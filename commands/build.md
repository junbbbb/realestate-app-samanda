Takes a natural language request and runs the full development loop (design → implement → verify → report).

Request: $ARGUMENTS

---

## Phase 1: Understand (Planner)

1. Read AGENTS.md to understand project context
2. Follow AGENTS.md context injection rules to read relevant docs/ files
3. Read blast-radius.md to assess the risk level of areas this task will affect
4. Expand the user's request into a concrete product spec

First, assess the request's scope:

### Large Request Detection
If 2 or more of the following are true, classify as large:
- Contains 3+ independent features
- Requires changes across both Core and Shell areas
- Requires 3+ new pages/screens

If large, automatically split into stages:
```
This is a large task. I'll work through it in stages:

Stage 1: [Most foundational feature]
Stage 2: [Feature that builds on stage 1]
Stage 3: [Final feature]

Shall I start with stage 1?
```
Each stage runs as an independent Phase 1-5 loop.
Progress is recorded in docs/plans/ (stage, status, completion).
If the user says "just do it all at once," proceed without splitting.

### Small Requests: Spec confirmation based on blast-radius

#### Shell Changes (simple UI fixes, styling, text, etc.)
Proceed directly to Phase 2 without user confirmation.
Request is clear and easily reversible — confirmation is waste.

#### Mid/Core Changes or New Features
Show the expanded spec to the user in non-technical terms:

```
Here's what I'll build:

- [Behavior change the user will see 1]
- [Behavior change the user will see 2]
- [Behavior change the user will see 3]

Shall I proceed? Let me know if you'd like to add or remove anything.
```

**Only proceed to Phase 2 after user confirmation.**

If AGENTS.md or docs/ don't exist: "Project environment isn't set up yet. Please run /harness-init first."

## Phase 2: Implement (Generator)

1. If git is initialized, create a working branch
2. Implement the feature
3. Run existing tests and write new ones as needed
4. Run linter/formatter if configured
5. If a Core-classified file needs changing:
   - Pause implementation and ask the user via a product question
   - e.g.: "I need to change how user data is stored. Which approach works for you: [A] or [B]?"

## Phase 3: Verify (Evaluator)

Adjust verification depth based on blast-radius:

### Shell (UI fixes, style changes, text edits — simple changes)
Lightweight verification only:
1. Linter/formatter passes
2. Run existing tests (if any)
3. Build succeeds
If all pass, proceed to Phase 4. No app boot, spec check, or repair loop needed.

### Mid (business logic, routing, etc.)
Standard verification:
1. Lint/test/build check
2. Verify changed functionality matches spec
3. Boot the app and verify key routes by requesting responses
   (e.g.: API change → curl request/response check, page change → dev server boot + access check)
4. If insufficient, self-fix once then re-verify

### Core (DB, auth, external APIs, etc.) — Separated Evaluator
Separate the Generator (main session) from the Evaluator (sub-agent).
Anthropic principle: "Self-evaluation of own code produces positive bias."

**Step 1: Generator completes implementation**
- Passes lint/test/build
- Prepares list of changed files and Phase 1 spec

**Step 2: Invoke a separate sub-agent (Agent tool) as Evaluator**
Pass the following to the sub-agent:
- Expanded spec from Phase 1 (checklist)
- List of changed file paths
- blast-radius.md

Sub-agent prompt core:
```
You are the QA lead. You are verifying code written by a different agent.
Do not be lenient. Do not rationalize.

For each item in the spec:
1. Read the code and verify it is actually implemented
2. Check edge cases (empty values, invalid input, unauthorized access)
3. Check if changes affect existing functionality
4. Run tests and report results
5. Boot the app and directly request key routes to verify behavior
   - Start dev server, check API responses via curl/fetch
   - Access pages and verify HTML response contains expected elements
   - Verify protected routes reject unauthenticated access

Pay special attention to these anti-patterns:
- Hollow implementation: UI exists but no actual data storage/retrieval
- Hardcoding: values that should be dynamic are fixed in code
- Missing routes: feature in spec but no actual access path
- Swallowed errors: invalid input silently passes through
- Security holes: protected routes accessible without auth, passwords/API keys exposed in code

Grade each item PASS/FAIL. If FAIL, state the specific reason.
Never use phrases like "probably fine" or "not a big deal."
```

**Step 3: Branch based on Evaluator results**
- All PASS → proceed to Phase 4
- Any FAIL → Generator (main session) fixes FAIL items → re-run Step 2
- Same item FAIL twice in a row → report to user non-technically:
  "This part isn't working as intended and needs your input: [user impact description]"

Do not report technical issues to the user (except for double-FAIL escalation).

## Phase 4: Report

Never show code, diffs, or filenames.

Report format adjusts based on blast-radius:

### Shell Changes — Brief Report
```
Done. [What changed in one line]
```
No further explanation needed. User can check directly.

### Mid/Core Changes — Detailed Report
```
Done.

Before: [behavior the user previously experienced]
After: [behavior the user will now experience]

Risk level: [highest of Core/Mid/Shell]
Tests: [pass/fail]

Try it out and let me know if anything needs changing.
```

On test failure: explain user impact, not technical cause.
e.g.: "Login works fine, but password reset email isn't sending yet."

If the app was booted and verified, include those results in natural language.

## Phase 5: Feedback

When the user gives natural language feedback:

1. If feedback is clear: immediately repeat Phase 2-4
2. If feedback is ambiguous: ask a follow-up as choices (max 2):
   ```
   Quick question:

   [A] [option description]
   [B] [option description]
   ```
3. After applying feedback, report again using Phase 4 format

## Technical Decision Rules

Agent decides autonomously (do not ask the user):
- Library/framework selection
- File structure, naming
- Design patterns, error handling approach
- Performance optimization methods
- Testing strategy
Record autonomous decisions in docs/decisions/ (title, options, reason in one line).

Must ask the user (product/business judgment only):
- Only decisions that directly affect user experience
- Always use this format:
  ```
  [1-2 line situation description]

  [A] [option — described from user's perspective]
  [B] [option — described from user's perspective]

  Recommended: [A or B] ([reason in one line])
  ```

## After Completion

- Update docs/quality.md (reflect this feature's status)
- Update docs/architecture.md if structural changes occurred
- If git is available, commit changes (agent writes commit message)
- If a working branch was used, merge to main and delete the branch (non-developers cannot manage branches — auto-cleanup)

## Core Principles

- The user is a non-developer. They only judge "is this what I wanted?" Provide only the information needed for that judgment
- Run the Anthropic Planner-Generator-Evaluator pipeline, but separate the Evaluator into a sub-agent for Core changes (prevents self-evaluation bias)
- Follow OpenAI's "humans steer, agents execute" principle
- Maximize technical autonomy, but always delegate product decisions to the user
- Minimize response cost: ask questions in formats the user can answer in 5 seconds
- When the same type of failure repeats, don't fix the code — improve the environment (add linter rules, strengthen tests, update docs/). OpenAI principle: "the fix was almost never 'try harder' — ask what capability is missing"
