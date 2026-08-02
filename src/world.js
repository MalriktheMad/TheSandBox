import { ASSETS, WORLD } from "./config.js";

const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 64;
const WALK_SPEED = 210;
const CLIMB_SPEED = 125;
const ANIMATION_FRAME_SECONDS = 0.13;
const DEFAULT_ZOOM = 4;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const TAP_DRAG_TOLERANCE = 10;
const AIRLOCK_SCAFFOLD_PATCH = Object.freeze({
  sourceX: 532,
  sourceY: 624,
  x: 622,
  y: 624,
  width: 90,
  height: 16
});

export class EchoWorld {
  constructor({ canvas, hint, locationReadout, zoomOutButton, zoomInButton, zoomReadout, saveSystem }) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.hint = hint;
    this.locationReadout = locationReadout;
    this.zoomOutButton = zoomOutButton;
    this.zoomInButton = zoomInButton;
    this.zoomReadout = zoomReadout;
    this.saveSystem = saveSystem;
    this.images = new Map();
    this.readyPromise = null;
    this.running = false;
    this.frameRequest = 0;
    this.lastTime = 0;
    this.scale = 1;
    this.cameraX = 0;
    this.cameraY = 0;
    this.zoom = DEFAULT_ZOOM;
    this.cssWidth = 1;
    this.cssHeight = 1;
    this.pointers = new Map();
    this.pinching = false;
    this.pinchStartDistance = 0;
    this.pinchStartZoom = DEFAULT_ZOOM;
    this.state = this.#makeInitialState();

    this.canvas.addEventListener("pointerdown", (event) => this.#onPointerDown(event));
    this.canvas.addEventListener("pointermove", (event) => this.#onPointerMove(event));
    this.canvas.addEventListener("pointerup", (event) => this.#onPointerEnd(event));
    this.canvas.addEventListener("pointercancel", (event) => this.#onPointerEnd(event));
    this.canvas.addEventListener("wheel", (event) => this.#onWheel(event), { passive: false });
    this.zoomOutButton?.addEventListener("click", () => this.#setZoom(this.zoom - ZOOM_STEP));
    this.zoomInButton?.addEventListener("click", () => this.#setZoom(this.zoom + ZOOM_STEP));
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pagehide", () => this.persist());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.persist();
      }
    });
  }

  preload() {
    if (!this.readyPromise) {
      const sources = [
        ASSETS.echoInterior,
        ASSETS.idleLeft,
        ASSETS.idleRight,
        ...ASSETS.walk,
        ...ASSETS.ladder,
        ...Object.values(ASSETS.actions)
      ];
      this.readyPromise = Promise.all(sources.map((source) => this.#loadImage(source)));
    }

    return this.readyPromise;
  }

  async start(save) {
    await this.preload();
    const floor = WORLD.floors[save?.floor] ? save.floor : WORLD.airlockSpawn.floor;
    const surface = WORLD.floors[floor];
    const x = this.#clamp(save?.x ?? WORLD.airlockSpawn.x, surface.minX, surface.maxX);
    this.state = {
      x,
      y: this.#floorY(floor, x),
      floor,
      facing: save?.facing === "right" ? "right" : "left",
      moving: false,
      movementMode: "idle",
      path: [],
      pendingDestination: null,
      activeAction: null,
      queuedAction: null,
      animationClock: 0
    };
    this.zoom = DEFAULT_ZOOM;
    this.#updateZoomControls();
    this.#syncLocationReadout();
    this.hint.textContent = "Tap a deck, ladder, or object to interact";
    this.hint.classList.remove("is-dismissed");
    this.running = true;
    this.lastTime = performance.now();
    this.resize();
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = requestAnimationFrame((time) => this.#tick(time));
  }

  stop() {
    this.persist();
    this.running = false;
    this.pointers.clear();
    this.pinching = false;
    cancelAnimationFrame(this.frameRequest);
  }

  persist() {
    if (!this.running || this.state.movementMode === "climb") {
      return;
    }

    this.saveSystem.save(this.state);
  }

  resize() {
    const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const rect = this.canvas.getBoundingClientRect();
    this.cssWidth = Math.max(1, rect.width);
    this.cssHeight = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.cssWidth * ratio);
    this.canvas.height = Math.round(this.cssHeight * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.context.imageSmoothingEnabled = false;
    this.#placeCamera();
    this.#draw();
  }

  #makeInitialState() {
    return {
      x: WORLD.airlockSpawn.x,
      y: WORLD.airlockSpawn.y,
      floor: WORLD.airlockSpawn.floor,
      facing: "left",
      moving: false,
      movementMode: "idle",
      path: [],
      pendingDestination: null,
      activeAction: null,
      queuedAction: null,
      animationClock: 0
    };
  }

  #onPointerDown(event) {
    if (!this.running) {
      return;
    }

    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    this.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    });

    if (this.pointers.size === 2) {
      this.pinching = true;
      this.pinchStartDistance = this.#pointerDistance();
      this.pinchStartZoom = this.zoom;
    }
  }

  #onPointerMove(event) {
    const pointer = this.pointers.get(event.pointerId);

    if (!pointer) {
      return;
    }

    event.preventDefault();
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.moved ||= Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) > TAP_DRAG_TOLERANCE;

    if (this.pointers.size < 2 || this.pinchStartDistance <= 0) {
      return;
    }

    const distance = this.#pointerDistance();
    this.#setZoom(this.pinchStartZoom * distance / this.pinchStartDistance);
  }

