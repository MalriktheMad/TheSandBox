import { ASSETS, OPENING_DIALOGUE } from "./config.js";

const delay = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

export class OpeningSequence {
  constructor({ elements, dialogue, audio, showScreen, onComplete, onAbort }) {
    this.elements = elements;
    this.dialogue = dialogue;
    this.audio = audio;
    this.showScreen = showScreen;
    this.onComplete = onComplete;
    this.onAbort = onAbort;
    this.running = false;
    this.ready = false;
    this.sequenceToken = 0;
  }

  async begin() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.ready = false;
    this.sequenceToken += 1;
    const token = this.sequenceToken;
    this.elements.menuScreen.classList.add("is-prelaunch");
    this.#preloadOpeningArtwork();

    const radioAction = await this.dialogue.play(OPENING_DIALOGUE.prelaunch);

    if (!this.running || token !== this.sequenceToken) {
      return;
    }

    if (radioAction === "abort") {
      this.abort();
      return;
    }

    if (radioAction !== "switch-off-radio") {
      return;
    }

    await delay(250);
    const leverAction = await this.dialogue.play(OPENING_DIALOGUE.leverPrompt);

    if (!this.running || token !== this.sequenceToken || leverAction !== "pull-lever") {
      return;
    }

    await delay(250);
    this.ready = true;
    const launchAction = await this.dialogue.play(OPENING_DIALOGUE.launchButtonPrompt);

    if (!this.running || token !== this.sequenceToken || launchAction !== "push-launch") {
      return;
    }

    await this.launch();
  }

  abort() {
    this.sequenceToken += 1;
    this.running = false;
    this.ready = false;
    this.audio.stopLaunchSequence();
    this.dialogue.cancel();
    this.resetMenu();
    this.onAbort();
  }

  resetMenu() {
    this.elements.menuScreen.classList.remove("is-prelaunch");
  }

  async launch() {
    if (!this.running || !this.ready || this.dialogue.active) {
      return;
    }

    this.ready = false;
    this.showScreen(this.elements.cinematicScreen);
    this.#resetCinematic();

    await this.#runCountdown();
    await this.#showIllustratedScene({
      source: ASSETS.welcomeToSpace,
      alt: "The Cosmonaut's rocket leaving Earth behind",
      lines: OPENING_DIALOGUE.welcome
    });
    await this.#showIllustratedScene({
      source: ASSETS.enterTheEcho,
      alt: "The Cosmonaut crossing open space toward the Echo",
      lines: OPENING_DIALOGUE.approach
    });

    this.elements.black.classList.remove("is-clear");
    await delay(900);
    this.running = false;
    this.resetMenu();
    this.onComplete();
  }

  async #runCountdown() {
    const startTime = performance.now();

    for (let value = 10; value >= 0; value -= 1) {
      const targetTime = startTime + (10 - value) * 1000;
      await delay(Math.max(0, targetTime - performance.now()));
      this.elements.countdown.textContent = value === 0 ? "T+00" : `T−${String(value).padStart(2, "0")}`;

      if (value > 0) {
        this.audio.playCountdown();
      }

      if (value === 7) {
        this.audio.startRocketLaunch();
      }

      if (value === 8) {
        this.#showTitleCard("", "Black Candle Labs", "Lead Developer · Kevin Klinkert");
      } else if (value === 5) {
        this.#showTitleCard("", "Echoes of Earth", "");
      } else if (value === 1) {
        this.elements.titleCard.hidden = true;
      }
    }

    this.elements.countdown.textContent = "";
    // The launch WAV begins at T−07. Its audible engine ends at 9.245 seconds;
    // the remaining 3.109 seconds are silence, so hand off before that tail.
    await delay(2245);
    this.audio.stopRocketLaunch();
    await Promise.all([delay(800), this.audio.playRocketDead()]);
  }

  async #showIllustratedScene({ source, alt, lines }) {
    const image = this.elements.cinematicImage;
    image.hidden = false;
    image.alt = alt;
    image.src = source;

    if (typeof image.decode === "function") {
      await image.decode().catch(() => {});
    }

    this.elements.titleCard.hidden = true;
    this.elements.black.classList.add("is-clear");
    await delay(850);
    await this.dialogue.play(lines);
    this.elements.black.classList.remove("is-clear");
    await delay(700);
  }

  #showTitleCard(kicker, title, credit) {
    this.elements.titleCardKicker.textContent = kicker;
    this.elements.titleCardTitle.textContent = title;
    this.elements.titleCardCredit.textContent = credit;
    this.elements.titleCard.hidden = false;
    this.elements.titleCard.style.animation = "none";
    void this.elements.titleCard.offsetWidth;
    this.elements.titleCard.style.animation = "";
  }

  #resetCinematic() {
    this.elements.cinematicImage.hidden = true;
    this.elements.cinematicImage.removeAttribute("src");
    this.elements.countdown.textContent = "";
    this.elements.titleCard.hidden = true;
    this.elements.black.classList.remove("is-clear");
  }

  #preloadOpeningArtwork() {
    [ASSETS.welcomeToSpace, ASSETS.enterTheEcho].forEach((source) => {
      const image = new Image();
      image.decoding = "async";
      image.src = source;
    });
  }
}
