# Change Risk Classification

## Core (user confirmation required)
- `supabase/` — DB 스키마, 마이그레이션
- `src/lib/db/` — DB 접근 로직
- `src/types/listing.ts` — 핵심 데이터 모델
- `.github/workflows/` — CI/CD 설정
- Environment variables / secrets

## Mid (notify user on test failure)
- `src/services/` — 비즈니스 로직
- `src/lib/scraper/` — 크롤링 로직
- `src/app/**/page.tsx` — 페이지 라우팅
- `scripts/` — 크롤링 스크립트

## Shell (proceed autonomously if tests pass)
- `src/components/` — UI 컴포넌트
- `src/app/**/layout.tsx` — 레이아웃
- Styles, utilities
- `docs/` — 문서
- Tests
