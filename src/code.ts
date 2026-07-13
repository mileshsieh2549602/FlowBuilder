figma.showUI(__html__, { width: 360, height: 300 });

type PluginRequest = { type: "generate-connector" };
type HorizontalMagnet = "LEFT" | "RIGHT";
type FrameLikeNode = SceneNode & DimensionAndPositionMixin;

let previousFrameSelection = new Set<string>();
let frameSelectionOrder: string[] = [];
let isSyncingFallbackLinks = false;
let pendingSyncTimer: ReturnType<typeof setTimeout> | null = null;

const FALLBACK_LINK_MARK = "flow-builder-fallback-link";
const FALLBACK_LINK_START_ID = "flow-builder-fallback-start-id";
const FALLBACK_LINK_END_ID = "flow-builder-fallback-end-id";
const FALLBACK_ROLE_KEY = "flow-builder-fallback-role";
const SYNC_THROTTLE_MS = 33;
const GEOMETRY_EPSILON = 0.25;

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

figma.on("selectionchange", () => {
  updateSelectionOrder();
});

void initializeDocumentSync();

async function initializeDocumentSync(): Promise<void> {
  try {
    // Required in incremental document mode before subscribing to documentchange.
    await figma.loadAllPagesAsync();
    figma.on("documentchange", () => {
      scheduleFallbackSync();
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize document sync.";
    figma.notify(`Connector sync fallback disabled: ${message}`);
  }
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

function isFrameOrImage(node: SceneNode): node is FrameLikeNode {
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

  updateSelectionOrder();
  const orderedSelection = resolveSelectionByOrder(selected);
  const [sourceNode, targetNode] = orderedSelection;
  const direction: HorizontalMagnet = targetNode.x >= sourceNode.x ? "RIGHT" : "LEFT";

  const linkNode = createLinkBetweenNodes(sourceNode, targetNode, direction);
  figma.currentPage.selection = [sourceNode, targetNode, linkNode];
  figma.notify(`Connector generated (${direction === "RIGHT" ? "rightward" : "leftward"}).`);
}

function resolveSelectionByOrder(selected: FrameLikeNode[]): [FrameLikeNode, FrameLikeNode] {
  if (selected.length !== 2) {
    throw new Error("Selection must contain exactly two nodes.");
  }
  const [a, b] = selected;
  const indexA = frameSelectionOrder.indexOf(a.id);
  const indexB = frameSelectionOrder.indexOf(b.id);
  if (indexA === -1 || indexB === -1 || indexA === indexB) {
    return [a, b];
  }
  return indexA < indexB ? [a, b] : [b, a];
}

function updateSelectionOrder(): void {
  const currentIds = figma.currentPage.selection.filter((node) => isFrameOrImage(node)).map((node) => node.id);
  const currentSet = new Set(currentIds);

  frameSelectionOrder = frameSelectionOrder.filter((id) => currentSet.has(id));

  currentIds.forEach((id) => {
    if (!previousFrameSelection.has(id) || !frameSelectionOrder.includes(id)) {
      frameSelectionOrder.push(id);
    }
  });

  previousFrameSelection = currentSet;
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
  const segment1 = figma.createRectangle();
  segment1.name = "Flow Link Segment";
  segment1.resize(10, 3);
  segment1.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  segment1.strokes = [];
  segment1.setPluginData(FALLBACK_ROLE_KEY, "segment-1");
  figma.currentPage.appendChild(segment1);

  const segment3 = figma.createRectangle();
  segment3.name = "Flow Link Segment";
  segment3.resize(10, 3);
  segment3.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  segment3.strokes = [];
  segment3.setPluginData(FALLBACK_ROLE_KEY, "segment-3");
  figma.currentPage.appendChild(segment3);

  const segment2 = figma.createRectangle();
  segment2.name = "Flow Link Segment";
  segment2.resize(3, 10);
  segment2.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  segment2.strokes = [];
  segment2.setPluginData(FALLBACK_ROLE_KEY, "segment-2");
  figma.currentPage.appendChild(segment2);

  const arrow = figma.createVector();
  arrow.name = "Flow Arrow";
  arrow.vectorPaths = [
    {
      windingRule: "NONZERO",
      data: direction === "RIGHT" ? "M 0 0 L 10 5 L 0 10 Z" : "M 10 0 L 0 5 L 10 10 Z"
    }
  ];
  arrow.fills = [{ type: "SOLID", color: hexToRgb("#383838") }];
  arrow.strokes = [];
  arrow.resize(10, 10);
  arrow.setPluginData(FALLBACK_ROLE_KEY, "arrow");
  figma.currentPage.appendChild(arrow);

  const group = figma.group([segment1, segment2, segment3, arrow], figma.currentPage);
  group.name = "Flow Connector (Shape)";
  group.setPluginData(FALLBACK_LINK_MARK, "true");
  group.setPluginData(FALLBACK_LINK_START_ID, sourceNode.id);
  group.setPluginData(FALLBACK_LINK_END_ID, targetNode.id);
  layoutFallbackShapeLink(group, sourceNode, targetNode, direction);
  return group;
}

function layoutFallbackShapeLink(
  group: GroupNode,
  sourceNode: SceneNode & DimensionAndPositionMixin,
  targetNode: SceneNode & DimensionAndPositionMixin,
  direction: HorizontalMagnet
): void {
  const segment1 = findFallbackChild<RectangleNode>(group, "segment-1", "RECTANGLE");
  const segment2 = findFallbackChild<RectangleNode>(group, "segment-2", "RECTANGLE");
  const segment3 = findFallbackChild<RectangleNode>(group, "segment-3", "RECTANGLE");
  const arrow = findFallbackChild<VectorNode>(group, "arrow", "VECTOR");
  if (!segment1 || !segment2 || !segment3 || !arrow) {
    return;
  }

  const startPoint = getAttachPoint(sourceNode, direction === "RIGHT" ? "RIGHT" : "LEFT");
  const endPoint = getAttachPoint(targetNode, direction === "RIGHT" ? "LEFT" : "RIGHT");

  const arrowLength = 10;
  const stroke = 3;
  const travelDistance = endPoint.x - startPoint.x;
  const arrowInset = direction === "RIGHT" ? -arrowLength : arrowLength;
  const finalX = startPoint.x + travelDistance + arrowInset;
  const midX = startPoint.x + (finalX - startPoint.x) / 2;

  const segment1Abs = {
    x: Math.min(startPoint.x, midX),
    y: startPoint.y - stroke / 2,
    w: Math.max(Math.abs(midX - startPoint.x), 2),
    h: stroke
  };
  const segment2Abs = {
    x: midX - stroke / 2,
    y: Math.min(startPoint.y, endPoint.y),
    w: stroke,
    h: Math.max(Math.abs(endPoint.y - startPoint.y), 0.01)
  };
  const segment3Abs = {
    x: Math.min(midX, finalX),
    y: endPoint.y - stroke / 2,
    w: Math.max(Math.abs(finalX - midX), 2),
    h: stroke
  };
  const arrowPath = direction === "RIGHT" ? "M 0 0 L 10 5 L 0 10 Z" : "M 10 0 L 0 5 L 10 10 Z";
  const arrowAbs = {
    x: direction === "RIGHT" ? endPoint.x - arrowLength : endPoint.x,
    y: endPoint.y - 5,
    w: 10,
    h: 10
  };

  const minX = Math.min(segment1Abs.x, segment2Abs.x, segment3Abs.x, arrowAbs.x);
  const minY = Math.min(segment1Abs.y, segment2Abs.y, segment3Abs.y, arrowAbs.y);

  maybeSetPosition(group, minX, minY);

  maybeSetRectGeometry(segment1, segment1Abs.x - minX, segment1Abs.y - minY, segment1Abs.w, segment1Abs.h);
  maybeSetRectGeometry(segment2, segment2Abs.x - minX, segment2Abs.y - minY, segment2Abs.w, segment2Abs.h);
  maybeSetRectGeometry(segment3, segment3Abs.x - minX, segment3Abs.y - minY, segment3Abs.w, segment3Abs.h);

  arrow.vectorPaths = [{ windingRule: "NONZERO", data: arrowPath }];
  maybeSetVectorGeometry(arrow, arrowAbs.x - minX, arrowAbs.y - minY, arrowAbs.w, arrowAbs.h, 0);
}

function findFallbackChild<T extends SceneNode>(
  group: GroupNode,
  role: string,
  type: SceneNode["type"]
): T | null {
  const node = group.children.find((child) => child.type === type && child.getPluginData(FALLBACK_ROLE_KEY) === role);
  return (node as T | undefined) ?? null;
}

async function syncFallbackLinks(): Promise<void> {
  if (isSyncingFallbackLinks) {
    return;
  }
  isSyncingFallbackLinks = true;
  try {
    const links = figma.currentPage.findAll(
      (node): node is GroupNode => node.type === "GROUP" && node.getPluginData(FALLBACK_LINK_MARK) === "true"
    );
    for (const group of links) {
      const startNodeId = group.getPluginData(FALLBACK_LINK_START_ID);
      const endNodeId = group.getPluginData(FALLBACK_LINK_END_ID);
      if (!startNodeId || !endNodeId) {
        continue;
      }

      const [startNode, endNode] = await Promise.all([
        figma.getNodeByIdAsync(startNodeId),
        figma.getNodeByIdAsync(endNodeId)
      ]);
      if (!startNode || !endNode || !("x" in startNode) || !("x" in endNode)) {
        continue;
      }

      const startDim = startNode as SceneNode & DimensionAndPositionMixin;
      const endDim = endNode as SceneNode & DimensionAndPositionMixin;
      const direction: HorizontalMagnet = endDim.x >= startDim.x ? "RIGHT" : "LEFT";
      layoutFallbackShapeLink(group, startDim, endDim, direction);
    }
  } finally {
    isSyncingFallbackLinks = false;
  }
}

function scheduleFallbackSync(): void {
  if (pendingSyncTimer) {
    return;
  }
  pendingSyncTimer = setTimeout(() => {
    pendingSyncTimer = null;
    void syncFallbackLinks();
  }, SYNC_THROTTLE_MS);
}

function almostEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= GEOMETRY_EPSILON;
}

function maybeSetPosition(node: SceneNode & DimensionAndPositionMixin, x: number, y: number): void {
  if (!almostEqual(node.x, x)) {
    node.x = x;
  }
  if (!almostEqual(node.y, y)) {
    node.y = y;
  }
}

function maybeSetRectGeometry(node: RectangleNode, x: number, y: number, w: number, h: number): void {
  maybeSetPosition(node, x, y);
  if (!almostEqual(node.width, w) || !almostEqual(node.height, h)) {
    node.resize(w, h);
  }
}

function maybeSetVectorGeometry(
  node: VectorNode,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation: number
): void {
  maybeSetPosition(node, x, y);
  if (!almostEqual(node.width, w) || !almostEqual(node.height, h)) {
    node.resize(w, h);
  }
  if (!almostEqual(node.rotation, rotation)) {
    node.rotation = rotation;
  }
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
