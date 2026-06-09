const OPENING_BEDROOM_DIALOGUE_KEY = "lab-zero-opening-bedroom-dialogue";
const BEDROOM_CAGE_START_X = 690;
const BEDROOM_CAGE_START_Y = 162;
const BEDROOM_CAGE_EXIT_X = 548;
const BEDROOM_CAGE_EXIT_Y = 258;

function playOpeningBedroomDialogue() {
  if (dialogueState.active || state.area !== "bedroom" || sessionStorage.getItem(OPENING_BEDROOM_DIALOGUE_KEY)) {
    return;
  }

  placeLittleWingInBedroomCage();
  sessionStorage.setItem(OPENING_BEDROOM_DIALOGUE_KEY, "true");
  startDialogue(getOpeningBedroomDialogueLines());
}

function getOpeningBedroomDialogueLines() {
  return [
    littleWingLine("Oh, I must have slept in..."),
    littleWingLine("Where is the wizard? He usually gets me up."),
    {
      ...littleWingLine("Let's just get this cage open and see if we can find the Wing-Master Cricket."),
      onShow: openBedroomCageDoor
    },
    {
      ...littleWingLine("I bet she's downstairs."),
      onShow: moveLittleWingOutOfBedroomCage
    }
  ];
}

function placeLittleWingInBedroomCage() {
  state.area = "bedroom";
  state.x = BEDROOM_CAGE_START_X;
  state.y = BEDROOM_CAGE_START_Y;
  state.targetX = BEDROOM_CAGE_START_X;
  state.targetY = BEDROOM_CAGE_START_Y;
  state.path = [];
  closeBedroomCageDoor();

  initializeAreaVisibility();
  placePlayer();
  placeTarget();
  placeCamera();
}

function closeBedroomCageDoor() {
  const cage = document.querySelector(".bedroom-cage");

  if (cage) {
    cage.classList.remove("is-open");
  }
}

function openBedroomCageDoor() {
  const cage = document.querySelector(".bedroom-cage");

  if (cage) {
    cage.classList.add("is-open");
  }
}

function moveLittleWingOutOfBedroomCage() {
  state.x = BEDROOM_CAGE_EXIT_X;
  state.y = BEDROOM_CAGE_EXIT_Y;
  state.targetX = BEDROOM_CAGE_EXIT_X;
  state.targetY = BEDROOM_CAGE_EXIT_Y;
  state.path = [];

  placePlayer();
  placeTarget();
  placeCamera();
}
