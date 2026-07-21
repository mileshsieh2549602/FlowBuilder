# Flow Builder v1.2 - UAT Checklist (Checkbox Version)

Use this checklist for final acceptance before publishing v1.2.

## A. Build and import

- [ ] `npm install` completes
- [ ] `npm run build` completes
- [ ] `dist/code.js` exists
- [ ] `dist/ui.js` exists
- [ ] `dist/ui.html` exists
- [ ] Plugin imports from `manifest.json` without load error

## B. FR-001 selection and auto generation

- [ ] Select exactly 2 Frames -> connector auto-generates
- [ ] Select exactly 2 Image-filled nodes -> connector auto-generates
- [ ] Select exactly 2 Auto Layout nodes -> connector auto-generates
- [ ] Select mixed valid pair (Frame + Auto Layout, Image + Frame) -> connector auto-generates
- [ ] Invalid selection count/type does not generate connector unexpectedly

## C. FR-002 A/B side controls

- [ ] A/B side controls are visible in panel
- [ ] Side options can be switched on both A and B
- [ ] A/B side preferences persist after reopening plugin
- [ ] A/B side choices are applied to newly generated connectors

## D. Connector routing and arrow direction

- [ ] Left/Right cases render correct arrow direction into target
- [ ] Top/Bottom cases render correct arrow direction into target
- [ ] Mixed case A(bottom) -> B(left) routes cleanly (no odd detours)
- [ ] Mixed case A(right) -> B(top) routes cleanly
- [ ] Line and arrow remain visually connected

## E. Connector stability and sync

- [ ] Move source node -> connector remains attached
- [ ] Move target node -> connector remains attached
- [ ] Resize source node -> connector remains attached
- [ ] Resize target node -> connector remains attached
- [ ] Connector does not pin to origin-like coordinates (0,0)
- [ ] Dragging/moving canvas feels responsive (no heavy delay regression)

## F. Panel visuals (Default / Active)

- [ ] Panel layout matches latest Default mockup structure
- [ ] Divider line spans full panel width
- [ ] Node Type section matches active/inactive visual behavior
- [ ] Process icon active style shows border `#96C6FE` and fill `#CCEDFE`

## G. A/B selection progress UX

- [ ] With no valid selection, A and B center boxes are gray
- [ ] After first selectable click, A center box turns blue
- [ ] After second selectable click, B center box turns blue
- [ ] Side-button active blue states continue to work

## H. Node Type behavior

- [ ] None Node works as before
- [ ] Process Node remains Frame-based and keeps expected shape
- [ ] Start/End is Auto Layout frame
- [ ] Y/N is Auto Layout frame
- [ ] Switching to Process does not shift node position unexpectedly
- [ ] Y/N default text is `Text`

## I. Feedback and messaging UX

- [ ] Success/error message appears on operations
- [ ] Message remains visible ~5 seconds
- [ ] Message fades out smoothly after timeout
