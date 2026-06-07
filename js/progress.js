const PLAYER_PROGRESS_STORAGE_KEY = "lab-zero-player-progress";
const BASE_PLAYER_HP = 100;
const HP_PER_LEVEL = 50;

const STARTING_PLAYER_PROGRESS = {
  level: 1,
  hp: BASE_PLAYER_HP,
  completedQuests: []
};

function getPlayerProgress() {
  const savedProgress = sessionStorage.getItem(PLAYER_PROGRESS_STORAGE_KEY);

  if (!savedProgress) {
    return { ...STARTING_PLAYER_PROGRESS };
  }

  try {
    const progress = JSON.parse(savedProgress);
    const level = Math.max(1, progress.level || STARTING_PLAYER_PROGRESS.level);
    return {
      ...STARTING_PLAYER_PROGRESS,
      ...progress,
      level,
      hp: getHpForLevel(level),
      completedQuests: Array.isArray(progress.completedQuests) ? progress.completedQuests : []
    };
  } catch (error) {
    sessionStorage.removeItem(PLAYER_PROGRESS_STORAGE_KEY);
    return { ...STARTING_PLAYER_PROGRESS };
  }
}

function savePlayerProgress(progress) {
  const level = Math.max(1, progress.level || STARTING_PLAYER_PROGRESS.level);
  sessionStorage.setItem(PLAYER_PROGRESS_STORAGE_KEY, JSON.stringify({
    ...STARTING_PLAYER_PROGRESS,
    ...progress,
    level,
    hp: getHpForLevel(level)
  }));
}

function getHpForLevel(level) {
  return BASE_PLAYER_HP + (Math.max(1, level) - 1) * HP_PER_LEVEL;
}

function setPlayerLevel(level) {
  const progress = getPlayerProgress();
  progress.level = Math.max(1, level);
  progress.hp = getHpForLevel(progress.level);
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
  const progress = getPlayerProgress();
  const levelValue = findReadoutStat("level");
  const hpValue = findReadoutStat("hp");

  if (levelValue) {
    levelValue.textContent = progress.level;
  }

  if (hpValue) {
    hpValue.textContent = progress.hp;
  }
}

function findReadoutStat(statName) {
  const markedStat = document.querySelector(`[data-stat="${statName}"]`);

  if (markedStat) {
    return markedStat;
  }

  return Array.from(document.querySelectorAll(".readout .stat-row, .sheet .stat-row")).find((row) => {
    const label = row.querySelector("span");
    return label && label.textContent.trim().toLowerCase() === statName;
  })?.querySelector("strong") || null;
}

syncPlayerProgressReadout();
