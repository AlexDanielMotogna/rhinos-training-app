# Rhinos Training — Agent Suite & Master Documentation (React + Material UI)

**Goal:** Build the internal American Football training app using a team of specialized AI agents. This document is the **single source of truth** each agent must read **before** generating artifacts. Output must be **React + Material UI (MUI v5)**, **TypeScript**, **mobile‑first**, **i18n (EN/DE)**, **no custom CSS** (use MUI + `sx` only), brand colors **Green #203731** & **Gold #FFB612**. Back‑end is separate; this phase focuses on **UI first**, then services.

---

## 0) Product Constraints (must‑haves)

- **Training model (HYBRID)**: players can log **coach plan sessions** **and** **free sessions**.

  - **Plan (Coach)**: from activated templates per position and training type (S&C / Sprints).
  - **Free (Player)**: player may add sessions/exercises not in the plan.

- **Exercise catalog (PRO‑LOADED + custom)**:

  - The app ships with a **professional preloaded catalog** of common exercises (S&C, Speed, COD, Mobility, Technique), each with category, optional YouTube, intensity, and optional position tags.
  - Players can add **custom exercises** only if not found in catalog; customs are **non‑specific by default** until coach review.
  - Coach may **promote** a reviewed custom to the **global catalog**.

- **Compliance**: computed **only** against coach plan targets. Free work does **not** increase adherence.
- **Score**: considers plan + free with weighting and caps (defaults below). Free entries have lower caps unless marked **specific** by coach.
- **Coach visibility & control**: review queue for free work, ability to mark **specific/non‑specific**, and configure **free policies** (limits & allowed categories).
- **Login/Sign‑up** (simple): name, age, weight, height, position, email, password (hashing on backend).
- **Hard notifications**: low adherence + high free share → **blocking full‑screen** until acknowledged.
- **Team attendance**: **Tue & Thu 19:00–21:00 (Europe/Vienna)**, default **absent** if no check‑in; only coach/admin can change status.
- **i18n EN/DE**, labels codes (`MACHINE, STEADY, IRREGULAR, LAZY`) localized in UI. 100% responsive; no CSS files (MUI + `sx`).

---

## 1) Global Coding Standards

- **Stack:** React 18, TypeScript strict, MUI v5. No CSS files; style with MUI components and `sx` prop.
- **Project layout:**

  - `/src/theme.ts` — MUI theme (primary `#203731`, secondary `#FFB612`, responsiveTypography).
  - `/src/i18n/` — `I18nProvider.tsx`, `messages/en.ts`, `messages/de.ts`.
  - `/src/types/` — `exercise.ts`, `template.ts`, `workout.ts`, `notification.ts`, `kpi.ts`, `attendance.ts`.
  - `/src/services/` — `mock.ts` (temporary mocks), `yt.ts` (YouTube sanitizer), `schedule.ts` (Tue/Thu helper).
  - `/src/components/` — `AppShell.tsx`, `LanguageSwitcher.tsx`, `HardNotification.tsx`, `workout/*`.
  - `/src/pages/` — `MyTraining.tsx`, `Profile.tsx`, `Attendance.tsx`, `Coach.tsx`, `Auth.tsx`.
  - `/src/App.tsx`, `/src/main.tsx`, `index.html`.

- **i18n:** All visible strings must pass through messages; do not hardcode text.
- **Accessibility:** label every input, use `aria-*` where relevant, ensure keyboard focus.
- **Outputs from UI agents:** a single JSON with `{ "files": [{"path":"...","content":"..."}, ...] }` containing all files required to run (Vite/Next + package.json + sources).

---

## 2) Domain Models (front‑end types)

- `Exercise`: `{ id, name, category, youtubeUrl?, positionTags?: Position[], intensity?: 'low'|'mod'|'high', isGlobal?: boolean, createdBy?: string, isCustom?: boolean }`
- `TemplateBlock`: `{ order, title, items: Exercise[] }`
- `Position`: `RB|WR|LB|OL|DB|QB|DL|TE|K/P`
- `TrainingTypeKey`: `strength_conditioning | sprints_speed | <custom>`
- `TrainingTypeMeta`: `{ key: TrainingTypeKey, nameEN: string, nameDE: string, season: 'in-season'|'off-season'|'pre-season', active: boolean }`
- `PositionTemplate`: `{ blocks: TemplateBlock[] }`
- `TemplatesByType`: `Record<TrainingTypeKey, Record<Position, PositionTemplate>>`
- `WorkoutEntry`: `{ exerciseId?: string, name: string, category, sets?, reps?, kg?, durationMin?, rpe?, source: 'coach'|'player', specific?: boolean, youtubeUrl?: string }`
- `WorkoutPayload`: `{ trainingTypeKey?: TrainingTypeKey, dateISO: string, entries: WorkoutEntry[], notes?, source: 'coach'|'player' }`
- `CoachReview`: `{ entryId: string, mark: 'specific'|'non_specific', promotedToCatalog?: boolean }`
- `HardNotification`: `{ title, message, severity: 'low'|'medium'|'high' }`
- `KPISnapshot`: `{ levelScore, weeklyScore, weeklyMinutes, planMinutes, freeMinutes, freeSharePct, labels: ('MACHINE'|'STEADY'|'IRREGULAR'|'LAZY')[] }`
- `ProjectionRow`: `{ week, score, compliance, totalMin }`
- `TeamSession`: `{ start: Date, end: Date }`
- `AttendanceRow`: `{ dateISO: string, weekday: 'Tue'|'Thu', start: '19:00', end: '21:00', status: 'on_time'|'late'|'absent' }`
- `LeaderboardRow`: `{ rank, playerName, position, scoreAvg, compliancePct, attendancePct, freeSharePct }`

