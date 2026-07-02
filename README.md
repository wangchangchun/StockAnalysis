# GetStock — 台股即時股價查詢

透過台灣證券交易所（TWSE）公開即時報價 API 查詢股票現價，不需要 API key。

## 檔案

- `get_stock.py` — 主程式
- `requirements.txt` — 依賴套件（只有 `requests`）

## 本機執行

```bash
pip install -r requirements.txt
python get_stock.py 2330 2317 0050
python get_stock.py 2330 --loop 5   # 每 5 秒刷新一次
```

## 遠端執行（不需開啟本機電腦）

目標：手機或任何裝置上，透過 Claude 直接叫這份 code 在雲端跑，不依賴你家裡那台電腦開機。

### 步驟 1：把這個資料夾 push 到 GitHub

```bash
cd /path/to/GetStock
git init
git add get_stock.py requirements.txt README.md
git commit -m "Add TWSE realtime stock price script"
git branch -M main
git remote add origin https://github.com/<your-username>/get-stock.git
git push -u origin main
```

（`<your-username>` 換成你的 GitHub 帳號，repo 名稱可自訂，先在 GitHub 網站上建立好空的 repo。）

### 步驟 2：改用 Claude Code Web 或手機 Claude app

- 網頁版：打開 [claude.ai/code](https://claude.ai/code)，連接你的 GitHub 帳號，選擇 `get-stock` 這個 repo 開一個新 session。
- 手機版：Claude app 若支援連接 Claude Code / GitHub repo，一樣選這個 repo 開 session。

這種入口的程式執行是跑在 Anthropic 的雲端沙盒環境，跟你本機電腦完全無關 — 電腦關機也能用。

### 步驟 3：隨時查詢

在雲端 session 裡直接跟 Claude 說，例如：

> 幫我查一下 2330 和 0050 現在的股價

Claude 會自動：
1. `pip install -r requirements.txt`
2. `python get_stock.py 2330 0050`
3. 把結果整理回覆給你

因為雲端沙盒每次都是全新環境（沒有持久化狀態），每次會重新安裝依賴，但這支腳本很輕量，幾秒內就能跑完。

## 注意事項

- 即時成交價只有在台股交易時段（平日 09:00–13:30）才有效，非交易時間會顯示最近一次收盤資料。
- 這是非官方公開端點，僅供個人查詢使用，請勿高頻率大量請求，以免被限流或封鎖。
