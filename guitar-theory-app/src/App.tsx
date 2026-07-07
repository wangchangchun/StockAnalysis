import { ChordLibraryPage } from "./pages/ChordLibraryPage";

const NAV_ITEMS = [
  { id: "chords", label: "和弦圖鑑", ready: true },
  { id: "scales", label: "音階教學", ready: false },
  { id: "songs", label: "歌曲進行", ready: false },
  { id: "practice", label: "練習模式", ready: false },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
          <h1 className="text-xl font-extrabold tracking-tight">
            🎸 搖滾吉他<span className="text-amber-400">樂理教室</span>
          </h1>
          <nav className="flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <span
                key={item.id}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  item.ready
                    ? "bg-slate-800 text-amber-300"
                    : "cursor-not-allowed text-slate-600"
                }`}
                title={item.ready ? undefined : "即將推出"}
              >
                {item.label}
                {!item.ready && <span className="ml-1 text-[10px]">soon</span>}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <ChordLibraryPage />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-slate-600">
        點擊任一和弦卡片即可聆聽音效（Karplus-Strong 弦振動合成）。
      </footer>
    </div>
  );
}
