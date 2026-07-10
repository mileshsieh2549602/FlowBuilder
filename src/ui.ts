type ArrowPosition = "left" | "right";
type LinePosition = "top" | "right" | "bottom" | "left";
type NodeType = "none" | "process" | "decision";
type StatusScope = "connector" | "node";
type StatusKind = "success" | "error";

interface PluginStatusMessage {
  type: "status";
  payload: {
    scope: StatusScope;
    kind: StatusKind;
    message: string;
  };
}

const connectorForm = document.getElementById("connector-form") as HTMLFormElement;
const nodeForm = document.getElementById("node-form") as HTMLFormElement;
const arrowPositionInput = document.getElementById("arrowPosition") as HTMLSelectElement;
const linePositionInput = document.getElementById("linePosition") as HTMLSelectElement;
const nodeTypeInput = document.getElementById("nodeType") as HTMLSelectElement;
const nodeTextInput = document.getElementById("nodeText") as HTMLInputElement;
const closeBtn = document.getElementById("closePlugin") as HTMLButtonElement;
const connectorStatus = document.getElementById("connectorStatus") as HTMLDivElement;
const nodeStatus = document.getElementById("nodeStatus") as HTMLDivElement;

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
        type: "generate-connector",
        payload: {
          arrowPosition: arrowPositionInput.value as ArrowPosition,
          linePosition: linePositionInput.value as LinePosition
        }
      }
    },
    "*"
  );
});

nodeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearStatus(nodeStatus);
  parent.postMessage(
    {
      pluginMessage: {
        type: "generate-node",
        payload: {
          nodeType: nodeTypeInput.value as NodeType,
          text: nodeTextInput.value.trim() || "Text"
        }
      }
    },
    "*"
  );
});

closeBtn.addEventListener("click", () => {
  parent.postMessage(
    {
      pluginMessage: {
        type: "close-plugin"
      }
    },
    "*"
  );
});

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginStatusMessage }>) => {
  const pluginMessage = event.data?.pluginMessage;
  if (!pluginMessage || pluginMessage.type !== "status") {
    return;
  }
  const target = pluginMessage.payload.scope === "connector" ? connectorStatus : nodeStatus;
  setStatus(target, pluginMessage.payload.kind, pluginMessage.payload.message);
};
