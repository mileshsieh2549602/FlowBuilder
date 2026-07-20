# Flow Builder for Figma - Release Notes v1.3

## Overview

v1.3 focuses on two major themes:

1. **Panel visual refinement** to match the latest Figma mockup style.
2. **Connector/node insertion reliability** so flow direction and routing stay consistent in complex layouts.

This version finalizes multiple UI/UX adjustments and several connector edge-case fixes validated during iterative UAT.

## What's new in v1.3

### 1) Panel visual style aligned to latest mockup

- Plugin window size updated for the new panel layout budget.
- Background updated to gradient style.
- Panel structure moved to two rounded cards (Connector Sides / Node Type).
- Card spacing, padding, and section hierarchy were tuned to match design intent.

### 2) Typography and spacing updates

- Section title size increased to **15px**.
- Section title color updated to **`#1A6AC7`**.
- Title-to-description spacing updated to **8px**.
- Outer padding remains **20px** on all sides.
- Helper descriptions are constrained to single-line behavior to avoid unwanted wrapping and clipping.

### 3) Toast/status message layout improvements

- Status messaging remains fade-out based (success/error feedback).
- Toast spacing from Node Type content was reworked to avoid visual crowding.
- Resolved compounded spacing issue (container gap + toast margin stacking) so the final toast gap behaves as intended.

### 4) Connector insertion path behavior improvements

- Added **collinear route handling** to keep lines straight when endpoints are vertically/horizontally aligned.
- Improved insertion routing for offset vertical scenarios (e.g. upper-left to lower-right style placement) by anchoring inserted nodes to meaningful route points.
- Reduced unintended visual bends after inserting node types in non-trivial A/B positions.

### 5) Endpoint side preservation bug fix

- Fixed a regression where inserting a node could change endpoint behavior unexpectedly (e.g. selected `B(right)` appearing as `B(bottom)`).
- Endpoint sides for A/B now remain locked to user-selected connector sides.
- Dynamic side inference is now applied only to the newly inserted flow node.

## Quality and validation summary

- Build passes: `npm run build`
- Panel style and spacing updates validated through UAT iterations.
- Node insertion behavior validated across:
  - left/right flows
  - top/bottom offset flows
  - connector-selected insertion path
- Endpoint direction consistency verified after insertion.

