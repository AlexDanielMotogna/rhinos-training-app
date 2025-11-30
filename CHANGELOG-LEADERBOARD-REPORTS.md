# Cambios en Leaderboard, Points System y Reports

Este documento describe todos los cambios realizados para poder replicarlos en `training-app`.

---

## 1. Sistema de Puntos (Backend)

### Archivo: `backend/src/services/points.ts` (NUEVO)

```typescript
/**
 * Points calculation service for workout scoring.
 *
 * Fixed point values - no configuration needed.
 * Points are calculated based on workout type and intensity.
 */

// Fixed point values
const POINTS = {
  light: 1,       // Light sessions (yoga, walking, stretching, <30min)
  moderate: 2,    // Moderate sessions (gym, jogging, 30-60min)
  team: 2.5,      // Team training sessions
  intensive: 3,   // Intensive sessions (≥60min or high volume)
} as const;

export type PointsCategory = keyof typeof POINTS;

interface WorkoutData {
  duration?: number;      // minutes
  source: string;         // 'coach' | 'player' | 'team'
  entries?: any[];        // workout entries with set data
}

/**
 * Calculate total volume from workout entries
 */
function calculateTotalVolume(entries: any[]): number {
  if (!entries || !Array.isArray(entries)) return 0;

  let totalVolume = 0;
  entries.forEach(entry => {
    if (entry.sets && Array.isArray(entry.sets)) {
      entry.sets.forEach((set: any) => {
        const reps = set.reps || 0;
        const weight = set.weight || 0;
        totalVolume += reps * weight;
      });
    }
  });
  return totalVolume;
}

/**
 * Calculate total sets from workout entries
 */
function calculateTotalSets(entries: any[]): number {
  if (!entries || !Array.isArray(entries)) return 0;

  let totalSets = 0;
  entries.forEach(entry => {
    if (entry.sets && Array.isArray(entry.sets)) {
      totalSets += entry.sets.length;
    }
  });
  return totalSets;
}

/**
 * Determine points category based on workout characteristics
 */
function determineCategory(duration: number, source: string, entries: any[]): PointsCategory {
  // Team sessions always get team points
  if (source === 'team') {
    return 'team';
  }

  const totalVolume = calculateTotalVolume(entries);
  const totalSets = calculateTotalSets(entries);

  // Intensive: Long duration OR high volume
  if (duration >= 60 || totalVolume > 5000) {
    return 'intensive';
  }

  // Moderate: Medium duration with some volume
  if (duration >= 30 || totalSets >= 8 || totalVolume > 1000) {
    return 'moderate';
  }

  // Light: Everything else
  return 'light';
}

/**
 * Calculate points for a workout
 */
export function calculatePoints(workout: WorkoutData): { points: number; category: PointsCategory } {
  const { duration = 0, source, entries = [] } = workout;
  const category = determineCategory(duration, source, entries);
  const points = POINTS[category];
  return { points, category };
}

/**
 * Get point value for a category
 */
export function getPointsForCategory(category: PointsCategory): number {
  return POINTS[category];
}
```

### Cambios en `backend/src/routes/workouts.ts`

Importar y usar el servicio de puntos:

```typescript
import { calculatePoints } from '../services/points.js';

// En POST /api/workouts (crear workout):
const { points, category } = calculatePoints({
  duration: data.duration || 0,
  source: data.source,
  entries: data.entries || [],
});

const workout = await prisma.workoutLog.create({
  data: {
    ...data,
    userId: req.user.userId,
    userName: user.name,
    points,                    // <-- NUEVO
    pointsCategory: category,  // <-- NUEVO
    createdAt: new Date().toISOString(),
  },
});

// En PUT /api/workouts/:id (actualizar workout):
// Recalcular puntos si cambió entries, duration o source
let pointsData = {};
if (data.entries || data.duration || data.source) {
  const { points, category } = calculatePoints({
    duration: data.duration ?? existing.duration ?? 0,
    source: (data.source ?? existing.source) as 'coach' | 'player',
    entries: data.entries ?? existing.entries ?? [],
  });
  pointsData = { points, pointsCategory: category };
}

const workout = await prisma.workoutLog.update({
  where: { id },
  data: { ...data, ...pointsData },
});
```

