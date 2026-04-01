Initializes an agent-driven development environment for non-developers.

## Procedure

### 1. Analyze Project

Analyze the current directory's codebase.
- Identify tech stack, frameworks, languages
- Check existing documentation, configuration, test structure
- If the project is empty, ask the user: "What product do you want to build? Describe it in a sentence or two."
  - After receiving the answer, the agent selects an appropriate tech stack and generates initial scaffolding
  - Prefer "boring technology" when choosing: stable, well-represented in agent training data, APIs that rarely change. Avoid cutting-edge/experimental tech. OpenAI principle: "boring technologies are easier for agents to model due to composability, API stability, and representation in the training set"

### 2. Create AGENTS.md (project root, under 100 lines)

```markdown
# [Project Name]

## Overview
[What this project is in 1-2 sentences]

## Tech Stack
[Technologies in use. Agent auto-writes after code analysis]

## Directory Structure
[Key directories and their roles. Agent auto-writes]

## Context Injection Rules
Documents to read based on task type:
- DB/data changes → docs/architecture.md
- External service integration → docs/architecture.md
- UI changes → docs/product-spec.md
- New feature → docs/product-spec.md + docs/architecture.md
- Everything else → this file is sufficient

## Change Risk Classification
See docs/blast-radius.md. Behavior changes based on risk level:
- Core: user confirmation required before changes
- Shell: proceed autonomously if tests pass

## Work Rules
- This project's user is a non-developer. Do not communicate with code/diffs/technical terms
- Describe change results as "behavior the user sees"
- Technical decisions are made autonomously by the agent and recorded in docs/decisions/
- Only ask the user about product/business decisions
```

### 3. Create docs/ Directory

```
docs/
  architecture.md      <- System structure (agent auto-generates from code analysis)
  product-spec.md      <- Product specification (written by asking the user questions)
  blast-radius.md      <- Change risk classification
  quality.md           <- Quality status tracking
  decisions/
    index.md           <- Technical decision log index
  plans/               <- Stage-by-stage progress for large tasks (auto-created by /build)
```

Writing rules per file:

**architecture.md**: Auto-generated from code analysis. Describes major components, data flows, external dependencies in text (no diagrams).

**product-spec.md**: Written by asking the user:
- "Who uses this product?"
- "What do users do with this product?"
- "What are the 3 most important features?"
Ask one question at a time. Provide choices when possible.

**blast-radius.md**: Auto-classified from codebase analysis:
- Core (user confirmation required): DB schema, auth/permissions, payments, external API contracts, deployment/infra config, data models
- Mid (notify user on test failure): business logic, routing, state management
- Shell (proceed autonomously if tests pass): UI components, styles, utilities, docs, tests
Classification is based on directory/file patterns, described concretely.

**quality.md**: Starts as empty template. Auto-updated after /build runs.

### 4. Install Standard Linter/Formatter

Auto-install standard linters for the tech stack. Do not create custom rules.
OpenAI principle: "Documentation alone doesn't keep a codebase coherent" — enforce rules with code.

Stack defaults:
- JavaScript/TypeScript → ESLint + Prettier (default recommended ruleset)
- Python → Ruff (default ruleset)
- Other → most widely used linter for that language

After installation:
- Generate linter config file at project root
- Add lint/format scripts to package.json or pyproject.toml
- Run once to verify existing code passes (auto-fix if it fails)

### 5. Create or Update CLAUDE.md (project root)

If CLAUDE.md exists, add the section below. Otherwise create new:

```markdown
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
```

### 6. Completion Report

Report without technical terms:

```
Project environment is ready.

[Project Name] is [one-line description].

What's been set up:
- Created a map for the agent to reference while working
- Created a space to record important decisions
- Classified which parts are critical and which are less so

Available commands:
  /build [what you want]  - Build or modify features
  /changes                - See recent changes
  /status                 - View overall status
  /cleanup                - Clean up code
```

## Principles (Based on Anthropic + OpenAI Harness Design)

- Repository is the source of truth (OpenAI): all knowledge version-controlled in repo
- Progressive disclosure (OpenAI): AGENTS.md is table of contents, details in docs/
- Context injection rules (Anthropic): load only necessary docs per task type
- Mechanical enforcement (both): enforce rules via code/config, not documentation
- Minimum complexity (Anthropic): "Find the simplest solution possible, and only increase complexity when needed"
