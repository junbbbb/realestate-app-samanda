#!/usr/bin/env python3
"""네이버 부동산 마포구 크롤링 - HTML 파싱 방식"""

import json
import time
import os
import re
from datetime import datetime
from playwright.sync_api import sync_playwright

TARGET = 100

def main():
    all_listings = []
    
    print(f"=== Playwright HTML 파싱 크롤링 ===")
    print(f"시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"목표: {TARGET}건\n")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            locale="ko-KR",
            viewport={"width": 1920, "height": 1080},
        )
        page = context.new_page()
        
        # 네이버 부동산 마포구 상가 페이지
        url = "https://new.land.naver.com/offices?ms=37.5547,126.9218,16&a=SG&b=A1&e=RETAIL&cortarNo=1144000000"
        
        print(f"페이지 로딩: {url}")
        page.goto(url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(5000)
        
        print("페이지 로드 완료. 네트워크 요청 가로채기 시작...\n")
        
        # 네트워크 요청을 가로채서 API 응답 캡처
        api_responses = []
        
        def handle_response(response):
            if "/api/articles" in response.url and response.status == 200:
                try:
                    body = response.json()
                    articles = body.get("articleList", [])
                    if articles:
                        api_responses.append(articles)
                        print(f"  API 응답 캡처: {len(articles)}건")
                except:
                    pass
        
        page.on("response", handle_response)
        
        # 지도를 마포구로 이동하고 매물 목록 로드
        # 지역을 선택해서 매물 로드 유도
        print("마포구 검색 중...")
        
        # 검색 시도
        try:
            search_input = page.locator('input[placeholder*="지역"]').first
            if search_input.is_visible():
                search_input.fill("마포구")
                page.wait_for_timeout(2000)
        except:
            pass
        
        # 매물 리스트가 로드될 때까지 스크롤
        print("매물 목록 스크롤 중...\n")
        
        for scroll_count in range(20):
            # 매물 리스트 영역 스크롤
            page.evaluate("window.scrollBy(0, 500)")
            page.wait_for_timeout(1000)
            
            # item_list 영역 스크롤 시도
            try:
                page.evaluate("""
                    const list = document.querySelector('.item_list') || 
                                 document.querySelector('[class*="article_list"]') ||
                                 document.querySelector('[class*="list_item"]');
                    if (list) list.scrollTop += 500;
                """)
            except:
                pass
            
            total_captured = sum(len(a) for a in api_responses)
            if total_captured >= TARGET:
                print(f"  {total_captured}건 캡처 완료!")
                break
            
            if scroll_count % 5 == 0:
                print(f"  스크롤 {scroll_count}... (캡처: {total_captured}건)")
        
        # API 응답에서 못 가져왔으면 HTML에서 직접 파싱
        total_from_api = sum(len(a) for a in api_responses)
        
        if total_from_api > 0:
            print(f"\nAPI 응답에서 총 {total_from_api}건 캡처됨.")
            for articles in api_responses:
                for article in articles:
                    real_estate_type = article.get("realEstateTypeName", "")
                    trade_type_name = article.get("tradeTypeName", "")
                    all_listings.append({
                        "source": "naver",
                        "type": "building" if "건물" in real_estate_type else "store",
                        "tradeType": "sale" if "매매" in trade_type_name else "lease",
                        "address": article.get("cortarAddress", "") or article.get("articleName", ""),
                        "addressDetail": article.get("detailAddress", "") or article.get("buildingName", ""),
                        "floor": None,
                        "price": 0,
                        "priceRaw": article.get("dealOrWarrantPrc", ""),
                        "area": article.get("area2", 0),
                        "description": article.get("articleFeatureDesc", ""),
                        "naverArticleNo": article.get("articleNo"),
                        "realEstateTypeName": real_estate_type,
                        "tradeTypeName": trade_type_name,
                        "floorInfo": article.get("floorInfo", ""),
                        "scrapedAt": datetime.now().isoformat(),
                    })
        else:
            print("\nAPI 캡처 실패. HTML에서 직접 파싱 시도...")
            
            # HTML 저장 (디버깅용)
            html = page.content()
            debug_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "debug-page.html")
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"디버그 HTML 저장: {debug_path}")
            
            # 스크린샷
            screenshot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "debug-screenshot.png")
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"스크린샷 저장: {screenshot_path}")
        
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
    
    print(f"\n=== 완료: {len(all_listings)}건 ===")
    print(f"저장: {output_path}")
    
    if all_listings:
        print(f"\n--- 샘플 3건 ---")
        for i, l in enumerate(all_listings[:3]):
            print(f"{i+1}. [{l.get('realEstateTypeName','')}] [{l.get('tradeTypeName','')}] {l['address']}")
            print(f"   {l.get('priceRaw','')} / {l.get('area',0)}㎡ / 층: {l.get('floorInfo','N/A')}")

if __name__ == "__main__":
    main()
