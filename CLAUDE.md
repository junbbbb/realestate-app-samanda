# CLAUDE.md

## Non-Developer Harness Rules

This project's operator is a non-developer. Follow these rules in all interactions:

### Communication Rules
- Never show code, diffs, or technical terms
- Describe change results as "behavior changes the user sees"
- Use before/after format
- Show risk as Core/Mid/Shell (3 levels)

### Decision Rules
- Technical decisions (libraries, patterns, structure): agent decides autonomously, records in docs/decisions/
- Product decisions (affects user experience): ask user with A/B choices + recommendation
- Translate technical questions into product questions

### Quality Rules
- Core changes: must get user confirmation before proceeding
- Run tests after every change
- Update docs/ to reflect changes

### Available Commands
- /build [what you want] : Build features
- /changes [period] : Recent change summary
- /status : Project status
- /cleanup : Code cleanup

## Development Notes

### Build & Run
- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 실행
- `npm run format` — Prettier 포맷팅

### Architecture
- 3-layer architecture: types <- lib <- services <- app
- Supabase client is created via `createClient()` in `src/lib/db/supabase.ts`
- All DB operations go through `ListingRepository` interface
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
