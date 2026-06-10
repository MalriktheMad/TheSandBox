const OPENING_BEDROOM_DIALOGUE_KEY = "lab-zero-opening-bedroom-dialogue";
const OPENING_BEDROOM_INTRO_KEY = "lab-zero-opening-bedroom-intro";
const BEDROOM_CAGE_START_X = 138;
const BEDROOM_CAGE_START_Y = 162;
const BEDROOM_CAGE_EXIT_X = 270;
const BEDROOM_CAGE_EXIT_Y = 258;
const BEDROOM_CAGE_BREAKOUT_ZONE = {
  left: 112,
  top: 118,
  right: 224,
  bottom: 248
};

function playOpeningBedroomDialogue() {
  if (dialogueState.active || state.area !== "bedroom" || sessionStorage.getItem(OPENING_BEDROOM_DIALOGUE_KEY)) {
    return;
  }

  placeLittleWingInBedroomCage();

  if (!sessionStorage.getItem(OPENING_BEDROOM_INTRO_KEY)) {
    sessionStorage.setItem(OPENING_BEDROOM_INTRO_KEY, "true");
    startDialogue(getOpeningBedroomIntroLines());
  }
}

function getOpeningBedroomIntroLines() {
  return [
    littleWingLine("Oh, I must have slept in..."),
    littleWingLine("Where is the wizard? He usually gets me up."),
    littleWingLine("The cage latch is loose. If I peck it just right, I can get out."),
    littleWingLine("Then I can find Wing-Master Cricket downstairs.")
  ];
}

function getBedroomCageBreakoutLines() {
  return [
    {
      ...littleWingLine("Tap tap... tap. Come on, little latch."),
      onShow: openBedroomCageDoor
    },
    {
      ...littleWingLine("Yes! Freedom. Tiny, responsible freedom."),
      onShow: moveLittleWingOutOfBedroomCage
    },
    littleWingLine("I bet Wing-Master Cricket knows where the wizard went.")
  ];
}

function isBedroomCageBreakoutPending() {
  return state.area === "bedroom" && !sessionStorage.getItem(OPENING_BEDROOM_DIALOGUE_KEY);
}

function handleBedroomCageBreakoutPointer(event) {
  if (state.area !== "bedroom" || sessionStorage.getItem(OPENING_BEDROOM_DIALOGUE_KEY)) {
    return false;
  }

  if (!isBedroomCageBreakoutPoint(event)) {
    return false;
  }

  sessionStorage.setItem(OPENING_BEDROOM_DIALOGUE_KEY, "true");
  startDialogue(getBedroomCageBreakoutLines());
  return true;
}

function isBedroomCageBreakoutPoint(event) {
  const point = screenToWorld(event.clientX, event.clientY);

  return point.x >= BEDROOM_CAGE_BREAKOUT_ZONE.left
    && point.x <= BEDROOM_CAGE_BREAKOUT_ZONE.right
    && point.y >= BEDROOM_CAGE_BREAKOUT_ZONE.top
    && point.y <= BEDROOM_CAGE_BREAKOUT_ZONE.bottom;
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