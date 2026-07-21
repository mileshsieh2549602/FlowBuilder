# Flow Builder for Figma - Release Notes v1.2

## Overview

v1.2 focuses on interaction clarity, panel UX quality, and connector controllability.

This release extends FR-001 and FR-002 with better selection handling, explicit side controls, improved routing behavior, and a redesigned panel aligned to production mockups.

## What's new in v1.2

### 1) FR-001 selection support expanded

- Auto connector generation now accepts exactly 2 selectable nodes from:
  - Frame
  - Image-filled node
  - Auto Layout node
- Validation and panel guidance are updated accordingly.

### 2) FR-002 connector side controls (A/B model)

- Added A/B connector preview controls in panel:
  - A = source (first selected)
  - B = target (second selected)
- Each side can be explicitly selected: Top / Right / Bottom / Left
- Connector generation now uses panel side preferences for start/end attach points.
- Side preferences are persisted through plugin client storage.

### 3) Four-side routing and arrow behavior fixes

- Connector geometry now supports all side combinations (horizontal, vertical, mixed).
- Arrow orientation logic updated to always point into the target node correctly.
- Mixed-side routes (e.g. A bottom -> B left) were adjusted for cleaner orthogonal paths.

### 4) Node Type panel redesign (Default / Active states)

- Panel updated to match the Figma UI mockups:
  - Connector section visual and spacing
  - Node Type icon row and labels
  - Full-width divider
- Node Type has explicit state behavior:
  - Disabled look when no Flow Node is selected
  - Active highlight when a Flow Node is selected and type is known

### 5) A/B selection progress guidance

- A/B center boxes now reflect current selection progress:
  - No selectable node selected -> A/B gray
  - First selectable node selected -> A blue
  - Second selectable node selected -> B blue
- This improves onboarding clarity during auto-generation flow.

### 6) Node behavior and text updates

- Start/End and Y/N nodes are now Auto Layout frames (Process remains Frame-based as-is).
- Switching node types now preserves node center position to prevent visual drift.
- Y/N default text changed from `"Y/N"` to `"Text"` (including reset behavior when applying Y/N).

### 7) Feedback UX improvements

- Status messages (success/error) now:
  - stay visible for 5 seconds
  - then fade out smoothly

## Reliability and performance updates

- Reduced connector sync overhead by using polling only as fallback when documentchange sync is unavailable.
- Added early exit when there are no connector links to sync.
- Existing stability model (group wrapper + internal frame geometry) remains intact.

## Validation baseline (high level)

- Build artifacts generated successfully (`dist/code.js`, `dist/ui.js`, `dist/ui.html`)
- FR-001 auto generation works for Frame/Image/Auto Layout selection
- FR-002 A/B side settings drive connector attach points correctly
- Arrow direction and mixed-side routes behave as expected
- Node Type state visuals match Default/Active panel intent
