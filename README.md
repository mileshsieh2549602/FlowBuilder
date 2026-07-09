# Flow Builder for Figma

Flow Builder is a Figma plugin focused on reducing repetitive work for UI/UX teams when building:

- Wireframe Flow
- User Flow
- UI Flow

The plugin generates structured step cards and auto-links them with connectors, then provides tools to quickly clean and reconnect flow sequences.

## Features

1. **Create flow map from text input**
   - Provide one step per line with optional metadata (`title | owner | note`)
   - Select flow type (`Wireframe`, `User Flow`, `UI Flow`)
   - Generate a complete flow frame with consistent spacing and visual style

2. **Auto connector generation**
   - Connector arrows are attached to step nodes
   - Moving steps keeps links connected

3. **Selection utilities**
   - `Connect Selection`: connect selected frames/components in sequence
   - `Tidy Selection`: align selected frames/components into a clean horizontal flow

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
