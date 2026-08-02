export const SAVE_KEY = "echoes-of-earth-save";
export const SAVE_VERSION = 2;

export const WORLD = Object.freeze({
  width: 2076,
  height: 819,
  floors: Object.freeze({
    top: Object.freeze({ id: "top", minX: 138, maxX: 1574, y: 250, label: "Upper Deck" }),
    crew: Object.freeze({ id: "crew", minX: 152, maxX: 526, y: 432, label: "Crew Deck" }),
    garden: Object.freeze({ id: "garden", minX: 596, maxX: 1630, y: 465, label: "Greenhouse Deck" }),
    bottom: Object.freeze({ id: "bottom", minX: 197, maxX: 1622, y: 637, label: "Airlock Deck" })
  }),
  ladders: Object.freeze([
    Object.freeze({ id: "left", x: 505, a: "top", b: "crew" }),
    Object.freeze({ id: "upper-right", x: 1444, a: "top", b: "garden" }),
    Object.freeze({ id: "lower-right", x: 1290, a: "garden", b: "bottom" })
  ]),
  actions: Object.freeze({
    bridgeSit: Object.freeze({
      id: "bridgeSit",
      asset: "bridgeSit",
      floor: "top",
      targetX: 318,
      x: 287,
      y: 168,
      width: 61,
      height: 82,
      hitPadding: 24,
      label: "Bridge Station"
    }),
    sleep: Object.freeze({
      id: "sleep",
      asset: "sleep",
      floor: "top",
      targetX: 796,
      x: 758,
      y: 181,
      width: 75,
      height: 29,
      hitPadding: 28,
      label: "Crew Bunk"
    })
  }),
  airlockSpawn: Object.freeze({ x: 667, y: 637, floor: "bottom" })
});

export const ASSETS = Object.freeze({
  menu: "Menus/Main Menu.png",
  radio: "Menus/New Game/Radio.png",
  lever: "Menus/New Game/Lever.png",
  launchButton: "Menus/New Game/LaunchButton.png",
  cosmonautPortrait: "Assets/Cosmonaut/Portrait/CosmonautPortrait.png",
  welcomeToSpace: "Cutscenes/New Game/WelcometoSpace.png",
  enterTheEcho: "Cutscenes/New Game/EntertheEcho.png",
  echoInterior: "Assets/TheEcho/TheEcho.png",
  idleLeft: "Assets/Cosmonaut/Idle/IdleLeft.png",
  idleRight: "Assets/Cosmonaut/Idle/IdleRight.png",
  walk: Object.freeze([
    "Assets/Cosmonaut/Walk/nautwalk1.png",
    "Assets/Cosmonaut/Walk/nautwalk2.png",
    "Assets/Cosmonaut/Walk/nautwalk3.png",
    "Assets/Cosmonaut/Walk/nautwalk4.png"
  ]),
  ladder: Object.freeze([
    "Assets/Cosmonaut/Ladder/Ladder1.png",
    "Assets/Cosmonaut/Ladder/Ladder2.png",
    "Assets/Cosmonaut/Ladder/Ladder3.png",
    "Assets/Cosmonaut/Ladder/Ladder4.png"
  ]),
  actions: Object.freeze({
    bridgeSit: "Assets/Cosmonaut/Actions/BridgeSit.png",
    sleep: "Assets/Cosmonaut/Actions/Sleep.png"
  })
});

// These are intentionally kept in one small file so the final script can be
// rewritten without touching the dialogue or sequence engines.
export const OPENING_DIALOGUE = Object.freeze({
  prelaunch: Object.freeze([
    {
      speaker: "Launch Interface",
      portrait: ASSETS.lever,
      text: "Cosmonaut link established. Pre-launch systems are standing by."
    },
    {
      speaker: "Cosmonaut",
      portrait: ASSETS.cosmonautPortrait,
      text: "Copy that. Let's wake this rocket up."
    },
    {
      speaker: "Radio",
      portrait: ASSETS.radio,
      text: "Cosmonaut! What are you doing? Abort mission!",
      choices: Object.freeze([
        Object.freeze({ id: "switch-off-radio", label: "Turn off the radio", style: "radio" })
      ])
    }
  ]),
  leverPrompt: Object.freeze([
    {
      speaker: "Launch Interface",
      portrait: ASSETS.lever,
      text: "Manual launch control ready. Pull the lever to engage the ignition sequence.",
      choices: Object.freeze([
        Object.freeze({ id: "pull-lever", label: "Pull the lever", style: "lever" })
      ])
    }
  ]),
  launchButtonPrompt: Object.freeze([
    {
      speaker: "Launch Interface",
      portrait: ASSETS.launchButton,
      text: "Ignition circuit armed. The green launch button begins to flash.",
      emphasis: "launch",
      choices: Object.freeze([
        Object.freeze({ id: "push-launch", label: "Push the launch button", style: "launch" })
      ])
    }
  ]),
  welcome: Object.freeze([
    {
      speaker: "Radio",
      portrait: ASSETS.radio,
      text: "We got your radio back on. You don't know what you're doing. We don't even know who built that ship or where it came from. You're likely to die just trying to get aboard it."
    },
    {
      speaker: "Cosmonaut",
      portrait: ASSETS.cosmonautPortrait,
      text: "Look. I'm going through with it. Earth already looks so small down there."
    },
    {
      speaker: "Radio",
      portrait: ASSETS.radio,
      text: "Space is a vacuum. If you try to jump out of your rocket, you'll just get sucked into space and die.",
      choices: Object.freeze([
        Object.freeze({ id: "switch-off-radio-again", label: "Turn off the radio", style: "radio" })
      ])
    }
  ]),
  approach: Object.freeze([
    {
      speaker: "Cosmonaut",
      portrait: ASSETS.cosmonautPortrait,
      text: "Alright. The moment of truth."
    },
    {
      speaker: "Suit Interface",
      portrait: ASSETS.radio,
      text: "Airlock approach locked. Tether secure."
    },
    {
      speaker: "Cosmonaut",
      portrait: ASSETS.cosmonautPortrait,
      text: "I wonder how much trouble i'll get in if i survive this."
    }
  ])
});
