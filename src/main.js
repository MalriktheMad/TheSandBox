import { ASSETS } from "./config.js";
import { AudioEngine } from "./audio.js";
import { DialogueSystem } from "./dialogue.js";
import { OpeningSequence } from "./opening.js";
import { SaveSystem } from "./save.js";
import { EchoWorld } from "./world.js";

const byId = (id) => document.getElementById(id);

const screens = [byId("menu-screen"), byId("cinematic-screen"), byId("game-screen")];
const elements = {
  menuScreen: byId("menu-screen"),
  cinematicScreen: byId("cinematic-screen"),
  gameScreen: byId("game-screen"),
  menuPanel: byId("menu-panel"),
  newGameButton: byId("new-game-button"),
  loadGameButton: byId("load-game-button"),
  clearSaveButton: byId("clear-save-button"),
  saveStatus: byId("save-status"),
  cinematicImage: byId("cinematic-image"),
  black: byId("cinematic-black"),
  countdown: byId("countdown"),
  titleCard: byId("title-card"),
  titleCardKicker: byId("title-card-kicker"),
  titleCardTitle: byId("title-card-title"),
  titleCardCredit: byId("title-card-credit"),
  zoomOutButton: byId("zoom-out-button"),
  zoomInButton: byId("zoom-in-button"),
  zoomReadout: byId("zoom-readout"),
  returnMenuButton: byId("return-menu-button"),
  loadingScreen: byId("loading-screen")
};

const saveSystem = new SaveSystem();
const audio = new AudioEngine();
audio.installUnlockListeners();

const dialogue = new DialogueSystem({
  box: byId("dialogue-box"),
  portrait: byId("dialogue-portrait"),
  speaker: byId("dialogue-speaker"),
  text: byId("dialogue-text"),
  choices: byId("dialogue-choices"),
  prompt: byId("dialogue-prompt"),
  audio
});

const world = new EchoWorld({
  canvas: byId("game-canvas"),
  hint: byId("movement-hint"),
  locationReadout: byId("location-readout"),
  zoomOutButton: elements.zoomOutButton,
  zoomInButton: elements.zoomInButton,
  zoomReadout: elements.zoomReadout,
  saveSystem
});

const showScreen = (activeScreen) => {
  screens.forEach((screen) => {
    if (screen === activeScreen) {
      screen.hidden = false;
      requestAnimationFrame(() => screen.classList.add("is-active"));
      return;
    }

    screen.classList.remove("is-active");
    window.setTimeout(() => {
      if (!screen.classList.contains("is-active")) {
        screen.hidden = true;
      }
    }, 520);
  });
};

const opening = new OpeningSequence({
  elements,
  dialogue,
  audio,
  showScreen,
  onAbort: () => {
    updateSaveControls();
    elements.newGameButton.focus();
  },
  onComplete: async () => {
    const save = saveSystem.createInitialSave();
    updateSaveControls();
    showScreen(elements.gameScreen);
    await world.start(save);
  }
});

let clearConfirmationTimer = 0;

elements.newGameButton.addEventListener("click", () => opening.begin());

elements.loadGameButton.addEventListener("click", async () => {
  const save = saveSystem.load();

  if (!save) {
    updateSaveControls();
    return;
  }

  showScreen(elements.gameScreen);
  await world.start(save);
});

elements.clearSaveButton.addEventListener("click", () => {
  if (elements.clearSaveButton.dataset.confirming !== "true") {
    elements.clearSaveButton.dataset.confirming = "true";
    elements.clearSaveButton.textContent = "Tap Again to Confirm";
    elements.saveStatus.textContent = "Flight record will be permanently cleared";
    window.clearTimeout(clearConfirmationTimer);
    clearConfirmationTimer = window.setTimeout(resetClearConfirmation, 3500);
    return;
  }

  saveSystem.clear();
  resetClearConfirmation();
  updateSaveControls();
});

elements.returnMenuButton.addEventListener("click", () => {
  world.stop();
  dialogue.cancel();
  opening.resetMenu();
  showScreen(elements.menuScreen);
  updateSaveControls();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("button") && !event.target.closest("#dialogue-box")) {
    audio.playUi();
  }
}, { capture: true });

function resetClearConfirmation() {
  window.clearTimeout(clearConfirmationTimer);
  clearConfirmationTimer = 0;
  delete elements.clearSaveButton.dataset.confirming;
  elements.clearSaveButton.textContent = "Clear Save";
}

function updateSaveControls() {
  const save = saveSystem.load();
  const hasSave = Boolean(save);
  elements.loadGameButton.disabled = !hasSave;
  elements.clearSaveButton.disabled = !hasSave;

  if (!hasSave) {
    elements.saveStatus.textContent = "No flight record detected";
    return;
  }

  elements.saveStatus.textContent = "Flight record · The Echo airlock";
}

async function prepareMenu() {
  updateSaveControls();

  const menuImages = Array.from(document.querySelectorAll("#menu-screen img"));
  await Promise.all(menuImages.map((image) => {
    if (typeof image.decode === "function") {
      return image.decode().catch(() => {});
    }

    return Promise.resolve();
  }));

  elements.loadingScreen.classList.add("is-finished");
  window.setTimeout(() => {
    elements.loadingScreen.hidden = true;
  }, 520);

  // Decode the playable room while the player explores the menu and intro.
  world.preload().catch((error) => console.warn(error));

  // Warm the portrait cache before the first line of dialogue.
  const portrait = new Image();
  portrait.decoding = "async";
  portrait.src = ASSETS.cosmonautPortrait;
}

prepareMenu();
