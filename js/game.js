const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;
const LAB_WIDTH = 920;
const LAB_HEIGHT = 620;
const DILLY_WIDTH = 880;
const DILLY_HEIGHT = 640;
const BEDROOM_WIDTH = 820;
const BEDROOM_HEIGHT = 560;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;
const DEFAULT_ZOOM = 0.85;
const PATH_GRID_SIZE = 32;
const PATH_SEARCH_LIMIT = 3000;
const TRANSITION_COOLDOWN = 0.45;
const FLIGHT_TAKEOFF_MS = 380;
const FLIGHT_LAND_MS = 320;
const BLOCKED_TERRAIN = [
  { name: "old-dilly-roof", left: 330, top: 116, right: 518, bottom: 198 },
  { name: "old-dilly-left-wall", left: 330, top: 198, right: 410, bottom: 262 },
  { name: "old-dilly-right-wall", left: 456, top: 198, right: 518, bottom: 262 },
  { name: "lab-zero-left-wall", left: 1248, top: 78, right: 1327, bottom: 266 },
  { name: "lab-zero-right-wall", left: 1407, top: 78, right: 1478, bottom: 266 },
  { name: "lab-zero-back-wall", left: 1328, top: 78, right: 1406, bottom: 216 }
];
const LAB_BLOCKED_TERRAIN = [
  { name: "left-bench", left: 66, top: 88, right: 228, bottom: 176 },
  { name: "right-bench", left: 232, top: 88, right: 394, bottom: 176 },
  { name: "lab-core", left: 414, top: 148, right: 506, bottom: 260 },
  { name: "codex-workstation", left: 518, top: 90, right: 676, bottom: 222 },
  { name: "empty-wizard-chair", left: 424, top: 34, right: 498, bottom: 146 },
  { name: "wing-master-cricket", left: 174, top: 178, right: 290, bottom: 280 }
];
const BEDROOM_BLOCKED_TERRAIN = [
  { name: "cage-back-wall", left: 606, top: 54, right: 776, bottom: 104 },
  { name: "wizard-bed", left: 42, top: 72, right: 300, bottom: 214 },
  { name: "nightstand", left: 270, top: 124, right: 336, bottom: 206 }
];
const DILLY_BLOCKED_TERRAIN = [
  { name: "kitchen", left: 48, top: 110, right: 232, bottom: 232 },
  { name: "old-dilly", left: 226, top: 142, right: 288, bottom: 222 },
  { name: "liz-art-corner", left: 618, top: 116, right: 826, bottom: 274 },
  { name: "liz", left: 560, top: 162, right: 624, bottom: 238 },
  { name: "greenhouse-sofa", left: 332, top: 354, right: 524, bottom: 464 },
  { name: "left-plant-wall", left: 8, top: 224, right: 108, bottom: 604 },
  { name: "right-plant-wall", left: 764, top: 430, right: 862, bottom: 604 },
  { name: "plant-cluster-one", left: 302, top: 108, right: 394, bottom: 214 },
  { name: "plant-cluster-two", left: 560, top: 382, right: 660, bottom: 488 },
  { name: "plant-cluster-three", left: 132, top: 432, right: 230, bottom: 536 }
];

const stage = document.getElementById("stage");
const world = document.getElementById("world");
const player = document.getElementById("player");
const targetEl = document.getElementById("target");
const labInterior = document.getElementById("lab-interior");
const interiorPlayer = document.getElementById("interior-player");
const interiorTarget = document.getElementById("interior-target");
const bedroomInterior = document.getElementById("bedroom-interior");
const bedroomPlayer = document.getElementById("bedroom-player");
const bedroomTarget = document.getElementById("bedroom-target");
const dillyInterior = document.getElementById("dilly-interior");
const dillyPlayer = document.getElementById("dilly-player");
const dillyTarget = document.getElementById("dilly-target");
const readout = document.getElementById("readout");
const quickNav = document.getElementById("quick-nav");
const zoomControls = document.getElementById("zoom-controls");
const flightControls = document.getElementById("flight-controls");
const zoomIn = document.getElementById("zoom-in");
const zoomOut = document.getElementById("zoom-out");
const flightToggle = document.getElementById("flight-toggle");

