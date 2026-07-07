/** 和弦性質分類 */
export type ChordQuality =
  | "major"
  | "minor"
  | "power"
  | "dominant7"
  | "major7"
  | "minor7"
  | "sus2"
  | "sus4";

export type PositionType = "open" | "barre" | "movable";

/** 每弦按壓資訊：琴格數（0 = 空弦），"x" = 悶音不彈。索引 0 = 第六弦（低音 E）。 */
export type FretValue = number | "x";

export interface Barre {
  fret: number;
  /** 封閉起始弦（6 = 低音 E） */
  fromString: number;
  /** 封閉結束弦（1 = 高音 E） */
  toString: number;
}

export interface ChordShape {
  id: string;
  /** 顯示名稱，例如 "Am7" */
  chordName: string;
  quality: ChordQuality;
  positionType: PositionType;
  /** 六條弦的按法，索引 0 = 第六弦（低音 E） */
  frets: FretValue[];
  /** 對應每弦使用的手指（1=食指 2=中指 3=無名指 4=小指），空弦或悶音為 null */
  fingers: (number | null)[];
  barre?: Barre;
  /** 補充說明（選填） */
  note?: string;
}

/** 標準調弦各弦空弦 MIDI 音高：E2 A2 D3 G3 B3 E4 */
export const STANDARD_TUNING_MIDI = [40, 45, 50, 55, 59, 64] as const;

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export function midiToNoteName(midi: number): string {
  return NOTE_NAMES[midi % 12];
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 由和弦按法算出實際發聲的 MIDI 音高（由低音弦到高音弦） */
export function chordMidiNotes(shape: ChordShape): number[] {
  const notes: number[] = [];
  shape.frets.forEach((fret, i) => {
    if (fret === "x") return;
    notes.push(STANDARD_TUNING_MIDI[i] + fret);
  });
  return notes;
}

/** 和弦組成音名（去除重複、保留由低到高首次出現順序） */
export function chordNoteNames(shape: ChordShape): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const midi of chordMidiNotes(shape)) {
    const name = midiToNoteName(midi);
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

export const QUALITY_LABELS: Record<ChordQuality, string> = {
  major: "大三和弦",
  minor: "小三和弦",
  power: "強力和弦",
  dominant7: "屬七和弦",
  major7: "大七和弦",
  minor7: "小七和弦",
  sus2: "掛留二和弦",
  sus4: "掛留四和弦",
};
