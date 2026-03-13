# RehabTrack — Claude Code Parallel Build Plan

## App Context (read once, reference always)
- React 19 + Vite + AWS Amplify Gen 2 + AppSync + DynamoDB
- User: 45M, 220lbs, Wegovy, LA Fitness/Planet Fitness, stationary bike warm-up
- Injuries: Plantar Fasciitis (R foot, stages 1–4), Sprained Elbow (L, stages 1–4)
- Core constraint: **every exercise must pass injury engine before rendering to user**

---

## Parallel Execution Map

```
PHASE 0 (sequential — 1 agent)
  └── Bootstrap

PHASE 1 (sequential — 1 agent)
  └── Amplify schema + deploy

PHASE 2 (3 parallel agents after Phase 1 deploys)
  ├── AGENT A: App shell + routing + auth flow
  ├── AGENT B: Workout session UI + set logger
  └── AGENT C: Injury engine + workout generator (pure logic, no UI)

PHASE 3 (2 parallel agents after Phase 2)
  ├── AGENT D: Rehab dashboard + milestone tracker (needs Agent A shell + Agent C types)
  └── AGENT E: Progress charts + analytics (needs Agent A shell + DB data)

PHASE 4 (2 parallel agents after Phase 3)
  ├── AGENT F: Lambda (plan adaptation via Bedrock) + EventBridge alerts
  └── AGENT G: PWA config + offline sync + polish
```

**Shared contract file:** `src/types/index.ts` — all agents import from here. No agent defines its own types.

---

## Phase 0 — Bootstrap (1 agent, ~2hrs)

```bash
npm create amplify@latest rehab-track -- --template react
cd rehab-track
npx shadcn@latest init  # neutral theme, CSS variables, src/components/ui
npm i zustand @tanstack/react-query recharts framer-motion react-hook-form zod date-fns react-hot-toast vite-plugin-pwa
```

Create `src/types/index.ts` — this is the **shared contract**. All agents read this, none modify it after Phase 0 without coordinating.

```typescript
// src/types/index.ts
export type InjurySide = 'LEFT' | 'RIGHT' | 'BILATERAL';
export type InjuryStage = 1 | 2 | 3 | 4;
export type ExerciseSafety = 'SAFE' | 'MODIFIED' | 'AVOID' | 'FLAG_PAIN';
export type SessionType = 'UPPER_BODY' | 'LOWER_BODY' | 'FULL_BODY' | 'REHAB_FOCUSED' | 'CARDIO_ONLY' | 'ACTIVE_RECOVERY' | 'REST';
export type GymLocation = 'LA_FITNESS' | 'PLANET_FITNESS' | 'HOME' | 'OTHER';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type InjuryContext = {
  plantarFasciitis: { stage: InjuryStage; painLevel: number; side: 'RIGHT' };
  sprainedElbow: { stage: InjuryStage; painLevel: number; side: 'LEFT' };
};

export type SafetyResult = {
  safety: ExerciseSafety;
  reason?: string;
  modification?: string;
};

export type PlannedExercise = {
  id: string;
  name: string;
  category: 'WARMUP' | 'STRENGTH' | 'CARDIO' | 'REHAB' | 'STRETCH' | 'CORE' | 'COOLDOWN';
  muscles: string[];
  sets?: number;
  repsMin?: number;
  repsMax?: number;
  durationSec?: number;
  restSec: number;
  weightLbs?: number;
  rpeTarget?: number;
  formCues: string[];
  isRehab: boolean;
  safetyResult: SafetyResult;
  orderIndex: number;
  wgerId?: number;
};

export type ActiveSession = {
  sessionId: string;
  plannedSessionId?: string;
  startedAt: Date;
  gym: GymLocation;
  exercises: PlannedExercise[];
  currentExerciseIndex: number;
  completedExercises: CompletedExercise[];
  preSessionPain: number;
  preSessionEnergy: number;
};

export type CompletedExercise = {
  exerciseId: string;
  name: string;
  sets: CompletedSet[];
  painDuring: number;
  wasModified: boolean;
  modificationNote?: string;
  wasSkipped: boolean;
};

export type CompletedSet = {
  setNumber: number;
  reps?: number;
  weightLbs?: number;
  durationSec?: number;
  rpe: number;
  romPct?: number;  // range of motion %, key for elbow rehab tracking
  pain: number;
};

export type Milestone = {
  id: string;
  injuryType: 'PLANTAR_FASCIITIS' | 'SPRAINED_ELBOW';
  label: string;
  requiredStage: InjuryStage;
  unlocks: string;
  achieved: boolean;
  achievedAt?: Date;
};
```

