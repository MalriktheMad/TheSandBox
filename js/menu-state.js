const GAME_STATE_STORAGE_KEY = "lab-zero-game-state";

restoreGameState();

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

function saveGameState() {
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
