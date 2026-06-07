const GAME_STATE_STORAGE_KEY = "lab-zero-game-state";
const START_MENU_NEW_GAME_KEYS = [
  GAME_STATE_STORAGE_KEY,
  "lab-zero-opening-bedroom-dialogue",
  "lab-zero-inventory",
  "lab-zero-player-progress",
  "lab-zero-collected-pickups"
];
const START_AREA = "bedroom";
const START_X = 228;
const START_Y = 324;

const startMenu = document.getElementById("start-menu");
const newGameButton = document.getElementById("new-game");
const continueGameButton = document.getElementById("continue-game");

restoreGameState();
setupStartMenu();
loadGameSystems();

if (quickNav) {
  quickNav.addEventListener("click", (event) => {
    const link = event.target.closest("a");

    if (!link) {
      return;
    }

    saveGameState();
  });
}

window.addEventListener("pagehide", saveGameState);

function setupStartMenu() {
  if (!startMenu || !newGameButton || !continueGameButton) {
    startGame();
    return;
  }

  continueGameButton.hidden = !sessionStorage.getItem(GAME_STATE_STORAGE_KEY);
  startMenu.hidden = false;

  newGameButton.addEventListener("click", () => {
    START_MENU_NEW_GAME_KEYS.forEach((key) => sessionStorage.removeItem(key));
    movePlayerToStart();
    startGame();
  });

  continueGameButton.addEventListener("click", startGame);
}

function startGame() {
  if (startMenu) {
    startMenu.hidden = true;
  }

  if (typeof playOpeningBedroomDialogue === "function") {
    window.setTimeout(playOpeningBedroomDialogue, 80);
  }
}

function movePlayerToStart() {
  getActiveArea().element.hidden = true;

  state.area = START_AREA;
  state.x = START_X;
  state.y = START_Y;
  state.targetX = START_X;
  state.targetY = START_Y;
  state.path = [];
  state.zoom = 1;
  state.transitionCooldown = 0;

  const area = getActiveArea();
  area.element.hidden = false;
  area.player.classList.remove("facing-left");
  area.target.classList.remove("visible");

  placePlayer();
  placeTarget();
  placeCamera();
}

function saveGameState() {
  if (startMenu && !startMenu.hidden) {
    return;
  }

  const area = getActiveArea();
  const snapshot = {
    area: state.area,
    x: state.x,
    y: state.y,
    zoom: state.zoom,
    facingLeft: area.player.classList.contains("facing-left")
  };

  sessionStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(snapshot));
}

function restoreGameState() {
  const savedState = sessionStorage.getItem(GAME_STATE_STORAGE_KEY);

  if (!savedState) {
    return;
  }

  let snapshot;

  try {
    snapshot = JSON.parse(savedState);
  } catch (error) {
    sessionStorage.removeItem(GAME_STATE_STORAGE_KEY);
    return;
  }

  if (!snapshot || !AREAS[snapshot.area]) {
    sessionStorage.removeItem(GAME_STATE_STORAGE_KEY);
    return;
  }

  getActiveArea().element.hidden = true;

  state.area = snapshot.area;
  state.x = clamp(snapshot.x, 24, getActiveArea().width - 24);
  state.y = clamp(snapshot.y, 24, getActiveArea().height - 24);
  state.targetX = state.x;
  state.targetY = state.y;
  state.path = [];
  state.zoom = clamp(snapshot.zoom || 1, MIN_ZOOM, MAX_ZOOM);
  state.transitionCooldown = 0;

  const area = getActiveArea();
  area.element.hidden = false;
  area.player.classList.toggle("facing-left", Boolean(snapshot.facingLeft));
  area.target.classList.remove("visible");

  placePlayer();
  placeTarget();
  placeCamera();
}

function loadGameSystems() {
  loadScript("js/inventory.js", () => {
    loadScript("js/progress.js", () => {
      loadScript("js/pickups.js");
    });
  });
}

function loadScript(src, onLoad) {
  const script = document.createElement("script");
  script.src = src;

  if (onLoad) {
    script.addEventListener("load", onLoad, { once: true });
  }

  document.body.append(script);
}
