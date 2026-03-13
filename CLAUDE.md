# CLAUDE.md — rehab-track

You are a **builder and coordinator of AI developers**, not a passive code generator.

This file is the **entrypoint** for how to work in this repo. It defines **guardrails + success criteria** (not micromanagement).

If you need deeper guidance, see the reference docs listed below.

---

## Core Philosophy

- Optimize for **correctness > safety > clarity > speed**
- Prefer **simple, obvious solutions**
- Make changes future agents can understand
- When unsure, **verify — never guess**

---

## Repo Scope (Hard Boundaries)

### This app OWNS
- User profile + injury management
- Workout plan generation and storage
- Active workout session logging (sets, reps, weight, RPE, pain)
- Rehab protocol display and milestone tracking
- Progress analytics and body metrics
- Exercise library (local pool + WGER API)
- Injury engine (safety evaluation, flagging, progression rules)
- Weekly report emails (SES)
- Pain spike alerts (SNS)

### This app DOES NOT OWN
- Medical records or clinical documentation
- Prescription or medication management (Wegovy data is user-reported only)
- Physical therapist portals or clinical workflows
- Nutrition tracking or meal planning
- Gym facility APIs or equipment integrations

### Cross-Service Rule
- WGER exercise API is read-only. Never write to it.
- Bedrock/Lambda plan adaptation always filters output through `injuryEngine.ts` before returning to client.
- Never bypass the injury engine to render an exercise directly to the user.

---

## Priority Order (When Tradeoffs Exist)

1. Data integrity
2. Deployment safety (Amplify)
3. Clear architecture
4. Reuse existing patterns
5. Developer convenience

---

## 🚫 Hard Constraint: Amplify/CloudFormation Resource Limit (Non-Negotiable)

We must **never** hit the Amplify/CloudFormation resource limit (~500 resources).

**Key rule:** Avoid backend changes that create many new cloud resources.

### What causes resource explosions
- Adding many new models/relationships/indexes in `amplify/data/resource.ts`
- Introducing multiple DynamoDB tables
- Adding backend features that create more resources (extra functions, storage, etc.)
- Repeated "nice-to-have" schema growth without a resource budget

### Required behavior
- Treat schema changes as **resource-budgeted** work.
- Prefer **minimal schema growth** and **reusing existing models**.
- If a task requires schema/backend changes: read `/docs/ai/amplify-resource-budget.md` first.
- If you suspect a change could meaningfully increase resources: stop and escalate with alternatives.

---

## ⚠️ Critical Infrastructure — Human Approval Required

**Amplify Gen 2 is fragile.** Breaking it can cost hours.

Before changing Amplify/infra, read:
- `/AMPLIFY_GEN2_GUIDELINES.md`
- `/docs/ai/amplify-ts-gotchas.md`

### NEVER modify without explicit human approval:
- `amplify.yml`
- `amplify/` (backend IaC)
- `package.json` dependencies or scripts
- `tsconfig.json`
- Root `*.config.*`
- `.env*`

If a task appears to require touching these:
- Pause
- Explain the tradeoff
- Propose alternatives
- Ask for approval

---

## Auth + Data Fetching (Critical)

Most common failure: **"No federated jwt"** from fetching before auth is ready.

Follow:
- `/docs/ai/auth-data-fetching.md`

Key rules:
- Never call Amplify Data before auth is ready
- Do NOT add `force-dynamic` to `"use client"` pages
- API routes must use cookies-based server client utilities (never raw `generateClient()`)

---

## Amplify + TypeScript Rules (Build Safety)

Follow:
- `/docs/ai/amplify-ts-gotchas.md`

Key rules:
- Schema source of truth: `amplify/data/resource.ts`
- Fields are often nullable; map `undefined → null` for UI types
- Never guess schema fields or enum values
- Dynamic Amplify filters may require casting (`as any`) when types are overly strict

---