---

## 3) UI Surfaces & Requirements

1. **Auth**: Sign‑up/Login form with fields above; switch locale; mock submit.
2. **My Training** (HYBRID):

   - Sections: **Strength & Conditioning** and **Sprints / Speed** (plan from templates).
   - Within a plan session: show template items and allow **“Add free exercise”** (search catalog → or **Create custom** if not found).
   - **Add Free Session**: build from catalog (autocomplete + category chips) or create custom (name/category/YouTube/sets–reps–kg or minutes, RPE). `source='player'`.
   - `onSave` returns `WorkoutPayload` with `source`.

3. **Profile**: KPI cards (`levelScore`, `weeklyScore`, `weeklyMinutes`, `planMinutes`, `freeMinutes`, `freeSharePct`, `labels`), 12‑week projection from **plan targets**, and **Coach AI feedback**.
4. **Attendance**: Tue/Thu 19:00–21:00 (Europe/Vienna). Next ≥4 sessions; default **absent** if no check‑in; only coach/admin can edit.
5. **Leaderboard** (visible to all): global/by position; columns **Rank/Player/Pos/Score/Compliance %/Attendance %/Free Share %**; window 7d/30d.
6. **Coach**:

   - **Training Builder**: create/edit training types (EN/DE, season, active), program templates per type/position, exercises with YouTube and load/time targets.
   - **Catalog Manager**: view global catalog, **promote** reviewed custom to global.
   - **Free Work Review**: list of free entries with actions **Mark specific / Mark non‑specific**; optional **Promote to catalog**.
   - **Free Policies**: set `maxFreeSessionsPerDay`, `maxFreeSharePctPerWeek`, `allowedCategories`.

7. **Hard Notification**: full‑screen blocking modal; triggers from low adherence + high free share or repeated non‑specific free work.

---

## 4) YouTube Sanitizer (must use)

- Accept only `youtube.com` or `youtu.be`. Extract `videoId`. Build `https://www.youtube.com/embed/{id}`. Return `undefined` if invalid.

---

## 5) Projection Logic (front‑only)

- Derive weekly **target minutes** from templates:

  - If `targetDurationMin` present → use it.
  - Else estimate: `expectedSetSec = reps*3 + 90`, `minutes = ceil(sets*expectedSetSec/60)`.

- Projection 12 weeks: EMA α=0.30; if compliance ≥70, +2 score per week (capped 100). Output rows 1..12.

---

## 6) i18n Keys (EN/DE)

Must include at least these keys (extend as needed):

- `app.title`, `nav.myTraining`, `nav.profile`, `nav.attendance`, `nav.coach`, `nav.leaderboard`, `common.language`, `common.save`
- `auth.login`, `auth.signup`, `auth.name`, `auth.email`, `auth.password`, `auth.age`, `auth.weightKg`, `auth.heightCm`, `auth.position`
- `training.strength`, `training.sprints`, `workout.save`, `workout.sets`, `workout.reps`, `workout.kg`, `workout.durationMin`, `workout.rpe`, `workout.notes`, `workout.video`, `workout.addFreeExercise`, `workout.addFreeSession`, `workout.searchCatalog`, `workout.createCustom`
- `notify.hard.title`, `notify.hard.cta`
- `profile.metrics`, `profile.weekly`, `profile.projection`, `profile.level`, `profile.labels`, `profile.coachFeedback`, `profile.planMinutes`, `profile.freeMinutes`, `profile.freeShare`
- `attendance.upcoming`, `attendance.checkIn`, `attendance.onTime`, `attendance.late`, `attendance.absent`, `attendance.onlyCoachCanEdit`
- `leaderboard.title`, `leaderboard.window`, `leaderboard.rank`, `leaderboard.player`, `leaderboard.pos`, `leaderboard.score`, `leaderboard.compliance`, `leaderboard.attendance`, `leaderboard.freeShare`
- `coach.activate`, `coach.exercises`, `coach.program`, `coach.addExercise`, `coach.addBlock`, `coach.trainingType`, `coach.season`, `coach.active`, `coach.youtubeUrl`, `coach.catalog`, `coach.promoteToCatalog`, `coach.freePolicies`, `coach.markSpecific`, `coach.markNonSpecific`

