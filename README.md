# Flow Builder for Figma

Flow Builder is a Figma plugin focused on reducing repetitive work for UI/UX teams when building:

- Wireframe Flow
- User Flow
- UI Flow

The plugin follows **PRD V1.0** and is optimized for the flow:
Select 2 nodes -> Generate connector + arrow -> Click connector -> Generate default None node -> Choose node type -> Input text.

## Features

1. **Selection detection (FR-001)**
   - Detects selection of exactly two nodes
   - Supports `Frame` and image nodes (any node with image fill)

2. **Connector + Arrow generation (FR-002)**
   - Generates a connector line between the two selected nodes
   - Supports arrow direction control (left / right)
   - Supports line anchor side (top / right / bottom / left)

3. **Node types (FR-003 ~ FR-006)**
   - `None`: rounded rectangle (default)
   - `Process`: rectangle
   - `Decision`: diamond
   - All node types support text input (default text: `Text`)

4. **Auto alignment and spacing (FR-007, FR-008)**
   - Aligns connected nodes on the same center axis based on line direction
   - Applies fixed 120px spacing between the two selected nodes

5. **PRD color system in plugin UI**
   - Primary button: `#383838`, text `#FFFFFF`
   - Secondary button: border `#383838`, bg `#FFFFFF`, text `#383838`
   - Title: `#383838`, body text: `#6E6E6E`, window bg: `#FCFCFC`

## Project Structure

```text
manifest.json
src/
  code.ts      # Figma plugin runtime
  ui.ts        # UI logic
  ui.html      # UI layout
dist/
  code.js      # built plugin runtime
  ui.js        # built UI script
```

## Development

### 1) Install dependencies

```bash
npm install
```

### 2) Build

```bash
npm run build
```

## Load into Figma (Development)

1. Open **Figma Desktop**.
2. Go to **Plugins → Development → Import plugin from manifest...**
3. Select this project's `manifest.json`.
4. Run the plugin from **Plugins → Development → Flow Builder for Figma**.

## Publish to Figma Community (Checklist)

Before publishing, verify:

- Plugin icon and cover image assets are prepared
- `manifest.json` metadata (`name`, `id`) is finalized
- Error states are handled and validated
- README/description/screenshots are ready for listing
- Plugin behavior is tested on realistic flow documents

Then use Figma's plugin publishing flow from your developer dashboard.