### Schema Prisma - Agregar campos a WorkoutLog

```prisma
model WorkoutLog {
  // ... campos existentes ...
  points          Float?    // Puntos calculados
  pointsCategory  String?   // 'light' | 'moderate' | 'team' | 'intensive'
}
```

---

## 2. Leaderboard con Filtro por Categoría

### Archivo: `backend/src/routes/leaderboard.ts`

Cambios principales:
1. Acepta query parameter `?category=` para filtrar
2. Coaches ven dropdown de sus categorías asignadas
3. Por defecto muestra la primera categoría (no todas)
4. Respuesta incluye `availableCategories` y `currentCategory`
5. **NUEVO: Coaches también aparecen en el leaderboard** si entrenan, con badge "Coach"

```typescript
router.get('/', async (req, res) => {
  const user = (req as any).user;
  const requestedCategory = req.query.category as string | undefined;

  // Get user's category info
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true, ageCategory: true, coachCategories: true },
  });

  // Determine category filter
  let categoryFilter: string[] = [];

  if (requestedCategory) {
    // Validate user has access to requested category
    if (dbUser?.role === 'player') {
      categoryFilter = dbUser.ageCategory === requestedCategory
        ? [requestedCategory]
        : (dbUser.ageCategory ? [dbUser.ageCategory] : []);
    } else if (dbUser?.role === 'coach') {
      if (dbUser.coachCategories?.includes(requestedCategory)) {
        categoryFilter = [requestedCategory];
      } else if (dbUser.coachCategories?.length > 0) {
        categoryFilter = [dbUser.coachCategories[0]];
      }
    }
  } else {
    // Default: first category
    if (dbUser?.role === 'player' && dbUser?.ageCategory) {
      categoryFilter = [dbUser.ageCategory];
    } else if (dbUser?.role === 'coach' && dbUser?.coachCategories?.length > 0) {
      categoryFilter = [dbUser.coachCategories[0]];
    }
  }

  // Filter users by category (players AND coaches!)
  let userIdsToInclude: string[] | null = null;
  if (categoryFilter.length > 0) {
    // Get players in the category
    const players = await prisma.user.findMany({
      where: { role: 'player', ageCategory: { in: categoryFilter } },
      select: { id: true },
    });

    // Get coaches that have this category assigned (they can also train!)
    const coaches = await prisma.user.findMany({
      where: {
        role: 'coach',
        coachCategories: { hasSome: categoryFilter },
      },
      select: { id: true },
    });

    userIdsToInclude = [
      ...players.map(p => p.id),
      ...coaches.map(c => c.id),
    ];
  }

  // ... rest of leaderboard logic (include role in user query) ...
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, position: true, ageCategory: true, role: true }, // <-- role added
  });

  // Include role in response
  return {
    userId,
    playerName: userInfo?.name || data.userName,
    position: userInfo?.position || '-',
    ageCategory: userInfo?.ageCategory,
    role: userInfo?.role || 'player',  // <-- NEW
    totalPoints: data.totalPoints,
    workoutDays: data.workoutDates.size,
  };

  // Response includes available categories
  let availableCategories: string[] = [];
  if (dbUser?.role === 'player' && dbUser?.ageCategory) {
    availableCategories = [dbUser.ageCategory];
  } else if (dbUser?.role === 'coach' && dbUser?.coachCategories) {
    availableCategories = dbUser.coachCategories;
  }

  res.json({
    month: currentMonth,
    leaderboard,
    currentCategory: categoryFilter[0] || null,
    availableCategories,
  });
});
```

### Archivo: `src/pages/Leaderboard.tsx`

Agregar selector de categoría:

