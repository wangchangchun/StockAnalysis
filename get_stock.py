"""
台股即時股價查詢工具

資料來源：台灣證券交易所（TWSE）與證券櫃買中心（TPEx）公開即時報價 API。
- 上市股票（如 2330 台積電）走 TWSE tse_ 前綴
- 上櫃股票（如 6446 藥華藥）走 TPEx otc_ 前綴

用法：
    python get_stock.py 2330 2317 0050
    python get_stock.py 2330 --loop 5      # 每 5 秒刷新一次

注意：
- 此 API 僅在台股交易時段（週一至週五 09:00-13:30，例假日除外）會回傳即時成交價，
  非交易時間會回傳最近一次收盤資訊。
- 這是非官方公開端點，僅供個人查詢使用，請勿高頻率大量請求。
"""

import sys
import time
import argparse
from datetime import datetime

import requests

TWSE_API = "https://mis.twse.com.tw/stock/api/getStockInfo.jsp"


def build_query_id(code: str) -> str:
    """判斷代號屬於上市(tse)或上櫃(otc)，組成查詢字串。"""
    # 簡單判斷：若查 tse 查不到，再嘗試 otc，這裡先兩者都組進去一起查
    return f"tse_{code}.tw|otc_{code}.tw"


def fetch_quotes(codes: list[str]) -> list[dict]:
    """一次查詢多檔股票即時報價，回傳整理後的資料列表。"""
    query = "|".join(build_query_id(c) for c in codes)
    params = {
        "ex_ch": query,
        "json": "1",
        "delay": "0",
    }
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://mis.twse.com.tw/stock/index.jsp",
    }

    resp = requests.get(TWSE_API, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    results = []
    seen_codes = set()
    for item in data.get("msgArray", []):
        code = item.get("c")
        if code in seen_codes:
            continue
        seen_codes.add(code)

        name = item.get("n")            # 股票名稱
        price = item.get("z")           # 最新成交價（'-' 表示尚無成交，改用參考價）
        if price in (None, "-", ""):
            price = item.get("y")       # 昨收價，作為備援
        open_price = item.get("o")      # 開盤價
        high = item.get("h")            # 最高價
        low = item.get("l")             # 最低價
        prev_close = item.get("y")      # 昨收價
        volume = item.get("v")          # 成交股數（單位：張需除以1000）
        update_time = item.get("t")     # 成交時間 (HH:MM:SS)
        update_date = item.get("d")     # 資料日期 (YYYYMMDD)

        change = None
        change_pct = None
        try:
            if price not in (None, "-", "") and prev_close not in (None, "-", ""):
                change = round(float(price) - float(prev_close), 2)
                change_pct = round(change / float(prev_close) * 100, 2)
        except (TypeError, ValueError):
            pass

        results.append({
            "code": code,
            "name": name,
            "price": price,
            "change": change,
            "change_pct": change_pct,
            "open": open_price,
            "high": high,
            "low": low,
            "prev_close": prev_close,
            "volume": volume,
            "date": update_date,
            "time": update_time,
        })

    return results


def print_quotes(quotes: list[dict]) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n查詢時間：{now}")
    print("-" * 78)
    header = f"{'代號':<6}{'名稱':<10}{'成交價':>8}{'漲跌':>8}{'漲跌%':>8}{'開盤':>8}{'最高':>8}{'最低':>8}"
    print(header)
    print("-" * 78)
    for q in quotes:
        price = q["price"] if q["price"] not in (None, "-", "") else "N/A"
        change = "N/A" if q["change"] is None else f"{q['change']:+.2f}"
        change_pct = "N/A" if q["change_pct"] is None else f"{q['change_pct']:+.2f}%"
        print(
            f"{q['code']:<6}{q['name']:<10}{str(price):>8}{change:>8}{change_pct:>8}"
            f"{str(q['open']):>8}{str(q['high']):>8}{str(q['low']):>8}"
        )
    print("-" * 78)


def main():
    parser = argparse.ArgumentParser(description="台股即時股價查詢")
    parser.add_argument("codes", nargs="+", help="股票代號，例如 2330 2317 0050")
    parser.add_argument("--loop", type=int, default=0, help="每隔幾秒重新查詢一次，0 表示只查一次")
    args = parser.parse_args()

    try:
        while True:
            quotes = fetch_quotes(args.codes)
            if not quotes:
                print("查無資料，請確認股票代號是否正確。")
            else:
                print_quotes(quotes)

            if args.loop <= 0:
                break
            time.sleep(args.loop)
    except requests.RequestException as e:
        print(f"查詢失敗，網路或 API 發生錯誤：{e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n已停止查詢。")


if __name__ == "__main__":
    main()
