# Flow Builder v1.2 - Publish Package

This file consolidates release text for direct publishing and update posts.

## 1) Internal release update (short)

Flow Builder v1.2 is now finalized.

This version expands auto-detection support to Frame/Image/Auto Layout, adds A/B side controls for explicit connector attachment, improves mixed-direction routing quality, refines arrow direction correctness, aligns panel UI with latest Figma mockups, and improves Node Type behavior (including stable center position on type switch and Auto Layout support for Start/End and Y/N). Status messages now auto-fade after 5 seconds.

## 2) Figma Community - English

### Short Description
Auto-connect flow screens with A/B side controls, cleaner routing, and faster node-type editing.

### Full Description
Flow Builder helps UI/UX teams create flow diagrams faster with fewer repetitive steps.

v1.2 highlights:

- Auto-generate connectors from 2 selected nodes:
  - Frame
  - Image-filled layers
  - Auto Layout containers
- A/B side controls (Top/Right/Bottom/Left) for explicit connector attachment points
- Improved orthogonal routing for mixed directions (example: A bottom -> B left)
- Correct arrow orientation into target nodes for all side combinations
- Redesigned panel aligned with production mockups (Default + Node Type Active states)
- Progressive A/B selection guidance (A turns blue on first selection, B on second)
- Node updates:
  - Start/End and Y/N are Auto Layout frames
  - Process remains frame-based
  - Type switching keeps node center position stable
  - Y/N default text is now "Text"
- Success/error messages now fade out smoothly after display

Built for Wireframe Flow, User Flow, and UI Flow workflows in real product files.

### Suggested Tags
connector, flowchart, user-flow, ux, wireframe, diagram, plugin, figma

## 3) Figma Community - Traditional Chinese

### 短描述
支援 A/B 端點方向控制、Auto Layout 偵測與更順暢路徑連線的流程圖插件。

### 完整描述
Flow Builder 協助 UI/UX 團隊在 Figma 中更快速建立與維護流程圖，減少重複操作。

v1.2 重點：

- 選取 2 個節點可自動產生連線，支援：
  - Frame
  - Image-filled 圖層
  - Auto Layout 容器
- 新增 A/B 端點方向控制（上/右/下/左）可精準指定連接位置
- 混合方向路徑優化（例如 A 下 -> B 左）連線更自然
- 箭頭方向修正為正確指向目標節點
- 面板對齊新版設計稿（Default / Node Type Active）
- A/B 選取引導更清楚：
  - 第一次選取 A 變藍
  - 第二次選取 B 變藍
- Node 優化：
  - Start/End 與 Y/N 改為 Auto Layout frame
  - Process 維持原本 frame 結構
  - 切換 Node Type 不再發生位置漂移
  - Y/N 預設文字改為 "Text"
- 成功/錯誤提示改為顯示後自動淡出

適合 UI Flow / User Flow / Wireframe Flow 的快速製作與持續迭代。
