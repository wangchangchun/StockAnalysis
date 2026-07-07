import { useMemo, useState } from "react";
import { CHORDS } from "../data/chords";
import type { ChordShape } from "../types/music";
import { QUALITY_LABELS, chordNoteNames } from "../types/music";
import { playChord } from "../audio/audioEngine";
import { ChordDiagram } from "../components/fretboard/ChordDiagram";

type FilterId =
  | "all"
  | "major"
  | "minor"
  | "power"
  | "seventh"
  | "sus"
  | "barre";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "major", label: "大三和弦" },
  { id: "minor", label: "小三和弦" },
  { id: "power", label: "強力和弦" },
  { id: "seventh", label: "七和弦" },
  { id: "sus", label: "掛留和弦" },
  { id: "barre", label: "封閉和弦" },
];

function matchesFilter(chord: ChordShape, filter: FilterId): boolean {
  switch (filter) {
    case "all":
      return true;
    case "seventh":
      return ["dominant7", "major7", "minor7"].includes(chord.quality);
    case "sus":
      return chord.quality === "sus2" || chord.quality === "sus4";
    case "barre":
      return chord.positionType === "barre";
    default:
      return chord.quality === filter;
  }
}

const POSITION_LABELS: Record<ChordShape["positionType"], string> = {
  open: "開放把位",
  barre: "封閉和弦",
  movable: "可移動手型",
};

export function ChordLibraryPage() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<ChordShape>(CHORDS[0]);

  const visibleChords = useMemo(
    () => CHORDS.filter((c) => matchesFilter(c, filter)),
    [filter],
  );

  const selectAndPlay = (chord: ChordShape) => {
    setSelected(chord);
    playChord(chord, "strum");
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* 左側：篩選 + 和弦卡片格 */}
      <div className="flex-1">
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visibleChords.map((chord) => (
            <button
              key={chord.id}
              onClick={() => selectAndPlay(chord)}
              className={`group flex flex-col items-center rounded-xl border p-3 transition-colors ${
                selected.id === chord.id
                  ? "border-amber-500 bg-slate-800/80"
                  : "border-slate-800 bg-slate-900 hover:border-slate-600"
              }`}
            >
              <span className="mb-1 text-lg font-bold text-slate-100">
                {chord.chordName}
              </span>
              <span className="mb-2 text-xs text-slate-400">
                {QUALITY_LABELS[chord.quality]}
              </span>
              <ChordDiagram shape={chord} width={110} />
            </button>
          ))}
        </div>

        {visibleChords.length === 0 && (
          <p className="mt-8 text-center text-slate-400">此分類目前沒有和弦。</p>
        )}
      </div>

      {/* 右側：選中和弦詳細資訊 */}
      <aside className="w-full shrink-0 lg:w-80">
        <div className="sticky top-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-1 flex items-baseline gap-3">
            <h2 className="text-3xl font-extrabold text-amber-400">
              {selected.chordName}
            </h2>
            <span className="text-sm text-slate-400">
              {QUALITY_LABELS[selected.quality]}
            </span>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            {POSITION_LABELS[selected.positionType]}
          </p>

          <div className="mb-4 flex justify-center">
            <ChordDiagram shape={selected} width={200} />
          </div>

          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-300">組成音</h3>
            <div className="flex flex-wrap gap-1.5">
              {chordNoteNames(selected).map((name) => (
                <span
                  key={name}
                  className="rounded-md bg-slate-800 px-2 py-0.5 text-sm font-mono text-amber-300"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {selected.note && (
            <p className="mb-4 rounded-lg bg-slate-800/60 p-3 text-sm leading-relaxed text-slate-300">
              {selected.note}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => playChord(selected, "strum")}
              className="flex-1 rounded-lg bg-amber-500 py-2 font-semibold text-slate-950 transition-colors hover:bg-amber-400"
            >
              ♪ 刷弦
            </button>
            <button
              onClick={() => playChord(selected, "arpeggio")}
              className="flex-1 rounded-lg bg-slate-700 py-2 font-semibold text-slate-100 transition-colors hover:bg-slate-600"
            >
              ♪ 分解
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            手指編號：1 食指 · 2 中指 · 3 無名指 · 4 小指
          </p>
        </div>
      </aside>
    </div>
  );
}