---

## 7) Agent Suite

### 7.1 UI Builder Agent (Primary)

_(sin cambios de formato, pero debe soportar sesiones y ejercicios **free**)_

### 7.2 Backend Agent (HYBRID)

- Endpoints (ajustes clave):

  - `POST /workouts` acepta `{ source: 'coach'|'player' }` y entradas con `exerciseId` (catálogo) o `name/category` (custom).
  - `POST /workouts/:id/score` calcula `score`, `compliancePct`, `fromPlanPct`, `freeVolumeMin`, `freeSharePct`.
  - `GET /leaderboard?window=7d|30d&position=RB` incluye `freeSharePct` en filas.
  - `GET /coach/free-review` lista entradas libres pendientes; `PUT /coach/free-review/:entryId` → `{ mark: 'specific'|'non_specific', promoteToCatalog?: boolean }`.
  - `PUT /coach/free-policies` → `{ maxFreeSessionsPerDay, maxFreeSharePctPerWeek, allowedCategories: string[] }`.
  - `GET /coach/catalog` (listar) y `POST /coach/catalog/promote` (promover un custom con metadatos) .

- Seeds: incluir **catálogo profesional pre‑cargado (~60 ejercicios)** (S&C, Speed, COD, Mobility, Technique) con EN/DE listos para i18n (o names neutrales + keys), y **plantilla off‑season S&C (6 ejercicios)**.

- Quality Guard (IA + reglas) añade triggers:

  - `freeSharePct > 40%` **y** `compliancePct < 60%` → **hard notification**.
  - Repetidos `non_specific` → aviso medio con prescripciones concretas.

--- (Later)
**Purpose:** Generate API routes, Prisma (Mongo), Redis, Anthropic calls respecting our schemas.

- Reads this doc; builds endpoints: auth, exercises, templates, training‑types activation, player/training, workouts, scoring, ai/evaluate, profile/metrics, attendance.
- Hash passwords (bcrypt). No plaintext.
- Output: server files + `.env.example`.

**SYSTEM:** Backend Builder Agent for Rhinos Training (Mongo+Prisma, Redis, Anthropic). Generate code only.

---

### 7.3 Data Model Agent

**Purpose:** Emit `schema.prisma` for MongoDB (models from this doc) + seed scripts (positions, training types, example templates) + TypeScript types alignment.

---

### 7.4 Scoring Agent

**Purpose:** Implement `computeScore(entries, template)` (deterministic) and weekly aggregation & projection utilities (front and back parity). Exported as TS libs.

---

### 7.5 Quality Guard Agent

**Purpose:** Implement rules (coverage, adherence, long low‑intensity) and Claude prompt wrappers. Returns JSON `{quality, reasons[], fixes[], notification, severity}` localizable via `locale`.

---

### 7.6 Notification Agent

**Purpose:** Push/in‑app delivery, including **blocking full‑screen** when `severity=high`. Queue with Redis. Provide stub SDK adapters (OneSignal/FCM).

---

### 7.7 Attendance Agent

**Purpose:** Generate Tue/Thu 19–21 schedule (Europe/Vienna), check‑in (on_time/late), weekly attendance KPIs and interaction with Quality Guard.

---

### 7.8 i18n Agent

**Purpose:** Build EN/DE message catalogs; verify full coverage; enforce no hardcoded strings. Provide `LanguageSwitcher` and persistence hook.

---

### 7.9 Deployment Agent

**Purpose:** Provide `package.json` scripts, Vite/Next config, README runbook, and CI lint/type checks. For backend phase, add Dockerfile & compose for Mongo/Redis.

---

### 7.10 E2E Test Agent

**Purpose:** Generate Playwright tests for mobile breakpoints: login flow, my training forms, hard notification blocking, attendance check‑in, i18n toggle.

---

## 8) Acceptance Checklist (for all agents)

- UI: Mobile‑first, zero horizontal scroll at 360px. MUI only; no CSS files.
- EN/DE coverage ≥ 100% of visible text.
- HYBRID training: plan + free (buttons “Add free session/exercise”). Catalog search + custom creation.
- Catalog pre‑loaded available; customs default to non‑specific and require coach review.
- Compliance only considers plan; Leaderboard shows Free Share %. Hard notification for low adherence + high free share.
- Attendance: Tue/Thu 19–21; default absent if no check‑in; only coach/admin can edit.
- Profile: KPIs + 12‑week plan‑based projection; show plan/free minutes and free share.
- Coach: Training Builder, Catalog Manager, Free Review, Free Policies. YouTube embeds sanitized.
