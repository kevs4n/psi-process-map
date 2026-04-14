"""ProcessBuilder fluent API for generating process-map JSON."""

import json
import math
from collections import deque

VALID_TYPES = {"start", "process", "decision", "end"}


class ProcessBuilder:
    def __init__(self, title):
        self._data = {"title": title, "lanes": [], "steps": [], "connections": []}
        self._lane_counter = 0
        self._step_counter = 0
        self._conn_counter = 0

    def lane(self, name, color=None):
        self._lane_counter += 1
        if color is None:
            color = (self._lane_counter - 1) % 5
        self._data["lanes"].append({
            "id": f"l{self._lane_counter}",
            "name": name,
            "color": color,
        })
        return self

    def step(self, label, lane, type="process", ado_ref="", description=""):
        lane_id = self._find_lane(lane)
        if not lane_id:
            raise ValueError(f"Lane '{lane}' not found. Add it first with .lane()")
        if type not in VALID_TYPES:
            raise ValueError(f"Invalid step type: {type}. Must be one of {VALID_TYPES}")
        self._step_counter += 1
        self._data["steps"].append({
            "id": f"s{self._step_counter}",
            "laneId": lane_id,
            "label": label,
            "type": type,
            "x": 0,
            "y": 0,
            "adoRef": ado_ref,
            "description": description,
        })
        return self

    def connect(self, from_label, to_label, label=""):
        from_id = self._find_step(from_label)
        to_id = self._find_step(to_label)
        if not from_id:
            raise ValueError(f"Step '{from_label}' not found")
        if not to_id:
            raise ValueError(f"Step '{to_label}' not found")
        self._conn_counter += 1
        self._data["connections"].append({
            "id": f"c{self._conn_counter}",
            "from": from_id,
            "to": to_id,
            "label": label,
        })
        return self

    def auto_layout(self, h_gap=200, v_gap=100, start_x=80, start_y=60, min_lane_h=120):
        """Assign x/y positions using Kahn's topological sort."""
        steps = self._data["steps"]
        connections = self._data["connections"]
        lanes = self._data["lanes"]

        if not steps:
            return self

        adj = {s["id"]: [] for s in steps}
        in_deg = {s["id"]: 0 for s in steps}
        for c in connections:
            if c["from"] in adj:
                adj[c["from"]].append(c["to"])
            if c["to"] in in_deg:
                in_deg[c["to"]] += 1

        queue = deque()
        column = {}
        for s in steps:
            if in_deg[s["id"]] == 0:
                queue.append(s["id"])
                column[s["id"]] = 0

        while queue:
            sid = queue.popleft()
            for nxt in adj.get(sid, []):
                in_deg[nxt] -= 1
                column[nxt] = max(column.get(nxt, 0), column[sid] + 1)
                if in_deg[nxt] == 0:
                    queue.append(nxt)

        max_col = max(column.values()) if column else 0
        for s in steps:
            if s["id"] not in column:
                column[s["id"]] = max_col + 1

        lane_order = {l["id"]: i for i, l in enumerate(lanes)}
        lane_groups = {l["id"]: [] for l in lanes}
        for s in steps:
            lane_groups.setdefault(s["laneId"], []).append(s)

        lane_y_offset = {}
        current_y = 0
        for lane in lanes:
            grp = lane_groups.get(lane["id"], [])
            col_counts = {}
            for s in grp:
                c = column[s["id"]]
                col_counts[c] = col_counts.get(c, 0) + 1
            max_rows = max(col_counts.values()) if col_counts else 1
            height = max(min_lane_h, max_rows * v_gap + start_y)
            lane_y_offset[lane["id"]] = current_y
            current_y += height

        lane_col_row = {}
        for s in steps:
            col = column[s["id"]]
            key = f"{s['laneId']}-{col}"
            row = lane_col_row.get(key, 0)
            lane_col_row[key] = row + 1
            s["x"] = start_x + col * h_gap
            s["y"] = lane_y_offset[s["laneId"]] + start_y + row * v_gap

        return self

    def validate(self):
        errors = []
        data = self._data
        if not data.get("title"):
            errors.append("Title is required")
        if not data.get("lanes"):
            errors.append("At least one lane is required")
        lane_ids = {l["id"] for l in data.get("lanes", [])}
        step_ids = set()
        for i, s in enumerate(data.get("steps", [])):
            if s["laneId"] not in lane_ids:
                errors.append(f"Step {i} references unknown lane: {s['laneId']}")
            if s["type"] not in VALID_TYPES:
                errors.append(f"Step {i} has invalid type: {s['type']}")
            if s["id"] in step_ids:
                errors.append(f"Duplicate step id: {s['id']}")
            step_ids.add(s["id"])
        for i, c in enumerate(data.get("connections", [])):
            if c["from"] not in step_ids:
                errors.append(f"Connection {i} references unknown step: {c['from']}")
            if c["to"] not in step_ids:
                errors.append(f"Connection {i} references unknown step: {c['to']}")
        return errors

    def build(self):
        return self._data

    def to_json(self, path=None):
        data = self._data
        json_str = json.dumps(data, indent=2)
        if path:
            with open(path, "w") as f:
                f.write(json_str)
        return json_str

    def _find_lane(self, name):
        for l in self._data["lanes"]:
            if l["name"] == name:
                return l["id"]
        return None

    def _find_step(self, label):
        for s in self._data["steps"]:
            if s["label"] == label:
                return s["id"]
        return None
