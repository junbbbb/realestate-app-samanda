# Architecture

## System Overview
마포구 부동산 매물 관리 웹앱. 네이버 부동산에서 매물을 자동 수집하고, 직접 매물을 등록/관리할 수 있다.

## Components

### Frontend (Next.js App Router)
- Vercel에 배포
- Base Web (Uber UI) 컴포넌트 사용
- 4개 주요 페이지: 대시보드, 매물 검색, 내 매물, 매물 상세

### Database (Supabase PostgreSQL)
- `listings` 테이블: 모든 매물 데이터 (네이버 수집 + 직접 등록)
- `scrape_logs` 테이블: 크롤링 실행 기록

### Scraping (Python + GitHub Actions)
- 매일 새벽 4시(KST) GitHub Actions로 실행
- 네이버 부동산 내부 API 호출하여 마포구 매물 수집
- Supabase에 저장 (중복 체크: naverArticleNo 기준)

## Data Flow
1. GitHub Actions → Python script → 네이버 API → Supabase DB
2. User → Next.js Frontend → Supabase DB (검색/조회)
3. User → Next.js Frontend → Supabase DB (매물 등록/수정/삭제)

## External Dependencies
- Supabase: PostgreSQL 호스팅 + REST API
- 네이버 부동산 API: `new.land.naver.com/api/articles`
- Vercel: 프론트엔드 호스팅
- GitHub Actions: 크롤링 스케줄러

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_URL`: (크롤링 스크립트용) Supabase URL
- `SUPABASE_KEY`: (크롤링 스크립트용) Supabase service key
