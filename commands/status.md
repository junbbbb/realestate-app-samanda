Reports overall project status in a form non-developers can understand.

---

## Procedure

1. Analyze project code (whether major features work)
2. Reference docs/quality.md if available
3. Reference docs/product-spec.md if available to assess progress against spec
4. If docs/plans/ has in-progress staged work, include current progress
5. Check recent git history for activity trends
6. Run tests to check current pass status

## Output Format

```
[Project Name] Status

Working features
  - [Feature name]: OK
  - [Feature name]: OK

Needs attention
  - [Non-technical description if any]

Issues found
  - [If any: what's wrong and how it affects the user]

Overall completion: [approximate progress against product-spec.md]

Recommended next steps:
  1. [Most valuable next task — in a form directly usable as /build input]
  2. [Next after that]
```

## Rules

- Translate technical indicators into non-technical language:
  - "Low test coverage" → "Some features lack safety checks"
  - "Technical debt accumulating" → "Internal cleanup is needed. Things work fine now, but adding features may get slower over time"
  - "Dependency vulnerability" → "External tools in use need a security update"
- Recommended tasks should be sentences the user can directly use as "/build [content]"
- Use status indicators (OK / needs attention / issue) rather than numbers for intuitive communication
- If product-spec.md doesn't exist, omit the completion section
- If tests can't run, judge from code analysis only and note that limitation
