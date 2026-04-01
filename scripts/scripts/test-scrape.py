#!/usr/bin/env python3
"""네이버 부동산 마포구 상가/건물 크롤링 테스트 - 100건 목표, 로컬 JSON 저장"""

import requests
import json
import time
import os
from datetime import datetime

NAVER_API_BASE = "https://new.land.naver.com/api"
MAPO_CORTAR_NO = "1144000000"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://new.land.naver.com/",
}

def parse_price(price_str):
    """가격 문자열 파싱 (예: '1억 5000' -> 15000)"""
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

def fetch_listings(real_estate_type, page=1):
    """네이버 부동산 API에서 매물 가져오기"""
    params = {
        "cortarNo": MAPO_CORTAR_NO,
        "realEstateType": real_estate_type,
        "tradeType": "",
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
    response = requests.get(url, params=params, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"  ERROR: HTTP {response.status_code}")
        return []
    
    data = response.json()
    return data.get("articleList", [])

def map_article(article):
    """네이버 API 응답을 우리 형식으로 변환"""
    real_estate_type = article.get("realEstateTypeName", "")
    listing_type = "building" if "건물" in real_estate_type else "store"
    
    trade_type_name = article.get("tradeTypeName", "")
    trade_type = "sale" if "매매" in trade_type_name else "lease"
    
    price_str = article.get("dealOrWarrantPrc", "0")
    price = parse_price(price_str)
    
    floor = None
    total_floors = None
    floor_info = article.get("floorInfo", "")
    if floor_info and "/" in floor_info:
        parts = floor_info.split("/")
        try:
            floor = int(parts[0])
        except:
            pass
        try:
            total_floors = int(parts[1])
        except:
            pass
    
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
    
    print(f"=== 네이버 부동산 마포구 크롤링 시작 (목표: {target}건) ===")
    print(f"시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 상가(SG) + 건물(DDDGG) 둘 다 크롤링
    for real_estate_type, type_name in [("SG", "상가"), ("DDDGG", "건물")]:
        print(f"--- {type_name} ({real_estate_type}) 크롤링 ---")
        page = 1
        type_count = 0
        
        while len(all_listings) < target:
            print(f"  페이지 {page} 요청 중...")
            articles = fetch_listings(real_estate_type, page)
            
            if not articles:
                print(f"  페이지 {page}: 결과 없음. 종료.")
                break
            
            for article in articles:
                listing = map_article(article)
                all_listings.append(listing)
                type_count += 1
            
            print(f"  페이지 {page}: {len(articles)}건 수집 (누적: {len(all_listings)}건)")
            
            if len(all_listings) >= target:
                break
            
            page += 1
            time.sleep(2)  # 2초 딜레이
        
        print(f"  {type_name} 총 {type_count}건 수집")
        print()
        
        if len(all_listings) >= target:
            break
    
    # 100건으로 자르기
    all_listings = all_listings[:target]
    
    # 로컬 JSON 저장
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "test-scrape-result.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "scrapedAt": datetime.now().isoformat(),
            "totalCount": len(all_listings),
            "region": "마포구",
            "types": ["상가", "건물"],
            "listings": all_listings,
        }, f, ensure_ascii=False, indent=2)
    
    print(f"=== 크롤링 완료 ===")
    print(f"총 {len(all_listings)}건 수집")
    print(f"저장: {output_path}")
    print()
    
    # 요약 통계
    stores = [l for l in all_listings if l["type"] == "store"]
    buildings = [l for l in all_listings if l["type"] == "building"]
    sales = [l for l in all_listings if l["tradeType"] == "sale"]
    leases = [l for l in all_listings if l["tradeType"] == "lease"]
    with_floor = [l for l in all_listings if l.get("floor") is not None]
    
    print(f"--- 통계 ---")
    print(f"상가: {len(stores)}건 / 건물: {len(buildings)}건")
    print(f"매매: {len(sales)}건 / 임대: {len(leases)}건")
    print(f"층수 정보 있음: {len(with_floor)}건")
    
    if all_listings:
        print(f"\n--- 샘플 (첫 3건) ---")
        for i, l in enumerate(all_listings[:3]):
            print(f"{i+1}. [{l['type']}] [{l['tradeType']}] {l['address']} {l.get('addressDetail', '')}")
            print(f"   가격: {l['priceRaw']} ({l['price']}만원) / 면적: {l['area']}㎡ / 층: {l.get('floorInfo', 'N/A')}")
            print()

if __name__ == "__main__":
    main()
