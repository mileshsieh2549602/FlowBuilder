type StatusKind = "success" | "error";
type ConnectorSide = "LEFT" | "RIGHT" | "TOP" | "BOTTOM";
type NodeType = "none" | "process" | "start-end" | "yes-no";

interface ConnectorPreferencePayload {
  sourceSide: ConnectorSide;
  targetSide: ConnectorSide;
}

interface PluginStatusMessage {
  type: "status";
  payload: {
    kind: StatusKind;
    message: string;
  };
}
interface PluginDebugStateMessage {
  type: "debug-state";
  payload: {
    enabled: boolean;
  };
}
interface PluginConnectorSideStateMessage {
  type: "connector-side-state";
  payload: ConnectorPreferencePayload;
}
interface PluginConnectorSelectionStateMessage {
  type: "connector-selection-state";
  payload: {
    sourceSelected: boolean;
    targetSelected: boolean;
  };
}
interface PluginNodeTypeStateMessage {
  type: "node-type-state";
  payload: {
    enabled: boolean;
    selectedType: NodeType | null;
  };
}

const panelStatus = document.getElementById("panelStatus") as HTMLDivElement;
const sourceNodeBox = document.getElementById("sourceNodeBox") as HTMLDivElement;
const targetNodeBox = document.getElementById("targetNodeBox") as HTMLDivElement;
const sideButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".side-btn"));
const nodeTypeNone = document.getElementById("nodeTypeNone") as HTMLButtonElement;
const nodeTypeProcess = document.getElementById("nodeTypeProcess") as HTMLButtonElement;
const nodeTypeStartEnd = document.getElementById("nodeTypeStartEnd") as HTMLButtonElement;
const nodeTypeYesNo = document.getElementById("nodeTypeYesNo") as HTMLButtonElement;
const nodeTypeButtons = [nodeTypeNone, nodeTypeProcess, nodeTypeStartEnd, nodeTypeYesNo];

const connectorPreference: ConnectorPreferencePayload = {
  sourceSide: "RIGHT",
  targetSide: "LEFT"
};
let nodeTypeEnabled = false;
let activeNodeType: NodeType | null = null;
let sourceSelected = false;
let targetSelected = false;
let statusHideTimer: ReturnType<typeof setTimeout> | null = null;
let statusCleanupTimer: ReturnType<typeof setTimeout> | null = null;

function clearStatusTimers(): void {
  if (statusHideTimer) {
    clearTimeout(statusHideTimer);
    statusHideTimer = null;
  }
  if (statusCleanupTimer) {
    clearTimeout(statusCleanupTimer);
    statusCleanupTimer = null;
  }
}

function setStatus(target: HTMLDivElement, kind: StatusKind, message: string): void {
  clearStatusTimers();
  target.textContent = message;
  target.classList.remove("success", "error");
  target.classList.add(kind);
  target.classList.add("visible");

  // Keep message visible for 5 seconds, then fade out.
  statusHideTimer = setTimeout(() => {
    target.classList.remove("visible");
    statusCleanupTimer = setTimeout(() => {
      target.textContent = "";
      target.classList.remove("success", "error");
      statusCleanupTimer = null;
    }, 500);
    statusHideTimer = null;
  }, 5000);
}

function clearStatus(target: HTMLDivElement): void {
  clearStatusTimers();
  target.textContent = "";
  target.classList.remove("success", "error");
  target.classList.remove("visible");
}

function updateSideButtonState(): void {
  sideButtons.forEach((button) => {
    const endpoint = button.dataset.endpoint;
    const side = button.dataset.side as ConnectorSide | undefined;
    if (!endpoint || !side) {
      return;
    }
    const active = endpoint === "source" ? connectorPreference.sourceSide === side : connectorPreference.targetSide === side;
    button.classList.toggle("active", active);
  });
}

function updateConnectorNodeBoxState(): void {
  sourceNodeBox.classList.toggle("active", sourceSelected);
  targetNodeBox.classList.toggle("active", targetSelected);
}

function sendConnectorPreference(): void {
  parent.postMessage(
    {
      pluginMessage: {
        type: "set-connector-sides",
        payload: connectorPreference
      }
    },
    "*"
  );
}

function updateNodeTypeVisualState(): void {
  nodeTypeButtons.forEach((button) => {
    const type = button.dataset.nodeType as NodeType | undefined;
    button.classList.toggle("enabled", nodeTypeEnabled);
    button.classList.toggle("active", nodeTypeEnabled && !!type && activeNodeType === type);
  });
}

function sendNodeType(nodeType: NodeType): void {
  clearStatus(panelStatus);
  parent.postMessage(
    {
      pluginMessage: {
        type: "set-node-type",
        payload: { nodeType }
      }
    },
    "*"
  );
}

nodeTypeNone.addEventListener("click", () => {
  if (!nodeTypeEnabled) {
    return;
  }
  sendNodeType("none");
  activeNodeType = "none";
  updateNodeTypeVisualState();
});
nodeTypeProcess.addEventListener("click", () => {
  if (!nodeTypeEnabled) {
    return;
  }
  sendNodeType("process");
  activeNodeType = "process";
  updateNodeTypeVisualState();
});
nodeTypeStartEnd.addEventListener("click", () => {
  if (!nodeTypeEnabled) {
    return;
  }
  sendNodeType("start-end");
  activeNodeType = "start-end";
  updateNodeTypeVisualState();
});
nodeTypeYesNo.addEventListener("click", () => {
  if (!nodeTypeEnabled) {
    return;
  }
  sendNodeType("yes-no");
  activeNodeType = "yes-no";
  updateNodeTypeVisualState();
});

sideButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const endpoint = button.dataset.endpoint;
    const side = button.dataset.side as ConnectorSide | undefined;
    if (!endpoint || !side) {
      return;
    }
    if (endpoint === "source") {
      connectorPreference.sourceSide = side;
    } else {
      connectorPreference.targetSide = side;
    }
    updateSideButtonState();
    clearStatus(panelStatus);
    sendConnectorPreference();
  });
});

updateSideButtonState();
updateConnectorNodeBoxState();
updateNodeTypeVisualState();

window.onmessage = (
  event: MessageEvent<{
    pluginMessage?:
      | PluginStatusMessage
      | PluginDebugStateMessage
      | PluginConnectorSideStateMessage
      | PluginConnectorSelectionStateMessage
      | PluginNodeTypeStateMessage;
  }>
) => {
  const pluginMessage = event.data?.pluginMessage;
  if (!pluginMessage) {
    return;
  }
  if (pluginMessage.type === "connector-side-state") {
    connectorPreference.sourceSide = pluginMessage.payload.sourceSide;
    connectorPreference.targetSide = pluginMessage.payload.targetSide;
    updateSideButtonState();
    return;
  }
  if (pluginMessage.type === "connector-selection-state") {
    sourceSelected = pluginMessage.payload.sourceSelected;
    targetSelected = pluginMessage.payload.targetSelected;
    updateConnectorNodeBoxState();
    return;
  }
  if (pluginMessage.type === "node-type-state") {
    nodeTypeEnabled = pluginMessage.payload.enabled;
    activeNodeType = pluginMessage.payload.selectedType;
    updateNodeTypeVisualState();
    return;
  }
  if (pluginMessage.type === "debug-state") {
    return;
  }
  if (pluginMessage.type !== "status") {
    return;
  }
  setStatus(panelStatus, pluginMessage.payload.kind, pluginMessage.payload.message);
};
