# 이모님 부동산 매물 관리앱 — MVP 개발 플랜

## 프로젝트 개요
이모님이 개인 부동산을 혼자 운영하면서 네이버 매물을 일일이 확인하는 불편함 해결.
마포구 상가/건물 매물을 자동 수집하고, 자기 매물도 등록/관리할 수 있는 웹앱.

## Tech Stack
- **프론트**: Next.js + React + Base Web (Uber UI)
- **DB**: Supabase PostgreSQL (무료)
- **크롤링**: Python (1차: 네이버 내부 API 직접 호출 / 2차: Scrapling fallback)
- **크롤링 스케줄러**: GitHub Actions (매일 새벽 4시 KST = UTC 19:00)
- **배포**: Vercel (프론트) + GitHub Actions (크롤링)
- **개발 도구**: Claude Code + harness-for-my-grandma 프레임워크

## 개발 프로세스
harness-for-my-grandma 프레임워크 사용:
1. /harness-init — 프로젝트 환경 세팅
2. /build — 기능별 설계→구현→검증→보고 루프
3. /status — 진행 상황 확인
4. /cleanup — 코드 품질 관리

## 코드 아키텍처 (3레이어 + 인터페이스)

```
src/
├── lib/                    # Layer 1: 인프라 (바꿔 끼울 수 있는 것들)
│   ├── db/
│   │   ├── index.ts        # ListingRepository 인터페이스 정의
│   │   └── supabase.ts     # Supabase 구현체
│   ├── scraper/
│   │   ├── index.ts        # PropertyScraper 인터페이스 정의
│   │   ├── naver-api.ts    # 1차: 네이버 내부 API 직접 호출
│   │   └── naver-scrapling.ts  # 2차: Scrapling fallback
│   └── auth/
│       └── index.ts        # 인증 (나중에 필요시)
│
├── services/               # Layer 2: 비즈니스 로직
│   ├── listing-search.ts   # 매물 검색 + 필터링 로직
│   ├── my-listing.ts       # 내 매물 CRUD 로직
│   └── scraper-job.ts      # 크롤링 작업 로직
│
├── app/                    # Layer 3: UI (Next.js App Router)
│   ├── page.tsx            # 대시보드 (홈)
│   ├── search/
│   │   └── page.tsx        # 매물 검색
│   ├── my-listings/
│   │   ├── page.tsx        # 내 매물 목록
│   │   └── new/
│   │       └── page.tsx    # 매물 등록
│   └── detail/
│       └── [id]/
│           └── page.tsx    # 매물 상세
│
├── types/                  # 공통 타입 정의
│   ├── listing.ts          # 매물 타입
│   └── filter.ts           # 필터 타입
│
└── scripts/                # 크롤링 스크립트 (GitHub Actions용)
    └── daily-scrape.ts     # 매일 새벽 4시 실행
```

### 의존성 규칙 (한 방향으로만)
```
types ← lib ← services ← app
         ↑ 인터페이스로만 의존
```
- app은 services만 호출
- services는 lib의 인터페이스만 호출 (구현체 직접 참조 X)
- lib은 types만 참조
- 구현체 교체 시 lib/ 내부만 변경, services/app 수정 불필요

## 핵심 인터페이스

### PropertyScraper (스크래퍼 인터페이스)
```typescript
interface PropertyScraper {
  fetchListings(filter: ListingFilter): Promise<Listing[]>
  fetchListingDetail(id: string): Promise<ListingDetail>
}
```

### ListingRepository (DB 인터페이스)
```typescript
interface ListingRepository {
  save(listing: Listing): Promise<void>
  saveBatch(listings: Listing[]): Promise<void>
  findByFilter(filter: ListingFilter): Promise<Listing[]>
  findById(id: string): Promise<Listing | null>
  delete(id: string): Promise<void>
  getNewListings(since: Date): Promise<Listing[]>
}
```

## 데이터 모델

### Listing (매물)
```typescript
interface Listing {
  id: string
  source: 'naver' | 'manual'       // 네이버 수집 or 직접 등록
  type: 'store' | 'building'        // 상가 | 건물
  tradeType: 'sale' | 'lease'       // 매매 | 임대
  address: string                    // 주소
  addressDetail?: string             // 상세주소
  floor?: number                     // 층수 ⭐
  totalFloors?: number               // 총 층수
  price: number                      // 가격 (만원)
  deposit?: number                   // 보증금 (임대 시)
  monthlyRent?: number               // 월세 (임대 시)
  area: number                       // 면적 (㎡)
  description?: string               // 설명
  images?: string[]                  // 사진 URL
  status: 'active' | 'contracted' | 'closed'  // 상태
  naverArticleNo?: string            // 네이버 매물 번호 (네이버 수집 시)
  scrapedAt?: Date                   // 수집 일시
  createdAt: Date
  updatedAt: Date
}
```