Setup `amplify/backend.ts` wiring auth + data + storage + workoutEngine function stubs.

---

## Phase 1 — Amplify Schema (1 agent, after Phase 0)

Deploy the full schema. Key models only — Claude Code can infer field details from types above:

```
Models: UserProfile, ActiveInjury, InjuryRestriction, RehabMilestone,
        WorkoutPlan, PlannedSession, PlannedExercise (DB),
        WorkoutSession, CompletedExercise (DB), CompletedSet,
        BodyMetric, ProgressPhoto
```

**Critical schema rules:**
- Every model: `.authorization((allow) => [allow.owner()])`
- Foreign keys: use `a.string()` + `a.belongsTo()` / `a.hasMany()` pairs
- Store JSON arrays as `a.string()` (muscles, formCues, restrictions)
- `WorkoutSession.flaggedForReview` + `flagReason` — auto-set by injury engine
- `CompletedSet.romPct` — integer 0–100, tracks elbow ROM recovery over time

Run `npx ampx sandbox` to confirm schema deploys clean before releasing agents.

---

## Phase 2 — Parallel (3 agents simultaneously)

### Agent A: App Shell + Auth Flow
**Owns:** `src/app/`, `src/components/layout/`, routing, auth pages

Build:
- Root layout with Tailwind dark mode, theme provider
- React Router v7 routes: `/dashboard`, `/workout`, `/workout/active`, `/workout/history`, `/rehab`, `/rehab/:injuryId`, `/progress`, `/profile`
- `_authenticated.tsx` wrapper — redirect to `/login` if no Amplify session
- `AppShell.tsx` — sidebar desktop, bottom nav mobile (large 48px+ tap targets — user may have elbow pain)
- Auth pages: sign-in, sign-up, confirm email using Amplify UI `<Authenticator>`
- Onboarding flow (first login): capture weight, gym preference, injury info → write to `UserProfile` + 2 `ActiveInjury` records

**Do NOT build:** any workout logic, charts, or injury calculations. Those come from Agents B and C.

---

### Agent B: Workout Session UI
**Owns:** `src/components/workout/`, `src/hooks/useWorkoutSession.ts`, active session store

Build Zustand store first:
```typescript
// src/stores/sessionStore.ts
type SessionStore = {
  session: ActiveSession | null;
  startSession: (planned?: PlannedSession) => void;
  logSet: (exerciseId: string, set: CompletedSet) => void;
  skipExercise: (exerciseId: string, reason: string) => void;
  nextExercise: () => void;
  completeSession: (postPain: number, postEnergy: number, notes?: string) => Promise<void>;
  flagSession: (reason: string) => void;
};
```

Components (build in this order):
1. `PreSessionCheck.tsx` — pain level (0–10 slider) + energy (1–10) → calls `shouldFlagSession()` from injury engine → shows rest recommendation if flagged
2. `WorkoutSessionHeader.tsx` — exercise X of N, session type badge, elapsed time
3. `ExerciseCard.tsx` — name, injury warning banner (if MODIFIED/AVOID), sets/reps target, form cues carousel
4. `SetLogger.tsx` — reps stepper, weight input, RPE selector (1–10), pain slider per set, ROM% input (show only for elbow exercises)
5. `RestTimer.tsx` — countdown with +30s / skip, auto-advance on complete
6. `RPESelector.tsx` — visual 1–10 scale with descriptors
7. `WorkoutComplete.tsx` — post-session pain + energy, notes, session summary

