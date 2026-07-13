# Flow Builder for Figma - Release Notes v1.0

## Overview

v1.0 delivers a connector-focused release aimed at reliability and predictable behavior in real design files.

## Highlights

- Connector-first workflow with a single action (`Generate Connector`)
- Selection-order-based direction (source -> target)
- Stable orthogonal connector path rendering
- Connector follows frame movement and resizing
- Optional debug markers for endpoint/path diagnostics
- Incremental-mode compatibility handling (`loadAllPagesAsync` before documentchange)

## Stability and UX improvements

- Removed automatic frame repositioning and forced spacing
- Removed automatic viewport zoom changes during generation
- Added throttled incremental updates to reduce drag jitter
- Added epsilon checks to avoid unnecessary micro-updates
- Migrated connector container model to improve coordinate stability

## Scope intentionally deferred

- Node generation UI (None / Process / Decision)
- Connector style presets and advanced path options
- Label text on connector path

## Validation baseline

- Plugin imports successfully through manifest
- Build artifacts are produced (`dist/code.js`, `dist/ui.js`, `dist/ui.html`)
- Connector generation works for both left-to-right and right-to-left selection orders
- Connector remains linked when frames move/resize
