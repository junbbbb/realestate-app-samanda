"""
매일 새벽 4시(KST) GitHub Actions에서 실행되는 크롤링 스크립트.
네이버 부동산 내부 API로 마포구 상가/건물 매물을 수집하여 Supabase에 저장.
"""

import os
import sys
import time
import json
import requests
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

NAVER_API_BASE = "https://new.land.naver.com/api"
MAPO_CORTAR_NO = "1144000000"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://new.land.naver.com/",
}

# 상가(SG), 건물(DDDGG)
REAL_ESTATE_TYPES = ["SG", "DDDGG"]


def fetch_naver_listings(real_estate_type: str, max_pages: int = 5) -> list[dict]:
    """네이버 부동산 API에서 매물 목록 조회"""
    all_articles = []

    for page in range(1, max_pages + 1):
        params = {
            "cortarNo": MAPO_CORTAR_NO,
            "realEstateType": real_estate_type,
            "tradeType": "",
            "page": str(page),
            "sameAddressGroup": "true",
        }

        url = f"{NAVER_API_BASE}/articles"
        try:
            resp = requests.get(url, params=params, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            articles = data.get("articleList", [])

            if not articles:
                break

            all_articles.extend(articles)
            print(f"  Page {page}: {len(articles)} articles")

            if page < max_pages:
                time.sleep(2)

        except Exception as e:
            print(f"  Error on page {page}: {e}")
            break

    return all_articles


def parse_price(price_str: str) -> int:
    """가격 문자열을 만원 단위 정수로 변환"""
    if not price_str:
        return 0

    cleaned = price_str.strip()
    total = 0

    if "억" in cleaned:
        parts = cleaned.split("억")
        eok = int(parts[0].strip().replace(",", "")) if parts[0].strip() else 0
        total += eok * 10000
        remaining = parts[1].strip().replace(",", "").replace("만", "") if len(parts) > 1 else ""
        if remaining and remaining.isdigit():
            total += int(remaining)
    else:
        digits = cleaned.replace(",", "").replace("만", "")
        if digits.isdigit():
            total = int(digits)

    return total


def map_article(article: dict) -> dict:
    """네이버 API 응답을 DB 스키마에 맞게 변환"""
    real_estate_type = article.get("realEstateTypeName", "")
    prop_type = "building" if "건물" in real_estate_type else "store"

    trade_type_name = article.get("tradeTypeName", "")
    trade_type = "sale" if "매매" in trade_type_name else "lease"

    price = parse_price(article.get("dealOrWarrantPrc", "0"))

    floor_info = article.get("floorInfo", "")
    floor_val = None
    total_floors = None
    if floor_info and "/" in floor_info:
        parts = floor_info.split("/")
        try:
            floor_val = int(parts[0])
        except ValueError:
            pass
        try:
            total_floors = int(parts[1])
        except ValueError:
            pass

    now = datetime.now(timezone.utc).isoformat()

    return {
        "source": "naver",
        "type": prop_type,
        "trade_type": trade_type,
        "address": article.get("cortarAddress", article.get("articleName", "")),
        "address_detail": article.get("detailAddress") or article.get("buildingName"),
        "floor": floor_val,
        "total_floors": total_floors or article.get("totalFloorCnt"),
        "price": price,
        "deposit": price if trade_type == "lease" else None,
        "monthly_rent": article.get("rentPrc"),
        "area": article.get("area2", 0),
        "description": article.get("articleFeatureDesc"),
        "images": [article["representImgUrl"]] if article.get("representImgUrl") else [],
        "status": "active",
        "naver_article_no": str(article.get("articleNo", "")),
        "scraped_at": now,
        "created_at": now,
        "updated_at": now,
    }


def save_to_supabase(listings: list[dict]) -> int:
    """Supabase에 매물 데이터 upsert"""
    if not listings:
        return 0

    url = f"{SUPABASE_URL}/rest/v1/listings"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    # Batch in groups of 50
    saved = 0
    batch_size = 50
    for i in range(0, len(listings), batch_size):
        batch = listings[i : i + batch_size]
        try:
            resp = requests.post(
                url,
                headers=headers,
                data=json.dumps(batch, default=str),
                params={"on_conflict": "naver_article_no"},
                timeout=30,
            )
            if resp.status_code in (200, 201):
                saved += len(batch)
                print(f"  Saved batch {i // batch_size + 1}: {len(batch)} listings")
            else:
                print(f"  Error saving batch: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"  Error saving batch: {e}")

    return saved


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set")
        sys.exit(1)

    print(f"=== Daily Scrape Started at {datetime.now(timezone.utc).isoformat()} ===")

    all_listings = []

    for re_type in REAL_ESTATE_TYPES:
        type_name = "상가" if re_type == "SG" else "건물"
        print(f"\nFetching {type_name} ({re_type})...")

        articles = fetch_naver_listings(re_type)
        print(f"  Found {len(articles)} articles")

        for article in articles:
            mapped = map_article(article)
            if mapped["naver_article_no"]:
                all_listings.append(mapped)

        time.sleep(2)

    print(f"\nTotal listings to save: {len(all_listings)}")
    saved = save_to_supabase(all_listings)
    print(f"Saved: {saved}")

    print(f"\n=== Daily Scrape Completed at {datetime.now(timezone.utc).isoformat()} ===")


if __name__ == "__main__":
    main()
