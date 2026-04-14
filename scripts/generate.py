#!/usr/bin/env python3
"""CLI for generating process-map JSON from text descriptions."""

import argparse
import json
import re
import sys
from schema import ProcessBuilder


def parse_inline(notation):
    """Parse inline notation into a ProcessBuilder.

    Format: "Start [Lane] > Step [Lane] > Decision? {decision,Lane} > End [Lane]"
    """
    parts = [p.strip() for p in notation.split(">")]
    if not parts:
        print("Error: empty notation", file=sys.stderr)
        sys.exit(1)

    builder = ProcessBuilder("Generated Process")
    lanes_seen = set()
    step_labels = []

    for part in parts:
        # Parse: Label [Lane] or Label {Type,Lane}
        label = part
        lane_name = "Default"
        step_type = "process"

        # Check for {Type,Lane}
        brace_match = re.search(r"\{(\w+),\s*(\w+)\}", part)
        if brace_match:
            step_type = brace_match.group(1).lower()
            lane_name = brace_match.group(2)
            label = part[: brace_match.start()].strip()
        else:
            # Check for [Lane]
            bracket_match = re.search(r"\[([^\]]+)\]", part)
            if bracket_match:
                lane_name = bracket_match.group(1)
                label = part[: bracket_match.start()].strip()

        # Auto-detect type from label
        if label.lower() == "start":
            step_type = "start"
        elif label.lower() == "end":
            step_type = "end"
        elif label.endswith("?"):
            step_type = "decision"
            label = label[:-1].strip()

        # Add lane if new
        if lane_name not in lanes_seen:
            builder.lane(lane_name)
            lanes_seen.add(lane_name)

        builder.step(label, lane_name, type=step_type)
        step_labels.append(label)

    # Connect sequentially
    for i in range(len(step_labels) - 1):
        builder.connect(step_labels[i], step_labels[i + 1])

    return builder


def parse_file(filepath):
    """Parse a text file into a ProcessBuilder.

    Format: one step per line.
      Label [Lane]
      Label? [Lane]         <- decision
    Indented lines with 'Yes:' or 'No:' are decision branches.
    """
    with open(filepath) as f:
        lines = f.readlines()

    builder = ProcessBuilder("Generated Process")
    lanes_seen = set()
    step_labels = []
    prev_decision = None

    for line in lines:
        line = line.rstrip()
        if not line.strip():
            continue

        indent = len(line) - len(line.lstrip())
        content = line.strip()

        # Check for branch prefix
        branch_label = ""
        if indent > 0 and ":" in content:
            prefix, rest = content.split(":", 1)
            if prefix.strip().lower() in ("yes", "no"):
                branch_label = prefix.strip()
                content = rest.strip()

        # Parse step
        label = content
        lane_name = "Default"
        step_type = "process"

        bracket_match = re.search(r"\[([^\]]+)\]", content)
        if bracket_match:
            lane_name = bracket_match.group(1)
            label = content[: bracket_match.start()].strip()

        if label.lower() == "start":
            step_type = "start"
        elif label.lower() == "end":
            step_type = "end"
        elif label.endswith("?"):
            step_type = "decision"
            label = label[:-1].strip()

        if lane_name not in lanes_seen:
            builder.lane(lane_name)
            lanes_seen.add(lane_name)

        builder.step(label, lane_name, type=step_type)

        # Connect
        if branch_label and prev_decision:
            builder.connect(prev_decision, label, label=branch_label)
        elif step_labels and indent == 0:
            builder.connect(step_labels[-1], label)

        if step_type == "decision":
            prev_decision = label
        elif indent == 0:
            prev_decision = None

        step_labels.append(label)

    return builder


def main():
    parser = argparse.ArgumentParser(description="Generate process-map JSON")
    parser.add_argument("--input", "-i", help="Input text file")
    parser.add_argument("--inline", help="Inline notation string")
    parser.add_argument("--output", "-o", help="Output JSON file (default: stdout)")
    parser.add_argument("--layout", action="store_true", default=True, help="Run auto-layout (default: true)")

    args = parser.parse_args()

    if not args.input and not args.inline:
        parser.print_help()
        sys.exit(1)

    if args.inline:
        builder = parse_inline(args.inline)
    else:
        builder = parse_file(args.input)

    if args.layout:
        builder.auto_layout()

    errors = builder.validate()
    if errors:
        print("Validation errors:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    if args.output:
        builder.to_json(args.output)
        print(f"Written to {args.output}")
    else:
        print(builder.to_json())


if __name__ == "__main__":
    main()
