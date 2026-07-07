import type { ChordShape } from "../types/music";
import { chordMidiNotes, midiToFrequency } from "../types/music";

/**
 * 音效引擎：以 Karplus-Strong 弦振動模擬合成撥弦音，
 * 不需載入任何取樣檔即可發出接近吉他的撥弦聲。
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const bufferCache = new Map<number, AudioBuffer>();

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const compressor = ctx.createDynamicsCompressor();
    master.connect(compressor);
    compressor.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Karplus-Strong：雜訊爆發灌入延遲線，經低通平均回授衰減成弦音 */
function renderPluck(audioCtx: AudioContext, midi: number): AudioBuffer {
  const cached = bufferCache.get(midi);
  if (cached) return cached;

  const sampleRate = audioCtx.sampleRate;
  const freq = midiToFrequency(midi);
  const seconds = 3;
  const length = sampleRate * seconds;
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const out = buffer.getChannelData(0);

  const period = Math.max(2, Math.round(sampleRate / freq));
  const delayLine = new Float32Array(period);
  for (let i = 0; i < period; i++) {
    delayLine[i] = Math.random() * 2 - 1;
  }

  // 低音弦衰減慢、高音弦衰減快，聽感較接近真實吉他
  const damping = 0.994 + Math.min(0.005, (midi - 40) * 0.00012);
  let idx = 0;
  for (let i = 0; i < length; i++) {
    const current = delayLine[idx];
    const next = delayLine[(idx + 1) % period];
    delayLine[idx] = damping * 0.5 * (current + next);
    out[i] = current;
    idx = (idx + 1) % period;
  }

  bufferCache.set(midi, buffer);
  return buffer;
}

function playMidiAt(audioCtx: AudioContext, midi: number, when: number, gain = 0.3) {
  const source = audioCtx.createBufferSource();
  source.buffer = renderPluck(audioCtx, midi);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gain, when);
  source.connect(g);
  g.connect(master!);
  source.start(when);
}

/** 播放單音 */
export function playNote(midi: number) {
  const audioCtx = getContext();
  playMidiAt(audioCtx, midi, audioCtx.currentTime);
}

export type StrumStyle = "strum" | "arpeggio";

/** 播放整個和弦：strum = 快速刷弦、arpeggio = 分解和弦 */
export function playChord(shape: ChordShape, style: StrumStyle = "strum") {
  const audioCtx = getContext();
  const notes = chordMidiNotes(shape);
  const stagger = style === "strum" ? 0.045 : 0.28;
  const start = audioCtx.currentTime + 0.02;
  notes.forEach((midi, i) => {
    playMidiAt(audioCtx, midi, start + i * stagger, 0.28);
  });
}
