type StatusKind = "success" | "error";

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

const connectorForm = document.getElementById("connector-form") as HTMLFormElement;
const connectorStatus = document.getElementById("connectorStatus") as HTMLDivElement;
const debugToggle = document.getElementById("debugToggle") as HTMLInputElement;
const nodeTypeNone = document.getElementById("nodeTypeNone") as HTMLButtonElement;
const nodeTypeProcess = document.getElementById("nodeTypeProcess") as HTMLButtonElement;
const nodeTypeStartEnd = document.getElementById("nodeTypeStartEnd") as HTMLButtonElement;
const nodeTypeYesNo = document.getElementById("nodeTypeYesNo") as HTMLButtonElement;

function setStatus(target: HTMLDivElement, kind: StatusKind, message: string): void {
  target.textContent = message;
  target.classList.remove("success", "error");
  target.classList.add(kind);
}

function clearStatus(target: HTMLDivElement): void {
  target.textContent = "";
  target.classList.remove("success", "error");
}

connectorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearStatus(connectorStatus);
  parent.postMessage(
    {
      pluginMessage: {
        type: "generate-connector"
      }
    },
    "*"
  );
});

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

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginStatusMessage | PluginDebugStateMessage }>) => {
  const pluginMessage = event.data?.pluginMessage;
  if (!pluginMessage) {
    return;
  }
  if (pluginMessage.type === "debug-state") {
    debugToggle.checked = pluginMessage.payload.enabled;
    return;
  }
  if (pluginMessage.type !== "status") {
    return;
  }
  setStatus(connectorStatus, pluginMessage.payload.kind, pluginMessage.payload.message);
};
