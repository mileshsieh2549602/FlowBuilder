figma.showUI(__html__, { width: 360, height: 460 });

type NodeType = "none" | "process" | "decision";
type ArrowPosition = "left" | "right";
type LinePosition = "top" | "right" | "bottom" | "left";
type Magnet = "TOP" | "RIGHT" | "BOTTOM" | "LEFT";

interface GenerateConnectorPayload {
  arrowPosition: ArrowPosition;
  linePosition: LinePosition;
}

interface GenerateNodePayload {
  nodeType: NodeType;
  text: string;
}

type PluginRequest =
  | { type: "generate-connector"; payload: GenerateConnectorPayload }
  | { type: "generate-node"; payload: GenerateNodePayload }
  | { type: "close-plugin" };

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
        await generateConnectorFromSelection(msg.payload);
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
  const selectedConnector = getSingleSelectedConnector();
  if (!selectedConnector) {
    return;
  }

  autoNodeGuard = true;
  try {
    await ensureFontsLoaded();
    await insertNodeOnConnector(selectedConnector, "none", "Text", true);
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

function getMagnetFromLinePosition(position: LinePosition): Magnet {
  switch (position) {
    case "top":
      return "TOP";
    case "bottom":
      return "BOTTOM";
    case "left":
      return "LEFT";
    case "right":
      return "RIGHT";
    default:
      return "RIGHT";
  }
}

function getConnectorMagnets(position: LinePosition): { start: Magnet; end: Magnet } {
  switch (position) {
    case "right":
      return { start: "RIGHT", end: "LEFT" };
    case "left":
      return { start: "LEFT", end: "RIGHT" };
    case "top":
      return { start: "TOP", end: "BOTTOM" };
    case "bottom":
      return { start: "BOTTOM", end: "TOP" };
    default:
      return { start: "RIGHT", end: "LEFT" };
  }
}

function alignNodesForConnection(
  first: SceneNode & DimensionAndPositionMixin,
  second: SceneNode & DimensionAndPositionMixin,
  linePosition: LinePosition
): void {
  if (linePosition === "left" || linePosition === "right") {
    const firstCenterY = first.y + first.height / 2;
    second.y = firstCenterY - second.height / 2;
    second.x = first.x + first.width + FLOW_SPACING;
    return;
  }
  const firstCenterX = first.x + first.width / 2;
  second.x = firstCenterX - second.width / 2;
  second.y = first.y + first.height + FLOW_SPACING;
}

function getArrowCaps(position: ArrowPosition): { start: ConnectorStrokeCap; end: ConnectorStrokeCap } {
  if (position === "left") {
    return { start: "ARROW_LINES", end: "NONE" };
  }
  return { start: "NONE", end: "ARROW_LINES" };
}

async function generateConnectorFromSelection(payload: GenerateConnectorPayload): Promise<void> {
  const selected = figma.currentPage.selection.filter((node) => isFrameOrImage(node));
  if (selected.length !== 2) {
    throw new Error("Please select exactly 2 Frame/Image nodes.");
  }

  const ordered = [...selected].sort((a, b) => a.x - b.x || a.y - b.y);
  const [first, second] = ordered;
  alignNodesForConnection(first, second, payload.linePosition);

  const magnet = getMagnetFromLinePosition(payload.linePosition);
  const connectorMagnets = getConnectorMagnets(payload.linePosition);
  const arrowCaps = getArrowCaps(payload.arrowPosition);

  const linkNode = createLinkBetweenNodes(first, second, connectorMagnets.start, connectorMagnets.end, arrowCaps);
  figma.currentPage.selection = [linkNode];
  figma.viewport.scrollAndZoomIntoView([first, second, linkNode]);
  figma.notify(`Connector generated (${capitalize(magnet.toLowerCase())} side). Click the line to insert a default node.`);
}

function createLinkBetweenNodes(
  first: SceneNode & DimensionAndPositionMixin,
  second: SceneNode & DimensionAndPositionMixin,
  startMagnet: Magnet,
  endMagnet: Magnet,
  arrowCaps: { start: ConnectorStrokeCap; end: ConnectorStrokeCap }
): SceneNode {
  const canCreateConnector = typeof figma.createConnector === "function";
  if (canCreateConnector) {
    try {
      const connector = figma.createConnector();
      connector.name = "Flow Connector";
      connector.connectorStart = { endpointNodeId: first.id, magnet: startMagnet };
      connector.connectorEnd = { endpointNodeId: second.id, magnet: endMagnet };
      connector.strokeWeight = 3;
      connector.cornerRadius = 14;
      connector.fills = [];
      connector.strokes = [{ type: "SOLID", color: hexToRgb("#383838") }];
      connector.connectorStartStrokeCap = arrowCaps.start;
      connector.connectorEndStrokeCap = arrowCaps.end;
      figma.currentPage.appendChild(connector);
      return connector;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connector API unavailable.";
      figma.notify(`Connector API unavailable, switched to shape line. ${message}`);
    }
  }
  return createFallbackShapeLink(first, second, startMagnet, endMagnet, arrowCaps);
}

function createFallbackShapeLink(
  first: SceneNode & DimensionAndPositionMixin,
  second: SceneNode & DimensionAndPositionMixin,
  startMagnet: Magnet,
  endMagnet: Magnet,
  arrowCaps: { start: ConnectorStrokeCap; end: ConnectorStrokeCap }
): SceneNode {
  const startPoint = getAttachPoint(first, startMagnet);
  const endPoint = getAttachPoint(second, endMagnet);
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 2);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const line = figma.createRectangle();
  line.name = "Flow Connector (Shape)";
  line.resize(length, 3);
  line.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  line.strokes = [];
  line.x = (startPoint.x + endPoint.x) / 2 - length / 2;
  line.y = (startPoint.y + endPoint.y) / 2 - 1.5;
  line.rotation = angle;
  line.setPluginData(FLOW_LINK_MARK, "true");
  line.setPluginData(FLOW_LINK_START_NODE, first.id);
  line.setPluginData(FLOW_LINK_END_NODE, second.id);
  figma.currentPage.appendChild(line);

  const hasArrowAtEnd = arrowCaps.end !== "NONE";
  const hasArrowAtStart = arrowCaps.start !== "NONE";
  if (hasArrowAtEnd || hasArrowAtStart) {
    const arrowNode = figma.createPolygon();
    arrowNode.name = "Flow Arrow (Shape)";
    arrowNode.pointCount = 3;
    arrowNode.resize(10, 10);
    arrowNode.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
    arrowNode.strokes = [];
    if (hasArrowAtEnd) {
      arrowNode.x = endPoint.x - 5;
      arrowNode.y = endPoint.y - 5;
      arrowNode.rotation = angle + 90;
    } else {
      arrowNode.x = startPoint.x - 5;
      arrowNode.y = startPoint.y - 5;
      arrowNode.rotation = angle - 90;
    }
    figma.currentPage.appendChild(arrowNode);
  }
  return line;
}

