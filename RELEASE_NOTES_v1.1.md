# Flow Builder for Figma - Release Notes v1.1

## Overview

v1.1 completes the first production-ready workflow for connector + node editing in one stable flow.

This version focuses on reducing repetitive actions:

- Connector generation is automatic when exactly 2 Frame/Image nodes are selected
- Node type editing is now the primary panel interaction
- UI panel is simplified to Node Type controls only

## What's new in v1.1

### 1) Automatic connector generation (FR-001 optimization)

- Selecting exactly 2 Frame/Image nodes auto-creates a connector
- No manual connector button required in normal usage
- Direction follows selection order (first selected = source, second selected = target)

### 2) Node Type workflow delivered

- Click a connector to insert/select its node, then switch types from panel buttons
- Supported types:
  - None Node
  - Process (diamond)
  - Start/End (rounded rectangle, corner radius 999)
  - Y/N (52x52, corner radius 6, default text "Y/N")

### 3) Node text behavior improvements

- None Node uses Auto Layout for better text wrapping behavior
- Text is preserved when switching among None / Process / Start-End
- Text resets to "Y/N" when switching to Y/N type (intentional format rule)

### 4) Process node geometry improvements

- Process node alignment fixed so connector paths align correctly
- Process node size increased to 180x180 for richer checkpoint content

### 5) Panel simplification

- Connector-specific text/buttons are hidden from panel
- Panel now exposes Node Type guidance and Node Type buttons only

## Reliability baseline retained from v1.0

- Stable shape-based connector rendering
- Leftward and rightward direction support by selection order
- Connector updates when related frames move/resize
- Group-wrapped connector object model to avoid visible container naming on canvas

## Validation checklist (high level)

- Build artifacts generated successfully (`dist/code.js`, `dist/ui.js`, `dist/ui.html`)
- Auto connector generation works on 2-node selection
- Node Type switching works with expected text-preservation rules
- Process node (180x180) remains visually aligned with connector paths
