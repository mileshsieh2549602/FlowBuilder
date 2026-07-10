type StatusKind = "success" | "error";

interface PluginStatusMessage {
  type: "status";
  payload: {
    kind: StatusKind;
    message: string;
  };
}

const connectorForm = document.getElementById("connector-form") as HTMLFormElement;
const connectorStatus = document.getElementById("connectorStatus") as HTMLDivElement;

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

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginStatusMessage }>) => {
  const pluginMessage = event.data?.pluginMessage;
  if (!pluginMessage || pluginMessage.type !== "status") {
    return;
  }
  setStatus(connectorStatus, pluginMessage.payload.kind, pluginMessage.payload.message);
};
