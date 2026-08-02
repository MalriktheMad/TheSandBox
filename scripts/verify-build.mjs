import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ASSETS, WORLD } from "../src/config.js";

const collectAssetPaths = (value) => {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectAssetPaths);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectAssetPaths);
  }

  return [];
};

const requiredFiles = [...new Set([
  "index.html",
  "styles/game.css",
  "src/main.js",
  "src/audio.js",
  "src/config.js",
  "src/dialogue.js",
  "src/opening.js",
  "src/save.js",
  "src/world.js",
  "Assets/Audio/SFX/ui-click.wav",
  "Assets/Audio/SFX/dialogue-blip.wav",
  "Assets/Audio/SFX/countdown-tick.wav",
  "Assets/Audio/SFX/Rocket Launch.wav",
  "Assets/Audio/SFX/RocketDead.wav",
  ...collectAssetPaths(ASSETS)
])];

const missing = requiredFiles.filter((file) => !existsSync(resolve(file)));

if (missing.length) {
  console.error(`Missing required files:\n${missing.join("\n")}`);
  process.exit(1);
}

requiredFiles.filter((file) => file.endsWith(".wav")).forEach((file) => {
  const wav = readFileSync(resolve(file));

  if (wav.subarray(0, 4).toString("ascii") !== "RIFF" || wav.subarray(8, 12).toString("ascii") !== "WAVE") {
    console.error(`Invalid WAV asset: ${file}`);
    process.exit(1);
  }
});

const html = readFileSync(resolve("index.html"), "utf8");

if (!html.includes("Echoes of Earth")) {
  console.error("The corrected game title is missing from index.html.");
  process.exit(1);
}

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
};

const { SaveSystem } = await import("../src/save.js");
const saveSystem = new SaveSystem();
const initialSave = saveSystem.createInitialSave();

if (!saveSystem.hasSave() || initialSave.area !== "echo-airlock") {
  console.error("The local save system failed its create/load check.");
  process.exit(1);
}

saveSystem.clear();

if (saveSystem.hasSave()) {
  console.error("The local save system failed its clear check.");
  process.exit(1);
}

const reachableFloors = new Set([WORLD.airlockSpawn.floor]);
let foundNewFloor = true;

while (foundNewFloor) {
  foundNewFloor = false;
  WORLD.ladders.forEach((ladder) => {
    if (reachableFloors.has(ladder.a) && !reachableFloors.has(ladder.b)) {
      reachableFloors.add(ladder.b);
      foundNewFloor = true;
    } else if (reachableFloors.has(ladder.b) && !reachableFloors.has(ladder.a)) {
      reachableFloors.add(ladder.a);
      foundNewFloor = true;
    }
  });
}

if (reachableFloors.size !== Object.keys(WORLD.floors).length) {
  console.error("The ladder graph does not connect every walkable deck.");
  process.exit(1);
}

Object.values(WORLD.actions).forEach((action) => {
  const floor = WORLD.floors[action.floor];

  if (!floor || action.targetX < floor.minX || action.targetX > floor.maxX) {
    console.error(`Action ${action.id} is not attached to a valid walkable deck.`);
    process.exit(1);
  }
});

console.log(`Build verification passed (${requiredFiles.length} required files).`);