const AREAS = {
  outside: {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    element: world,
    player,
    target: targetEl,
    blocked: BLOCKED_TERRAIN,
    transitions: [
      { left: 378, top: 204, right: 498, bottom: 344, to: "dilly", entryX: 748, entryY: 320 },
      { left: 1328, top: 214, right: 1406, bottom: 296, to: "lab", entryX: 460, entryY: 526 }
    ]
  },
  lab: {
    width: LAB_WIDTH,
    height: LAB_HEIGHT,
    element: labInterior,
    player: interiorPlayer,
    target: interiorTarget,
    blocked: LAB_BLOCKED_TERRAIN,
    transitions: [
      { left: 426, top: 534, right: 494, bottom: 610, to: "outside", entryX: 1354, entryY: 302 },
      { left: 92, top: 438, right: 224, bottom: 556, to: "bedroom", entryX: 548, entryY: 420 }
    ]
  },
  bedroom: {
    width: BEDROOM_WIDTH,
    height: BEDROOM_HEIGHT,
    element: bedroomInterior,
    player: bedroomPlayer,
    target: bedroomTarget,
    blocked: BEDROOM_BLOCKED_TERRAIN,
    transitions: [
      { left: 568, top: 392, right: 790, bottom: 552, to: "lab", entryX: 258, entryY: 430 }
    ]
  },
  dilly: {
    width: DILLY_WIDTH,
    height: DILLY_HEIGHT,
    element: dillyInterior,
    player: dillyPlayer,
    target: dillyTarget,
    blocked: DILLY_BLOCKED_TERRAIN,
    transitions: [
      { left: 792, top: 252, right: 874, bottom: 404, to: "outside", entryX: 506, entryY: 306 }
    ]
  }
};

const state = {
  area: "bedroom",
  x: 690,
  y: 162,
  targetX: 690,
  targetY: 162,
  path: [],
  speed: 260,
  zoom: DEFAULT_ZOOM,
  cameraX: 0,
  cameraY: 0,
  transitionCooldown: 0,
  flightMode: false,
  flightPhase: "ground",
  flightTimer: 0,
  lastTime: performance.now()
};

initializeAreaVisibility();
placePlayer();
placeTarget();
placeCamera();
syncPlayerAnimationState();
requestAnimationFrame(tick);

stage.addEventListener("pointerdown", setTarget);
stage.addEventListener("pointermove", (event) => {
  if (event.buttons === 1 && event.pointerType !== "mouse") {
    setTarget(event);
  }
});

[readout, quickNav, zoomControls, flightControls].filter(Boolean).forEach((element) => {
  element.addEventListener("pointerdown", stopUiMovement);
});

zoomIn.addEventListener("click", () => changeZoom(ZOOM_STEP));
zoomOut.addEventListener("click", () => changeZoom(-ZOOM_STEP));
if (flightToggle) {
  flightToggle.addEventListener("click", toggleFlightMode);
}

window.addEventListener("resize", () => {
  state.x = clampWorldX(state.x);
  state.y = clampWorldY(state.y);
  state.targetX = clampWorldX(state.targetX);
  state.targetY = clampWorldY(state.targetY);
  state.path = [];
  placePlayer();
  placeTarget();
  placeCamera();
});

function initializeAreaVisibility() {
  Object.values(AREAS).forEach((area) => {
    area.element.hidden = area !== getActiveArea();
  });
}

function stopUiMovement(event) {
  event.stopPropagation();
}

function isGamePausedForDialogue() {
  return typeof isDialogueActive === "function" && isDialogueActive();
}

function setTarget(event) {
  if (isGamePausedForDialogue()) {
    return;
  }
  if (event.target.closest(".readout, .quick-nav, .zoom-controls, .flight-controls, .start-menu")) {
    return;
  }

  const point = screenToWorld(event.clientX, event.clientY);
  const requested = {
    x: clampWorldX(point.x),
    y: clampWorldY(point.y)
  };
  const destination = findNearestWalkablePoint(requested.x, requested.y);

  if (!destination) {
    state.path = [];
    setPlayerMoving(false);
    return;
  }

  state.targetX = destination.x;
  state.targetY = destination.y;
  state.path = findPath(state.x, state.y, destination.x, destination.y);
  getActiveArea().target.classList.add("visible");
  placeTarget();
}

