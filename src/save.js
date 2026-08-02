import { SAVE_KEY, SAVE_VERSION, WORLD } from "./config.js";

export class SaveSystem {
  hasSave() {
    return this.load() !== null;
  }

  load() {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const save = JSON.parse(raw);

      if (!save || ![1, SAVE_VERSION].includes(save.version) || save.area !== "echo-airlock") {
        return null;
      }

      const floor = WORLD.floors[save.floor] ? save.floor : WORLD.airlockSpawn.floor;
      const surface = WORLD.floors[floor];

      return {
        ...save,
        version: SAVE_VERSION,
        floor,
        x: this.#clamp(Number(save.x) || WORLD.airlockSpawn.x, surface.minX, surface.maxX),
        y: Number(save.y) || surface.y
      };
    } catch {
      return null;
    }
  }

  createInitialSave() {
    return this.save({
      area: "echo-airlock",
      x: WORLD.airlockSpawn.x,
      y: WORLD.airlockSpawn.y,
      floor: WORLD.airlockSpawn.floor,
      facing: "left",
      openingComplete: true
    });
  }

  save(state) {
    const floor = WORLD.floors[state.floor] ? state.floor : WORLD.airlockSpawn.floor;
    const surface = WORLD.floors[floor];
    const snapshot = {
      version: SAVE_VERSION,
      area: "echo-airlock",
      floor,
      x: this.#clamp(Number(state.x) || WORLD.airlockSpawn.x, surface.minX, surface.maxX),
      y: Number(state.y) || surface.y,
      facing: state.facing === "right" ? "right" : "left",
      openingComplete: true,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    return snapshot;
  }

  clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  #clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
}