```typescript
const [selectedCategory, setSelectedCategory] = useState<string>('');
const [availableCategories, setAvailableCategories] = useState<string[]>([]);

useEffect(() => {
  const loadLeaderboard = async () => {
    const response = await leaderboardService.getCurrentWeek(selectedCategory || undefined);
    setData(response.leaderboard || []);

    if (response.availableCategories) {
      setAvailableCategories(response.availableCategories);
      if (!selectedCategory && response.currentCategory) {
        setSelectedCategory(response.currentCategory);
      }
    }
  };
  loadLeaderboard();
}, [selectedMonth, selectedCategory]);

// En el JSX - mostrar dropdown solo si hay múltiples categorías:
{availableCategories.length > 1 && (
  <FormControl sx={{ minWidth: 180 }} size="small">
    <InputLabel>{t('leaderboard.category')}</InputLabel>
    <Select
      value={selectedCategory}
      label={t('leaderboard.category')}
      onChange={(e) => setSelectedCategory(e.target.value)}
    >
      {availableCategories.map((cat) => (
        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
      ))}
    </Select>
  </FormControl>
)}

// Agregar role al interface:
interface LeaderboardEntry {
  rank: number;
  userId: string;
  playerName: string;
  position: string;
  ageCategory?: string;
  role?: string;  // <-- NEW
  totalPoints: number;
  workoutDays: number;
}

// En la tabla, mostrar badge "Coach" junto al nombre:
<TableCell sx={{ fontWeight: row.rank <= 3 ? 600 : 400 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {row.playerName}
    {row.role === 'coach' && (
      <Chip label={t('leaderboard.coach')} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
    )}
  </Box>
</TableCell>
```

### Archivo: `src/services/api.ts`

Actualizar service para pasar categoría:

```typescript
leaderboardService: {
  getCurrentWeek: (category?: string) =>
    fetchApi(`/api/leaderboard${category ? `?category=${category}` : ''}`),
  getMonth: (month: string, category?: string) =>
    fetchApi(`/api/leaderboard/month/${month}${category ? `?category=${category}` : ''}`),
},
```

---

## 3. Reports - Weekly Overview (Simplificado)

### Archivo: `backend/src/routes/reports.ts` (NUEVO o REEMPLAZADO)

```typescript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

router.get('/weekly-overview/:startDate?', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can access reports
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can access reports' });
    }

    // Get coach's categories for filtering
    const coach = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { coachCategories: true },
    });
    const categoryFilter = coach?.coachCategories || [];

    // Calculate week start (Monday)
    let weekStart: Date;
    if (req.params.startDate) {
      weekStart = new Date(req.params.startDate);
      if (isNaN(weekStart.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diff);
    }
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    // Get players in coach's categories
    const playersWhere: any = { role: 'player' };
    if (categoryFilter.length > 0) {
      playersWhere.ageCategory = { in: categoryFilter };
    }

    const players = await prisma.user.findMany({
      where: playersWhere,
      select: { id: true, name: true, position: true, ageCategory: true },
      orderBy: { name: 'asc' },
    });

    // Get workouts for the week
    const playerIds = players.map(p => p.id);
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId: { in: playerIds },
        date: { gte: startStr, lte: endStr },
      },
      select: { userId: true, date: true, source: true },
    });

    // Get team sessions
    const teamSessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: startStr, lte: endStr },
        sessionCategory: 'team',
      },
      select: { date: true },
    });
    const teamSessionDates = new Set(teamSessions.map(s => s.date));

    // Build week days array
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }

    // Build player data
    const playerData = players.map(player => {
      const playerWorkouts = workouts.filter(w => w.userId === player.id);
      const days: Record<string, 'self' | 'team' | null> = {};
      let totalDays = 0;

      weekDays.forEach(day => {
        const dayWorkouts = playerWorkouts.filter(w => w.date === day);
        const hasTeamSession = dayWorkouts.some(w => w.source === 'team') ||
          (teamSessionDates.has(day) && dayWorkouts.length > 0);
        const hasSelfTraining = dayWorkouts.some(w => w.source !== 'team');

        if (hasTeamSession) {
          days[day] = 'team';
          totalDays++;
        } else if (hasSelfTraining) {
          days[day] = 'self';
          totalDays++;
        } else {
          days[day] = null;
        }
      });

      return {
        id: player.id,
        name: player.name,
        position: player.position || '-',
        ageCategory: player.ageCategory,
        days,
        totalDays,
      };
    });

    const playersWhoTrained = playerData.filter(p => p.totalDays > 0).length;

    res.json({
      weekStart: startStr,
      weekEnd: endStr,
      weekDays,
      players: playerData,
      summary: {
        totalPlayers: players.length,
        playersTrained: playersWhoTrained,
      },
      availableCategories: categoryFilter,
    });
  } catch (error) {
    console.error('[REPORTS] Weekly overview error:', error);
    res.status(500).json({ error: 'Failed to generate weekly overview' });
  }
});

export default router;
```

