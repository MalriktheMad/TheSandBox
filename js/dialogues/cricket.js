const CRICKET_SEED_QUEST_ID = "cricket-seed-lesson";
const CRICKET_SEED_ITEM_ID = "sunflowerSeeds";

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
