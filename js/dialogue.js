const dialogueStage = document.getElementById("stage");
const CRICKET_SEED_QUEST_ID = "cricket-seed-lesson";
const CRICKET_SEED_ITEM_ID = "sunflowerSeeds";
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
  left: 160,
  top: 158,
  right: 316,
  bottom: 292
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
  </div>
`;
dialogueStage.appendChild(dialogueBox);

const dialoguePortrait = document.getElementById("dialogue-portrait");
const dialogueSpeaker = document.getElementById("dialogue-speaker");
const dialogueText = document.getElementById("dialogue-text");

if (dialogueStage) {
  dialogueStage.addEventListener("pointerdown", handleDialoguePointer, { capture: true });
}

function handleDialoguePointer(event) {
  if (dialogueState.active) {
    swallowDialoguePointer(event);
    advanceDialogue();
    return;
  }

  if (event.target.closest(".readout, .quick-nav, .zoom-controls, .dialogue-box")) {
    return;
  }

  const cricket = event.target.closest(".wing-master-cricket");

  if (state.area !== "lab" || (!cricket && !isCricketTalkPoint(event))) {
    return;
  }

  swallowDialoguePointer(event);
  startDialogue();
}

function isCricketTalkPoint(event) {
  const point = screenToWorld(event.clientX, event.clientY);

  return point.x >= cricketTalkZone.left
    && point.x <= cricketTalkZone.right
    && point.y >= cricketTalkZone.top
    && point.y <= cricketTalkZone.bottom;
}

function startDialogue() {
  const area = getActiveArea();
  state.path = [];
  state.targetX = state.x;
  state.targetY = state.y;
  area.target.classList.remove("visible");

  dialogueState.active = true;
  dialogueState.index = 0;
  dialogueState.lines = getCricketDialogueLines();
  dialogueBox.hidden = false;
  showDialogueLine();
}

function getCricketDialogueLines() {
  if (isCricketSeedQuestComplete()) {
    return [
      cricketLine("Quest complete placeholder. Replace this with Cricket's post-lesson greeting."),
      littleWingLine("Post-quest placeholder response.")
    ];
  }

  if (hasCricketSeed()) {
    return [
      cricketLine("Quest turn-in placeholder. Cricket notices Little Wing has a sunflower seed."),
      littleWingLine("Give Wing Master Cricket one sunflower seed."),
      {
        ...cricketLine("Reward placeholder. Cricket accepts the seed and teaches Little Wing something important."),
        onShow: completeCricketSeedQuest
      },
      littleWingLine("Level up placeholder response.")
    ];
  }

  return [
    cricketLine("Quest intro placeholder. Cricket asks Little Wing to bring her one sunflower seed."),
    littleWingLine("Quest accepted placeholder. Little Wing should find a sunflower outside."),
    cricketLine("Reminder placeholder. Come back after collecting a sunflower seed.")
  ];
}

function completeCricketSeedQuest() {
  if (isCricketSeedQuestComplete()) {
    return;
  }

  if (!removeCricketSeed()) {
    return;
  }

  markCricketSeedQuestComplete();
  raiseLittleWingLevel();
}

function hasCricketSeed() {
  if (typeof hasInventoryItem === "function") {
    return hasInventoryItem(CRICKET_SEED_ITEM_ID);
  }

  return getDialogueInventory()[CRICKET_SEED_ITEM_ID] > 0;
}

function removeCricketSeed() {
  if (typeof removeInventoryItem === "function") {
    return removeInventoryItem(CRICKET_SEED_ITEM_ID, 1);
  }

  const inventory = getDialogueInventory();

  if ((inventory[CRICKET_SEED_ITEM_ID] || 0) <= 0) {
    return false;
  }

  inventory[CRICKET_SEED_ITEM_ID] -= 1;
  sessionStorage.setItem("lab-zero-inventory", JSON.stringify(inventory));
  return true;
}

function isCricketSeedQuestComplete() {
  if (typeof hasCompletedQuest === "function") {
    return hasCompletedQuest(CRICKET_SEED_QUEST_ID);
  }

  return getDialogueProgress().completedQuests.includes(CRICKET_SEED_QUEST_ID);
}

function markCricketSeedQuestComplete() {
  if (typeof completeQuest === "function") {
    completeQuest(CRICKET_SEED_QUEST_ID);
    return;
  }

  const progress = getDialogueProgress();

  if (!progress.completedQuests.includes(CRICKET_SEED_QUEST_ID)) {
    progress.completedQuests.push(CRICKET_SEED_QUEST_ID);
    sessionStorage.setItem("lab-zero-player-progress", JSON.stringify(progress));
  }
}

function raiseLittleWingLevel() {
  if (typeof levelUpPlayer === "function") {
    levelUpPlayer(1);
    return;
  }

  const progress = getDialogueProgress();
  progress.level += 1;
  sessionStorage.setItem("lab-zero-player-progress", JSON.stringify(progress));
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
    portrait: "assets/portraits/wing-master.svg",
    text
  };
}

function littleWingLine(text) {
  return {
    speaker: "Little Wing",
    portrait: "assets/portraits/little-wing.svg",
    text
  };
}

function advanceDialogue() {
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

  if (line.onShow) {
    line.onShow();
  }
}

function swallowDialoguePointer(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}
