# 이모님 부동산 매물 관리앱

## Overview
마포구 상가/건물 매물을 네이버에서 자동 수집하고, 자기 매물도 등록/관리할 수 있는 웹앱.

## Tech Stack
- Frontend: Next.js 14 (App Router) + React 18 + Base Web (Uber UI)
- Database: Supabase PostgreSQL
- Scraping: Python (네이버 부동산 내부 API)
- Scheduler: GitHub Actions (daily cron)
- Deploy: Vercel (frontend) + GitHub Actions (scraping)
- Language: TypeScript (frontend), Python (scraping)

## Directory Structure
```
src/
  types/          # 공통 타입 정의 (Listing, ListingFilter)
  lib/            # Layer 1: 인프라 (DB, Scraper 인터페이스 + 구현체)
    db/           # ListingRepository 인터페이스 + Supabase 구현
    scraper/      # PropertyScraper 인터페이스 + 네이버 API 구현
  services/       # Layer 2: 비즈니스 로직 (검색, CRUD, 크롤링 작업)
  app/            # Layer 3: UI (Next.js App Router 페이지)
    search/       # 매물 검색 페이지
    my-listings/  # 내 매물 관리
    detail/[id]/  # 매물 상세
  components/     # 공통 UI 컴포넌트
scripts/          # 크롤링 스크립트 (GitHub Actions용)
supabase/         # DB 마이그레이션 SQL
```

## Dependency Rules
```
types <- lib <- services <- app
```
- app → services만 호출
- services → lib 인터페이스만 호출
- lib → types만 참조

## Context Injection Rules
- DB/data changes → docs/architecture.md
- External service integration → docs/architecture.md
- UI changes → docs/product-spec.md
- New feature → docs/product-spec.md + docs/architecture.md
- Everything else → this file is sufficient

## Change Risk Classification
See docs/blast-radius.md.
- Core: user confirmation required before changes
- Shell: proceed autonomously if tests pass

## Work Rules
- This project's user is a non-developer. Do not communicate with code/diffs/technical terms
- Describe change results as "behavior the user sees"
- Technical decisions are made autonomously by the agent and recorded in docs/decisions/
- Only ask the user about product/business decisions
