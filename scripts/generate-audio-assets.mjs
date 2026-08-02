import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SAMPLE_RATE = 44_100;
const OUTPUT_DIRECTORY = resolve("Assets/Audio/SFX");

const sounds = [
  {
    file: "ui-click.wav",
    startFrequency: 220,
    endFrequency: 150,
    duration: 0.055,
    attack: 0.002,
    level: 0.55
  },
  {
    file: "dialogue-blip.wav",
    startFrequency: 640,
    endFrequency: 520,
    duration: 0.035,
    attack: 0.001,
    level: 0.45
  },
  {
    file: "countdown-tick.wav",
    startFrequency: 420,
    endFrequency: 390,
    duration: 0.1,
    attack: 0.002,
    level: 0.72
  }
];

mkdirSync(OUTPUT_DIRECTORY, { recursive: true });

sounds.forEach((sound) => {
  const outputPath = resolve(OUTPUT_DIRECTORY, sound.file);
  const wav = renderSquareSweep(sound);
  writeFileSync(outputPath, wav);
  console.log(`Generated ${sound.file}`);
});

function renderSquareSweep({ startFrequency, endFrequency, duration, attack, level }) {
  const sampleCount = Math.ceil(duration * SAMPLE_RATE);
  const pcm = new Int16Array(sampleCount);
  let phase = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const progress = Math.min(1, time / duration);
    const frequency = startFrequency * Math.pow(endFrequency / startFrequency, progress);
    phase = (phase + frequency / SAMPLE_RATE) % 1;

    const attackEnvelope = attack > 0 ? Math.min(1, time / attack) : 1;
    const decayEnvelope = Math.pow(0.0001, progress);
    const endFade = Math.min(1, Math.max(0, (duration - time) / 0.004));
    const envelope = level * attackEnvelope * decayEnvelope * endFade;
    const sample = phase < 0.5 ? 1 : -1;
    pcm[index] = Math.round(sample * envelope * 32767);
  }

  return encodePcmWav(pcm, SAMPLE_RATE);
}

function encodePcmWav(samples, sampleRate) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(samples[index], 44 + index * bytesPerSample);
  }

  return buffer;
}
