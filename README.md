# Echoes of Earth

A mobile-first narrative science-fiction game by Black Candle Labs.

## First playable slice

The current build includes:

- A launch-pad main menu
- New Game, Load Game, and two-step Clear Save controls
- Prelaunch interface dialogue
- In-dialogue launch controls for the lever, radio, and launch button
- A synchronized countdown and title sequence
- Welcome to Space and Enter the Echo story scenes
- A persistent local save created at the Echo airlock
- Touch-to-move Cosmonaut gameplay across four decks and three ladders
- Precisely aligned bridge-sitting and sleeping interactions
- A 25%-view close-up ship camera by default, with button, wheel, and pinch zoom out to 100%

Opening dialogue is kept in `src/config.js` so it can be rewritten without changing the sequence engine.

Editable sound cues live in `Assets/Audio/SFX`. The generated interface, dialogue, and countdown tick settings are in `scripts/generate-audio-assets.mjs`; the authored `Rocket Launch.wav` begins at T−07 and hands off at its audible ending to `RocketDead.wav`.


## Mobile direction

The interface uses pointer events, safe-area insets, large touch targets, responsive layouts, durable local storage, mobile audio unlocking, and pixel-preserving rendering. Both iPhone Safari and Android Chrome are primary targets.
