Summarizes recent changes in a form non-developers can understand.

Scope: $ARGUMENTS
(If empty, defaults to last 24 hours. Supports natural language: "this week", "last 3 days", "today", etc.)

---

## Procedure

1. Collect commits from git log for the specified period
2. Analyze changed files and commit messages
3. Group changes by feature
4. Reference blast-radius.md if available to assess risk

## Output Format

```
Changes during [period]:

New features
  - [What's new from the user's perspective]

Fixes
  - [What was fixed, from the user's perspective]

Improvements
  - [What got better, from the user's perspective]

Summary
  - Change scope: [small/medium/large]
  - Changes needing attention: [non-technical description if any, otherwise "none"]
```

If no changes: "No changes during this period."

## Rules

- Never use filenames, function names, variable names, or technical terms
- Never show code diffs
- Translate technical actions into user impact:
  - Refactoring → "Internal structure was reorganized to make future feature additions smoother"
  - Tests added → "Safety checks were added to prevent existing features from accidentally breaking"
  - Dependency update → "External tools in use were updated to their latest versions"
- Omit or condense changes that only matter internally (formatting, lint fixes, etc.)
- Prioritize changes the user can directly experience
