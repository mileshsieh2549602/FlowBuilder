figma.showUI(__html__, { width: 380, height: 560 });

type FlowType = "wireframe" | "user-flow" | "ui-flow";

interface FlowStepInput {
  title: string;
  owner?: string;
  note?: string;
}

interface CreateFlowPayload {
  flowName: string;
  flowType: FlowType;
  spacing: number;
  steps: FlowStepInput[];
}

interface ConnectSelectionPayload {
  labelPrefix?: string;
}

interface PluginRequest {
  type: "create-flow" | "connect-selection" | "tidy-selection";
  payload?: CreateFlowPayload | ConnectSelectionPayload;
}

interface Theme {
  frameFill: RGB;
  frameStroke: RGB;
  titleColor: RGB;
  bodyColor: RGB;
  accentColor: RGB;
}

const FONT_REGULAR: FontName = { family: "Inter", style: "Regular" };
const FONT_SEMIBOLD: FontName = { family: "Inter", style: "Semi Bold" };

const THEMES: Record<FlowType, Theme> = {
  wireframe: {
    frameFill: { r: 0.972, g: 0.972, b: 0.972 },
    frameStroke: { r: 0.78, g: 0.78, b: 0.78 },
    titleColor: { r: 0.2, g: 0.2, b: 0.2 },
    bodyColor: { r: 0.92, g: 0.92, b: 0.92 },
    accentColor: { r: 0.45, g: 0.45, b: 0.45 }
  },
  "user-flow": {
    frameFill: { r: 0.94, g: 0.97, b: 1 },
    frameStroke: { r: 0.57, g: 0.74, b: 1 },
    titleColor: { r: 0.07, g: 0.22, b: 0.45 },
    bodyColor: { r: 0.88, g: 0.93, b: 0.99 },
    accentColor: { r: 0.2, g: 0.46, b: 0.94 }
  },
  "ui-flow": {
    frameFill: { r: 0.95, g: 0.99, b: 0.96 },
    frameStroke: { r: 0.58, g: 0.84, b: 0.66 },
    titleColor: { r: 0.11, g: 0.32, b: 0.15 },
    bodyColor: { r: 0.89, g: 0.97, b: 0.9 },
    accentColor: { r: 0.17, g: 0.6, b: 0.28 }
  }
};

