# Flow Builder v1.0 - Smoke Test Checklist

Use this checklist before tagging/releasing/publishing.

## A. Build and import

- [ ] `npm install` completes
- [ ] `npm run build` completes
- [ ] `dist/code.js` exists
- [ ] `dist/ui.js` exists
- [ ] `dist/ui.html` exists
- [ ] Plugin imports from `manifest.json` in Figma Desktop

## B. Core generation

- [ ] Select exactly 2 frames -> connector auto-generates
- [ ] Manual `Generate Connector` button still works as fallback
- [ ] Selection-order left->right produces rightward arrow
- [ ] Selection-order right->left produces leftward arrow
- [ ] Generated path is orthogonal (right-angle style)
- [ ] Connector starts from source edge and ends on target edge

## C. Update behavior

- [ ] Move source frame -> connector updates and stays attached
- [ ] Move target frame -> connector updates and stays attached
- [ ] Resize source frame -> connector updates and stays attached
- [ ] Resize target frame -> connector updates and stays attached
- [ ] Repeated drags do not show severe jitter

## D. Stability checks

- [ ] No `Unable to load code` import error
- [ ] No incremental-mode documentchange registration crash
- [ ] No connector pinned to origin-like position (e.g. x=0/y=0)

## E. Debug mode

- [ ] Toggle debug ON -> endpoint/path markers appear
- [ ] Toggle debug OFF -> markers are hidden
- [ ] Debug toggle state persists across plugin reopen

## F. Regression sanity

- [ ] Plugin does not auto-reposition selected frames
- [ ] Plugin does not auto-zoom/scroll viewport on generate
- [ ] Connector object appears as Group (without visible frame naming on canvas)
