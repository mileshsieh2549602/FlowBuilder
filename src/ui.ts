type ArrowPosition = "left" | "right";
type LinePosition = "top" | "right" | "bottom" | "left";
type NodeType = "none" | "process" | "decision";

const connectorForm = document.getElementById("connector-form") as HTMLFormElement;
const nodeForm = document.getElementById("node-form") as HTMLFormElement;
const arrowPositionInput = document.getElementById("arrowPosition") as HTMLSelectElement;
const linePositionInput = document.getElementById("linePosition") as HTMLSelectElement;
const nodeTypeInput = document.getElementById("nodeType") as HTMLSelectElement;
const nodeTextInput = document.getElementById("nodeText") as HTMLInputElement;
const closeBtn = document.getElementById("closePlugin") as HTMLButtonElement;

connectorForm.addEventListener("submit", (event) => {
  event.preventDefault();
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