**Import types from** `src/types/index.ts`. Import safety check from `src/lib/injuryEngine.ts` (Agent C delivers this — stub it with `() => ({ safety: 'SAFE' })` during dev).

---

### Agent C: Injury Engine + Workout Generator
**Owns:** `src/lib/injuryEngine.ts`, `src/lib/workoutGenerator.ts`, `src/lib/progressionRules.ts`, `src/data/exercisePool.ts`

This is pure TypeScript logic — no React, no Amplify calls. Fully unit testable.

**`injuryEngine.ts`** — export these functions:
```typescript
evaluateExerciseSafety(name: string, movements: string[], muscles: string[], ctx: InjuryContext): SafetyResult
shouldFlagSession(preSessionPain: number, preEnergy: number, recentSessions: {postPain: number}[]): { flag: boolean; reason: string }
getActiveRestrictions(ctx: InjuryContext): string[]  // human-readable list for UI
```

PF rules: Stage 1 = no impact + no standing. Stage 2 = seated variants only. Stage 3 = elliptical OK, limited standing. Stage 4 = full (arch support note).

Elbow rules: Stage 1 = no loaded elbow flex/ext, no grip, no push. Stage 2 = bands + neutral grip only. Stage 3 = bilateral pressing with 40% weight reduction. Stage 4 = full (avoid full lockout note).

Wegovy flag: if preEnergy ≤ 3 → flag for rest (GLP-1 fatigue). If postPain - prePain ≥ 2 for 3 sessions → trigger alert.

**`exercisePool.ts`** — static library of ~60 exercises tagged with `{ movements[], muscles[], contraindications[], equipment: ('LA_FITNESS' | 'PLANET_FITNESS')[], isRehab }`. Include the PF and elbow rehab protocols as exercise entries.

**`workoutGenerator.ts`** — `generateWeeklyPlan(profile, injuryContext, week: 1|2|3|4): DayPlan[]`
- Week 1: rehab-heavy, low training volume
- Week 2: add volume on cleared movements  
- Week 3: progressive overload on safe exercises
- Week 4: deload (60% volume), reassess injury stages

**`progressionRules.ts`** — double progression model: hit top of rep range all sets + RPE ≤ threshold → suggest weight increase. Threshold: stages 1–2 = RPE 7, stages 3–4 = RPE 8. Conservative increments (2.5lb DB, 5lb machine).

Write Vitest unit tests for all three files.

---

## Phase 3 — Parallel (2 agents, after Phase 2)

### Agent D: Rehab Dashboard
**Owns:** `src/app/routes/rehab/`, `src/components/rehab/`
**Reads from:** Agent A's shell, Agent C's engine functions, Amplify data models

Components:
- `InjuryStatusCard.tsx` — injury name, stage badge (1–4 color-coded), current pain, days since injury, "Update Stage" button
- `RecoveryStageGauge.tsx` — visual stage progression bar with what's unlocked at each stage
- `MilestoneTracker.tsx` — checklist of milestones for current stage, tap to mark achieved → updates `RehabMilestone` in DB, triggers stage evaluation
- `RehabProtocolCard.tsx` — today's prescribed stretches/ice/mobility work based on injury + stage (static lookup table, not AI)
- `PainTrendChart.tsx` — Recharts LineChart, pre/post session pain over last 30 days, alert banner if trending up

Milestone data lives in `src/data/milestones.ts` (static — Agent C can stub this or Agent D owns it):
- PF: 5 milestones across stages 1→4
- Elbow: 5 milestones across stages 1→4

---

### Agent E: Progress Analytics
**Owns:** `src/app/routes/progress/`, `src/components/progress/`
**Reads from:** Agent A's shell, Amplify session history data

Components (all use Recharts):
- `WeightTrendChart.tsx` — line chart + Wegovy start marker + expected loss band (0.5–1.5 lbs/wk) + alert if >2 lbs/wk lost
- `VolumeChart.tsx` — weekly sets per muscle group stacked bar, grayed weeks = injury acute
- `StrengthProgressChart.tsx` — working weight over time per exercise, regression flag if weight drops 2+ sessions
- `WorkoutHeatmap.tsx` — GitHub-style contribution grid: green=complete, yellow=modified, gray=rest, red=flagged
- `ProgressSummary.tsx` — top-level stats: total sessions, avg weekly volume, best lifts, active streak

