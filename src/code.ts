figma.showUI(__html__, { width: 360, height: 300 });

type PluginRequest = { type: "generate-connector" };

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
  magnet: "LEFT" | "RIGHT"
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

  const ordered = [...selected].sort((a, b) => a.x - b.x || a.y - b.y);
  const [first, second] = ordered;

  const linkNode = createLinkBetweenNodes(first, second);
  figma.currentPage.selection = [linkNode];
  figma.notify("Connector generated.");
}

function createLinkBetweenNodes(
  first: SceneNode & DimensionAndPositionMixin,
  second: SceneNode & DimensionAndPositionMixin
): SceneNode {
  if (typeof figma.createConnector === "function") {
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
  return createFallbackShapeLink(first, second);
}

function createFallbackShapeLink(
  first: SceneNode & DimensionAndPositionMixin,
  second: SceneNode & DimensionAndPositionMixin
): GroupNode {
  const startPoint = getAttachPoint(first, "RIGHT");
  const endPoint = getAttachPoint(second, "LEFT");
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const fullLength = Math.max(Math.sqrt(dx * dx + dy * dy), 2);
  const ux = dx / fullLength;
  const uy = dy / fullLength;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const arrowLength = 10;
  const lineLength = Math.max(fullLength - arrowLength, 2);
  const lineCenterX = startPoint.x + ux * (lineLength / 2);
  const lineCenterY = startPoint.y + uy * (lineLength / 2);

  const line = figma.createRectangle();
  line.name = "Flow Link Segment";
  line.resize(lineLength, 3);
  line.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  line.strokes = [];
  line.x = lineCenterX - lineLength / 2;
  line.y = lineCenterY - 1.5;
  line.rotation = angle;
  figma.currentPage.appendChild(line);

  const arrowCenterX = endPoint.x - ux * (arrowLength / 2);
  const arrowCenterY = endPoint.y - uy * (arrowLength / 2);
  const arrow = figma.createVector();
  arrow.name = "Flow Arrow";
  arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 0 L 10 5 L 0 10 Z" }];
  arrow.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  arrow.strokes = [];
  arrow.resize(10, 10);
  arrow.x = arrowCenterX - 5;
  arrow.y = arrowCenterY - 5;
  arrow.rotation = angle;
  figma.currentPage.appendChild(arrow);

  const group = figma.group([line, arrow], figma.currentPage);
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
