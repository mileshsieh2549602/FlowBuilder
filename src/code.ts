figma.showUI(__html__, { width: 360, height: 460 });

type NodeType = "none" | "process" | "decision";

interface GenerateNodePayload {
  nodeType: NodeType;
  text: string;
}

type PluginRequest =
  | { type: "generate-connector" }
  | { type: "generate-node"; payload: GenerateNodePayload }
  | { type: "close-plugin" };

type SelectedLink =
  | { kind: "connector"; connector: ConnectorNode }
  | { kind: "shape"; shape: GroupNode };

const FLOW_NODE_MARK = "flow-builder-node";
const FLOW_NODE_TYPE = "flow-builder-node-type";
const FLOW_LINK_MARK = "flow-builder-link";
const FLOW_LINK_START_NODE = "flow-builder-link-start-node";
const FLOW_LINK_END_NODE = "flow-builder-link-end-node";
const FLOW_SPACING = 120;
const FONT_REGULAR: FontName = { family: "Inter", style: "Regular" };
let autoNodeGuard = false;

figma.ui.onmessage = async (msg: PluginRequest) => {
  try {
    switch (msg.type) {
      case "generate-connector":
        await generateConnectorFromSelection();
        sendStatus("connector", "success", "Successful");
        break;
      case "generate-node":
        await generateNodeFromSelection(msg.payload);
        sendStatus("node", "success", "Done!");
        break;
      case "close-plugin":
        figma.closePlugin();
        break;
      default:
        throw new Error("Unsupported command.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected plugin error.";
    figma.notify(message, { error: true });
    if (msg.type === "generate-connector") {
      sendStatus("connector", "error", message);
    } else if (msg.type === "generate-node") {
      sendStatus("node", "error", message);
    }
  }
};

figma.on("selectionchange", async () => {
  if (autoNodeGuard) {
    return;
  }
  const selectedLink = getSingleSelectedLink();
  if (!selectedLink) {
    return;
  }

  autoNodeGuard = true;
  try {
    await ensureFontsLoaded();
    await insertNodeOnSelectedLink(selectedLink, "none", "Text", true);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create default node.";
    figma.notify(message, { error: true });
  } finally {
    autoNodeGuard = false;
  }
});

async function ensureFontsLoaded(): Promise<void> {
  await figma.loadFontAsync(FONT_REGULAR);
}

function isImageNode(node: SceneNode): boolean {
  if (!("fills" in node)) {
    return false;
  }
  if (node.fills === figma.mixed || !Array.isArray(node.fills)) {
    return false;
  }
  return node.fills.some((fill) => fill.type === "IMAGE");
}

function isFrameOrImage(node: SceneNode): node is SceneNode & DimensionAndPositionMixin {
  if (!("x" in node) || !("width" in node)) {
    return false;
  }
  return node.type === "FRAME" || isImageNode(node);
}

function alignNodesForRightFlow(
  first: SceneNode & DimensionAndPositionMixin,
  second: SceneNode & DimensionAndPositionMixin
): void {
  const firstCenterY = first.y + first.height / 2;
  second.y = firstCenterY - second.height / 2;
  second.x = first.x + first.width + FLOW_SPACING;
}

async function generateConnectorFromSelection(): Promise<void> {
  const selected = figma.currentPage.selection.filter((node) => isFrameOrImage(node));
  if (selected.length !== 2) {
    throw new Error("Please select exactly 2 Frame/Image nodes.");
  }

  const ordered = [...selected].sort((a, b) => a.x - b.x || a.y - b.y);
  const [first, second] = ordered;
  alignNodesForRightFlow(first, second);

  const linkNode = createLinkBetweenNodes(first, second, true);
  figma.currentPage.selection = [linkNode];
  figma.viewport.scrollAndZoomIntoView([first, second, linkNode]);
  figma.notify("Connector generated (right direction). Click the line to insert a default node.");
}

function createLinkBetweenNodes(
  first: SceneNode & DimensionAndPositionMixin,
  second: SceneNode & DimensionAndPositionMixin,
  selectableLink: boolean
): SceneNode {
  const canCreateConnector = typeof figma.createConnector === "function";
  if (canCreateConnector) {
    try {
      const connector = figma.createConnector();
      connector.name = "Flow Connector";
      connector.connectorStart = { endpointNodeId: first.id, magnet: "RIGHT" };
      connector.connectorEnd = { endpointNodeId: second.id, magnet: "LEFT" };
      connector.strokeWeight = 3;
      connector.cornerRadius = 14;
      connector.fills = [];
      connector.strokes = [{ type: "SOLID", color: hexToRgb("#383838") }];
      connector.connectorStartStrokeCap = "NONE";
      connector.connectorEndStrokeCap = "ARROW_LINES";
      figma.currentPage.appendChild(connector);
      return connector;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connector API unavailable.";
      figma.notify(`Connector API unavailable, switched to shape line. ${message}`);
    }
  }
  return createFallbackShapeLink(first, second, selectableLink, true);
}

function createFallbackShapeLink(
  first: SceneNode & DimensionAndPositionMixin,
  second: SceneNode & DimensionAndPositionMixin,
  selectableLink: boolean,
  arrowAtEnd: boolean
): GroupNode {
  const startPoint = getAttachPoint(first, "RIGHT");
  const endPoint = getAttachPoint(second, "LEFT");
  const arrowWidth = arrowAtEnd ? 10 : 0;
  const lineWidth = Math.max(endPoint.x - startPoint.x - arrowWidth, 2);
  const lineY = startPoint.y - 1.5;

  const line = figma.createRectangle();
  line.name = "Flow Link Segment";
  line.resize(lineWidth, 3);
  line.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  line.strokes = [];
  line.x = startPoint.x;
  line.y = lineY;
  figma.currentPage.appendChild(line);

  const nodesToGroup: SceneNode[] = [line];
  if (arrowAtEnd) {
    const arrowNode = figma.createVector();
    arrowNode.name = "Flow Arrow";
    arrowNode.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 0 L 10 5 L 0 10 Z" }];
    arrowNode.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
    arrowNode.strokes = [];
    arrowNode.resize(10, 10);
    arrowNode.x = startPoint.x + lineWidth;
    arrowNode.y = startPoint.y - 5;
    figma.currentPage.appendChild(arrowNode);
    nodesToGroup.push(arrowNode);
  }

  const group = figma.group(nodesToGroup, figma.currentPage);
  group.name = "Flow Connector (Shape)";
  if (selectableLink) {
    group.setPluginData(FLOW_LINK_MARK, "true");
    group.setPluginData(FLOW_LINK_START_NODE, first.id);
    group.setPluginData(FLOW_LINK_END_NODE, second.id);
  }
  return group;
}

function getAttachPoint(
  node: SceneNode & DimensionAndPositionMixin,
  magnet: "LEFT" | "RIGHT"
): { x: number; y: number } {
  if (magnet === "LEFT") {
    return { x: node.x, y: node.y + node.height / 2 };
  }
  return { x: node.x + node.width, y: node.y + node.height / 2 };
}

async function generateNodeFromSelection(payload: GenerateNodePayload): Promise<void> {
  await ensureFontsLoaded();
  const selectedLink = getSingleSelectedLink();
  if (selectedLink) {
    await insertNodeOnSelectedLink(selectedLink, payload.nodeType, payload.text || "Text", false);
    return;
  }

  if (figma.currentPage.selection.length !== 1) {
    throw new Error("Select one connector or one flow node.");
  }

  const selectedNode = figma.currentPage.selection[0];
  if (selectedNode.type !== "FRAME" || selectedNode.getPluginData(FLOW_NODE_MARK) !== "true") {
    throw new Error("Selected node is not a plugin-created flow node.");
  }

  applyNodeStyle(selectedNode, payload.nodeType, payload.text || "Text");
  figma.notify(`Node updated to ${payload.nodeType}.`);
}

function getSingleSelectedLink(): SelectedLink | null {
  if (figma.currentPage.selection.length !== 1) {
    return null;
  }
  const node = figma.currentPage.selection[0];
  if (node.type === "CONNECTOR") {
    return { kind: "connector", connector: node };
  }
  if (node.type === "GROUP" && node.getPluginData(FLOW_LINK_MARK) === "true") {
    return { kind: "shape", shape: node };
  }
  return null;
}

async function getEndpointNode(endpoint: ConnectorEndpoint): Promise<(SceneNode & DimensionAndPositionMixin) | null> {
  if (!("endpointNodeId" in endpoint)) {
    return null;
  }
  const node = await figma.getNodeByIdAsync(endpoint.endpointNodeId);
  if (!node || !("x" in node) || !("width" in node)) {
    return null;
  }
  return node as SceneNode & DimensionAndPositionMixin;
}

async function insertNodeOnSelectedLink(
  selectedLink: SelectedLink,
  nodeType: NodeType,
  text: string,
  isDefaultNode: boolean
): Promise<void> {
  if (selectedLink.kind === "connector") {
    await insertNodeOnConnector(selectedLink.connector, nodeType, text, isDefaultNode);
    return;
  }
  await insertNodeOnShapeLink(selectedLink.shape, nodeType, text, isDefaultNode);
}

async function insertNodeOnConnector(
  connector: ConnectorNode,
  nodeType: NodeType,
  text: string,
  isDefaultNode: boolean
): Promise<void> {
  const startNode = await getEndpointNode(connector.connectorStart);
  const endNode = await getEndpointNode(connector.connectorEnd);
  if (!startNode || !endNode) {
    throw new Error("Connector must be attached to two nodes.");
  }

  const centerX = (startNode.x + startNode.width / 2 + (endNode.x + endNode.width / 2)) / 2;
  const centerY = (startNode.y + startNode.height / 2 + (endNode.y + endNode.height / 2)) / 2;

  const flowNode = figma.createFrame();
  flowNode.name = "Flow Node";
  applyNodeStyle(flowNode, nodeType, text);
  flowNode.x = centerX - flowNode.width / 2;
  flowNode.y = centerY - flowNode.height / 2;
  figma.currentPage.appendChild(flowNode);

  const incoming = figma.createConnector();
  incoming.name = "Flow Connector";
  incoming.connectorStart = connector.connectorStart;
  incoming.connectorEnd = { endpointNodeId: flowNode.id, magnet: "LEFT" };
  incoming.strokeWeight = connector.strokeWeight;
  incoming.cornerRadius = connector.cornerRadius;
  incoming.fills = [];
  incoming.strokes = connector.strokes;
  incoming.connectorStartStrokeCap = connector.connectorStartStrokeCap;
  incoming.connectorEndStrokeCap = "NONE";
  figma.currentPage.appendChild(incoming);

  const outgoing = figma.createConnector();
  outgoing.name = "Flow Connector";
  outgoing.connectorStart = { endpointNodeId: flowNode.id, magnet: "RIGHT" };
  outgoing.connectorEnd = connector.connectorEnd;
  outgoing.strokeWeight = connector.strokeWeight;
  outgoing.cornerRadius = connector.cornerRadius;
  outgoing.fills = [];
  outgoing.strokes = connector.strokes;
  outgoing.connectorStartStrokeCap = "NONE";
  outgoing.connectorEndStrokeCap = connector.connectorEndStrokeCap;
  figma.currentPage.appendChild(outgoing);

  connector.remove();
  figma.currentPage.selection = [flowNode];
  figma.viewport.scrollAndZoomIntoView([flowNode, incoming, outgoing]);
  figma.notify(isDefaultNode ? "Generated default None node." : `Generated ${nodeType} node.`);
}

async function insertNodeOnShapeLink(
  shapeLink: GroupNode,
  nodeType: NodeType,
  text: string,
  isDefaultNode: boolean
): Promise<void> {
  const startNodeId = shapeLink.getPluginData(FLOW_LINK_START_NODE);
  const endNodeId = shapeLink.getPluginData(FLOW_LINK_END_NODE);
  if (!startNodeId || !endNodeId) {
    throw new Error("Shape link is missing endpoint metadata.");
  }
  const startNode = await figma.getNodeByIdAsync(startNodeId);
  const endNode = await figma.getNodeByIdAsync(endNodeId);
  if (!startNode || !endNode || !("x" in startNode) || !("x" in endNode)) {
    throw new Error("Shape link is missing endpoint nodes.");
  }

  const startDim = startNode as SceneNode & DimensionAndPositionMixin;
  const endDim = endNode as SceneNode & DimensionAndPositionMixin;
  const centerX = (startDim.x + startDim.width / 2 + (endDim.x + endDim.width / 2)) / 2;
  const centerY = (startDim.y + startDim.height / 2 + (endDim.y + endDim.height / 2)) / 2;

  const flowNode = figma.createFrame();
  flowNode.name = "Flow Node";
  applyNodeStyle(flowNode, nodeType, text);
  flowNode.x = centerX - flowNode.width / 2;
  flowNode.y = centerY - flowNode.height / 2;
  figma.currentPage.appendChild(flowNode);

  createFallbackShapeLink(startDim, flowNode, false, false);
  createFallbackShapeLink(flowNode, endDim, false, true);
  shapeLink.remove();

  figma.currentPage.selection = [flowNode];
  figma.viewport.scrollAndZoomIntoView([flowNode]);
  figma.notify(isDefaultNode ? "Generated default None node." : `Generated ${nodeType} node.`);
}

function applyNodeStyle(node: FrameNode, nodeType: NodeType, textValue: string): void {
  node.setPluginData(FLOW_NODE_MARK, "true");
  node.setPluginData(FLOW_NODE_TYPE, nodeType);
  node.strokes = [{ type: "SOLID", color: hexToRgb("#383838") }];
  node.strokeWeight = 1.5;
  node.fills = [{ type: "SOLID", color: hexToRgb("#FCFCFC") }];

  const label = getOrCreateLabel(node);
  label.characters = textValue || "Text";
  label.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];

  if (nodeType === "decision") {
    node.resize(96, 96);
    node.cornerRadius = 0;
    node.rotation = 45;
    label.rotation = -45;
    label.fontSize = 12;
  } else {
    node.resize(132, 52);
    node.rotation = 0;
    label.rotation = 0;
    label.fontSize = 12;
    node.cornerRadius = nodeType === "none" ? 10 : 0;
  }
  label.x = node.width / 2 - label.width / 2;
  label.y = node.height / 2 - label.height / 2;
  node.name = `${capitalize(nodeType)} Node`;
}

function getOrCreateLabel(node: FrameNode): TextNode {
  const firstText = node.findChild((child): child is TextNode => child.type === "TEXT");
  if (firstText) {
    return firstText;
  }
  const label = figma.createText();
  label.fontName = FONT_REGULAR;
  label.textAutoResize = "WIDTH_AND_HEIGHT";
  node.appendChild(label);
  return label;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace("#", "");
  const parsed = parseInt(cleanHex, 16);
  return {
    r: ((parsed >> 16) & 255) / 255,
    g: ((parsed >> 8) & 255) / 255,
    b: (parsed & 255) / 255
  };
}

function sendStatus(scope: "connector" | "node", kind: "success" | "error", message: string): void {
  figma.ui.postMessage({
    type: "status",
    payload: {
      scope,
      kind,
      message
    }
  });
}
