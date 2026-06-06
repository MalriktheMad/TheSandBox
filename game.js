const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;
const BLOCKED_TERRAIN = [
  { left: 0, top: 585, right: 210, bottom: 860 },
  { left: 0, top: 860, right: 132, bottom: 965 },
  { name: "old-dilly-liz-house", left: 292, top: 116, right: 536, bottom: 350 },
  { name: "lab-zero", left: 1248, top: 78, right: 1478, bottom: 266 }
];

const stage = document.getElementById("stage");
const world = document.getElementById("world");
const player = document.getElementById("player");
const targetEl = document.getElementById("target");
const readout = document.getElementById("readout");
const quickNav = document.getElementById("quick-nav");
const zoomControls = document.getElementById("zoom-controls");
const zoomIn = document.getElementById("zoom-in");
const zoomOut = document.getElementById("zoom-out");

const state = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  targetX: WORLD_WIDTH / 2,
  targetY: WORLD_HEIGHT / 2,
  speed: 260,
  zoom: 1,
  cameraX: 0,
  cameraY: 0,
  lastTime: performance.now()
};

placePlayer();
placeTarget();
placeCamera();
requestAnimationFrame(tick);

stage.addEventListener("pointerdown", setTarget);
stage.addEventListener("pointermove", (event) => {
  if (event.buttons === 1 && event.pointerType !== "mouse") {
    setTarget(event);
  }
});

[readout, quickNav, zoomControls].forEach((element) => {
  element.addEventListener("pointerdown", stopUiMovement);
});

zoomIn.addEventListener("click", () => changeZoom(ZOOM_STEP));
zoomOut.addEventListener("click", () => changeZoom(-ZOOM_STEP));

window.addEventListener("resize", () => {
  state.x = clampWorldX(state.x);
  state.y = clampWorldY(state.y);
  state.targetX = clampWorldX(state.targetX);
  state.targetY = clampWorldY(state.targetY);
  placePlayer();
  placeTarget();
  placeCamera();
});

function stopUiMovement(event) {
  event.stopPropagation();
}

function setTarget(event) {
  if (event.target.closest(".readout, .quick-nav, .zoom-controls")) {
    return;
  }

  const point = screenToWorld(event.clientX, event.clientY);
  state.targetX = clampWorldX(point.x);
  state.targetY = clampWorldY(point.y);
  targetEl.classList.add("visible");
  placeTarget();
}

function changeZoom(amount) {
  state.zoom = clamp(roundZoom(state.zoom + amount), MIN_ZOOM, MAX_ZOOM);
  placeCamera();
}

function tick(now) {
  const delta = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;

  const dx = state.targetX - state.x;
  const dy = state.targetY - state.y;
  const distance = Math.hypot(dx, dy);
  const step = state.speed * delta;

  if (distance > 1) {
    const move = Math.min(step, distance);
    const nextX = state.x + (dx / distance) * move;
    const nextY = state.y + (dy / distance) * move;

    if (isUiBlocked(nextX, nextY) || isTerrainBlocked(nextX, nextY)) {
      state.targetX = state.x;
      state.targetY = state.y;
      targetEl.classList.remove("visible");
    } else {
      player.classList.toggle("facing-left", dx < -1);
      state.x = nextX;
      state.y = nextY;
      placePlayer();
      placeCamera();
    }
  } else {
    targetEl.classList.remove("visible");
  }

  requestAnimationFrame(tick);
}

function placePlayer() {
  player.style.left = `${state.x}px`;
  player.style.top = `${state.y}px`;
}

function placeTarget() {
  targetEl.style.left = `${state.targetX}px`;
  targetEl.style.top = `${state.targetY}px`;
}

function placeCamera() {
  const scaledWidth = WORLD_WIDTH * state.zoom;
  const scaledHeight = WORLD_HEIGHT * state.zoom;
  const viewWidth = window.innerWidth;
  const viewHeight = window.innerHeight;

  state.cameraX = scaledWidth <= viewWidth
    ? (viewWidth - scaledWidth) / 2
    : clamp(viewWidth / 2 - state.x * state.zoom, viewWidth - scaledWidth, 0);
  state.cameraY = scaledHeight <= viewHeight
    ? (viewHeight - scaledHeight) / 2
    : clamp(viewHeight / 2 - state.y * state.zoom, viewHeight - scaledHeight, 0);

  world.style.transform = `translate(${state.cameraX}px, ${state.cameraY}px) scale(${state.zoom})`;
}

function screenToWorld(screenX, screenY) {
  return {
    x: (screenX - state.cameraX) / state.zoom,
    y: (screenY - state.cameraY) / state.zoom
  };
}

function worldToScreen(worldX, worldY) {
  return {
    x: state.cameraX + worldX * state.zoom,
    y: state.cameraY + worldY * state.zoom
  };
}

function isUiBlocked(worldX, worldY) {
  const screenPoint = worldToScreen(worldX, worldY);
  return getBlockedRects().some((rect) => {
    return screenPoint.x >= rect.left && screenPoint.x <= rect.right && screenPoint.y >= rect.top && screenPoint.y <= rect.bottom;
  });
}

function isTerrainBlocked(worldX, worldY) {
  const radius = 18;
  return BLOCKED_TERRAIN.some((rect) => {
    return worldX >= rect.left - radius && worldX <= rect.right + radius && worldY >= rect.top - radius && worldY <= rect.bottom + radius;
  });
}

function getBlockedRects() {
  return [readout, quickNav, zoomControls].map((element) => {
    const rect = element.getBoundingClientRect();
    const padding = getPlayerRadius() * state.zoom + 8;
    return {
      left: rect.left - padding,
      right: rect.right + padding,
      top: rect.top - padding,
      bottom: rect.bottom + padding
    };
  });
}

function getPlayerRadius() {
  return player.getBoundingClientRect().width / 2;
}

function clampWorldX(value) {
  return clamp(value, 24, WORLD_WIDTH - 24);
}

function clampWorldY(value) {
  return clamp(value, 24, WORLD_HEIGHT - 24);
}

function roundZoom(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
