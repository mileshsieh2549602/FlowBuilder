figma.showUI(__html__, { width: 360, height: 300 });

type PluginRequest = { type: "generate-connector" };
type HorizontalMagnet = "LEFT" | "RIGHT";

figma.ui.onmessage = async (msg: PluginRequest) => {
  try {
    if (msg.type !== "generate-connector") {
      throw new Error("Unsupported command.");
    }
    await generateConnectorFromSelection();
    sendStatus("success", "Successful");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected plugin error.";
    figma.notify(message, { error: true });
    sendStatus("error", message);
  }
};

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

function getAttachPoint(
  node: SceneNode & DimensionAndPositionMixin,
  magnet: HorizontalMagnet
): { x: number; y: number } {
  if (magnet === "LEFT") {
    return { x: node.x, y: node.y + node.height / 2 };
  }
  return { x: node.x + node.width, y: node.y + node.height / 2 };
}

async function generateConnectorFromSelection(): Promise<void> {
  const selected = figma.currentPage.selection.filter((node) => isFrameOrImage(node));
  if (selected.length !== 2) {
    throw new Error("Please select exactly 2 Frame/Image nodes.");
  }

  const [sourceNode, targetNode] = selected;
  const direction: HorizontalMagnet = targetNode.x >= sourceNode.x ? "RIGHT" : "LEFT";

  const linkNode = createLinkBetweenNodes(sourceNode, targetNode, direction);
  figma.currentPage.selection = [sourceNode, targetNode, linkNode];
  figma.notify(`Connector generated (${direction === "RIGHT" ? "rightward" : "leftward"}).`);
}

function createLinkBetweenNodes(
  sourceNode: SceneNode & DimensionAndPositionMixin,
  targetNode: SceneNode & DimensionAndPositionMixin,
  direction: HorizontalMagnet
): SceneNode {
  // Leftward links are rendered with the shape fallback to guarantee
  // a visually connected elbow line + arrowhead in all editor environments.
  if (direction === "LEFT") {
    return createFallbackShapeLink(sourceNode, targetNode, direction);
  }

  const startMagnet: HorizontalMagnet = direction === "RIGHT" ? "RIGHT" : "LEFT";
  const endMagnet: HorizontalMagnet = direction === "RIGHT" ? "LEFT" : "RIGHT";

  if (typeof figma.createConnector === "function") {
    try {
      const connector = figma.createConnector();
      connector.name = "Flow Connector";
      connector.connectorStart = { endpointNodeId: sourceNode.id, magnet: startMagnet };
      connector.connectorEnd = { endpointNodeId: targetNode.id, magnet: endMagnet };
      connector.connectorLineType = "ELBOWED";
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
  return createFallbackShapeLink(sourceNode, targetNode, direction);
}

function createFallbackShapeLink(
  sourceNode: SceneNode & DimensionAndPositionMixin,
  targetNode: SceneNode & DimensionAndPositionMixin,
  direction: HorizontalMagnet
): GroupNode {
  const startPoint = getAttachPoint(sourceNode, direction === "RIGHT" ? "RIGHT" : "LEFT");
  const endPoint = getAttachPoint(targetNode, direction === "RIGHT" ? "LEFT" : "RIGHT");
  const arrowLength = 10;
  const stroke = 3;
  const travelDistance = endPoint.x - startPoint.x;
  const arrowInset = direction === "RIGHT" ? -arrowLength : arrowLength;
  const finalX = startPoint.x + travelDistance + arrowInset;
  const midX = startPoint.x + (finalX - startPoint.x) / 2;
  const segment1Width = Math.max(Math.abs(midX - startPoint.x), 2);
  const segment3Width = Math.max(Math.abs(finalX - midX), 2);

  const nodes: SceneNode[] = [];

  const segment1 = figma.createRectangle();
  segment1.name = "Flow Link Segment";
  segment1.resize(segment1Width, stroke);
  segment1.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  segment1.strokes = [];
  segment1.x = Math.min(startPoint.x, midX);
  segment1.y = startPoint.y - stroke / 2;
  figma.currentPage.appendChild(segment1);
  nodes.push(segment1);

  if (Math.abs(endPoint.y - startPoint.y) >= 1) {
    const segment2 = figma.createRectangle();
    segment2.name = "Flow Link Segment";
    segment2.resize(stroke, Math.abs(endPoint.y - startPoint.y));
    segment2.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
    segment2.strokes = [];
    segment2.x = midX - stroke / 2;
    segment2.y = Math.min(startPoint.y, endPoint.y);
    figma.currentPage.appendChild(segment2);
    nodes.push(segment2);
  }

  const segment3 = figma.createRectangle();
  segment3.name = "Flow Link Segment";
  segment3.resize(segment3Width, stroke);
  segment3.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  segment3.strokes = [];
  segment3.x = Math.min(midX, finalX);
  segment3.y = endPoint.y - stroke / 2;
  figma.currentPage.appendChild(segment3);
  nodes.push(segment3);

  const arrow = figma.createVector();
  arrow.name = "Flow Arrow";
  arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 0 L 10 5 L 0 10 Z" }];
  arrow.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  arrow.strokes = [];
  arrow.resize(10, 10);
  arrow.x = direction === "RIGHT" ? endPoint.x - arrowLength : endPoint.x;
  arrow.y = endPoint.y - 5;
  arrow.rotation = direction === "RIGHT" ? 0 : 180;
  figma.currentPage.appendChild(arrow);
  nodes.push(arrow);

  const group = figma.group(nodes, figma.currentPage);
  group.name = "Flow Connector (Shape)";
  return group;
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

function sendStatus(kind: "success" | "error", message: string): void {
  figma.ui.postMessage({
    type: "status",
    payload: {
      kind,
      message
    }
  });
}