TanStack Query hooks for all data fetching — cache for 5 min, invalidate on session complete.

---

## Phase 4 — Parallel (2 agents, after Phase 3)

### Agent F: Lambda + Notifications
**Owns:** `amplify/functions/`

`workoutEngine/handler.ts` — invoked from frontend to generate adapted plan:
- Input: userId, injuryContext, last 4 sessions summary, days available
- Calls Bedrock (claude-sonnet-4-20250514) with tight system prompt
- Returns JSON plan modifications only — no prose
- Hard limit: Bedrock output always filtered through `evaluateExerciseSafety()` before returning to client

`weeklyReport/handler.ts` — EventBridge trigger Sunday 8pm ET:
- Pull week's sessions from DynamoDB
- Compose summary (sessions done, pain trend, top lifts, next week preview)
- Send via SES

`painAlert/handler.ts` — EventBridge rule on DynamoDB stream:
- If `WorkoutSession.postSessionPainLevel` ≥ 8 → SNS push: "Pain spike detected — consider rest before next session"
- If 3 consecutive sessions postPain > prePain → SNS: "Pain trending up — recommend PT consultation"

---

### Agent G: PWA + Polish
**Owns:** `vite.config.ts`, service worker, performance, a11y

PWA setup: `vite-plugin-pwa` with `NetworkFirst` for AppSync calls, `CacheFirst` for exercise media. Offline = full session logging, reads from DataStore cache.

A11y: keyboard nav for set logger (Tab through reps → weight → RPE → log), ARIA labels on all sliders, min 48px tap targets throughout.

Performance: lazy-load `/progress` and `/rehab` routes. Workout session route = eager (critical path). Target LCP <2.5s mobile 3G.

Add `react-hot-toast` notification calls:
- Session flagged for rest → warning toast with reason
- Milestone achieved → success toast + confetti (canvas-confetti, 2kb)
- Pain spike during set → immediate warning

---

## Agent Coordination Rules

1. **Types:** Read `src/types/index.ts`. Never define types locally that belong there. If a type is missing, add it to `index.ts` and note it in your commit message.

2. **Amplify client:** One shared instance in `src/lib/amplifyClient.ts`. Never instantiate separately.

3. **Injury engine:** Always imported from `src/lib/injuryEngine.ts`. Never inline safety logic in components.

4. **Stubs:** Agents that depend on unfinished sibling work use clearly named stubs (`// STUB: replace with Agent C output`). No silent fallbacks.

5. **Branch naming:** `feature/agent-[A-G]-[short-description]` → PR into `develop` → merge sequentially within each phase.

6. **No cross-phase PRs:** Agent D cannot merge before Agent A and C are merged. Gate on CI passing against `develop`.

---

## File Ownership Map

| Path | Owner |
|---|---|
| `src/types/index.ts` | Phase 0 → all agents read |
| `amplify/` | Phase 0/1, then Agent F |
| `src/app/routes/`, `src/components/layout/` | Agent A |
| `src/components/workout/`, `src/stores/` | Agent B |
| `src/lib/`, `src/data/` | Agent C |
| `src/app/routes/rehab/`, `src/components/rehab/` | Agent D |
| `src/app/routes/progress/`, `src/components/progress/` | Agent E |
| `amplify/functions/` | Agent F |
| `vite.config.ts`, `public/`, global a11y | Agent G |

---

## Done Criteria per Phase

- **Phase 0:** `npx ampx sandbox` starts clean. Auth sign-up/in works. Types file committed.
- **Phase 1:** All models deploy. AppSync queries return data. Owner auth enforced.
- **Phase 2:** A=routes render behind auth. B=can log a full session to DynamoDB. C=all engine functions pass unit tests.
- **Phase 3:** D=milestones update DB and reflect in UI. E=charts render from real session data.
- **Phase 4:** F=Lambda generates a plan + sends test email. G=Lighthouse PWA score ≥90.