### ListingFilter (검색 필터)
```typescript
interface ListingFilter {
  type?: 'store' | 'building'
  tradeType?: 'sale' | 'lease'
  priceMin?: number
  priceMax?: number
  areaMin?: number
  areaMax?: number
  floor?: number                     // ⭐ 층별 검색
  floorMin?: number                  // ⭐ 층 범위 검색
  floorMax?: number
  keyword?: string                   // 주소/설명 검색
  source?: 'naver' | 'manual' | 'all'
  sortBy?: 'price' | 'area' | 'date' | 'floor'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}
```

## MVP 기능 상세

### 1. 대시보드 (홈)
- 오늘 새로 수집된 매물 수
- 내 등록 매물 현황 (활성/계약중/완료)
- 최근 수집 매물 미리보기 (5개)
- 마지막 크롤링 시간

### 2. 매물 검색
- 네이버 수집 매물 + 내 매물 통합 검색
- 필터링:
  - 유형: 상가 / 건물
  - 거래: 매매 / 임대
  - 가격 범위
  - 면적 범위
  - ⭐ 층별 검색 (특정 층 or 층 범위)
  - 키워드 (주소, 설명)
- 정렬: 가격순 / 면적순 / 최신순 / 층순
- 매물 카드: 주소, 가격, 면적, 층, 유형 한눈에
- 상세 보기: 전체 정보 + 네이버 원문 링크

### 3. 내 매물 관리
- 매물 등록 (주소, 가격, 면적, 층, 사진, 설명)
- 매물 수정
- 상태 변경 (활성 → 계약중 → 완료)
- 매물 삭제

### 4. 크롤링 자동화 (GitHub Actions)
- 매일 새벽 4시(KST) 실행
- 마포구 상가/건물 매물 수집
- Supabase에 저장 (중복 체크: naverArticleNo 기준)
- 새 매물 / 가격 변동 / 삭제된 매물 추적
- 실패 시 에러 로깅

## 크롤링 전략

### 1차: 네이버 내부 API
```
GET https://new.land.naver.com/api/articles
  ?cortarNo=1144000000          # 마포구
  &realEstateType=SG,DDDGG      # 상가, 건물
  &tradeType=                    # 전체 (매매+임대)
  &page=1
```
- User-Agent 헤더 필수
- 요청 간 2초 딜레이
- 하루 1회라 차단 위험 매우 낮음

### 2차: Scrapling (API 막히면)
```python
from scrapling import StealthyFetcher
page = StealthyFetcher().get('https://new.land.naver.com/...')
listings = page.find_all('.item_inner')
```
- Camoufox로 안티봇 우회
- 퍼지 매칭으로 구조 변경 적응

## GitHub Actions 크론잡
```yaml
# .github/workflows/daily-scrape.yml
name: Daily Scrape
on:
  schedule:
    - cron: '0 19 * * *'  # UTC 19:00 = KST 04:00
  workflow_dispatch:        # 수동 실행

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install requests supabase-py
      - run: python scripts/daily-scrape.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

## 페이지 구성 (UI)

### 하단/사이드 네비게이션
1. 대시보드 (홈)
2. 매물 검색
3. 내 매물
4. 설정

### UI 컴포넌트 (Base Web)
- Table: 매물 리스트
- Select: 필터 드롭다운
- Input: 가격/면적 범위, 키워드
- Card: 매물 카드
- Modal: 매물 상세, 등록/수정 폼
- Toast: 알림 (저장 완료, 에러 등)
- Tabs: 매매/임대 탭 전환

## 개발 순서

### Phase 1: 기반 (1일)
- [ ] harness-for-my-grandma /harness-init
- [ ] Next.js + Base Web 프로젝트 세팅
- [ ] Supabase DB 테이블 생성
- [ ] 3레이어 폴더 구조 + 인터페이스 정의
- [ ] 타입 정의

### Phase 2: 크롤링 (1일)
- [ ] 네이버 내부 API 호출 테스트
- [ ] (실패 시) Scrapling fallback 구현
- [ ] Supabase 저장 로직
- [ ] GitHub Actions 크론잡 설정

### Phase 3: 매물 검색 (1일)
- [ ] 검색 페이지 UI
- [ ] 필터링 로직 (유형, 거래, 가격, 면적, ⭐층)
- [ ] 정렬
- [ ] 매물 상세 페이지

### Phase 4: 내 매물 관리 (1일)
- [ ] 매물 등록 폼
- [ ] 매물 목록/수정/삭제
- [ ] 상태 변경
- [ ] 대시보드

### Phase 5: 마무리 (0.5일)
- [ ] 에러 처리
- [ ] 반응형 (모바일)
- [ ] Vercel 배포
- [ ] 이모님 테스트