function changeZoom(amount) {
  state.zoom = clamp(roundZoom(state.zoom + amount), MIN_ZOOM, MAX_ZOOM);
  placeCamera();
}

function toggleFlightMode() {
  if (state.flightPhase === "taking-off" || state.flightPhase === "landing") {
    return;
  }

  if (state.flightMode) {
    startLanding();
  } else {
    startTakeoff();
  }
}

function startTakeoff() {
  state.flightMode = true;
  state.flightPhase = "taking-off";
  clearTimeout(state.flightTimer);
  syncPlayerAnimationState();

  state.flightTimer = setTimeout(() => {
    if (state.flightMode && state.flightPhase === "taking-off") {
      state.flightPhase = "flying";
      syncPlayerAnimationState();
    }
  }, FLIGHT_TAKEOFF_MS);
}

function startLanding() {
  state.flightMode = false;
  state.flightPhase = "landing";
  state.path = [];
  getActiveArea().target.classList.remove("visible");
  clearTimeout(state.flightTimer);
  syncPlayerAnimationState();

  state.flightTimer = setTimeout(() => {
    if (!state.flightMode && state.flightPhase === "landing") {
      state.flightPhase = "ground";
      syncPlayerAnimationState();
    }
  }, FLIGHT_LAND_MS);
}

function tick(now) {
  const delta = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;
  state.transitionCooldown = Math.max(0, state.transitionCooldown - delta);

  
  if (isGamePausedForDialogue()) {
    state.path = [];
    getActiveArea().target.classList.remove("visible");
    setPlayerMoving(false);
    requestAnimationFrame(tick);
    return;
  }

  if (state.path.length > 0) {
    followPath(delta);
  } else {
    getActiveArea().target.classList.remove("visible");
  }

  setPlayerMoving(state.path.length > 0);
  requestAnimationFrame(tick);
}

function followPath(delta) {
  const waypoint = state.path[0];
  const dx = waypoint.x - state.x;
  const dy = waypoint.y - state.y;
  const distance = Math.hypot(dx, dy);
  const step = state.speed * delta;

  if (distance <= Math.max(1, step)) {
    state.x = waypoint.x;
    state.y = waypoint.y;
    state.path.shift();
    placePlayer();
    placeCamera();
    enterTransitionAtCurrentPosition();
    return;
  }

  const nextX = state.x + (dx / distance) * step;
  const nextY = state.y + (dy / distance) * step;
  const transition = getTransition(nextX, nextY);

  if (transition && state.transitionCooldown === 0) {
    enterArea(transition.to, transition.entryX, transition.entryY);
  } else if (isUiBlocked(nextX, nextY) || isTerrainBlocked(nextX, nextY)) {
    state.path = [];
    state.targetX = state.x;
    state.targetY = state.y;
    getActiveArea().target.classList.remove("visible");
  } else {
    getActiveArea().player.classList.toggle("facing-left", dx < -1);
    state.x = nextX;
    state.y = nextY;
    placePlayer();
    placeCamera();
  }
}

function enterTransitionAtCurrentPosition() {
  const transition = getTransition(state.x, state.y);

  if (transition && state.transitionCooldown === 0) {
    enterArea(transition.to, transition.entryX, transition.entryY);
  }
}

function placePlayer() {
  const area = getActiveArea();
  area.player.style.left = `${state.x}px`;
  area.player.style.top = `${state.y}px`;
}

function setPlayerMoving(isMoving) {
  Object.values(AREAS).forEach((area) => {
    area.player.classList.toggle("is-moving", area === getActiveArea() && isMoving);
  });
  syncPlayerAnimationState();
}

function syncPlayerAnimationState() {
  Object.values(AREAS).forEach((area) => {
    const isActive = area === getActiveArea();
    area.player.classList.toggle("is-taking-off", isActive && state.flightPhase === "taking-off");
    area.player.classList.toggle("is-flying", isActive && state.flightPhase === "flying");
    area.player.classList.toggle("is-landing", isActive && state.flightPhase === "landing");
  });

  if (flightToggle) {
    flightToggle.textContent = state.flightMode ? "Land" : "Fly";
    flightToggle.setAttribute("aria-label", state.flightMode ? "Land" : "Take flight");
    flightToggle.setAttribute("aria-pressed", String(state.flightMode));
  }
}

