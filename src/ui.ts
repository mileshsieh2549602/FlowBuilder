type StatusKind = "success" | "error";
type ConnectorSide = "LEFT" | "RIGHT" | "TOP" | "BOTTOM";

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

const panelStatus = document.getElementById("panelStatus") as HTMLDivElement;
const debugToggle = document.getElementById("debugToggle") as HTMLInputElement;
const sideButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".side-btn"));
const nodeTypeNone = document.getElementById("nodeTypeNone") as HTMLButtonElement;
const nodeTypeProcess = document.getElementById("nodeTypeProcess") as HTMLButtonElement;
const nodeTypeStartEnd = document.getElementById("nodeTypeStartEnd") as HTMLButtonElement;
const nodeTypeYesNo = document.getElementById("nodeTypeYesNo") as HTMLButtonElement;

const connectorPreference: ConnectorPreferencePayload = {
  sourceSide: "RIGHT",
  targetSide: "LEFT"
};

function setStatus(target: HTMLDivElement, kind: StatusKind, message: string): void {
  target.textContent = message;
  target.classList.remove("success", "error");
  target.classList.add(kind);
}

function clearStatus(target: HTMLDivElement): void {
  target.textContent = "";
  target.classList.remove("success", "error");
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

debugToggle.addEventListener("change", () => {
  parent.postMessage(
    {
      pluginMessage: {
        type: "set-debug",
        payload: { enabled: debugToggle.checked }
      }
    },
    "*"
  );
});

function sendNodeType(nodeType: "none" | "process" | "start-end" | "yes-no"): void {
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

nodeTypeNone.addEventListener("click", () => sendNodeType("none"));
nodeTypeProcess.addEventListener("click", () => sendNodeType("process"));
nodeTypeStartEnd.addEventListener("click", () => sendNodeType("start-end"));
nodeTypeYesNo.addEventListener("click", () => sendNodeType("yes-no"));

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

window.onmessage = (
  event: MessageEvent<{ pluginMessage?: PluginStatusMessage | PluginDebugStateMessage | PluginConnectorSideStateMessage }>
) => {
  const pluginMessage = event.data?.pluginMessage;
  if (!pluginMessage) {
    return;
  }
  if (pluginMessage.type === "debug-state") {
    debugToggle.checked = pluginMessage.payload.enabled;
    return;
  }
  if (pluginMessage.type === "connector-side-state") {
    connectorPreference.sourceSide = pluginMessage.payload.sourceSide;
    connectorPreference.targetSide = pluginMessage.payload.targetSide;
    updateSideButtonState();
    return;
  }
  if (pluginMessage.type !== "status") {
    return;
  }
  setStatus(panelStatus, pluginMessage.payload.kind, pluginMessage.payload.message);
};