figma.ui.onmessage = async (msg: PluginRequest) => {
  try {
    switch (msg.type) {
      case "create-flow":
        await createFlow(msg.payload as CreateFlowPayload);
        break;
      case "connect-selection":
        await connectSelectedNodes(msg.payload as ConnectSelectionPayload | undefined);
        break;
      case "tidy-selection":
        tidySelection();
        break;
      default:
        figma.notify("Unsupported command.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected plugin error.";
    figma.notify(message, { error: true });
  }
};

async function ensureFontsLoaded(): Promise<void> {
  await Promise.all([figma.loadFontAsync(FONT_REGULAR), figma.loadFontAsync(FONT_SEMIBOLD)]);
}

async function createFlow(payload: CreateFlowPayload): Promise<void> {
  if (!payload || payload.steps.length === 0) {
    throw new Error("Please add at least one flow step.");
  }

  await ensureFontsLoaded();

  const theme = THEMES[payload.flowType];
  const flowContainer = figma.createFrame();
  flowContainer.name = payload.flowName || "Flow";
  flowContainer.layoutMode = "HORIZONTAL";
  flowContainer.itemSpacing = Math.max(payload.spacing || 120, 40);
  flowContainer.counterAxisSizingMode = "AUTO";
  flowContainer.primaryAxisSizingMode = "AUTO";
  flowContainer.fills = [];
  flowContainer.clipsContent = false;
  flowContainer.strokes = [];
  flowContainer.paddingLeft = 24;
  flowContainer.paddingRight = 24;
  flowContainer.paddingTop = 24;
  flowContainer.paddingBottom = 24;

  const steps = payload.steps.map((step, index) => createStepNode(step, index + 1, theme));
  steps.forEach((step) => {
    flowContainer.appendChild(step);
  });

  const page = figma.currentPage;
  page.appendChild(flowContainer);
  flowContainer.x = figma.viewport.center.x - flowContainer.width / 2;
  flowContainer.y = figma.viewport.center.y - flowContainer.height / 2;

  const connectors: ConnectorNode[] = [];
  for (let i = 0; i < steps.length - 1; i += 1) {
    const connector = figma.createConnector();
    connector.name = `Flow Link ${i + 1}`;
    connector.connectorStart = { endpointNodeId: steps[i].id, magnet: "AUTO" };
    connector.connectorEnd = { endpointNodeId: steps[i + 1].id, magnet: "AUTO" };
    connector.strokeWeight = 2;
    connector.strokeCap = "ROUND";
    connector.cornerRadius = 18;
    connector.fills = [];
    connector.strokes = [{ type: "SOLID", color: theme.accentColor }];
    page.appendChild(connector);
    connectors.push(connector);
  }

  page.selection = [flowContainer, ...connectors];
  figma.viewport.scrollAndZoomIntoView([flowContainer, ...connectors]);
  figma.notify(`Created "${flowContainer.name}" with ${steps.length} steps.`);
}

function createStepNode(step: FlowStepInput, order: number, theme: Theme): FrameNode {
  const card = figma.createFrame();
  card.name = `Step ${order} - ${step.title.trim() || "Untitled"}`;
  card.layoutMode = "VERTICAL";
  card.primaryAxisSizingMode = "AUTO";
  card.counterAxisSizingMode = "FIXED";
  card.resize(280, 220);
  card.itemSpacing = 10;
  card.paddingLeft = 16;
  card.paddingRight = 16;
  card.paddingTop = 16;
  card.paddingBottom = 16;
  card.cornerRadius = 14;
  card.strokeWeight = 1;
  card.strokes = [{ type: "SOLID", color: theme.frameStroke }];
  card.fills = [{ type: "SOLID", color: theme.frameFill }];
  card.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 2 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    }
  ];

  const title = figma.createText();
  title.fontName = FONT_SEMIBOLD;
  title.characters = `${order}. ${step.title.trim() || "Untitled Step"}`;
  title.fontSize = 14;
  title.lineHeight = { unit: "PIXELS", value: 20 };
  title.fills = [{ type: "SOLID", color: theme.titleColor }];
  title.textAutoResize = "HEIGHT";
  card.appendChild(title);

  const wireframeArea = figma.createFrame();
  wireframeArea.name = "Wireframe Placeholder";
  wireframeArea.resize(248, 120);
  wireframeArea.cornerRadius = 10;
  wireframeArea.strokeWeight = 1;
  wireframeArea.strokes = [{ type: "SOLID", color: theme.frameStroke }];
  wireframeArea.fills = [{ type: "SOLID", color: theme.bodyColor }];
  wireframeArea.clipsContent = true;
  card.appendChild(wireframeArea);

  const meta = figma.createText();
  meta.fontName = FONT_REGULAR;
  const ownerLabel = step.owner?.trim() ? `Owner: ${step.owner.trim()}` : "Owner: TBD";
  const noteLabel = step.note?.trim() ? `\nNote: ${step.note.trim()}` : "";
  meta.characters = `${ownerLabel}${noteLabel}`;
  meta.fontSize = 11;
  meta.lineHeight = { unit: "PIXELS", value: 16 };
  meta.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.35, b: 0.35 } }];
  meta.textAutoResize = "HEIGHT";
  card.appendChild(meta);

  return card;
}

async function connectSelectedNodes(payload?: ConnectSelectionPayload): Promise<void> {
  const selected = figma.currentPage.selection.filter((node): node is FrameNode | ComponentNode => {
    return node.type === "FRAME" || node.type === "COMPONENT";
  });

  if (selected.length < 2) {
    throw new Error("Select at least two frames/components to connect.");
  }

  const sorted = [...selected].sort((a, b) => a.x - b.x || a.y - b.y);
  const links: ConnectorNode[] = [];

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const connector = figma.createConnector();
    connector.name = payload?.labelPrefix ? `${payload.labelPrefix} ${i + 1}` : `Connection ${i + 1}`;
    connector.connectorStart = { endpointNodeId: sorted[i].id, magnet: "AUTO" };
    connector.connectorEnd = { endpointNodeId: sorted[i + 1].id, magnet: "AUTO" };
    connector.strokeWeight = 2;
    connector.cornerRadius = 14;
    connector.fills = [];
    connector.strokes = [{ type: "SOLID", color: { r: 0.35, g: 0.55, b: 0.92 } }];
    figma.currentPage.appendChild(connector);
    links.push(connector);
  }

  figma.currentPage.selection = links;
  figma.viewport.scrollAndZoomIntoView(links);
  figma.notify(`Connected ${sorted.length} nodes.`);
}

function tidySelection(): void {
  const selected = figma.currentPage.selection.filter((node): node is FrameNode | ComponentNode => {
    return node.type === "FRAME" || node.type === "COMPONENT";
  });

  if (selected.length < 2) {
    throw new Error("Select at least two frames/components to tidy.");
  }

  const sorted = [...selected].sort((a, b) => a.x - b.x || a.y - b.y);
  const first = sorted[0];
  const averageY = sorted.reduce((acc, item) => acc + item.y, 0) / sorted.length;
  const spacing = 140;

  sorted.forEach((node, index) => {
    node.x = first.x + index * (node.width + spacing);
    node.y = averageY;
  });

  figma.currentPage.selection = sorted;
  figma.viewport.scrollAndZoomIntoView(sorted);
  figma.notify("Aligned selected nodes into a clean horizontal flow.");
}
