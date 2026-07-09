type FlowType = "wireframe" | "user-flow" | "ui-flow";

interface FlowStepInput {
  title: string;
  owner?: string;
  note?: string;
}

interface CreateFlowPayload {
  flowName: string;
  flowType: FlowType;
  spacing: number;
  steps: FlowStepInput[];
}

const form = document.getElementById("flow-form") as HTMLFormElement;
const stepsInput = document.getElementById("steps") as HTMLTextAreaElement;
const flowTypeInput = document.getElementById("flowType") as HTMLSelectElement;
const flowNameInput = document.getElementById("flowName") as HTMLInputElement;
const spacingInput = document.getElementById("spacing") as HTMLInputElement;
const connectBtn = document.getElementById("connectSelection") as HTMLButtonElement;
const tidyBtn = document.getElementById("tidySelection") as HTMLButtonElement;
const parseHint = document.getElementById("parseHint") as HTMLDivElement;

function parseSteps(raw: string): FlowStepInput[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, owner, note] = line.split("|").map((part) => part.trim());
      return {
        title: title || "Untitled Step",
        owner,
        note
      };
    });
}

function updateHint(): void {
  const count = parseSteps(stepsInput.value).length;
  parseHint.textContent = `${count} step${count === 1 ? "" : "s"} will be created`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const steps = parseSteps(stepsInput.value);

  if (steps.length === 0) {
    parseHint.textContent = "Please provide at least one step.";
    parseHint.classList.add("error");
    return;
  }

  parseHint.classList.remove("error");

  const payload: CreateFlowPayload = {
    flowName: flowNameInput.value.trim() || "Flow",
    flowType: flowTypeInput.value as FlowType,
    spacing: Number(spacingInput.value) || 120,
    steps
  };

  parent.postMessage(
    {
      pluginMessage: {
        type: "create-flow",
        payload
      }
    },
    "*"
  );
});

connectBtn.addEventListener("click", () => {
  parent.postMessage(
    {
      pluginMessage: {
        type: "connect-selection",
        payload: { labelPrefix: "Flow Link" }
      }
    },
    "*"
  );
});

tidyBtn.addEventListener("click", () => {
  parent.postMessage(
    {
      pluginMessage: {
        type: "tidy-selection"
      }
    },
    "*"
  );
});

stepsInput.addEventListener("input", updateHint);
updateHint();
