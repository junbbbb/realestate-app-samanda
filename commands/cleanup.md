Checks codebase quality and performs automatic cleanup.
Shared principle from both Anthropic and OpenAI harness design: pay down technical debt continuously in small increments.

---

## Procedure

### 1. Scan

Read blast-radius.md to identify Core/Mid/Shell classification, then check for:

- Unused code (imports, variables, functions, files)
- Duplicate patterns (same logic in multiple places)
- Discrepancies between docs/ and actual code
- Whether blast-radius.md classification still matches current code
- Core-area code without tests
- Linter/formatter violations
- Security issues: hardcoded passwords/API keys/tokens in code, .env files tracked by git, protected routes accessible without authentication

### 2. Auto-Fix (Shell Area Only)

Issues in Shell-classified areas are auto-fixed without user confirmation:
- Remove unused code
- Fix formatting/lint violations
- Consolidate duplicate code
- Add missing tests

### 3. Report Core/Mid Issues

Core/Mid area issues are reported only, not auto-fixed:

```
Auto-cleanup complete:
  - [What was cleaned — non-technical description]

Items needing attention:
  - [Core/Mid issue — non-technical description + user impact]
  - To fix: /build [specific request sentence]
```

### 4. Update Documentation

- Update docs/quality.md to current state
- Update docs/architecture.md if it no longer matches the code
- Update blast-radius.md if classifications have changed

### 5. Results Report

```
Cleanup complete

Auto-fixed:
  - [What was cleaned, non-technical description]

Current state:
  - Overall quality: [good/fair/needs attention]
  - [Additional note if needed, one line]

Recommendations:
  - [If any, in /build-ready format]
```

## Rules

- Auto-fix Shell area only. Never auto-fix Core/Mid
- After fixes, always run tests to verify existing features still work
- Never show code, diffs, or filenames to the user
- OpenAI principle: "technical debt is like a high-interest loan — pay it down continuously"
- Anthropic principle: "Find the simplest solution possible" — no excessive cleanup/refactoring
- Record any technical decisions discovered during cleanup in docs/decisions/
