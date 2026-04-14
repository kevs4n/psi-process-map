# CLAUDE.md - process-map

## Project Overview

**Name:** process-map
**Purpose:** Interactive swimlane / business process diagram tool
**Stack:** Vite + React 18 (plain JSX, no TypeScript)

## Use Cases

1. **RFP Artifacts** — Python scripts generate process JSON from descriptions, app renders the diagram, export SVG/PNG
2. **Workshop Editor** — Interactive drag-and-drop editor for live workshops with clients (facilitator shares screen)
3. **ADO Linking** — Each process step has an `adoRef` field with a full URL to Azure DevOps work items. Clickable in-app and in exported SVGs.

## JSON Data Model

```json
{
  "title": "Process Name",
  "lanes": [{ "id": "l1", "name": "Actor", "color": 0 }],
  "steps": [{ "id": "s1", "laneId": "l1", "label": "Step", "type": "start|process|decision|end", "x": 60, "y": 30, "adoRef": "https://dev.azure.com/org/proj/_workitems/edit/101" }],
  "connections": [{ "id": "c1", "from": "s1", "to": "s2", "label": "" }]
}
```

### `adoRef` field contract

- Empty string → no badge, no link
- Full URL (`https://...`) → clickable badge displaying `WI-{id}` (last path segment), opens in new tab. Preserved as `<a>` in SVG export.
- Non-URL string → visible text badge, no link

## Repository Structure

```
process-map/
├── CLAUDE.md                    # This file
├── index.html                   # Vite entry (includes Google Fonts)
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx                 # ReactDOM entry
│   ├── App.jsx                  # Root component, all state, auto-save
│   ├── App.css
│   ├── index.css                # CSS reset + fonts
│   ├── components/
│   │   ├── Canvas.jsx           # SVG viewport: grid, lanes, steps, connectors
│   │   ├── StepShape.jsx        # Step shapes by type + ADO hyperlink badges
│   │   ├── Connector.jsx        # SVG curved arrow between steps
│   │   ├── Sidebar.jsx          # Dark sidebar panel + back-to-list
│   │   ├── Toolbar.jsx          # Tool selector
│   │   ├── EditModal.jsx        # Edit modal for steps/lanes/connections
│   │   └── DiagramList.jsx      # Landing screen — saved diagrams grid
│   └── lib/
│       ├── tokens.js            # Design tokens (colors, sizes, fonts)
│       ├── schema.js            # JSON schema validation
│       ├── layout.js            # Kahn's algorithm auto-layout
│       ├── export.js            # SVG/PNG/JSON export (preserves hyperlinks)
│       ├── storage.js           # localStorage CRUD for diagram persistence
│       └── sampleData.js        # Default O2C process
└── scripts/
    ├── schema.py                # ProcessBuilder fluent API
    ├── generate.py              # CLI text-to-JSON
    └── examples.py              # 5 template generators
```

## Running

```bash
npm install
npm run dev          # http://localhost:5173
```

## Persistence

Diagrams are saved to **localStorage** under key `process-map:diagrams`.

- First load seeds a sample O2C diagram
- Auto-save debounced 1 second on every change
- Landing screen (DiagramList) shows all saved diagrams with create/duplicate/delete/import
- "All Diagrams" button in sidebar returns to landing screen (saves first)

### Storage format

```json
{
  "diagrams": {
    "d-abc123": {
      "id": "d-abc123",
      "name": "Order to Cash",
      "createdAt": "2026-04-14T10:30:00Z",
      "updatedAt": "2026-04-14T11:45:00Z",
      "process": { "title": "...", "lanes": [...], "steps": [...], "connections": [...] }
    }
  }
}
```

### Storage API (`src/lib/storage.js`)

| Function | Purpose |
|----------|---------|
| `listDiagrams()` | Returns `{id, name, updatedAt}[]` sorted by updatedAt desc |
| `loadDiagram(id)` | Returns `{id, name, process}` or null |
| `saveDiagram(id, process)` | Upserts diagram, sets updatedAt |
| `deleteDiagram(id)` | Removes diagram |
| `duplicateDiagram(id)` | Copies with " (copy)" suffix, returns new id |
| `createDiagram()` | Creates empty diagram, returns id |

## Design Decisions

- **SVG-based rendering** — DOM-level events, accessibility, clean export
- **All state in App.jsx** — Simple prop drilling, 2-level component tree
- **Design tokens** — All colors, sizes, fonts in `src/lib/tokens.js`
- **Kahn's topological sort** — Left-to-right auto-layout via BFS level assignment
- **Fonts** — DM Sans (UI) + JetBrains Mono (code/refs)
- **localStorage** — Zero-infra persistence. Swap to API calls when cloud persistence is needed.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select mode |
| A | Add Step mode |
| C | Connect mode |
| Escape | Cancel / Deselect |
| Delete | Remove selected |

## Step Types & Colors

| Type | Shape | Color |
|------|-------|-------|
| start | Pill | Green (#a6e3a1) |
| process | Rounded rect | White |
| decision | Diamond | Yellow (#f9e2af) |
| end | Pill | Pink (#f5c2e7) |

## Python Scripts

```bash
# Generate templates
python scripts/examples.py

# CLI generation
python scripts/generate.py --inline "Start [Sales] > Review Order [Sales] > Ship [Warehouse] > End [Sales]"
python scripts/generate.py --input process.txt --output process.json
```

### adoRef in Python

Supply full URLs when building process JSON programmatically:

```python
builder.step("Review Order", "Sales", ado_ref="https://dev.azure.com/org/proj/_workitems/edit/101")
```

## Export

- **SVG** — Cloned DOM, XMLSerializer. `<a>` hyperlinks on ADO-linked steps are preserved with both `href` and `xlink:href`.
- **PNG** — SVG to Image to Canvas at 2x scale. ADO badge text visible but not clickable (raster).
- **JSON** — Schema-validated process data
- **Copy JSON** — Clipboard API

## Deployment

Target: **Azure Static Web Apps** for zero-infra hosting. `npm run build` produces `dist/` for deployment.

## Future: Cloud Persistence (Use Case 3)

When localStorage is no longer sufficient (cross-machine access, ADO integration):
- Add Azure Functions API for CRUD
- Add Cosmos DB serverless for storage
- Swap `storage.js` calls for API calls — UI stays the same
