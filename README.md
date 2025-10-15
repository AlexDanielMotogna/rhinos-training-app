# Rhinos Training App

A mobile-first American Football training application built with React, TypeScript, and Material UI (MUI v5).

## Features

- **Hybrid Training Model**: Coach-assigned plans + player free sessions
- **Two Training Types**: Strength & Conditioning, Sprints/Speed
- **Exercise Catalog**: 60+ professional pre-loaded exercises with search and custom exercise creation
- **Player Profile**: KPIs, metrics, labels, and 12-week projections
- **Team Attendance**: Tue/Thu 19:00-21:00 check-ins with default absent status
- **Leaderboard**: Global rankings with compliance, attendance, and free share metrics
- **Coach Dashboard**: Training builder, catalog manager, free work review, and policies
- **Hard Notifications**: Full-screen blocking alerts for low adherence
- **i18n Support**: English and German languages
- **YouTube Integration**: Sanitized video embeds for exercise demonstrations
- **Mobile-First Design**: Fully responsive, no horizontal scroll at 360px

## Tech Stack

- **React 18** with TypeScript (strict mode)
- **Material UI v5** for all styling (no CSS files)
- **Vite** for fast development and building
- **React Router v6** for navigation
- **Brand Colors**: Primary #203731 (Green), Secondary #FFB612 (Gold)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppShell.tsx
│   ├── LanguageSwitcher.tsx
│   ├── HardNotification.tsx
│   └── workout/        # Workout-specific components
├── i18n/               # Internationalization
│   ├── I18nProvider.tsx
│   └── messages/
│       ├── en.ts
│       └── de.ts
├── pages/              # Page components
│   ├── Auth.tsx
│   ├── MyTraining.tsx
│   ├── Profile.tsx
│   ├── Attendance.tsx
│   ├── Leaderboard.tsx
│   └── Coach.tsx
├── services/           # Business logic and utilities
│   ├── mock.ts         # Mock data service
│   ├── catalog.ts      # Exercise catalog
│   ├── yt.ts          # YouTube URL sanitizer
│   └── schedule.ts     # Attendance scheduling
├── types/              # TypeScript type definitions
│   ├── exercise.ts
│   ├── template.ts
│   ├── workout.ts
│   ├── notification.ts
│   ├── kpi.ts
│   ├── attendance.ts
│   └── leaderboard.ts
├── theme.ts            # MUI theme configuration
├── App.tsx            # Main app component with routing
└── main.tsx           # Entry point
```

## Key Concepts

### Hybrid Training Model

- **Coach Plan**: Template-based workouts assigned by position and training type
- **Free Sessions**: Player-created workouts from catalog or custom exercises
- **Compliance**: Calculated only from coach plan completion
- **Score**: Considers both plan and free work with weighting and caps

### Exercise System

- **Global Catalog**: 60+ pre-loaded professional exercises
- **Custom Exercises**: Players can create custom exercises if not found in catalog
- **Specific vs Non-Specific**: Coach can mark free exercises to affect scoring
- **YouTube Integration**: All URLs sanitized to embed format

### Attendance

- **Schedule**: Tuesday & Thursday 19:00-21:00 (Europe/Vienna)
- **Default Status**: Absent unless player checks in
- **Check-in Window**: 15 minutes before to 15 minutes after start time
- **Coach Control**: Only coach/admin can edit attendance records

### Labels

Players are automatically labeled based on behavior:
- **MACHINE**: Consistent high performance
- **STEADY**: Regular adherence to plan
- **IRREGULAR**: Inconsistent training patterns
- **LAZY**: Low adherence and participation

## Mock Data

This UI-only version uses localStorage for data persistence. All user data, check-ins, and preferences are stored locally.

## Internationalization

The app supports English (EN) and German (DE) with full translation coverage. Language preference is persisted in localStorage.

## Accessibility

- All inputs have proper labels
- ARIA attributes for screen readers
- Keyboard navigation support
- Mobile-first responsive design

## License

Private - Rhinos Training Internal Use
