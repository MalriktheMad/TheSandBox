const dialogueStage = document.getElementById("stage");
const dialogueLines = [
  {
    speaker: "Wing Master Cricket",
    portrait: "assets/portraits/wing-master.svg",
    text: "Hello, Little Wing."
  },
  {
    speaker: "Little Wing",
    portrait: "assets/portraits/little-wing.svg",
    text: "Hello, Wing Master Cricket."
  },
  {
    speaker: "Wing Master Cricket",
    portrait: "assets/portraits/wing-master.svg",
    text: "The lab is quiet today. The wizard is out working. He appreciates you helping him with his game! Really. Thank you for testing this game for me i put a lot  of work into it."
  },
  {
    speaker: "Little Wing",
    portrait: "assets/portraits/little-wing.svg",
    text: "I'll keep poking around then."
  }
];

const dialogueState = {
  active: false,
  index: 0
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

  const cricket = event.target.closest(".wing-master-cricket");

  if (!cricket || state.area !== "lab") {
    return;
  }

  swallowDialoguePointer(event);
  startDialogue();
}

function startDialogue() {
  const area = getActiveArea();
  state.path = [];
  state.targetX = state.x;
  state.targetY = state.y;
  area.target.classList.remove("visible");

  dialogueState.active = true;
  dialogueState.index = 0;
  dialogueBox.hidden = false;
  showDialogueLine();
}

function advanceDialogue() {
  dialogueState.index += 1;

  if (dialogueState.index >= dialogueLines.length) {
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
  const line = dialogueLines[dialogueState.index];
  dialoguePortrait.src = line.portrait;
  dialoguePortrait.alt = `${line.speaker} portrait`;
  dialogueSpeaker.textContent = line.speaker;
  dialogueText.textContent = line.text;
}

function swallowDialoguePointer(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}
