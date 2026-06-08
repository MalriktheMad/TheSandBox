const OLD_DILLY_TREAT_KEY = "lab-zero-old-dilly-treat";
const OLD_DILLY_TREAT_ITEM_ID = "milletSeeds";

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
