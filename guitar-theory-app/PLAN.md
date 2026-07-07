# 搖滾吉他樂理學習 App — 專案規劃

## 1. 專案目標

打造一個圖形化、互動式的網頁 App，幫助使用者學習搖滾吉他的和弦按法、和弦變化（轉位/切換）、音階與樂理知識，並透過歌曲資料庫與音效回饋強化練習效果。

核心功能（依使用者需求）：
1. **和弦圖鑑 + 按法動畫** — 指板圖、手指位置動畫、和弦間轉換教學
2. **音階與樂理教學** — 五聲音階、藍調音階、調式(Modes)、和弦進行理論
3. **歌曲/進行資料庫** — 常見搖滾歌曲的和弦進行範例
4. **互動練習與音效回饋** — 點擊播放和弦音效、節拍器、簡易練習模式

---

## 2. 技術選型與理由

### 2.1 為什麼選 Web，而不是 C++/C#

| 面向 | C++ (Qt/Dear ImGui) | C# (WPF/Avalonia) | Web (React + TS) |
|---|---|---|---|
| 圖形化指板/和弦圖開發效率 | 低（需手刻繪圖與動畫框架） | 中 | **高**（SVG/Canvas + CSS 動畫生態成熟） |
| 音效播放（Web Audio API vs NAudio/OpenAL） | 需額外整合音訊庫 | 需額外整合 | **內建 Web Audio API，開箱即用** |
| 跨平台（桌面/手機/瀏覽器） | 需分別打包 | 需分別打包 | **一份程式碼，瀏覽器即可執行**，之後可用 Tauri/Capacitor 包成桌面/手機 App |
| 部署與分享 | 需安裝檔 | 需安裝檔 | **網址分享，免安裝** |
| 開發社群/元件庫（和弦圖、指板元件） | 少 | 少 | **多**（有現成開源和弦圖/指板套件可參考） |
| 效能需求（本專案不需要即時 DSP 分析） | 過剩 | 過剩 | 足夠 |

**結論**：本專案是「圖形化 + 互動 UI + 音效」導向，並非效能敏感的即時運算（例如即時麥克風音高偵測才需要考慮效能），Web 技術棧開發效率遠高於 C++/C#，因此建議採用 Web 技術。若未來需要包裝成「感覺像原生」的桌面 App，可用 **Tauri**（Rust 殼 + Web 前端，體積小、免 Chromium 全裝）或 **Electron** 二次封裝，不需重寫核心邏輯。

### 2.2 技術棧

- **框架**：React 18 + TypeScript + Vite（開發速度快、型別安全）
- **樣式**：Tailwind CSS
- **狀態管理**：Zustand（輕量，適合本專案規模）
- **指板/和弦圖繪製**：SVG（自繪元件，精確控制手指位置動畫），搭配 Framer Motion 做轉位動畫
- **音效播放**：Tone.js（基於 Web Audio API，方便播放取樣音色、節拍器排程）
- **音訊取樣**：可用免費吉他音色 sample（如 sf2/wav），或先用合成音（Karplus-Strong 弦振動模擬）作為 MVP
- **測試**：Vitest + React Testing Library
- **部署**：Vercel / Netlify（靜態網站，免後端）
- **未來擴充**：Tauri 打包桌面版；Capacitor 打包 iOS/Android

> 不需要後端伺服器 — 和弦/音階/歌曲資料以本地 JSON/TS 資料檔管理即可，減少維運成本。若之後要做使用者帳號、雲端進度同步，再考慮加入 Supabase 之類的 BaaS。

---

## 3. 核心資料模型

```typescript
// 和弦定義
interface ChordShape {
  id: string;              // e.g. "E-major-open"
  chordName: string;       // e.g. "E"
  quality: "major" | "minor" | "power" | "dominant7" | "major7" | "minor7" | "sus2" | "sus4" | "dim" | "aug";
  positionType: "open" | "barre" | "movable";
  rootFret: number;        // 起始琴衍位置（0 = 空弦區）
  frets: (number | "x")[]; // 6 弦各自按的琴格，"x" = 不彈
  fingers: (number | null)[]; // 對應每弦使用的手指 (1=食指...4=小指)
  barre?: { fret: number; fromString: number; toString: number };
}

// 音階定義
interface Scale {
  id: string;
  name: string;            // e.g. "A小調五聲音階"
  intervals: number[];     // 半音音程模式，e.g. [0,3,5,7,10]
  rootNote: string;
}

// 和弦進行 / 歌曲
interface Progression {
  id: string;
  title: string;
  artist?: string;
  genre: "rock" | "blues" | "punk" | "metal";
  key: string;
  chords: string[];        // 依序的和弦名稱，e.g. ["E","A","B","E"]
  bpm?: number;
}
```

資料檔規劃於 `src/data/chords.ts`、`src/data/scales.ts`、`src/data/progressions.ts`，方便日後擴充而不需改動元件邏輯。

---

## 4. 功能模組拆解