### Archivo: `src/pages/Reports.tsx` (SIMPLIFICADO)

Vista simple con:
- Navegación por semanas (flechas izquierda/derecha)
- Tabla: Player | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Total
- Iconos: Check (azul) = Self, Football (verde) = Team, Dash (gris) = None
- Jugadores con 0 días resaltados en naranja
- Summary chip: "X/Y players trained this week"

### Archivo: `src/services/api.ts`

```typescript
reportsService: {
  getWeeklyOverview: (startDate?: string) =>
    fetchApi(`/api/reports/weekly-overview${startDate ? `/${startDate}` : ''}`),
},
```

---

## 4. Traducciones i18n

### English (`src/i18n/messages/en.ts`)

```typescript
// Leaderboard
'leaderboard.category': 'Category',
'leaderboard.coach': 'Coach',  // Badge para coaches en leaderboard
'leaderboard.pointsIntensive': 'Intensive (≥60min)',  // Cambiado de >90min a ≥60min

// Reports
'nav.reports': 'Reports',
'reports.weeklyOverview': 'Weekly Training Overview',
'reports.player': 'Player',
'reports.total': 'Total',
'reports.playersTrained': 'players trained this week',
'reports.noOneTrainedYet': 'No one trained yet',
'reports.everyoneTrained': 'Everyone trained!',
'reports.selfTraining': 'Self Training',
'reports.teamSession': 'Team Session',
'reports.noTraining': 'No Training',
'reports.noPlayers': 'No players found',
```

### German (`src/i18n/messages/de.ts`)

```typescript
// Leaderboard
'leaderboard.category': 'Kategorie',
'leaderboard.coach': 'Trainer',  // Badge para coaches en leaderboard
'leaderboard.pointsIntensive': 'Intensiv (≥60min)',

// Reports
'nav.reports': 'Berichte',
'reports.weeklyOverview': 'Wöchentliche Trainingsübersicht',
'reports.player': 'Spieler',
'reports.total': 'Gesamt',
'reports.playersTrained': 'Spieler haben diese Woche trainiert',
'reports.noOneTrainedYet': 'Noch niemand trainiert',
'reports.everyoneTrained': 'Alle haben trainiert!',
'reports.selfTraining': 'Eigentraining',
'reports.teamSession': 'Team-Session',
'reports.noTraining': 'Kein Training',
'reports.noPlayers': 'Keine Spieler gefunden',
```

---

## 5. Resumen de Cambios

| Componente | Cambio |
|------------|--------|
| **Points System** | Cálculo de puntos movido al backend. Valores fijos: light=1, moderate=2, team=2.5, intensive=3 |
| **Intensive threshold** | Cambiado de >90min a ≥60min |
| **Leaderboard** | Filtro por categoría con dropdown para coaches. Coaches ahora aparecen en el leaderboard con badge "Coach" |
| **Reports** | Simplificado a vista semanal con tabla Player/Days |
| **WorkoutLog** | Nuevos campos: `points` (Float) y `pointsCategory` (String) |

---

## 6. Script de Migración (para workouts existentes)

Si hay workouts sin puntos calculados:

```typescript
// backend/scripts/migrate-points.ts
import prisma from '../src/utils/prisma.js';
import { calculatePoints } from '../src/services/points.js';

async function migratePoints() {
  const workouts = await prisma.workoutLog.findMany({
    where: { points: null },
  });

  console.log(`Found ${workouts.length} workouts without points`);

  for (const workout of workouts) {
    const { points, category } = calculatePoints({
      duration: workout.duration || 0,
      source: workout.source || 'player',
      entries: workout.entries || [],
    });

    await prisma.workoutLog.update({
      where: { id: workout.id },
      data: { points, pointsCategory: category },
    });
  }

  console.log('Migration complete');
}

migratePoints();
```

Ejecutar: `npx tsx backend/scripts/migrate-points.ts`