function placeTarget() {
  const area = getActiveArea();
  area.target.style.left = `${state.targetX}px`;
  area.target.style.top = `${state.targetY}px`;
}

function placeCamera() {
  const area = getActiveArea();
  const scaledWidth = area.width * state.zoom;
  const scaledHeight = area.height * state.zoom;
  const viewWidth = window.innerWidth;
  const viewHeight = window.innerHeight;

  state.cameraX = scaledWidth <= viewWidth
    ? (viewWidth - scaledWidth) / 2
    : clamp(viewWidth / 2 - state.x * state.zoom, viewWidth - scaledWidth, 0);
  state.cameraY = scaledHeight <= viewHeight
    ? (viewHeight - scaledHeight) / 2
    : clamp(viewHeight / 2 - state.y * state.zoom, viewHeight - scaledHeight, 0);

  area.element.style.transform = `translate(${state.cameraX}px, ${state.cameraY}px) scale(${state.zoom})`;
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
  return getActiveArea().blocked.some((rect) => {
    if (rect.flightPassable && state.flightMode) {
      return false;
    }
    return worldX >= rect.left - radius && worldX <= rect.right + radius && worldY >= rect.top - radius && worldY <= rect.bottom + radius;
  });
}

function isWalkablePoint(worldX, worldY) {
  return !isTerrainBlocked(worldX, worldY) && worldX >= 24 && worldX <= getActiveArea().width - 24 && worldY >= 24 && worldY <= getActiveArea().height - 24;
}

function getTransition(worldX, worldY) {
  return getActiveArea().transitions.find((rect) => {
    return worldX >= rect.left && worldX <= rect.right && worldY >= rect.top && worldY <= rect.bottom;
  });
}

function enterArea(areaName, x, y) {
  const currentArea = getActiveArea();
  currentArea.target.classList.remove("visible");
  currentArea.element.hidden = true;

  state.area = areaName;
  state.x = x;
  state.y = y;
  state.targetX = x;
  state.targetY = y;
  state.path = [];
  state.transitionCooldown = TRANSITION_COOLDOWN;

  const nextArea = getActiveArea();
  nextArea.element.hidden = false;
  Object.values(AREAS).forEach((area) => area.player.classList.remove("is-moving"));
  nextArea.player.classList.remove("facing-left");
  syncPlayerAnimationState();
  placePlayer();
  placeTarget();
  placeCamera();
}

function getActiveArea() {
  return AREAS[state.area];
}

function findPath(startX, startY, endX, endY) {
  const start = findNearestWalkableCell(worldToCell(startX), worldToCell(startY));
  const end = findNearestWalkableCell(worldToCell(endX), worldToCell(endY));

  if (!start || !end) {
    return [];
  }

  if (start.key === end.key) {
    return [{ x: endX, y: endY }];
  }

  const open = [makePathNode(start.x, start.y, null, 0, getCellDistance(start, end))];
  const best = new Map([[start.key, open[0]]]);
  const closed = new Set();
  let searched = 0;

  while (open.length > 0 && searched < PATH_SEARCH_LIMIT) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();

    if (closed.has(current.key)) {
      continue;
    }

    if (current.key === end.key) {
      return simplifyPath(buildWaypointPath(current, endX, endY)).slice(1);
    }

    closed.add(current.key);
    searched += 1;

    getNeighbors(current).forEach((neighbor) => {
      if (closed.has(neighbor.key) || !isWalkableCell(neighbor.x, neighbor.y)) {
        return;
      }

      if (neighbor.diagonal && (!isWalkableCell(current.x + neighbor.dx, current.y) || !isWalkableCell(current.x, current.y + neighbor.dy))) {
        return;
      }

      const moveCost = neighbor.diagonal ? Math.SQRT2 : 1;
      const g = current.g + moveCost;
      const previous = best.get(neighbor.key);

      if (!previous || g < previous.g) {
        const node = makePathNode(neighbor.x, neighbor.y, current, g, getCellDistance(neighbor, end));
        best.set(neighbor.key, node);
        open.push(node);
      }
    });
  }

  return [];
}

function buildWaypointPath(node, exactEndX, exactEndY) {
  const path = [];
  let current = node;

  while (current) {
    path.unshift(cellToWorld(current.x, current.y));
    current = current.parent;
  }

  path.push({ x: exactEndX, y: exactEndY });
  return path;
}

