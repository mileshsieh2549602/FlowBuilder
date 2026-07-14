# Flow Builder for Figma (v1.0)

Flow Builder is a Figma plugin for quickly creating stable flow connectors between two screens.

v1.0 is focused on a **Connector-first workflow** and intentionally keeps scope small for reliability.

## What v1.0 does

1. **Connector-only generation**
   - Select exactly 2 nodes (`Frame` or image-filled layer)
   - Connector is auto-generated immediately when selection reaches 2 nodes
   - `Generate Connector` button remains as manual fallback
   - Plugin draws an orthogonal connector with arrow terminal

2. **Selection-order direction**
   - First selected node = source
   - Second selected node = target
   - Arrow direction follows source -> target

3. **Stable geometry mode**
   - Uses deterministic elbow path calculation
   - Endpoint calculation uses absolute page coordinates
   - Connector updates when connected frames move/resize
   - Throttled incremental sync to reduce drag jitter

4. **Optional debug mode**
   - Toggle in UI: `Debug mode (show endpoint/path nodes)`
   - Shows start/mid/end markers for diagnostics only

## Current scope (intentional)

- No node-generation UI in v1.0 (None/Process/Decision temporarily removed)
- No auto spacing/alignment of selected frames (user controls layout)
- No viewport auto-zoom side effects when generating connectors

## Project Structure

```text
manifest.json
src/
  code.ts       # Figma plugin runtime
  ui.ts         # UI logic
  ui.html       # UI layout
scripts/
  build-ui-html.mjs
dist/
  code.js       # built plugin runtime
  ui.js         # built UI script (embedded into dist/ui.html)
  ui.html       # built plugin UI entry
```

## Development

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

## Load into Figma (Development)

1. Open **Figma Desktop**
2. Go to **Plugins -> Development -> Import plugin from manifest...**
3. Select this project's `manifest.json`
4. Run **Flow Builder for Figma**

## Troubleshooting

### "Unable to load code" / `ENOENT ... dist/code.js`
- Run `npm run build` in your local project folder
- Re-import manifest from the same folder
- Remove old dev plugin entries and restart Figma Desktop

### `documentchange handler in incremental mode` error
- v1.0 handles this by calling `figma.loadAllPagesAsync()` before binding documentchange

## Publishing

See:
- `PRD_V1.0_IMPLEMENTED_SCOPE.md`
- `RELEASE_NOTES_v1.0.md`
- `FIGMA_COMMUNITY_LISTING.md`
- `SMOKE_TEST_CHECKLIST_v1.0.md`
