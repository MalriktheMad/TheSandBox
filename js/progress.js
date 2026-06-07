const PLAYER_PROGRESS_STORAGE_KEY = "lab-zero-player-progress";

const STARTING_PLAYER_PROGRESS = {
  level: 1,
  hp: 100,
  completedQuests: []
};

function getPlayerProgress() {
  const savedProgress = sessionStorage.getItem(PLAYER_PROGRESS_STORAGE_KEY);

  if (!savedProgress) {
    return { ...STARTING_PLAYER_PROGRESS };
  }

  try {
    const progress = JSON.parse(savedProgress);
    return {
      ...STARTING_PLAYER_PROGRESS,
      ...progress,
      completedQuests: Array.isArray(progress.completedQuests) ? progress.completedQuests : []
    };
  } catch (error) {
    sessionStorage.removeItem(PLAYER_PROGRESS_STORAGE_KEY);
    return { ...STARTING_PLAYER_PROGRESS };
  }
}

function savePlayerProgress(progress) {
  sessionStorage.setItem(PLAYER_PROGRESS_STORAGE_KEY, JSON.stringify({
    ...STARTING_PLAYER_PROGRESS,
    ...progress
  }));
}

function setPlayerLevel(level) {
  const progress = getPlayerProgress();
  progress.level = Math.max(1, level);
  savePlayerProgress(progress);
  syncPlayerProgressReadout();
}

function levelUpPlayer(amount = 1) {
  const progress = getPlayerProgress();
  setPlayerLevel(progress.level + amount);
}

function completeQuest(questId) {
  const progress = getPlayerProgress();

  if (!progress.completedQuests.includes(questId)) {
    progress.completedQuests.push(questId);
    savePlayerProgress(progress);
  }
}

function hasCompletedQuest(questId) {
  return getPlayerProgress().completedQuests.includes(questId);
}

function syncPlayerProgressReadout() {
  const levelValue = document.querySelector('[data-stat="level"]');

  if (levelValue) {
    levelValue.textContent = getPlayerProgress().level;
  }
}

syncPlayerProgressReadout();
