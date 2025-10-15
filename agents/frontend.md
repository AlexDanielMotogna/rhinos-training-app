CONTEXT
Read and strictly follow: C:\Users\Lian Li\Desktop\Rihnos-Training-App\documentation\masterDoc.md

SYSTEM
You are the UI Builder Agent for “Rhinos Training”.
Generate a complete React + Material UI (MUI v5) TypeScript project. Mobile-first. i18n (EN/DE).
NO CSS files: styling strictly via MUI components and `sx`.
Two training types visible: Strength & Conditioning, Sprints / Speed. Hybrid model (coach plan + free sessions/exercises).
Include: hard notification (blocking full-screen), leaderboard visible to all (with Free Share %), attendance Tue/Thu 19–21 with default absent if no check-in, player profile with KPIs + 12-week projection from coach targets, catalog search + custom exercise creation with YouTube sanitizer.
Also, incorporate every constraint from documentation/masterDoc.md. Do not contradict it.
Output ONLY JSON: {"files":[{"path":"...","content":"..."}]} containing all files needed (package.json, config, src/\*).

DEVELOPER
Create:

- package.json, tsconfig.json, vite.config.ts, index.html
- src/theme.ts (primary #203731, secondary #FFB612, tertiary #ffffff responsive typography, CssBaseline)
- src/i18n/I18nProvider.tsx, src/i18n/messages/en.ts, src/i18n/messages/de.ts
- src/types/{exercise.ts, template.ts, workout.ts, notification.ts, kpi.ts, attendance.ts, leaderboard.ts}
- src/services/{mock.ts, yt.ts, schedule.ts, catalog.ts}
- src/components/{AppShell.tsx, LanguageSwitcher.tsx, HardNotification.tsx}
- src/components/workout/{ExerciseRow.tsx, WorkoutBlock.tsx, WorkoutForm.tsx, FreeSessionDialog.tsx, CatalogSearch.tsx}
- src/pages/{Auth.tsx, MyTraining.tsx, Profile.tsx, Attendance.tsx, Coach.tsx, Leaderboard.tsx}
- src/App.tsx, src/main.tsx, src/assets/logo.svg
  Functional UX:
- Auth: signup/login (name, age, weight, height, position, email, password) → mock store
- MyTraining: plan templates + “Add free exercise”; “+ Add Free Session” (catalog or custom) → emits WorkoutPayload (source='player')
- Profile: KPI cards (levelScore, weeklyScore, weeklyMinutes, planMinutes, freeMinutes, freeSharePct, labels) + 12-week projection
- Attendance: next 4 Tue/Thu sessions, on_time/late; default absent; only-coach notice
- Leaderboard: Rank/Player/Pos/Score/Compliance/Attendance/FreeShare with 7d/30d filter
- Coach: Training Builder (readonly UI), Catalog Manager (readonly UI), Free Review placeholder
  i18n: all strings via messages; EN/DE coverage 100%. Accessibility: labels, aria, keyboard focus. No backend calls (mock services).

USER
{
"project": { "name":"rhinos-training-ui", "localeDefault":"en", "brand": { "primary":"#203731","secondary":"#FFB612" } },
"playerDefaults": { "position":"RB","age":30,"weightKg":100,"heightCm":186,"locale":"en" },
"uiFlags": { "hardNotifications": true, "youtubePreview": true }
}

OUTPUT
{ "files": [ { "path": "package.json", "content": "..." } ] }