function simplifyPath(path) {
  if (path.length <= 2) {
    return path;
  }

  const simplified = [path[0]];
  let anchorIndex = 0;

  for (let index = 2; index < path.length; index += 1) {
    if (!hasLineOfSight(path[anchorIndex], path[index])) {
      simplified.push(path[index - 1]);
      anchorIndex = index - 1;
    }
  }

  simplified.push(path[path.length - 1]);
  return simplified;
}

function hasLineOfSight(from, to) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const samples = Math.max(1, Math.ceil(distance / (PATH_GRID_SIZE / 2)));

  for (let index = 1; index <= samples; index += 1) {
    const ratio = index / samples;
    const x = from.x + (to.x - from.x) * ratio;
    const y = from.y + (to.y - from.y) * ratio;

    if (!isWalkablePoint(x, y)) {
      return false;
    }
  }

  return true;
}

function findNearestWalkablePoint(worldX, worldY) {
  if (isWalkablePoint(worldX, worldY)) {
    return { x: worldX, y: worldY };
  }

  const cell = findNearestWalkableCell(worldToCell(worldX), worldToCell(worldY));
  return cell ? cellToWorld(cell.x, cell.y) : null;
}

function findNearestWalkableCell(startX, startY) {
  const maxColumns = Math.ceil(getActiveArea().width / PATH_GRID_SIZE);
  const maxRows = Math.ceil(getActiveArea().height / PATH_GRID_SIZE);
  const originX = clamp(startX, 0, maxColumns - 1);
  const originY = clamp(startY, 0, maxRows - 1);

  if (isWalkableCell(originX, originY)) {
    return makeCell(originX, originY);
  }

  const maxRadius = Math.max(maxColumns, maxRows);

  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let y = originY - radius; y <= originY + radius; y += 1) {
      for (let x = originX - radius; x <= originX + radius; x += 1) {
        const onEdge = x === originX - radius || x === originX + radius || y === originY - radius || y === originY + radius;

        if (onEdge && isWalkableCell(x, y)) {
          return makeCell(x, y);
        }
      }
    }
  }

  return null;
}

function getNeighbors(cell) {
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: -1, diagonal: true },
    { dx: 1, dy: 1, diagonal: true },
    { dx: -1, dy: 1, diagonal: true },
    { dx: -1, dy: -1, diagonal: true }
  ];

  return directions.map((direction) => ({
    x: cell.x + direction.dx,
    y: cell.y + direction.dy,
    dx: direction.dx,
    dy: direction.dy,
    diagonal: Boolean(direction.diagonal),
    key: getCellKey(cell.x + direction.dx, cell.y + direction.dy)
  }));
}

function isWalkableCell(cellX, cellY) {
  const maxColumns = Math.ceil(getActiveArea().width / PATH_GRID_SIZE);
  const maxRows = Math.ceil(getActiveArea().height / PATH_GRID_SIZE);

  if (cellX < 0 || cellX >= maxColumns || cellY < 0 || cellY >= maxRows) {
    return false;
  }

  const point = cellToWorld(cellX, cellY);
  return isWalkablePoint(point.x, point.y);
}

function makePathNode(x, y, parent, g, h) {
  return {
    x,
    y,
    parent,
    g,
    h,
    f: g + h,
    key: getCellKey(x, y)
  };
}

function makeCell(x, y) {
  return {
    x,
    y,
    key: getCellKey(x, y)
  };
}

function getCellDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function worldToCell(value) {
  return Math.floor(value / PATH_GRID_SIZE);
}

function cellToWorld(cellX, cellY) {
  return {
    x: clamp(cellX * PATH_GRID_SIZE + PATH_GRID_SIZE / 2, 24, getActiveArea().width - 24),
    y: clamp(cellY * PATH_GRID_SIZE + PATH_GRID_SIZE / 2, 24, getActiveArea().height - 24)
  };
}

function getCellKey(cellX, cellY) {
  return `${cellX},${cellY}`;
}

function getBlockedRects() {
  return [readout, quickNav, zoomControls, flightControls].filter(Boolean).map((element) => {
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
  return clamp(value, 24, getActiveArea().width - 24);
}

function clampWorldY(value) {
  return clamp(value, 24, getActiveArea().height - 24);
}

function roundZoom(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}



















