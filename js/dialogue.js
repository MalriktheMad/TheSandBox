const dialogueStage = document.getElementById("stage");
const dialogueInventoryDefaults = {
  sunflowerSeeds: 0,
  milletSeeds: 0,
  cig: 1
};
const dialogueProgressDefaults = {
  level: 1,
  hp: 100,
  completedQuests: []
};
const cricketTalkZone = {
  left: 650,
  top: 286,
  right: 830,
  bottom: 448
};
const codexTalkZone = {
  left: 548,
  top: 62,
  right: 808,
  bottom: 250
};
const oldDillyTalkZone = {
  left: 190,
  top: 112,
  right: 330,
  bottom: 270
};
const lizTalkZone = {
  left: 520,
  top: 126,
  right: 672,
  bottom: 276
};

const dialogueState = {
  active: false,
  index: 0,
  lines: []
};

const dialogueBox = document.createElement("div");
dialogueBox.id = "dialogue-box";
dialogueBox.className = "dialogue-box";
dialogueBox.hidden = true;
dialogueBox.innerHTML = `
  <img id="dialogue-portrait" class="dialogue-portrait" alt="">
  <div class="dialogue-content">
    <div id="dialogue-speaker" class="dialogue-speaker"></div>
    <p id="dialogue-text" class="dialogue-text"></p>
    <div id="dialogue-choices" class="dialogue-choices" hidden></div>
  </div>
`;
document.body.appendChild(dialogueBox);

const dialoguePortrait = document.getElementById("dialogue-portrait");
const dialogueSpeaker = document.getElementById("dialogue-speaker");
const dialogueText = document.getElementById("dialogue-text");
const dialogueChoices = document.getElementById("dialogue-choices");

if (dialogueStage) {
  dialogueStage.addEventListener("pointerdown", handleDialoguePointer, { capture: true });
}

dialogueBox.addEventListener("pointerdown", handleDialoguePointer);

function isDialogueActive() {
  return dialogueState.active;
}

function handleDialoguePointer(event) {
  if (dialogueState.active) {
    if (event.target.closest(".dialogue-choice")) {
      return;
    }

    swallowDialoguePointer(event);
    advanceDialogue();
    return;
  }

  if (event.target.closest(".readout, .quick-nav, .zoom-controls, .flight-controls, .dialogue-box, .start-menu")) {
    return;
  }

  if (state.area === "bedroom" && typeof handleBedroomCageBreakoutPointer === "function") {
    if (handleBedroomCageBreakoutPointer(event)) {
      swallowDialoguePointer(event);
      return;
    }

    if (typeof isBedroomCageBreakoutPending === "function" && isBedroomCageBreakoutPending()) {
      swallowDialoguePointer(event);
      return;
    }
  }

  if (state.area === "lab") {
    const cricket = event.target.closest(".wing-master-cricket");
    const codex = event.target.closest(".codex-terminal");

    if (cricket || isCricketTalkPoint(event)) {
      swallowDialoguePointer(event);
      startDialogue(getCricketDialogueLines());
      return;
    }

    if (codex || isCodexTalkPoint(event)) {
      swallowDialoguePointer(event);
      startDialogue(getCandlewickDialogueLines());
    }

    return;
  }

  if (state.area === "dilly") {
    const oldDilly = event.target.closest(".old-dilly-npc");
    const liz = event.target.closest(".liz-npc");

    if (oldDilly || isOldDillyTalkPoint(event)) {
      swallowDialoguePointer(event);
      startDialogue(getOldDillyDialogueLines());
      return;
    }

    if (liz || isLizTalkPoint(event)) {
      swallowDialoguePointer(event);
      startDialogue(getLizDialogueLines());
    }
  }
}

function isCricketTalkPoint(event) {
  return isPointInTalkZone(event, cricketTalkZone);
}

function isCodexTalkPoint(event) {
  return isPointInTalkZone(event, codexTalkZone);
}

function isOldDillyTalkPoint(event) {
  return isPointInTalkZone(event, oldDillyTalkZone);
}

