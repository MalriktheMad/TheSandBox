const TYPE_INTERVAL_MS = 24;

export class DialogueSystem {
  constructor({ box, portrait, speaker, text, choices, prompt, audio }) {
    this.box = box;
    this.portrait = portrait;
    this.speaker = speaker;
    this.text = text;
    this.choices = choices;
    this.prompt = prompt;
    this.audio = audio;
    this.lines = [];
    this.index = 0;
    this.timer = 0;
    this.typingComplete = true;
    this.resolve = null;
    this.active = false;

    this.box.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.advance();
    });

    window.addEventListener("keydown", (event) => {
      if (!this.active || !["Enter", " "].includes(event.key)) {
        return;
      }

      event.preventDefault();
      this.advance();
    });
  }

  play(lines) {
    this.cancel();
    this.lines = [...lines];
    this.index = 0;
    this.active = true;
    this.box.hidden = false;
    this.#showLine();

    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  advance() {
    if (!this.active) {
      return;
    }

    if (!this.typingComplete) {
      this.#finishTyping();
      return;
    }

    const line = this.lines[this.index];

    if (line?.choices?.length) {
      return;
    }

    this.index += 1;

    if (this.index >= this.lines.length) {
      this.#complete();
      return;
    }

    this.#showLine();
  }

  cancel() {
    window.clearInterval(this.timer);
    this.timer = 0;
    this.active = false;
    this.box.hidden = true;
    this.box.classList.remove("has-choices", "is-launch-ready");

    if (this.resolve) {
      const resolve = this.resolve;
      this.resolve = null;
      resolve(false);
    }
  }

  #showLine() {
    const line = this.lines[this.index];
    this.audio.playDialogue();
    this.portrait.src = line.portrait;
    this.portrait.alt = `${line.speaker} portrait`;
    this.speaker.textContent = line.speaker;
    this.text.textContent = "";
    this.choices.innerHTML = "";
    this.choices.hidden = true;
    this.prompt.textContent = "Tap to continue";
    this.box.classList.remove("has-choices", "is-launch-ready");
    this.box.classList.toggle("is-launch-ready", line.emphasis === "launch");
    this.typingComplete = false;
    let character = 0;

    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      character += 1;
      this.text.textContent = line.text.slice(0, character);

      if (character >= line.text.length) {
        this.#finishTyping();
      }
    }, TYPE_INTERVAL_MS);
  }

  #finishTyping() {
    window.clearInterval(this.timer);
    this.timer = 0;
    this.typingComplete = true;
    this.text.textContent = this.lines[this.index].text;
    this.#renderChoices(this.lines[this.index].choices || []);
  }

  #renderChoices(choices) {
    this.choices.innerHTML = "";
    this.choices.hidden = choices.length === 0;
    this.box.classList.toggle("has-choices", choices.length > 0);
    this.prompt.textContent = choices.length > 0 ? "Choose an action" : "Tap to continue";

    choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `dialogue-choice dialogue-choice-${choice.style || "default"}`;
      button.textContent = choice.label;
      button.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        event.stopImmediatePropagation();
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.#selectChoice(choice.id);
      });
      this.choices.append(button);
    });
  }

  #selectChoice(choiceId) {
    const resolve = this.resolve;
    window.clearInterval(this.timer);
    this.timer = 0;
    this.resolve = null;
    this.active = false;
    this.box.hidden = true;
    this.box.classList.remove("has-choices", "is-launch-ready");

    if (resolve) {
      resolve(choiceId);
    }
  }

  #complete() {
    const resolve = this.resolve;
    window.clearInterval(this.timer);
    this.timer = 0;
    this.resolve = null;
    this.active = false;
    this.box.hidden = true;
    this.box.classList.remove("has-choices", "is-launch-ready");

    if (resolve) {
      resolve(null);
    }
  }
}
