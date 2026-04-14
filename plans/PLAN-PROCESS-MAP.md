# PLAN-PROCESS-MAP

> **Status:** Draft
> **Created:** 2026-04-14

## Context

Build a new standalone project called **process-map** — an interactive swimlane / business process diagram tool. Three use cases: (1) Python scripts generate process JSON for RFP artifacts, (2) drag-and-drop editor for client workshops, (3) steps link to Azure DevOps via `adoRef`. The project lives in a new GitHub repo `kevs4n/process-map`.

---

## Phase 1: Repository & Scaffold

- [x] Create GitHub repo `kevs4n/process-map`
- [x] Scaffold with `npm create vite@latest . -- --template react`
- [x] Remove boilerplate, add Google Fonts (DM Sans + JetBrains Mono)
- [x] Create `CLAUDE.md` at project root with full spec

### File Structure

```
process-map/
├── CLAUDE.md
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx                  # Root component, all state
│   ├── App.css
│   ├── index.css
│   ├── components/
│   │   ├── Canvas.jsx           # SVG viewport: grid, lanes, steps, connectors
│   │   ├── StepShape.jsx        # Step shapes by type
│   │   ├── Connector.jsx        # SVG curved arrow between steps
│   │   ├── Sidebar.jsx          # Dark sidebar panel
│   │   ├── Toolbar.jsx          # Tool selector
│   │   └── EditModal.jsx        # Edit modal
│   └── lib/
│       ├── tokens.js            # Design tokens
│       ├── schema.js            # JSON schema validation
│       ├── layout.js            # Kahn's algorithm auto-layout
│       ├── export.js            # SVG/PNG/JSON export
│       └── sampleData.js        # Default O2C process
└── scripts/
    ├── schema.py                # ProcessBuilder fluent API
    ├── generate.py              # CLI text-to-JSON
    └── examples.py              # 5 template generators
```

---

## Phase 2: Foundation Layer (`src/lib/`)

- [x] **`tokens.js`** — Colors, sizes, fonts, layout gaps
- [x] **`schema.js`** — `validateProcess()`, `createEmptyProcess()`, `generateId()`
- [x] **`sampleData.js`** — Default O2C process (4 lanes, 11 steps)
- [x] **`layout.js`** — Kahn's topological sort auto-layout
- [x] **`export.js`** — SVG/PNG/JSON export, clipboard copy, JSON import

---

## Phase 3: React Components

- [x] **`StepShape.jsx`** — SVG shapes: start=pill green, process=rounded rect white, decision=diamond yellow, end=pill pink
- [x] **`Connector.jsx`** — Cubic Bezier paths with arrowheads and optional labels
- [x] **`Canvas.jsx`** — SVG viewport with dot grid, lane bands, interaction modes
- [x] **`Sidebar.jsx`** — Dark panel with tools, lanes, export, import, auto-layout
- [x] **`Toolbar.jsx`** — Select/Add/Connect toggles
- [x] **`EditModal.jsx`** — Edit steps, connections, lanes

---

## Phase 4: App.jsx — State & Wiring

- [x] State: `process`, `tool`, `selectedId`, `connectingFrom`, `editingItem`
- [x] Immutable handlers for all operations
- [x] Keyboard shortcuts: V/A/C/Escape/Delete

---

## Phase 5: Python Scripts

- [x] **`schema.py`** — ProcessBuilder fluent API with auto_layout
- [x] **`generate.py`** — argparse CLI for inline and file-based generation
- [x] **`examples.py`** — O2C, P2P, R2R, H2R, Danish seed certification

---

## Verification

1. `npm run dev` starts, O2C diagram renders
2. Steps render with correct shapes/colors
3. Drag, select, delete all work
4. Add Step mode places new steps
5. Connect mode draws connectors
6. Double-click opens edit modal
7. Export SVG/PNG/JSON all download
8. Import JSON replaces canvas
9. Auto-Layout repositions steps
10. `python scripts/examples.py` generates 5 templates