function getAttachPoint(node: SceneNode & DimensionAndPositionMixin, magnet: Magnet): { x: number; y: number } {
  switch (magnet) {
    case "TOP":
      return { x: node.x + node.width / 2, y: node.y };
    case "BOTTOM":
      return { x: node.x + node.width / 2, y: node.y + node.height };
    case "LEFT":
      return { x: node.x, y: node.y + node.height / 2 };
    case "RIGHT":
      return { x: node.x + node.width, y: node.y + node.height / 2 };
    default:
      return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
  }
}

async function generateNodeFromSelection(payload: GenerateNodePayload): Promise<void> {
  await ensureFontsLoaded();
  const selectedConnector = getSingleSelectedConnector();
  if (selectedConnector) {
    await insertNodeOnConnector(selectedConnector, payload.nodeType, payload.text || "Text", false);
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

function getSingleSelectedConnector(): ConnectorNode | null {
  if (figma.currentPage.selection.length !== 1) {
    return null;
  }
  const node = figma.currentPage.selection[0];
  return node.type === "CONNECTOR" ? node : null;
}

function getEndpointNode(endpoint: ConnectorEndpoint): (SceneNode & DimensionAndPositionMixin) | null {
  if (!("endpointNodeId" in endpoint)) {
    return null;
  }
  const node = figma.getNodeById(endpoint.endpointNodeId);
  if (!node || !("x" in node) || !("width" in node)) {
    return null;
  }
  return node as SceneNode & DimensionAndPositionMixin;
}

async function insertNodeOnConnector(
  connector: ConnectorNode,
  nodeType: NodeType,
  text: string,
  isDefaultNode: boolean
): Promise<void> {
  const startNode = getEndpointNode(connector.connectorStart);
  const endNode = getEndpointNode(connector.connectorEnd);
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
