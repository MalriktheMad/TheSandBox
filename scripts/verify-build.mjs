import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  "index.html",
  "styles/game.css",
  "src/main.js",
  "src/audio.js",
  "src/dialogue.js",
  "src/opening.js",
  "src/save.js",
  "src/world.js",
  "Menus/Main Menu.png",
  "Menus/New Game/LaunchButton.png",
  "Cutscenes/New Game/WelcometoSpace.png",
  "Cutscenes/New Game/EntertheEcho.png",
  "Assets/TheEcho/TheEcho.png",
  "Assets/Cosmonaut/Idle/Idlefront.png",
  "Assets/Cosmonaut/Ladder/Ladder1.png",
  "Assets/Cosmonaut/Actions/BridgeSit.png",
  "Assets/Cosmonaut/Actions/Sleep.png",
  "Assets/Audio/SFX/ui-click.wav",
  "Assets/Audio/SFX/dialogue-blip.wav",
  "Assets/Audio/SFX/countdown-tick.wav",
  "Assets/Audio/SFX/Rocket Launch.wav",
  "Assets/Audio/SFX/RocketDead.wav"
];

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

if (!html.includes('id="zoom-out-button"') || !html.includes('id="zoom-in-button"')) {
  console.error("The ship camera zoom controls are missing from index.html.");
  process.exit(1);
}

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
};

const { SaveSystem } = await import("../src/save.js");
const { WORLD } = await import("../src/config.js");
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