function isLizTalkPoint(event) {
  return isPointInTalkZone(event, lizTalkZone);
}

function isPointInTalkZone(event, zone) {
  const point = screenToWorld(event.clientX, event.clientY);

  return point.x >= zone.left
    && point.x <= zone.right
    && point.y >= zone.top
    && point.y <= zone.bottom;
}

function startDialogue(lines) {
  const area = getActiveArea();
  state.path = [];
  state.targetX = state.x;
  state.targetY = state.y;
  area.target.classList.remove("visible");

  dialogueState.active = true;
  dialogueState.index = 0;
  dialogueState.lines = lines;
  dialogueBox.hidden = false;
  showDialogueLine();
}

function addDialogueInventoryItem(itemId, amount = 1) {
  if (typeof addInventoryItem === "function") {
    addInventoryItem(itemId, amount);
    return;
  }

  const inventory = getDialogueInventory();
  inventory[itemId] = Math.max(0, (inventory[itemId] || 0) + amount);
  sessionStorage.setItem("lab-zero-inventory", JSON.stringify(inventory));
}

function getDialogueInventory() {
  const savedInventory = sessionStorage.getItem("lab-zero-inventory");

  if (!savedInventory) {
    return { ...dialogueInventoryDefaults };
  }

  try {
    return {
      ...dialogueInventoryDefaults,
      ...JSON.parse(savedInventory)
    };
  } catch (error) {
    return { ...dialogueInventoryDefaults };
  }
}

function getDialogueProgress() {
  const savedProgress = sessionStorage.getItem("lab-zero-player-progress");

  if (!savedProgress) {
    return { ...dialogueProgressDefaults };
  }

  try {
    const progress = JSON.parse(savedProgress);
    return {
      ...dialogueProgressDefaults,
      ...progress,
      completedQuests: Array.isArray(progress.completedQuests) ? progress.completedQuests : []
    };
  } catch (error) {
    return { ...dialogueProgressDefaults };
  }
}

function cricketLine(text) {
  return {
    speaker: "Wing Master Cricket",
    portrait: "assets/portraits/wing-master.png",
    text
  };
}

function littleWingLine(text) {
  return {
    speaker: "Little Wing",
    portrait: "assets/portraits/little-wing.png",
    text
  };
}

function codexLine(text) {
  return {
    speaker: "Candlewick",
    portrait: "assets/portraits/codex.png",
    text
  };
}

function oldDillyLine(text) {
  return {
    speaker: "Old Dilly",
    portrait: "assets/portraits/old-dilly.png",
    text
  };
}

function lizLine(text) {
  return {
    speaker: "Liz",
    portrait: "assets/portraits/liz.png",
    text
  };
}

function advanceDialogue() {
  const line = dialogueState.lines[dialogueState.index];

  if (line && line.choices) {
    return;
  }

  dialogueState.index += 1;

  if (dialogueState.index >= dialogueState.lines.length) {
    closeDialogue();
    return;
  }

  showDialogueLine();
}

function closeDialogue() {
  dialogueState.active = false;
  dialogueBox.hidden = true;
}

function showDialogueLine() {
  const line = dialogueState.lines[dialogueState.index];
  dialoguePortrait.src = line.portrait;
  dialoguePortrait.alt = `${line.speaker} portrait`;
  dialogueSpeaker.textContent = line.speaker;
  dialogueText.textContent = line.text;
  renderDialogueChoices(line.choices || []);

  if (line.onShow) {
    line.onShow();
  }
}

function renderDialogueChoices(choices) {
  dialogueChoices.innerHTML = "";
  dialogueChoices.hidden = choices.length === 0;

  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dialogue-choice";
    button.textContent = choice.label;
    button.disabled = Boolean(choice.disabled);
    button.addEventListener("pointerdown", (event) => {
      swallowDialoguePointer(event);

      if (!choice.disabled && choice.action) {
        choice.action();
      }
    });
    dialogueChoices.append(button);
  });
}

function swallowDialoguePointer(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}




