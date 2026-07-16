# Flow Builder v1.2 - UAT Checklist (Completed)

Use this record as the v1.2 acceptance archive.

## Test result summary

- Status: PASS
- Final result: All major verification categories passed
- Verified by: Cloud run + user manual validation

## A. Build and import

- [x] `npm install` completes
- [x] `npm run build` completes
- [x] `dist/code.js` exists
- [x] `dist/ui.js` exists
- [x] `dist/ui.html` exists
- [x] Plugin imports from `manifest.json` without load error

## B. FR-001 selection and auto generation

- [x] Select exactly 2 Frames -> connector auto-generates
- [x] Select exactly 2 Image-filled nodes -> connector auto-generates
- [x] Select exactly 2 Auto Layout nodes -> connector auto-generates
- [x] Select mixed valid pair (Frame + Auto Layout, Image + Frame) -> connector auto-generates
- [x] Invalid selection count/type does not generate connector unexpectedly

## C. FR-002 A/B side controls

- [x] A/B side controls are visible in panel
- [x] Side options can be switched on both A and B
- [x] A/B side preferences persist after reopening plugin
- [x] A/B side choices are applied to newly generated connectors

## D. Connector routing and arrow direction

- [x] Left/Right cases render correct arrow direction into target
- [x] Top/Bottom cases render correct arrow direction into target
- [x] Mixed case A(bottom) -> B(left) routes cleanly (no odd detours)
- [x] Mixed case A(right) -> B(top) routes cleanly
- [x] Line and arrow remain visually connected

## E. Connector stability and sync

- [x] Move source node -> connector remains attached
- [x] Move target node -> connector remains attached
- [x] Resize source node -> connector remains attached
- [x] Resize target node -> connector remains attached
- [x] Connector does not pin to origin-like coordinates (0,0)
- [x] Dragging/moving canvas feels responsive (no heavy delay regression)

## F. Panel visuals (Default / Active)

- [x] Panel layout matches latest Default mockup structure
- [x] Divider line spans full panel width
- [x] Node Type section matches active/inactive visual behavior
- [x] Process icon active style shows border `#96C6FE` and fill `#CCEDFE`

## G. A/B selection progress UX

- [x] With no valid selection, A and B center boxes are gray
- [x] After first selectable click, A center box turns blue
- [x] After second selectable click, B center box turns blue
- [x] Side-button active blue states continue to work

## H. Node Type behavior

- [x] None Node works as before
- [x] Process Node remains Frame-based and keeps expected shape
- [x] Start/End is Auto Layout frame
- [x] Y/N is Auto Layout frame
- [x] Switching to Process does not shift node position unexpectedly
- [x] Y/N default text is `Text`

## I. Feedback and messaging UX

- [x] Success/error message appears on operations
- [x] Message remains visible ~5 seconds
- [x] Message fades out smoothly after timeout
