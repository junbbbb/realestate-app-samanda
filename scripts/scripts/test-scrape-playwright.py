#!/usr/bin/env python3
"""네이버 부동산 마포구 크롤링 - Playwright 직접 사용"""

import json
import time
import os
import re
import random
from datetime import datetime
from playwright.sync_api import sync_playwright

TARGET = 100
MAPO_CORTAR_NO = "1144000000"

def parse_price(price_str):
    if not price_str:
        return 0
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
        "area": article.get("area2", 0),
        "description": article.get("articleFeatureDesc", ""),
        "naverArticleNo": article.get("articleNo"),
        "realEstateTypeName": real_estate_type,
        "tradeTypeName": trade_type_name,
        "floorInfo": floor_info,
        "scrapedAt": datetime.now().isoformat(),
    }

def main():
    all_listings = []
    
    print(f"=== Playwright 크롤링 시작 ===")
    print(f"시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"목표: {TARGET}건\n")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            locale="ko-KR",
        )
        page = context.new_page()
        
        # 먼저 메인 페이지 방문해서 쿠키 획득
        print("메인 페이지 방문 (쿠키 획득)...")
        page.goto("https://new.land.naver.com/offices?ms=37.5547,126.9218,16&a=SG")
        page.wait_for_timeout(3000)
        print("쿠키 획득 완료.\n")
        
        for real_estate_type, type_name in [("SG", "상가"), ("DDDGG", "건물")]:
            print(f"--- {type_name} ({real_estate_type}) ---")
            pg = 1
            type_count = 0
            
            while len(all_listings) < TARGET:
                url = (f"https://new.land.naver.com/api/articles"
                       f"?cortarNo={MAPO_CORTAR_NO}"
                       f"&realEstateType={real_estate_type}"
                       f"&tradeType=&tag=::::::::"
                       f"&rentPriceMin=0&rentPriceMax=900000000"
                       f"&priceMin=0&priceMax=900000000"
                       f"&areaMin=0&areaMax=900000000"
                       f"&showArticle=false&sameAddressGroup=true"
                       f"&priceType=RETAIL&page={pg}&type=list&order=rank")
                
                print(f"  페이지 {pg}...")
                
                try:
                    response = page.evaluate(f"""
                        async () => {{
                            const res = await fetch("{url}", {{
                                headers: {{
                                    "Accept": "application/json",
                                }},
                                credentials: "include"
                            }});
                            return {{
                                status: res.status,
                                body: await res.text()
                            }};
                        }}
                    """)
                    
                    status = response["status"]
                    body = response["body"]
                    print(f"  HTTP {status}")
                    
                    if status == 429:
                        print(f"  Rate limited. 15초 대기...")
                        time.sleep(15)
                        continue
                    
                    if status != 200:
                        print(f"  에러: {body[:200]}")
                        break
                    
                    data = json.loads(body)
                    articles = data.get("articleList", [])
                    
                    if not articles:
                        print(f"  결과 없음.")
                        break
                    
                    for article in articles:
                        all_listings.append(map_article(article))
                        type_count += 1
                    
                    print(f"  -> {len(articles)}건 (누적: {len(all_listings)}건)")
                    
                except Exception as e:
                    print(f"  에러: {e}")
                    break
                
                if len(all_listings) >= TARGET:
                    break
                
                pg += 1
                delay = random.uniform(3, 5)
                print(f"  {delay:.1f}초 대기...")
                time.sleep(delay)
            
            print(f"  {type_name} 소계: {type_count}건\n")
            if len(all_listings) >= TARGET:
                break
            time.sleep(3)
        
        browser.close()
    
    all_listings = all_listings[:TARGET]
    
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
    print(f"상가: {len(stores)} / 건물: {len(buildings)}")
    
    if all_listings:
        print(f"\n--- 샘플 3건 ---")
        for i, l in enumerate(all_listings[:3]):
            print(f"{i+1}. [{l['realEstateTypeName']}] [{l['tradeTypeName']}] {l['address']} {l.get('addressDetail','')}")
            print(f"   {l['priceRaw']} / {l['area']}㎡ / 층: {l.get('floorInfo','N/A')}")

if __name__ == "__main__":
    main()
