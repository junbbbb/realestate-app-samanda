#!/usr/bin/env python3
"""네이버 부동산 마포구 상가/건물 크롤링 테스트 v2 - 브라우저 헤더 강화"""

import requests
import json
import time
import os
import random
from datetime import datetime

NAVER_API_BASE = "https://new.land.naver.com/api"
MAPO_CORTAR_NO = "1144000000"

# 실제 브라우저 요청과 동일한 헤더
HEADERS = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "keep-alive",
    "Host": "new.land.naver.com",
    "Referer": "https://new.land.naver.com/offices?ms=37.5547,126.9218,16&a=SG&b=A1&e=RETAIL",
    "sec-ch-ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
}

def parse_price(price_str):
    if not price_str:
        return 0
    import re
    cleaned = re.sub(r'[^0-9억만]', '', price_str)
    total = 0
    eok = re.search(r'(\d+)억', cleaned)
    man = re.search(r'억?\s*(\d+)(?:만)?$', cleaned)
    if eok:
        total += int(eok.group(1)) * 10000
    if man:
        total += int(man.group(1))
    if total == 0:
        num_only = re.sub(r'[^0-9]', '', cleaned)
        if num_only:
            total = int(num_only)
    return total

def fetch_listings(real_estate_type, trade_type="", page=1):
    params = {
        "cortarNo": MAPO_CORTAR_NO,
        "realEstateType": real_estate_type,
        "tradeType": trade_type,
        "tag": "::::::::",
        "rentPriceMin": 0,
        "rentPriceMax": 900000000,
        "priceMin": 0,
        "priceMax": 900000000,
        "areaMin": 0,
        "areaMax": 900000000,
        "showArticle": "false",
        "sameAddressGroup": "true",
        "priceType": "RETAIL",
        "page": page,
        "type": "list",
        "order": "rank",
    }
    
    url = f"{NAVER_API_BASE}/articles"
    
    session = requests.Session()
    
    # 먼저 메인 페이지 방문해서 쿠키 획득
    if page == 1:
        try:
            session.get("https://new.land.naver.com/offices", headers={
                "User-Agent": HEADERS["User-Agent"],
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }, timeout=10)
            time.sleep(1)
        except:
            pass
    
    response = session.get(url, params=params, headers=HEADERS, timeout=15)
    
    print(f"  HTTP {response.status_code} (content-length: {len(response.content)})")
    
    if response.status_code == 429:
        print(f"  Rate limited. 10초 대기 후 재시도...")
        time.sleep(10)
        response = session.get(url, params=params, headers=HEADERS, timeout=15)
        print(f"  재시도 HTTP {response.status_code}")
    
    if response.status_code != 200:
        print(f"  응답 본문: {response.text[:200]}")
        return []
    
    data = response.json()
    return data.get("articleList", [])

def map_article(article):
    real_estate_type = article.get("realEstateTypeName", "")
    listing_type = "building" if "건물" in real_estate_type else "store"
    
    trade_type_name = article.get("tradeTypeName", "")
    trade_type = "sale" if "매매" in trade_type_name else "lease"
    
    price_str = article.get("dealOrWarrantPrc", "0")
    price = parse_price(price_str)
    
    floor = None
    total_floors = None
    floor_info = article.get("floorInfo", "")
    if floor_info and "/" in str(floor_info):
        parts = str(floor_info).split("/")
        try: floor = int(parts[0])
        except: pass
        try: total_floors = int(parts[1])
        except: pass
    
    return {
        "source": "naver",
        "type": listing_type,
        "tradeType": trade_type,
        "address": article.get("cortarAddress", "") or article.get("articleName", ""),
        "addressDetail": article.get("detailAddress", "") or article.get("buildingName", ""),
        "floor": floor,
        "totalFloors": total_floors or article.get("totalFloorCnt"),
        "price": price,
        "priceRaw": price_str,
        "deposit": price if trade_type == "lease" else None,
        "monthlyRent": article.get("rentPrc") if trade_type == "lease" else None,
        "area": article.get("area2", 0),
        "description": article.get("articleFeatureDesc", ""),
        "images": [article.get("representImgUrl")] if article.get("representImgUrl") else [],
        "status": "active",
        "naverArticleNo": article.get("articleNo"),
        "realEstateTypeName": real_estate_type,
        "tradeTypeName": trade_type_name,
        "floorInfo": floor_info,
        "scrapedAt": datetime.now().isoformat(),
    }

def main():
    all_listings = []
    target = 100
    
    print(f"=== 네이버 부동산 마포구 크롤링 테스트 v2 ===")
    print(f"시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"목표: {target}건")
    print()
    
    for real_estate_type, type_name in [("SG", "상가"), ("DDDGG", "건물")]:
        print(f"--- {type_name} ({real_estate_type}) ---")
        page = 1
        type_count = 0
        
        while len(all_listings) < target:
            print(f"  페이지 {page} 요청...")
            articles = fetch_listings(real_estate_type, page=page)
            
            if not articles:
                print(f"  결과 없음. 다음 유형으로.")
                break
            
            for article in articles:
                all_listings.append(map_article(article))
                type_count += 1
            
            print(f"  -> {len(articles)}건 수집 (누적: {len(all_listings)}건)")
            
            if len(all_listings) >= target:
                break
            
            page += 1
            delay = random.uniform(2, 4)
            print(f"  {delay:.1f}초 대기...")
            time.sleep(delay)
        
        print(f"  {type_name} 소계: {type_count}건\n")
        
        if len(all_listings) >= target:
            break
        
        time.sleep(3)
    
    all_listings = all_listings[:target]
    
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test-scrape-result.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "scrapedAt": datetime.now().isoformat(),
            "totalCount": len(all_listings),
            "region": "마포구",
            "listings": all_listings,
        }, f, ensure_ascii=False, indent=2)
    
    print(f"=== 완료: {len(all_listings)}건 ===")
    print(f"저장: {output_path}")
    
    stores = [l for l in all_listings if l["type"] == "store"]
    buildings = [l for l in all_listings if l["type"] == "building"]
    sales = [l for l in all_listings if l["tradeType"] == "sale"]
    leases = [l for l in all_listings if l["tradeType"] == "lease"]
    
    print(f"\n상가: {len(stores)} / 건물: {len(buildings)}")
    print(f"매매: {len(sales)} / 임대: {len(leases)}")
    
    if all_listings:
        print(f"\n--- 샘플 3건 ---")
        for i, l in enumerate(all_listings[:3]):
            print(f"{i+1}. [{l['realEstateTypeName']}] [{l['tradeTypeName']}] {l['address']} {l.get('addressDetail','')}")
            print(f"   {l['priceRaw']} / {l['area']}㎡ / 층: {l.get('floorInfo','N/A')}")

if __name__ == "__main__":
    main()
