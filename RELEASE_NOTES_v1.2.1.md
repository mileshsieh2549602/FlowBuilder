# Flow Builder for Figma - Release Notes v1.2.1

## Overview

v1.2.1 is a focused patch release that improves connector-to-node insertion flow clarity and fixes residual node placement drift during insertion/type application.

## Patch highlights

### 1) Connector selection no longer auto-inserts nodes

- Clicking a connector now behaves as normal selection only.
- This restores expected delete/edit behavior for connector objects.

### 2) Explicit insertion action from connector

- Node insertion from a connector now requires an explicit Node Type click in the panel.
- Connector flow is now intentional and predictable:
  - Click connector
  - Choose node type

### 3) Connector can insert all 4 node types

- When a connector is selected, users can now insert:
  - None Node
  - Process
  - Start / End
  - Y / N
- This supports common design cases where users want to insert non-None nodes directly.

### 4) Node insertion position drift fixes

- Center anchoring is preserved consistently when applying node types.
- Base node sizing is initialized before center positioning to prevent residual offset.
- Result: insertion and type application no longer drift downward from intended center.

### 5) Panel copy refinement

- Node Type helper text updated to reflect actual behavior:
  - `Click a connector or select a Flow Node, then choose a node type.`

## Regression status

- Build passes (`npm run build`)
- Connector delete flow remains normal
- Connector -> Node Type insertion works across all 4 types
- Node placement stays centered in insertion flow