### 4.1 和弦圖鑑 + 按法動畫（MVP 核心）
- 指板 SVG 元件：畫出 6 弦 x N 格琴衍、品絲、和弦點
- 手指動畫：切換和弦時，手指從舊位置「滑動」到新位置（Framer Motion 過場動畫）
- 和弦分類瀏覽：大三和弦、小三和弦、Power Chord、七和弦、封閉和弦(Barre Chord)
- 「和弦轉換練習」模式：隨機出兩個和弦，動畫展示手指移動路徑，並可用節拍器測試切換速度

### 4.2 音階與樂理教學
- 指板上高亮顯示音階音符（五聲音階、小調音階、藍調音階、Ionian/Dorian/Mixolydian 等調式）
- 音階與常用和弦進行的對應關係圖解（例如 I-IV-V 和弦配對哪些可彈奏音階）
- 圖文教學頁：搖滾常用理論（Power Chord 結構、Blues 12小節進行、Pentatonic Box 1-5）

### 4.3 歌曲 / 進行資料庫
- 內建常見搖滾和弦進行範例（12 小節藍調、Punk I-IV-V、常見 Pop-Rock 進行如 I-V-vi-IV）
- 每個進行可一鍵播放節奏音效 + 顯示對應和弦圖示序列（跟著進行走動畫）
- 依 genre/key 篩選

### 4.4 互動練習與音效回饋
- 點擊和弦圖 → 播放對應和弦音效（分解和弦或刷弦音）
- 內建節拍器（可調 BPM，視覺 + 聲音提示）
- 「聽和弦猜名稱」小測驗模式（播放音效，使用者選擇對應和弦圖）
- （進階/Phase 3）若使用者裝置有麥克風權限，可用 pitch-detection（如 Pitchy.js）做簡易彈奏音高比對回饋，但不做為 MVP 必要功能

---

## 5. 資料夾結構規劃

```
guitar-theory-app/
├── PLAN.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/
    │   ├── fretboard/
    │   │   ├── ChordDiagram.tsx      # 單一和弦指板圖
    │   │   ├── Fretboard.tsx         # 全指板音階顯示
    │   │   └── FingerAnimation.tsx   # 和弦切換動畫
    │   ├── practice/
    │   │   ├── Metronome.tsx
    │   │   └── ChordQuiz.tsx
    │   └── layout/
    │       ├── NavBar.tsx
    │       └── PageLayout.tsx
    ├── pages/
    │   ├── ChordLibraryPage.tsx
    │   ├── ScaleTheoryPage.tsx
    │   ├── SongProgressionsPage.tsx
    │   └── PracticePage.tsx
    ├── data/
    │   ├── chords.ts
    │   ├── scales.ts
    │   └── progressions.ts
    ├── audio/
    │   └── audioEngine.ts            # Tone.js 封裝：播放和弦/節拍器
    ├── store/
    │   └── useAppStore.ts            # Zustand store
    └── types/
        └── music.ts                  # 上述資料模型型別定義
```

---

## 6. 開發路線圖 / 里程碑

**Phase 1 — MVP（可展示的核心體驗）** ✅ 已完成
- [x] 專案骨架建置（Vite + React + TS + Tailwind）
- [x] `ChordDiagram` SVG 元件（顯示單一和弦指板圖）
- [x] 和弦資料庫（涵蓋開放和弦、Power Chord、常用封閉和弦，共 43 組）
- [x] 和弦圖鑑瀏覽頁（分類篩選）
- [x] 點擊播放和弦音效（實作採自寫 Karplus-Strong 合成，零依賴、免音色檔；之後若需更真實音色再引入 Tone.js + 取樣）

**Phase 2 — 互動與動畫**
- [ ] 和弦切換動畫（FingerAnimation）
- [ ] 音階教學頁（指板音階高亮）
- [ ] 節拍器元件
- [ ] 歌曲/進行資料庫 + 播放跟弦動畫

**Phase 3 — 練習與擴充**
- [ ] 聽和弦猜名稱測驗模式
- [ ] 自訂練習清單（收藏和弦、自建歌曲進行）
- [ ] （選配）Tauri 打包桌面版 / Capacitor 打包行動版
- [ ] （選配）麥克風彈奏偵測回饋

---

## 7. 風險與備案

- **音色真實度**：合成音（Karplus-Strong）開發快但音色較假；真實吉他取樣音質好但檔案較大，需權衡載入時間。MVP 先用合成音，之後視情況換取樣包。
- **指板動畫效能**：大量 SVG 動畫在低階手機瀏覽器可能卡頓，需注意用 CSS transform 而非重繪 DOM，必要時改用 Canvas。
- **樂理內容正確性**：音階/調式/和弦資料需要仔細校對，建議建立資料驗證測試（例如驗證和弦音程是否符合其 quality 標示）。

---

## 8. 下一步

若確認此規劃方向，下一步可以：
1. 直接開始建置 Phase 1 專案骨架與 `ChordDiagram` 元件的程式碼
2. 或先設計視覺風格（配色、UI wireframe）再進入開發

請告訴我要往哪個方向繼續。
