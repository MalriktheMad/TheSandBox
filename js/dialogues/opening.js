const OPENING_BEDROOM_DIALOGUE_KEY = "lab-zero-opening-bedroom-dialogue";

function playOpeningBedroomDialogue() {
  if (dialogueState.active || state.area !== "bedroom" || sessionStorage.getItem(OPENING_BEDROOM_DIALOGUE_KEY)) {
    return;
  }

  sessionStorage.setItem(OPENING_BEDROOM_DIALOGUE_KEY, "true");
  startDialogue(getOpeningBedroomDialogueLines());
}

function getOpeningBedroomDialogueLines() {
  return [
    littleWingLine("Oh, I must have slept in..."),
    littleWingLine("Where is the wizard and the Wing Master?")
  ];
}