  #onPointerEnd(event) {
    const pointer = this.pointers.get(event.pointerId);

    if (!pointer) {
      return;
    }

    event.preventDefault();
    const suppressTap = this.pinching || pointer.moved || event.type === "pointercancel";
    this.pointers.delete(event.pointerId);

    if (this.pointers.size < 2) {
      this.pinchStartDistance = 0;
    }

    if (this.pointers.size === 0) {
      this.pinching = false;

      if (!suppressTap) {
        this.#setTarget(event.clientX, event.clientY);
      }
    }
  }

  #onWheel(event) {
    if (!this.running) {
      return;
    }

    event.preventDefault();
    this.#setZoom(this.zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  }

  #setTarget(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const worldPoint = {
      x: this.cameraX + (clientX - rect.left) / this.scale,
      y: this.cameraY + (clientY - rect.top) / this.scale
    };

    if (this.state.activeAction) {
      this.state.activeAction = null;
      this.state.movementMode = "idle";
      this.#syncLocationReadout();
    }

    const destination = this.#findDestination(worldPoint);

    // A ladder is an atomic movement segment. Keep climbing to the landing,
    // then honor the player's newest tap instead of restarting mid-animation.
    if (this.state.movementMode === "climb") {
      this.state.pendingDestination = destination;
      this.hint.classList.add("is-dismissed");
      return;
    }

    this.#routeTo(destination);
  }

  #routeTo(destination) {
    const floorRoute = this.#findFloorRoute(this.state.floor, destination.floor);

    if (!floorRoute) {
      return;
    }

    this.state.activeAction = null;
    this.state.queuedAction = destination.actionId || null;
    this.state.path = this.#buildPath(floorRoute, destination);
    this.state.pendingDestination = null;
    this.state.moving = this.state.path.length > 0;
    this.state.animationClock = 0;
    this.hint.classList.add("is-dismissed");

    if (this.state.path.length === 0) {
      this.#finishRoute();
    }
  }

  #findDestination(point) {
    const selectedAction = Object.values(WORLD.actions).find((action) => {
      const padding = action.hitPadding;
      return point.x >= action.x - padding
        && point.x <= action.x + action.width + padding
        && point.y >= action.y - padding
        && point.y <= action.y + action.height + padding;
    });

    if (selectedAction) {
      return {
        floor: selectedAction.floor,
        x: selectedAction.targetX,
        y: this.#floorY(selectedAction.floor, selectedAction.targetX),
        actionId: selectedAction.id
      };
    }

    const selectedLadder = WORLD.ladders.find((ladder) => {
      const aY = this.#floorY(ladder.a, ladder.x);
      const bY = this.#floorY(ladder.b, ladder.x);
      return Math.abs(point.x - ladder.x) <= 32
        && point.y >= Math.min(aY, bY) - 18
        && point.y <= Math.max(aY, bY) + 18;
    });

    if (selectedLadder) {
      const targetFloor = this.state.floor === selectedLadder.a
        ? selectedLadder.b
        : this.state.floor === selectedLadder.b
          ? selectedLadder.a
          : Math.abs(point.y - this.#floorY(selectedLadder.a, selectedLadder.x))
            < Math.abs(point.y - this.#floorY(selectedLadder.b, selectedLadder.x))
              ? selectedLadder.a
              : selectedLadder.b;

      return {
        floor: targetFloor,
        x: selectedLadder.x,
        y: this.#floorY(targetFloor, selectedLadder.x)
      };
    }

    let bestFloor = WORLD.floors.bottom;
    let bestDistance = Number.POSITIVE_INFINITY;

    Object.values(WORLD.floors).forEach((floor) => {
      const horizontalDistance = point.x < floor.minX
        ? floor.minX - point.x
        : point.x > floor.maxX
          ? point.x - floor.maxX
          : 0;
      const distance = Math.abs(point.y - this.#floorY(floor.id, point.x)) + horizontalDistance * 0.7;

      if (distance < bestDistance) {
        bestDistance = distance;
        bestFloor = floor;
      }
    });

    return {
      floor: bestFloor.id,
      x: this.#clamp(point.x, bestFloor.minX, bestFloor.maxX),
      y: this.#floorY(bestFloor.id, point.x)
    };
  }

  #findFloorRoute(startFloor, targetFloor) {
    if (startFloor === targetFloor) {
      return [];
    }

    const queue = [{ floor: startFloor, route: [] }];
    const visited = new Set([startFloor]);

    while (queue.length) {
      const current = queue.shift();

      for (const ladder of WORLD.ladders) {
        let nextFloor = null;

        if (ladder.a === current.floor) {
          nextFloor = ladder.b;
        } else if (ladder.b === current.floor) {
          nextFloor = ladder.a;
        }

        if (!nextFloor || visited.has(nextFloor)) {
          continue;
        }

        const route = [...current.route, { ladder, from: current.floor, to: nextFloor }];

        if (nextFloor === targetFloor) {
          return route;
        }

        visited.add(nextFloor);
        queue.push({ floor: nextFloor, route });
      }
    }

    return null;
  }

  #buildPath(floorRoute, destination) {
    const path = [];
    let currentFloor = this.state.floor;

    floorRoute.forEach(({ ladder, to }) => {
      path.push({
        x: ladder.x,
        y: this.#floorY(currentFloor, ladder.x),
        floor: currentFloor,
        mode: "walk"
      });
      path.push({
        x: ladder.x,
        y: this.#floorY(to, ladder.x),
        floor: to,
        mode: "climb"
      });
      currentFloor = to;
    });

    path.push({
      x: destination.x,
      y: this.#floorY(destination.floor, destination.x),
      floor: destination.floor,
      mode: "walk"
    });

    return path.filter((waypoint, index) => {
      if (index > 0) {
        return true;
      }

      return Math.hypot(waypoint.x - this.state.x, waypoint.y - this.state.y) > 2;
    });
  }

  #tick(time) {
    if (!this.running) {
      return;
    }

    const delta = Math.min(0.05, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;
    this.#update(delta);
    this.#draw();
    this.frameRequest = requestAnimationFrame((nextTime) => this.#tick(nextTime));
  }

  #update(delta) {
    const waypoint = this.state.path[0];

    if (!waypoint) {
      this.state.moving = false;
      this.state.movementMode = this.state.activeAction ? "action" : "idle";
      return;
    }

    this.state.moving = true;
    this.state.movementMode = waypoint.mode;
    this.state.animationClock += delta;

    if (waypoint.mode === "walk") {
      this.#walkToward(waypoint, delta);
    } else {
      this.#climbToward(waypoint, delta);
    }

    this.#placeCamera();
  }

  #walkToward(waypoint, delta) {
    const difference = waypoint.x - this.state.x;
    const step = WALK_SPEED * delta;

    if (Math.abs(difference) <= step) {
      this.state.x = waypoint.x;
      this.state.floor = waypoint.floor;
      this.state.y = this.#floorY(this.state.floor, this.state.x);
      this.#finishWaypoint();
      return;
    }

    this.state.facing = difference > 0 ? "right" : "left";
    this.state.x += Math.sign(difference) * step;
    this.state.y = this.#floorY(this.state.floor, this.state.x);
  }

  #climbToward(waypoint, delta) {
    const difference = waypoint.y - this.state.y;
    const step = CLIMB_SPEED * delta;

    if (Math.abs(difference) <= step) {
      this.state.x = waypoint.x;
      this.state.y = waypoint.y;
      this.state.floor = waypoint.floor;
      this.#syncLocationReadout();
      this.#finishWaypoint();
      return;
    }

    this.state.x = waypoint.x;
    this.state.y += Math.sign(difference) * step;
  }

  #finishWaypoint() {
    this.state.path.shift();
    this.state.animationClock = 0;

    if (this.state.pendingDestination) {
      const destination = this.state.pendingDestination;
      this.state.pendingDestination = null;
      this.#routeTo(destination);
      return;
    }

    if (this.state.path.length === 0) {
      this.#finishRoute();
    }
  }

  #finishRoute() {
    this.state.moving = false;

    if (this.state.queuedAction && WORLD.actions[this.state.queuedAction]) {
      this.state.activeAction = this.state.queuedAction;
      this.state.queuedAction = null;
      this.state.movementMode = "action";
    } else {
      this.state.activeAction = null;
      this.state.queuedAction = null;
      this.state.movementMode = "idle";
    }

    this.#syncLocationReadout();
    this.persist();
  }

  #syncLocationReadout() {
    if (this.locationReadout) {
      const action = this.state.activeAction ? WORLD.actions[this.state.activeAction] : null;
      this.locationReadout.textContent = `The Echo · ${action?.label || WORLD.floors[this.state.floor].label}`;
    }
  }

  #floorY(floorId, x) {
    const floor = WORLD.floors[floorId];

    if (floorId !== "bottom") {
      return floor.y;
    }

    if (x <= 760) {
      return 637;
    }

    if (x < 780) {
      return 637 + ((x - 760) / 20) * 14;
    }

    return 651;
  }

  #placeCamera() {
    const fittedScale = this.#clamp(this.cssHeight / WORLD.height, 0.44, 1.5);
    this.scale = fittedScale * this.zoom;
    const viewWidth = this.cssWidth / this.scale;
    const viewHeight = this.cssHeight / this.scale;
    this.cameraX = this.#clamp(this.state.x - viewWidth / 2, 0, Math.max(0, WORLD.width - viewWidth));
    this.cameraY = this.#clamp(this.state.y - viewHeight / 2, 0, Math.max(0, WORLD.height - viewHeight));
  }

  #draw() {
    const context = this.context;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#000";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.restore();

    context.save();
    context.translate(-this.cameraX * this.scale, -this.cameraY * this.scale);
    context.scale(this.scale, this.scale);
    context.imageSmoothingEnabled = false;

    const interior = this.images.get(ASSETS.echoInterior);

    if (interior) {
      context.drawImage(interior, 0, 0, WORLD.width, WORLD.height);
      const patch = AIRLOCK_SCAFFOLD_PATCH;
      context.drawImage(
        interior,
        patch.sourceX,
        patch.sourceY,
        patch.width,
        patch.height,
        patch.x,
        patch.y,
        patch.width,
        patch.height
      );
    }

    this.#drawPlayer(context);
    context.restore();
  }

  #drawPlayer(context) {
    let source;

    if (this.state.activeAction) {
      const action = WORLD.actions[this.state.activeAction];
      const actionImage = this.images.get(ASSETS.actions[action.asset]);

      if (actionImage) {
        context.drawImage(actionImage, action.x, action.y, action.width, action.height);
      }

      return;
    }

    if (this.state.movementMode === "climb") {
      const frame = Math.floor(this.state.animationClock / ANIMATION_FRAME_SECONDS) % ASSETS.ladder.length;
      source = ASSETS.ladder[frame];
    } else if (this.state.moving) {
      const frame = Math.floor(this.state.animationClock / ANIMATION_FRAME_SECONDS) % ASSETS.walk.length;
      source = ASSETS.walk[frame];
    } else {
      source = this.state.facing === "right" ? ASSETS.idleRight : ASSETS.idleLeft;
    }

    const image = this.images.get(source);

    if (!image) {
      return;
    }

    const x = Math.round(this.state.x - PLAYER_WIDTH / 2);
    const y = Math.round(this.state.y - PLAYER_HEIGHT);

    // The authored walk cycle faces right. Mirror it only while moving left.
    if (this.state.movementMode === "walk" && this.state.facing === "left") {
      context.save();
      context.translate(x + PLAYER_WIDTH, y);
      context.scale(-1, 1);
      context.drawImage(image, 0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
      context.restore();
      return;
    }

    context.drawImage(image, x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
  }

  #loadImage(source) {
    if (this.images.has(source)) {
      return Promise.resolve(this.images.get(source));
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => {
        this.images.set(source, image);
        resolve(image);
      }, { once: true });
      image.addEventListener("error", () => reject(new Error(`Unable to load ${source}`)), { once: true });
      image.src = source;
    });
  }

  #setZoom(value) {
    const nextZoom = this.#clamp(value, MIN_ZOOM, MAX_ZOOM);

    if (Math.abs(nextZoom - this.zoom) < 0.001) {
      return;
    }

    this.zoom = nextZoom;
    this.#placeCamera();
    this.#draw();
    this.#updateZoomControls();
  }

  #updateZoomControls() {
    if (this.zoomReadout) {
      this.zoomReadout.value = `${Math.round(100 / this.zoom)}% view`;
      this.zoomReadout.textContent = this.zoomReadout.value;
    }

    if (this.zoomOutButton) {
      this.zoomOutButton.disabled = this.zoom <= MIN_ZOOM + 0.001;
    }

    if (this.zoomInButton) {
      this.zoomInButton.disabled = this.zoom >= MAX_ZOOM - 0.001;
    }
  }

  #pointerDistance() {
    const [first, second] = Array.from(this.pointers.values());
    return first && second ? Math.hypot(second.x - first.x, second.y - first.y) : 0;
  }

  #clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
}
