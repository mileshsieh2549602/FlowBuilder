# Flow Builder v1.1 - UAT Checklist (Checkbox Version)

Use this checklist for final acceptance before publishing v1.1.

## A. Build and import

- [ ] `npm install` completes
- [ ] `npm run build` completes
- [ ] `dist/code.js` exists
- [ ] `dist/ui.js` exists
- [ ] `dist/ui.html` exists
- [ ] Plugin imports from `manifest.json` without load error

## B. Auto connector generation (FR-001 optimized)

- [ ] Select exactly 2 Frame nodes -> connector auto-generates
- [ ] Select exactly 2 Image nodes -> connector auto-generates
- [ ] Select right frame then left frame -> arrow points left
- [ ] Select left frame then right frame -> arrow points right
- [ ] Connector path is orthogonal (right-angle)
- [ ] Line and arrow are visually connected (no detached arrow)

## C. Connector stability

- [ ] Move source frame -> connector remains attached
- [ ] Move target frame -> connector remains attached
- [ ] Resize source frame -> connector remains attached
- [ ] Resize target frame -> connector remains attached
- [ ] Connector does not pin to origin-like coordinates (0,0)
- [ ] Connector object is Group-based without unwanted visible container label

## D. Node Type panel (v1.1 focus)

- [ ] Panel shows only Node Type instructions and buttons
- [ ] Connector-related button/text are hidden from panel
- [ ] Buttons available: None Node / Process / Start-End / Y/N
- [ ] Status message appears after Node Type action (success/error)

## E. Node type behavior

- [ ] Clicking connector prepares node editing flow as expected
- [ ] Switch to None Node -> default None style
- [ ] Switch to Process -> diamond style
- [ ] Process node size is 180x180
- [ ] Switch to Start-End -> rounded rectangle with large corner radius
- [ ] Switch to Y/N -> 52x52 with corner radius 6 and text "Y/N"

## F. Node text rules

- [ ] Enter custom text, switch None -> Process -> Start-End: text is preserved
- [ ] Switch to Y/N: text resets to "Y/N"
- [ ] None Node wraps long text correctly (Auto Layout behavior)

## G. Regression checks

- [ ] No plugin white-screen UI issue during common operations
- [ ] No viewport auto-zoom/auto-scroll caused by connector generation
- [ ] No major jitter or drift during repeated move/resize tests
