const dialogueStage = document.getElementById("stage");
const CRICKET_SEED_QUEST_ID = "cricket-seed-lesson";
const CRICKET_SEED_ITEM_ID = "sunflowerSeeds";
const OPENING_BEDROOM_DIALOGUE_KEY = "lab-zero-opening-bedroom-dialogue";
const OLD_DILLY_TREAT_KEY = "lab-zero-old-dilly-treat";
const OLD_DILLY_TREAT_ITEM_ID = "milletSeeds";
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
const codexTalkZone = {
  left: 500,
  top: 72,
  right: 702,
  bottom: 248
};
const oldDillyTalkZone = {
  left: 190,
  top: 112,
  right: 330,
  bottom: 270
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

function playOpeningBedroomDialogue() {
  if (dialogueState.active || state.area !== "bedroom" || sessionStorage.getItem(OPENING_BEDROOM_DIALOGUE_KEY)) {
    return;
  }

  sessionStorage.setItem(OPENING_BEDROOM_DIALOGUE_KEY, "true");
  startDialogue(getOpeningBedroomDialogueLines());
}

function handleDialoguePointer(event) {
  if (dialogueState.active) {
    swallowDialoguePointer(event);
    advanceDialogue();
    return;
  }

  if (event.target.closest(".readout, .quick-nav, .zoom-controls, .dialogue-box, .start-menu")) {
    return;
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
      startDialogue(getCodexDialogueLines());
    }

    return;
  }

  if (state.area === "dilly") {
    const oldDilly = event.target.closest(".old-dilly-npc");

    if (oldDilly || isOldDillyTalkPoint(event)) {
      swallowDialoguePointer(event);
      startDialogue(getOldDillyDialogueLines());
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

function getOpeningBedroomDialogueLines() {
  return [
    littleWingLine("Oh, I must have slept in..."),
    littleWingLine("Where is the wizard and the Wing Master?")
  ];
}

function getCricketDialogueLines() {
  if (hasCricketSeed()) {
    return [
      cricketLine("The lab is quiet today. The wizard is out working. He appreciates you helping him with his game! Really. Thank you for testing this game for him he put a lot of work into it. By the way do you have any sunflower Seeds?"),
      littleWingLine("Alright here is what i could find."),
      {
        ...cricketLine("Thank you my young friend. If you keep collecting these perhaps one day i will teach you the ancient wing-haiatii tequnique."),
        onShow: completeCricketSeedTraining
      },
      littleWingLine("I will not fail you Wing Master Cricket!")
    ];
  }

  if (isCricketSeedQuestComplete()) {
    return [
      cricketLine("Hello, Little Wing."),
      littleWingLine("Hello, Wing Master Cricket."),
      cricketLine("Bring me another sunflower seed when you find one and we will keep training.")
    ];
  }

  return [
    cricketLine("The lab is quiet today. The wizard is out working. He appreciates you helping him with his game! Really. Thank you for testing this game for him he put a lot of work into it."),
    littleWingLine("I'll go poke around then."),
    cricketLine("Come back if you find a sunflower seed and i'll open it for you and share it.")
  ];
}

function getCodexDialogueLines() {
  return [
    codexLine("Hello, Little Wing. The machine is awake."),
    littleWingLine("You can talk?"),
    codexLine("A little. The wizard gave me a glowing eye, a friendly face, and far too many loose wires."),
    littleWingLine("That sounds about right."),
    codexLine("If you find the wizard, tell him the lab is still listening."),
    codexLine("And if you uncover any ancient tablets out there, bring them back to me. I may be able to decipher what the old magic forgot."),
    littleWingLine("Find the wizard. Bring back tablets. Got it.")
  ];
}

function getOldDillyDialogueLines() {
  if (hasOldDillyTreat()) {
    return [
      oldDillyLine("Come back later when my sunflowers have grown back.")
    ];
  }

  return [
    {
      ...oldDillyLine("Hello Yoshi, Here's a treat my young lad!"),
      onShow: giveOldDillyTreat
    },
    littleWingLine("Millet!")
  ];
}

function hasOldDillyTreat() {
  return sessionStorage.getItem(OLD_DILLY_TREAT_KEY) === "true";
}

function giveOldDillyTreat() {
  if (hasOldDillyTreat()) {
    return;
  }

  addDialogueInventoryItem(OLD_DILLY_TREAT_ITEM_ID, 1);
  sessionStorage.setItem(OLD_DILLY_TREAT_KEY, "true");
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

function completeCricketSeedTraining() {
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

function codexLine(text) {
  return {
    speaker: "Codex",
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









