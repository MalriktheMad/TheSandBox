const SOUND_ASSETS = Object.freeze({
  ui: Object.freeze({
    source: new URL("../Assets/Audio/SFX/ui-click.wav", import.meta.url).href,
    volume: 0.09,
    maxVoices: 6
  }),
  dialogue: Object.freeze({
    source: new URL("../Assets/Audio/SFX/dialogue-blip.wav", import.meta.url).href,
    volume: 0.065,
    maxVoices: 3
  }),
  countdown: Object.freeze({
    source: new URL("../Assets/Audio/SFX/countdown-tick.wav", import.meta.url).href,
    volume: 0.075,
    maxVoices: 1
  }),
  rocketLaunch: Object.freeze({
    source: new URL("../Assets/Audio/SFX/Rocket Launch.wav", import.meta.url).href,
    volume: 0.42,
    maxVoices: 1
  }),
  rocketDead: Object.freeze({
    source: new URL("../Assets/Audio/SFX/RocketDead.wav", import.meta.url).href,
    volume: 0.48,
    maxVoices: 1
  })
});

export class AudioEngine {
  constructor() {
    this.context = null;
    this.unlocked = false;
    this.rawSounds = new Map();
    this.decodedSounds = new Map();
    this.activeVoices = new Map();
    this.#preloadRawSounds();
  }

  installUnlockListeners() {
    const unlock = () => this.unlock();
    document.addEventListener("pointerdown", unlock, { capture: true });
    document.addEventListener("keydown", unlock, { capture: true });
  }

  async unlock() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      this.context = new AudioContext();
      this.#primeContext();
    }

    if (this.context.state !== "running") {
      await this.context.resume().catch(() => {});
    }

    this.unlocked = this.context.state === "running";

    if (this.unlocked) {
      Object.keys(SOUND_ASSETS).forEach((soundId) => {
        this.#getDecodedSound(soundId).catch(() => {});
      });
    }
  }

  playUi() {
    this.#playSound("ui");
  }

  playDialogue() {
    this.#playSound("dialogue");
  }

  playCountdown() {
    return this.#playSound("countdown", { restart: true });
  }

  startRocketLaunch() {
    return this.#playSound("rocketLaunch", { restart: true });
  }

  stopRocketLaunch() {
    this.#stopSound("rocketLaunch");
  }

  playRocketDead() {
    return this.#playSound("rocketDead", { restart: true });
  }

  stopLaunchSequence() {
    this.#stopSound("rocketLaunch");
    this.#stopSound("rocketDead");
  }

  #preloadRawSounds() {
    Object.entries(SOUND_ASSETS).forEach(([soundId, sound]) => {
      const request = fetch(sound.source)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Unable to load ${soundId}: ${response.status}`);
          }

          return response.arrayBuffer();
        })
        .catch((error) => {
          console.warn(error);
          return null;
        });

      this.rawSounds.set(soundId, request);
    });
  }

  #primeContext() {
    try {
      const buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.addEventListener("ended", () => source.disconnect(), { once: true });
      source.start();
    } catch {
      // A later user gesture can retry audio playback on restrictive browsers.
    }
  }

  #getDecodedSound(soundId) {
    if (this.decodedSounds.has(soundId)) {
      return this.decodedSounds.get(soundId);
    }

    const rawSound = this.rawSounds.get(soundId);

    if (!this.context || !rawSound) {
      return Promise.resolve(null);
    }

    const decoded = rawSound
      .then((audioData) => audioData ? this.context.decodeAudioData(audioData.slice(0)) : null)
      .catch((error) => {
        console.warn(error);
        return null;
      });

    this.decodedSounds.set(soundId, decoded);
    return decoded;
  }

  async #playSound(soundId, options = {}) {
    const sound = SOUND_ASSETS[soundId];
    const context = this.context;

    if (!sound || !context) {
      return;
    }

    if (context.state !== "running") {
      await context.resume().catch(() => {});
    }

    const buffer = await this.#getDecodedSound(soundId);

    if (!buffer || context.state !== "running") {
      return;
    }

    if (!this.activeVoices.has(soundId)) {
      this.activeVoices.set(soundId, new Set());
    }

    const voices = this.activeVoices.get(soundId);

    if (options.restart) {
      Array.from(voices).forEach((voice) => this.#stopVoice(voices, voice));
    }

    while (voices.size >= sound.maxVoices) {
      this.#stopVoice(voices, voices.values().next().value);
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    const voice = { source, gain };
    source.buffer = buffer;
    gain.gain.value = sound.volume;
    source.connect(gain);
    gain.connect(context.destination);
    voices.add(voice);
    return new Promise((resolve) => {
      source.addEventListener("ended", () => {
        voices.delete(voice);
        source.disconnect();
        gain.disconnect();
        resolve();
      }, { once: true });
      source.start();
    });
  }

  #stopSound(soundId) {
    const voices = this.activeVoices.get(soundId);

    if (!voices) {
      return;
    }

    Array.from(voices).forEach((voice) => this.#stopVoice(voices, voice));
  }

  #stopVoice(voices, voice) {
    voices.delete(voice);

    try {
      voice.source.stop();
    } catch {
      // The voice may already have ended.
    }
  }
}
