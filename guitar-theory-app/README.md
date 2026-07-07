# 🎸 搖滾吉他樂理教室

圖形化的搖滾吉他樂理學習 App。目前完成 Phase 1（和弦圖鑑）：

- 43 組常用和弦：開放和弦、強力和弦（Power Chords）、封閉和弦（Barre Chords）、七和弦、掛留和弦
- SVG 指板圖：手指編號、空弦/悶音標記、封閉橫按、高把位起始格標示
- 點擊即發聲：Karplus-Strong 弦振動合成，支援刷弦與分解和弦兩種播放方式，無需載入音色檔
- 分類篩選 + 和弦詳細面板（組成音、把位類型、練習提示）

完整規劃見 [PLAN.md](./PLAN.md)。

## 開發

```bash
npm install
npm run dev       # 開發伺服器
npm run build     # 型別檢查 + 產出 dist/
npm run preview   # 預覽建置結果
```

技術棧：React 18 + TypeScript + Vite + Tailwind CSS v4 + Web Audio API。

## 後續路線

- Phase 2：和弦切換動畫、音階教學（指板高亮）、節拍器、歌曲和弦進行資料庫
- Phase 3：聽力測驗、自訂練習清單、Tauri/Capacitor 打包