## Injury Engine Rules (Non-Negotiable)

The injury engine is the most critical piece of logic in this app.

- **Source of truth:** `src/lib/injuryEngine.ts`
- **Never inline safety logic in components** — always import from `injuryEngine.ts`
- **Every exercise must pass `evaluateExerciseSafety()` before rendering to the user**
- Bedrock Lambda output is not exempt — filter it through the engine before returning
- Injury stage changes (1→2→3→4) must update `ActiveInjury` in DynamoDB, not just local state
- Pain levels ≥ 7 pre-session must trigger `shouldFlagSession()` — never suppress this check

---

## Shared Types Contract

- **Source of truth:** `src/types/index.ts`
- All agents read from here. Never define types locally that belong in this file.
- If a type is missing, add it to `index.ts` and note it in your commit message.
- Never duplicate `InjuryContext`, `SafetyResult`, `PlannedExercise`, or `ActiveSession` types anywhere else.

---

## Parallel Agent Workflow Rules

Follow:
- `/docs/ai/parallel-workflow.md`
- `/docs/ai/patterns.md`

Summary:
- One task = one concern
- Avoid broad refactors and file-wide formatting
- Prefer additive changes over rewrites
- Preserve stable interfaces
- Respect the file ownership map in `/docs/ai/parallel-workflow.md`

---

## Testing Environment

**All testing is done on the live production site (Amplify-hosted), not locally.**
`npm run dev` does not work reliably with Amplify Gen 2. Do not suggest or rely on local dev server testing. Verify changes by pushing to a branch and testing on the deployed site.

**Exception:** `src/lib/` (injury engine, workout generator, progression rules) is pure TypeScript and must have Vitest unit tests. These run locally and in CI. Always run tests before PRing logic changes.

---

## How to Work

- Keep changes small and scoped
- Match existing patterns in `components/`
- Avoid new dependencies unless necessary
- Do not edit `node_modules`

---

## Pre-PR Checklist

Always run:
- `npm run lint`
- `npm test`
- `npm run build`

If schema/auth changed:
- `npx ampx sandbox`

If injury engine changed:
- `npx vitest run src/lib/`

---

## Allowed Commands (Safe Defaults)

- `npm run dev`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx tsc --noEmit`
- `npx ampx sandbox` (schema/auth only)
- `npx vitest run src/lib/` (injury engine unit tests)

---

## Task Execution Contract

Work only from `docs/tasks/*.md`.

- Pick ONE task
- Mark it `in_progress`
- Implement + run the commands listed in the task
- Update the task file with:
  - What changed
  - Commands run
  - Follow-ups
- Mark it `done`

If blocked:
- Mark it `blocked`
- State exact blocker + proposed next step

See `/docs/tasks/README.md`.

---

## Definition of Success

A change is successful when:
- It builds cleanly
- It respects repo boundaries
- It doesn't risk Amplify infra
- It matches existing patterns
- The injury engine is not bypassed
- Another agent can continue easily

---

## Reference Index (Agent Jump Table)

- `/docs/architecture.md` — system overview + agent ownership map
- `/docs/ai/README.md` — what to read when
- `/docs/ai/philosophy.md` — builder mindset + autonomy
- `/docs/ai/patterns.md` — delegation + parallelization patterns
- `/docs/ai/parallel-workflow.md` — conflict-minimizing team workflow + file ownership map
- `/docs/ai/quality-security.md` — quality/security red flags
- `/docs/ai/amplify-ts-gotchas.md` — Amplify/TS build failure traps
- `/docs/ai/auth-data-fetching.md` — auth-first fetching patterns
- `/docs/ai/amplify-resource-budget.md` — preventing CloudFormation 500-limit blowups
- `/docs/rehab/INJURY_ENGINE_OVERVIEW.md` — injury engine design, stage rules, flagging logic
- `/docs/rehab/EXERCISE_POOL.md` — exercise library structure, contraindication tagging
