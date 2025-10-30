# 🎯 PLAN DE INTEGRACIÓN BACKEND - RHINOS TRAINING APP

**Fecha de creación:** 2025-10-29
**Última actualización:** 2025-10-30
**Duración estimada:** 6 semanas
**Basado en:** BACKEND_AUDIT_REPORT.md

**📌 ESTADO ACTUAL:** Semana 1 (Videos Backend) ✅ COMPLETADA

---

## 📋 RESUMEN EJECUTIVO

### Objetivo
Completar la integración backend de los 7 módulos restantes que actualmente usan solo localStorage/mock data, priorizando por impacto y dependencias.

### Estrategia
Seguir el enfoque **"Opción C: Progresivo"** - Implementar Fase 1 (Infraestructura) y Fase 2 (Analytics) en 6 semanas, dejando optimizaciones para iteraciones futuras.

### Recursos Necesarios
- 1 Full-Stack Developer (tiempo completo)
- Acceso a MongoDB Atlas
- Cloudinary API (para imágenes)
- Entorno de staging para testing

---

## 🗓️ SEMANA 1: VIDEOS BACKEND ✅ COMPLETADO

### Objetivo
Migrar sistema de videos educativos de localStorage a MongoDB, permitiendo progreso sincronizado entre dispositivos.

### 📌 DÍA 1-2: Backend Setup ✅

**Tareas:**
```bash
✅ Verificar modelo Video en backend/prisma/schema.prisma
  - El modelo ya existe ✅
  - Confirmar campos necesarios ✅
  - Agregado campo runs[] para Run Concepts ✅

✅ Crear archivo backend/src/routes/videos.ts

✅ Implementar endpoints:
  - GET    /api/videos              # Listar todos los videos ✅
  - GET    /api/videos/:id          # Obtener video específico ✅
  - POST   /api/videos              # Crear video (coach only) ✅
  - PUT    /api/videos/:id          # Actualizar video (coach only) ✅
  - DELETE /api/videos/:id          # Eliminar video (coach only) ✅

✅ Agregar autenticación con middleware authenticate

✅ Implementar autorización:
  - Coaches: CRUD completo ✅
  - Players: Solo lectura ✅

✅ Registrar routes en backend/src/index.ts:
  import videoRoutes from './routes/videos.js';
  app.use('/api/videos', videoRoutes);
```

**Testing Backend:** ✅
```bash
# Testeado y funcionando
✅ POST /api/videos (como coach)
✅ GET  /api/videos
✅ GET  /api/videos/:id
✅ PUT  /api/videos/:id
✅ DELETE /api/videos/:id
```

### 📌 DÍA 3: Video Progress Tracking ✅

**Tareas:**
```bash
✅ Agregar modelo VideoProgress a schema.prisma:
  model VideoProgress {
    id            String   @id @default(auto()) @map("_id") @db.ObjectId
    userId        String   @db.ObjectId
    videoId       String   @db.ObjectId
    lastTimestamp Int      # Segundos
    totalDuration Int      # Segundos
    percentWatched Int     # 0-100
    completed     Boolean  @default(false)
    lastWatchedAt DateTime @updatedAt
    createdAt     DateTime @default(now())

    @@unique([userId, videoId])
    @@index([userId])
    @@index([videoId])
  }

✅ npx prisma generate
✅ npx prisma db push

✅ Agregar endpoints de progreso en videos.ts:
  - POST /api/videos/:id/progress     # Guardar progreso ✅
  - GET  /api/videos/:id/progress     # Obtener progreso usuario actual ✅
  - GET  /api/videos/progress/user/:userId # Progreso de un player (coach only) ✅
```

### 📌 DÍA 4-5: Frontend Migration ✅

**Tareas:**
```bash
✅ Crear API client en src/services/api.ts:
  export const videoService = {
    getAll: () => api.get('/videos'),
    getById: (id) => api.get(`/videos/${id}`),
    create: (data) => api.post('/videos', data),
    update: (id, data) => api.put(`/videos/${id}`, data),
    delete: (id) => api.delete(`/videos/${id}`),
    saveProgress: (id, progress) => api.post(`/videos/${id}/progress`, progress),
    getProgress: (id) => api.get(`/videos/${id}/progress`),
  };

✅ Actualizar src/services/videos.ts:
  - Mantener funciones actuales ✅
  - Agregar syncVideosFromBackend() ✅
  - Modificar getAllVideos() para intentar backend primero ✅
  - Fallback a localStorage si offline ✅
  - Guardar respuesta backend en localStorage (cache) ✅

✅ Implementar sync en src/App.tsx:
  useEffect(() => {
    if (currentUser) {
      syncVideosFromBackend();
    }
  }, [currentUser]);

✅ Actualizar componentes:
  - src/pages/Videos.tsx ✅
  - src/pages/Admin.tsx (VideosAdmin) ✅
```

**Código de ejemplo:**
```typescript
// src/services/videos.ts
export async function syncVideosFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping video sync');
    return;
  }

  try {
    console.log('🔄 Syncing videos from backend...');
    const backendVideos = await videoService.getAll();

    // Guardar en localStorage como cache
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(backendVideos));
    console.log('✅ Videos synced successfully');
  } catch (error) {
    console.warn('⚠️ Failed to sync videos:', error);
  }
}

export function getAllVideos(): Video[] {
  const stored = localStorage.getItem(VIDEOS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function createVideo(video: Omit<Video, 'id'>): Promise<Video> {
  if (isOnline()) {
    try {
      const newVideo = await videoService.create(video);
      // Actualizar cache local
      const videos = getAllVideos();
      videos.push(newVideo);
      localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));
      return newVideo;
    } catch (error) {
      console.error('Failed to create video on backend:', error);
      throw error;
    }
  } else {
    throw new Error('Cannot create video while offline');
  }
}
```

### 📌 Testing Semana 1 ✅

```bash
✅ Verificar coach puede crear/editar/eliminar videos
✅ Verificar player solo puede ver videos
✅ Verificar progreso se guarda correctamente
✅ Verificar sync funciona al iniciar app
✅ Verificar fallback a localStorage funciona offline
✅ Verificar no hay errores en consola
```

**Resultado esperado:** ✅ Videos sincronizados con backend, progreso compartido entre dispositivos

### 🎉 EXTRAS IMPLEMENTADOS EN SEMANA 1:

**Dynamic Video Tags System** (Commit 9b6cdbb)
```bash
✅ Creado modelo VideoTag en Prisma
✅ Implementado backend CRUD routes en /api/video-tags
  - GET, POST, PUT, DELETE endpoints
  - Filtro por tipo (position/route/coverage/run)
  - Initialize endpoint con tags por defecto
  - Validación con Zod
  - Previene eliminación de tags default
✅ Creado VideoTagsManager component en Admin panel
  - Tabs para cada tipo de tag
  - Add/Edit/Delete functionality
  - Visual chips con color para defaults
  - Click-to-edit tag names
✅ Actualizado VideosAdmin para usar tags dinámicos
  - Carga tags desde backend
  - Dropdowns dinámicos en lugar de hardcoded
  - Guidance cuando tags están vacíos
```

**Run Concepts Video Type** (Commit 5e891a8)
```bash
✅ Agregado tipo 'run' a VideoType
✅ Agregado campo runs[] al modelo Video
✅ Actualizado VideoTag model para soportar tipo 'run'
✅ 12 Run Concepts por defecto:
  - Inside Zone, Outside Zone, Counter, Power
  - Trap, Stretch, Toss, Sweep
  - Draw, Iso, Wham, Dart
✅ Frontend completo:
  - Tab "Run Concepts" en Videos player view
  - Filtros por run concept
  - Run tags en Admin
  - VideoTagsManager soporta runs
```

**YouTube URL Fixes** (Commit 75c0c63)
```bash
✅ Fix: Error Alert ahora dentro del Dialog modal
✅ Fix: YouTube URL parsing mejorado
  - Usa extractYouTubeVideoId de yt.ts
  - Maneja URLs con parámetros extra (source_ve_path, etc.)
  - Mismo parsing que exercise videos
```

---

## 🗓️ SEMANA 2: DRILLS & EQUIPMENT BACKEND

### Objetivo
Centralizar gestión de drills y equipamiento para que coaches puedan compartir recursos con todo el equipo.

### 📌 DÍA 1-2: Drills Backend

**Prisma Schema:**
```prisma
// Agregar a backend/prisma/schema.prisma

model Drill {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  category      String   // 'offense' | 'defense' | 'special-teams'
  description   String?
  duration      Int      // minutos

  // Personnel
  players       Int      @default(0)
  coaches       Int      @default(0)
  dummies       Int      @default(0)

  // Equipment (array of equipment IDs)
  equipment     Json     // [{equipmentId: string, quantity: number}]

  // Resources
  sketchUrl     String?  // Cloudinary URL para diagrama
  videoUrl      String?  // YouTube URL

  // Organization
  tags          String[]
  difficulty    String?  // 'beginner' | 'intermediate' | 'advanced'

  // Metadata
  createdBy     String   @db.ObjectId
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([category, difficulty])
  @@index([createdBy])
}
```

**Backend Routes:**
```bash
□ Crear backend/src/routes/drills.ts

□ Implementar endpoints:
  - GET    /api/drills              # Listar todos
  - GET    /api/drills/:id          # Obtener específico
  - POST   /api/drills              # Crear (coach only)
  - PUT    /api/drills/:id          # Actualizar (coach only)
  - DELETE /api/drills/:id          # Eliminar (coach only)
  - GET    /api/drills/category/:cat # Filtrar por categoría
  - POST   /api/drills/:id/sketch   # Upload sketch a Cloudinary

□ Autenticación + Autorización
□ Registrar en backend/src/index.ts

□ npx prisma generate
□ npx prisma db push
```

**Testing Backend:**
```bash
POST /api/drills (como coach)
GET  /api/drills
GET  /api/drills/:id
PUT  /api/drills/:id
DELETE /api/drills/:id (como coach)
DELETE /api/drills/:id (como player) → debe fallar 403
```

### 📌 DÍA 3: Equipment Backend

**Prisma Schema:**
```prisma
// Agregar a backend/prisma/schema.prisma

model Equipment {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String   @unique
  quantity    Int?     // Cantidad total disponible
  imageUrl    String?  // Cloudinary URL
  publicId    String?  // Cloudinary public_id para eliminar
  category    String?  // 'weights' | 'cardio' | 'field' | 'protection'
  condition   String?  // 'excellent' | 'good' | 'fair' | 'poor'
  notes       String?

  createdBy   String?  @db.ObjectId
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
}
```

**Backend Routes:**
```bash
□ Crear backend/src/routes/equipment.ts

□ Implementar endpoints:
  - GET    /api/equipment           # Listar todo
  - GET    /api/equipment/:id       # Obtener específico
  - POST   /api/equipment           # Crear (coach only)
  - PUT    /api/equipment/:id       # Actualizar (coach only)
  - DELETE /api/equipment/:id       # Eliminar (coach only)
  - POST   /api/equipment/:id/image # Upload imagen a Cloudinary

□ Registrar en backend/src/index.ts

□ npx prisma generate
□ npx prisma db push
```

### 📌 DÍA 4-5: Frontend Migration

**Tareas Drills:**
```bash
□ Crear API client en src/services/api.ts:
  export const drillService = {
    getAll: () => api.get('/drills'),
    getById: (id) => api.get(`/drills/${id}`),
    create: (data) => api.post('/drills', data),
    update: (id, data) => api.put(`/drills/${id}`, data),
    delete: (id) => api.delete(`/drills/${id}`),
    uploadSketch: (id, file) => {
      const formData = new FormData();
      formData.append('sketch', file);
      return api.post(`/drills/${id}/sketch`, formData);
    },
  };

□ Actualizar src/services/drillService.ts:
  - Agregar syncDrillsFromBackend()
  - Modificar getAllDrills() para usar backend
  - Mantener localStorage como cache
  - Fallback offline

□ Actualizar componentes:
  - Drill creation/edit dialogs
  - DrillLibrary.tsx
```

**Tareas Equipment:**
```bash
□ Crear API client en src/services/api.ts:
  export const equipmentService = {
    getAll: () => api.get('/equipment'),
    getById: (id) => api.get(`/equipment/${id}`),
    create: (data) => api.post('/equipment', data),
    update: (id, data) => api.put(`/equipment/${id}`, data),
    delete: (id) => api.delete(`/equipment/${id}`),
    uploadImage: (id, file) => {
      const formData = new FormData();
      formData.append('image', file);
      return api.post(`/equipment/${id}/image`, formData);
    },
  };

□ Actualizar src/services/equipmentService.ts:
  - Agregar syncEquipmentFromBackend()
  - Modificar getAllEquipment() para usar backend
  - Mantener localStorage como cache

□ Actualizar componentes:
  - Equipment management
  - Drill equipment selector
```

**Sync en App.tsx:**
```typescript
useEffect(() => {
  if (currentUser) {
    syncDrillsFromBackend();
    syncEquipmentFromBackend();
  }
}, [currentUser]);
```

### 📌 Testing Semana 2

```bash
□ Verificar coach puede crear/editar drills
□ Verificar sketch upload funciona (Cloudinary)
□ Verificar equipment CRUD funciona
□ Verificar permisos (player read-only)
□ Verificar sync al inicio
□ Verificar offline fallback
□ Verificar drills referencian equipment correctamente
```

**Resultado esperado:** ✅ Drills y equipment centralizados, coaches pueden compartir recursos

---

## 🗓️ SEMANA 3: TEAM SETTINGS + CLEANUP

### Objetivo
Migrar configuración de branding a backend y limpiar código redundante.

### 📌 DÍA 1-2: Team Settings Backend

**Backend Routes:**
```bash
□ Crear backend/src/routes/teamSettings.ts

□ Implementar endpoints:
  - GET  /api/team-settings          # Obtener config actual
  - PUT  /api/team-settings          # Actualizar (admin only)
  - POST /api/team-settings/logo     # Upload logo a Cloudinary
  - POST /api/team-settings/favicon  # Upload favicon a Cloudinary

□ Nota: El modelo TeamSettings ya existe en schema.prisma ✅

□ Autorización: Solo admin/coach puede modificar

□ Registrar en backend/src/index.ts
```

**Código de ejemplo:**
```typescript
// backend/src/routes/teamSettings.ts
import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// Get team settings (public)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.teamSettings.findFirst();
    if (!settings) {
      return res.status(404).json({ error: 'Team settings not found' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team settings' });
  }
});

// Update team settings (admin only)
router.put('/', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can update team settings' });
  }

  try {
    const data = req.body;
    const settings = await prisma.teamSettings.findFirst();

    if (settings) {
      const updated = await prisma.teamSettings.update({
        where: { id: settings.id },
        data,
      });
      res.json(updated);
    } else {
      const created = await prisma.teamSettings.create({ data });
      res.json(created);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team settings' });
  }
});

export default router;
```

### 📌 DÍA 3: Frontend Migration

**Tareas:**
```bash
□ Crear API client en src/services/api.ts:
  export const teamSettingsService = {
    get: () => api.get('/team-settings'),
    update: (data) => api.put('/team-settings', data),
    uploadLogo: (file) => {
      const formData = new FormData();
      formData.append('logo', file);
      return api.post('/team-settings/logo', formData);
    },
  };

□ Actualizar src/services/teamSettings.ts:
  - Agregar syncTeamSettingsFromBackend()
  - Modificar getTeamSettings() para usar backend
  - Cache en localStorage
  - Fallback offline

□ Actualizar componentes:
  - Admin panel branding settings
  - Apply branding on load

□ Sync en App.tsx
```

### 📌 DÍA 4-5: Code Cleanup

**Eliminar código obsoleto:**
```bash
□ Eliminar funciones de src/services/mock.ts:
  - getMockLeaderboard() → Ya no se usa (se implementará en semana 4)
  - getMockNotifications() → Backend ya existe
  - getMockProjection() → Se calculará server-side
  - getMockKPIs() → Se calculará server-side

□ Eliminar src/services/schedule.ts:
  - Schedule usa TrainingSession backend ✅
  - Este archivo es redundante

□ Actualizar imports en componentes que usaban mock.ts

□ Verificar no hay errores de compilación
```

**Optimización:**
```bash
□ Revisar todos los servicios sync:
  - ¿Usan isOnline() correctamente?
  - ¿Tienen try/catch para errores?
  - ¿Logs claros de sync status?

□ Agregar índices MongoDB si faltan:
  - Videos: category, isPublic
  - Drills: category, difficulty
  - Equipment: category

□ Testing de performance:
  - ¿Sync inicial toma < 2 segundos?
  - ¿API responses < 200ms?
```

### 📌 Testing Semana 3

```bash
□ Verificar branding se sincroniza
□ Verificar logo upload funciona
□ Verificar permisos (solo coach puede editar)
□ Verificar app compila sin errores
□ Verificar no hay imports rotos
□ Verificar performance no degradó
```

**Resultado esperado:** ✅ Team settings centralizado, código más limpio

---

## 🗓️ SEMANA 4: LEADERBOARD BACKEND

### Objetivo
Implementar rankings reales basados en datos de workout logs, test results, y attendance.

### 📌 DÍA 1-3: Backend Calculation Logic

**Crear servicio de cálculo:**
```bash
□ Crear backend/src/services/leaderboard.ts
```

**Lógica de ranking:**
```typescript
// backend/src/services/leaderboard.ts
import prisma from '../utils/prisma.js';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  position: string;
  rank: number;
  totalScore: number;

  // Componentes del score
  complianceScore: number;    // 0-100 (30% weight)
  volumeScore: number;        // 0-100 (20% weight)
  testScore: number;          // 0-100 (30% weight)
  attendanceScore: number;    // 0-100 (20% weight)

  // Stats adicionales
  workoutsCompleted: number;
  totalVolume: number; // kg
  attendanceRate: number; // %
  avgTestScore: number;
}

export async function calculateLeaderboard(period: '7d' | '30d' = '30d'): Promise<LeaderboardEntry[]> {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (period === '7d' ? 7 : 30));

  // Get all players
  const users = await prisma.user.findMany({
    where: { role: 'player' },
    select: { id: true, name: true, position: true },
  });

  const entries: LeaderboardEntry[] = [];

  for (const user of users) {
    // 1. Compliance Score (30%)
    const assignments = await prisma.trainingAssignment.findMany({
      where: {
        playerIds: { has: user.id },
        active: true,
      },
    });

    const workoutsAssigned = assignments.length * 3; // Assuming 3x per week
    const workoutsCompleted = await prisma.workoutLog.count({
      where: {
        userId: user.id,
        date: { gte: startDate.toISOString().split('T')[0] },
      },
    });

    const complianceScore = workoutsAssigned > 0
      ? Math.min(100, (workoutsCompleted / workoutsAssigned) * 100)
      : 0;

    // 2. Volume Score (20%)
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate.toISOString().split('T')[0] },
      },
    });

    let totalVolume = 0;
    workouts.forEach(workout => {
      const entries = workout.entries as any[];
      entries.forEach(entry => {
        if (entry.setData) {
          entry.setData.forEach((set: any) => {
            totalVolume += (set.kg || 0) * (set.reps || 0);
          });
        }
      });
    });

    // Normalize volume to 0-100 (assuming 10,000 kg = 100)
    const volumeScore = Math.min(100, (totalVolume / 10000) * 100);

    // 3. Test Score (30%)
    const testResults = await prisma.testResult.findMany({
      where: {
        userId: user.id,
        isCurrent: true,
      },
    });

    const avgTestScore = testResults.length > 0
      ? testResults.reduce((sum, t) => sum + t.score, 0) / testResults.length
      : 0;

    // 4. Attendance Score (20%)
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: startDate.toISOString().split('T')[0] },
      },
    });

    const attendedCount = sessions.filter(session => {
      const checkIns = session.checkIns as any[];
      return checkIns?.some(c => c.userId === user.id);
    }).length;

    const attendanceRate = sessions.length > 0
      ? (attendedCount / sessions.length) * 100
      : 0;

    // Calculate total score (weighted)
    const totalScore =
      (complianceScore * 0.30) +
      (volumeScore * 0.20) +
      (avgTestScore * 0.30) +
      (attendanceRate * 0.20);

    entries.push({
      userId: user.id,
      userName: user.name,
      position: user.position || '',
      rank: 0, // Will be set after sorting
      totalScore: Math.round(totalScore),
      complianceScore: Math.round(complianceScore),
      volumeScore: Math.round(volumeScore),
      testScore: Math.round(avgTestScore),
      attendanceScore: Math.round(attendanceRate),
      workoutsCompleted,
      totalVolume,
      attendanceRate: Math.round(attendanceRate),
      avgTestScore: Math.round(avgTestScore),
    });
  }

  // Sort by totalScore and assign ranks
  entries.sort((a, b) => b.totalScore - a.totalScore);
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}
```

**Backend Routes:**
```bash
□ Crear backend/src/routes/leaderboard.ts

□ Implementar endpoints:
  - GET /api/leaderboard?period=7d     # Weekly rankings
  - GET /api/leaderboard?period=30d    # Monthly rankings (default)
  - GET /api/leaderboard?position=RB   # Filter by position
  - GET /api/leaderboard/history       # Historical rankings (optional)

□ Implementar caching:
  - Cache rankings for 1 hour
  - Invalidate cache after workout/test completion

□ Registrar en backend/src/index.ts
```

### 📌 DÍA 4-5: Frontend Migration

**Tareas:**
```bash
□ Crear API client en src/services/api.ts:
  export const leaderboardService = {
    get: (period, position) => api.get('/leaderboard', { params: { period, position } }),
    getHistory: () => api.get('/leaderboard/history'),
  };

□ Eliminar getMockLeaderboard() de mock.ts

□ Actualizar src/pages/Leaderboard.tsx:
  - Usar leaderboardService.get()
  - Agregar loading state
  - Agregar error handling
  - Mantener filtros de período y posición
  - Agregar refresh button

□ Agregar auto-refresh cada 5 minutos (opcional)
```

**Código de ejemplo:**
```typescript
// src/pages/Leaderboard.tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leaderboardService.get(period, positionFilter || undefined);
      setData(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchLeaderboard();
}, [period, positionFilter]);
```

### 📌 Testing Semana 4

```bash
□ Verificar rankings son correctos (comparar con datos reales)
□ Verificar filtros funcionan (7d, 30d, position)
□ Verificar rankings actualizan después de workout
□ Verificar loading state muestra
□ Verificar error handling funciona
□ Verificar performance (cálculo < 2s)
```

**Resultado esperado:** ✅ Leaderboard real basado en datos, rankings motivan competencia

---

## 🗓️ SEMANA 5: REPORTS BACKEND

### Objetivo
Generar reportes diarios/semanales/mensuales con datos reales del equipo.

### 📌 DÍA 1-3: Backend Report Generation

**Crear servicio de reportes:**
```bash
□ Crear backend/src/services/reports.ts
```

**Lógica de reportes:**
```typescript
// backend/src/services/reports.ts
import prisma from '../utils/prisma.js';

interface DailyReport {
  summary: {
    period: 'day';
    dateISO: string;
    totalPlayers: number;
    activePlayers: number;
    partialPlayers: number;
    absentPlayers: number;
    avgScore: number;
    avgCompliance: number;
    totalMinutes: number;
    avgMinutesPerPlayer: number;
    topPerformers: string[];
    needsAttention: string[];
    teamSessions: TeamSession[];
  };
  players: PlayerDailyReport[];
  generatedAt: string;
}

export async function generateDailyReport(date: string): Promise<DailyReport> {
  // date format: YYYY-MM-DD
  const players = await prisma.user.findMany({
    where: { role: 'player' },
  });

  const playerReports: PlayerDailyReport[] = [];

  for (const player of players) {
    // Get workouts for this day
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId: player.id,
        date: date,
      },
    });

    // Get assignments
    const assignments = await prisma.trainingAssignment.findMany({
      where: {
        playerIds: { has: player.id },
        active: true,
      },
    });

    // Check if player attended team session today
    const sessions = await prisma.trainingSession.findMany({
      where: { date: date },
    });

    const attendance = sessions.length > 0 && sessions.some(s => {
      const checkIns = s.checkIns as any[];
      return checkIns?.some(c => c.userId === player.id);
    });

    const workoutsCompleted = workouts.length;
    const workoutsAssigned = assignments.length > 0 ? 1 : 0; // Simplified
    const compliance = workoutsAssigned > 0 ? (workoutsCompleted / workoutsAssigned) * 100 : 0;

    const minutesTrained = workouts.reduce((sum, w) => sum + (w.duration || 60), 0);

    // Get latest test scores
    const testResults = await prisma.testResult.findMany({
      where: {
        userId: player.id,
        isCurrent: true,
      },
    });

    const currentScore = testResults.length > 0
      ? testResults.reduce((sum, t) => sum + t.score, 0) / testResults.length
      : 0;

    // Determine status
    let status: 'active' | 'partial' | 'absent';
    if (workoutsCompleted >= workoutsAssigned && attendance) {
      status = 'active';
    } else if (workoutsCompleted > 0 || attendance) {
      status = 'partial';
    } else {
      status = 'absent';
    }

    playerReports.push({
      playerId: player.id,
      playerName: player.name,
      position: player.position || '',
      status,
      workoutsCompleted,
      workoutsAssigned,
      minutesTrained,
      currentScore: Math.round(currentScore),
      previousScore: 0, // Would need historical data
      scoreTrend: 0,
      compliance: Math.round(compliance),
      attendance,
      lastActive: date,
      frequencyPerWeek: assignments[0]?.template?.frequencyPerWeek || '',
    });
  }

  // Calculate summary
  const activePlayers = playerReports.filter(p => p.status === 'active').length;
  const partialPlayers = playerReports.filter(p => p.status === 'partial').length;
  const absentPlayers = playerReports.filter(p => p.status === 'absent').length;
  const avgScore = Math.round(
    playerReports.reduce((sum, p) => sum + p.currentScore, 0) / playerReports.length
  );
  const avgCompliance = Math.round(
    playerReports.reduce((sum, p) => sum + p.compliance, 0) / playerReports.length
  );
  const totalMinutes = playerReports.reduce((sum, p) => sum + p.minutesTrained, 0);

  // Get team sessions for today
  const teamSessions = await prisma.trainingSession.findMany({
    where: { date: date },
  });

  return {
    summary: {
      period: 'day',
      dateISO: date,
      totalPlayers: players.length,
      activePlayers,
      partialPlayers,
      absentPlayers,
      avgScore,
      avgCompliance,
      totalMinutes,
      avgMinutesPerPlayer: Math.round(totalMinutes / players.length),
      topPerformers: [], // Would need more logic
      needsAttention: [],
      teamSessions: teamSessions.map(s => ({
        date: s.date,
        startTime: s.time,
        endTime: '', // Would need endTime field
        playersAttended: ((s.checkIns as any[]) || []).length,
        totalPlayers: players.length,
        location: s.location,
        address: s.address || '',
      })),
    },
    players: playerReports,
    generatedAt: new Date().toISOString(),
  };
}

// Similar functions for generateWeeklyReport() and generateMonthlyReport()
```

**Backend Routes:**
```bash
□ Crear backend/src/routes/reports.ts

□ Implementar endpoints:
  - GET /api/reports/daily/:date      # Daily report (YYYY-MM-DD)
  - GET /api/reports/weekly/:date     # Weekly report (start date)
  - GET /api/reports/monthly/:month   # Monthly report (YYYY-MM)

□ Autorización: Solo coaches

□ Implementar caching (1 hora para reportes completados)

□ Registrar en backend/src/index.ts
```

### 📌 DÍA 4-5: Frontend Migration

**Tareas:**
```bash
□ Crear API client en src/services/api.ts:
  export const reportsService = {
    getDaily: (date) => api.get(`/reports/daily/${date}`),
    getWeekly: (startDate) => api.get(`/reports/weekly/${startDate}`),
    getMonthly: (month) => api.get(`/reports/monthly/${month}`),
  };

□ Eliminar funciones mock de src/services/reports.ts:
  - generateDailyReport()
  - generateWeeklyReport()
  - generateMonthlyReport()

□ Actualizar src/pages/Reports.tsx:
  - Usar reportsService API calls
  - Agregar loading states
  - Agregar error handling
  - Mantener filtros de período
  - Agregar export to PDF (opcional)

□ Solo accesible por coaches (verificar en routing)
```

### 📌 Testing Semana 5

```bash
□ Verificar reportes tienen datos correctos
□ Verificar cálculos son precisos
□ Verificar filtros de fecha funcionan
□ Verificar solo coaches pueden acceder
□ Verificar loading/error states
□ Verificar performance (< 2s)
```

**Resultado esperado:** ✅ Coaches tienen reportes reales del equipo, insights accionables

---

## 🗓️ SEMANA 6: KPI + TESTING FINAL

### Objetivo
Mover cálculos KPI al backend y realizar testing completo end-to-end.

### 📌 DÍA 1-2: KPI Backend

**Backend Service:**
```bash
□ Crear backend/src/services/kpi.ts
  - Mover lógica de src/services/kpi.ts (frontend) a backend
  - Optimizar queries con aggregations
  - Calcular una sola vez por usuario
```

**Backend Routes:**
```bash
□ Crear backend/src/routes/kpi.ts

□ Implementar endpoints:
  - GET /api/kpi/:userId              # Get user KPIs
  - POST /api/kpi/:userId/refresh     # Force recalculation
  - GET /api/kpi/team                 # Team-wide KPIs (coach only)

□ Implementar caching (TTL 1 hora)
□ Invalidar cache después de workout/test

□ Registrar en backend/src/index.ts
```

**Frontend Migration:**
```bash
□ Crear API client en src/services/api.ts:
  export const kpiService = {
    get: (userId) => api.get(`/kpi/${userId}`),
    refresh: (userId) => api.post(`/kpi/${userId}/refresh`),
    getTeam: () => api.get('/kpi/team'),
  };

□ Actualizar src/services/kpi.ts:
  - Mantener calculateKPIs() como fallback offline
  - Agregar fetchKPIsFromBackend()
  - Usar backend primero, fallback a local si offline

□ Actualizar componentes:
  - src/pages/Profile.tsx
  - MyStats components
```

### 📌 DÍA 3-4: Testing End-to-End

**Test Plan:**
```bash
□ VIDEOS
  □ Coach puede crear video
  □ Player puede ver video
  □ Progreso se guarda correctamente
  □ Sync funciona al iniciar app
  □ Offline fallback funciona

□ DRILLS & EQUIPMENT
  □ Coach puede crear/editar drills
  □ Equipment management funciona
  □ Sketch upload funciona
  □ Player solo puede ver (read-only)
  □ Sync funciona

□ TEAM SETTINGS
  □ Coach puede actualizar branding
  □ Logo upload funciona
  □ Cambios se reflejan en toda la app
  □ Sync funciona

□ LEADERBOARD
  □ Rankings son correctos
  □ Filtros funcionan (period, position)
  □ Rankings actualizan después de workout
  □ Performance < 2s

□ REPORTS
  □ Daily report tiene datos correctos
  □ Weekly report agrega correctamente
  □ Monthly report muestra tendencias
  □ Solo coaches pueden acceder
  □ Export funciona (si implementado)

□ KPI
  □ KPIs se calculan correctamente
  □ Performance mejorada vs frontend
  □ Offline fallback funciona
  □ Cache funciona

□ GENERAL
  □ No hay errores en consola
  □ No hay memory leaks
  □ App funciona offline
  □ Sync inicial < 5 segundos
  □ Todas las rutas protegidas funcionan
```

**Performance Testing:**
```bash
□ Medir tiempos de respuesta API:
  - Videos: < 200ms
  - Drills: < 200ms
  - Leaderboard: < 2s
  - Reports: < 3s
  - KPI: < 500ms

□ Medir tiempo de sync inicial:
  - Target: < 5 segundos total
  - Videos, Drills, Equipment, Settings en paralelo

□ Verificar no hay N+1 queries en backend

□ Verificar índices MongoDB están aplicados
```

### 📌 DÍA 5: Deployment & Documentation

**Deployment:**
```bash
□ Backend:
  - npx prisma generate
  - npx prisma db push (en staging primero)
  - Deploy a Railway/Render/Heroku
  - Verificar variables de entorno
  - Run smoke tests

□ Frontend:
  - npm run build
  - Deploy a Vercel/Netlify
  - Verificar API_URL apunta a backend correcto
  - Run smoke tests

□ Monitoring:
  - Configurar error tracking (Sentry/LogRocket)
  - Configurar uptime monitoring
  - Configurar alertas
```

**Documentation:**
```bash
□ Actualizar README.md:
  - Nuevas features implementadas
  - Variables de entorno requeridas
  - Pasos de setup actualizado

□ Crear DEPLOYMENT.md:
  - Pasos para deploy backend
  - Pasos para deploy frontend
  - Rollback procedure

□ Crear API_DOCS.md:
  - Documentar todos los nuevos endpoints
  - Ejemplos de requests/responses
  - Error codes

□ Actualizar BACKEND_AUDIT_REPORT.md:
  - Marcar módulos completados ✅
  - Actualizar métricas
  - Próximos pasos (Fase 3 opcional)
```

### 📌 Testing Semana 6

```bash
□ Verificar KPI calculation es correcta
□ Verificar performance mejoró
□ Verificar deployment en staging funciona
□ Verificar deployment en production funciona
□ Verificar monitoring está activo
□ Smoke tests pasan en production
```

**Resultado esperado:** ✅ Sistema completamente integrado, testeado y deployed

---

## 📊 MÉTRICAS DE PROGRESO

### Checklist General

**Semana 1: Videos** ✅ COMPLETADO
- [x] Backend routes implementados
- [x] Frontend migration completa
- [x] Testing passed
- [x] Deployed
- [x] EXTRAS: Dynamic tags system
- [x] EXTRAS: Run Concepts type
- [x] EXTRAS: YouTube URL fixes

**Semana 2: Drills & Equipment** ✅
- [ ] Drills backend implementado
- [ ] Equipment backend implementado
- [ ] Frontend migration completa
- [ ] Testing passed
- [ ] Deployed

**Semana 3: Team Settings + Cleanup** ✅
- [ ] Team Settings backend implementado
- [ ] Código obsoleto eliminado
- [ ] Frontend migration completa
- [ ] Testing passed

**Semana 4: Leaderboard** ✅
- [ ] Ranking logic implementada
- [ ] Backend routes implementados
- [ ] Frontend migration completa
- [ ] Testing passed
- [ ] Deployed

**Semana 5: Reports** ✅
- [ ] Report generation logic implementada
- [ ] Backend routes implementados
- [ ] Frontend migration completa
- [ ] Testing passed
- [ ] Deployed

**Semana 6: KPI + Testing** ✅
- [ ] KPI backend implementado
- [ ] End-to-end testing completo
- [ ] Performance testing passed
- [ ] Documentation actualizada
- [ ] Deployed to production

---

## 🎯 CRITERIOS DE ÉXITO

### Técnicos
- ✅ 95%+ de features usan backend (target: 11 de 11 módulos principales)
- ✅ API response time < 200ms (p95)
- ✅ Sync success rate > 99%
- ✅ 0 módulos usan solo mock data
- ✅ Offline support 100% funcional

### Negocio
- ✅ Coaches pueden gestionar contenido centralizado
- ✅ Players tienen datos sincronizados en todos dispositivos
- ✅ Rankings motivan competencia sana
- ✅ Reports proveen insights accionables
- ✅ System uptime > 99.5%

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgos Principales

**1. Data Migration Conflicts**
- **Riesgo:** Datos locales conflictan con backend
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:**
  - Backend wins strategy
  - Implementar conflict resolution logic
  - Testing exhaustivo en staging
  - Rollback plan preparado

**2. Performance Degradation**
- **Riesgo:** Cálculos backend son lentos
- **Probabilidad:** Baja
- **Impacto:** Medio
- **Mitigación:**
  - Caching agresivo
  - Índices MongoDB optimizados
  - Query optimization
  - Load testing antes de deploy

**3. Breaking Changes**
- **Riesgo:** Cambios rompen funcionalidad existente
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:**
  - Mantener backwards compatibility
  - Feature flags
  - Gradual rollout
  - Extensive testing

**4. Deadline Overrun**
- **Riesgo:** Implementación toma más de 6 semanas
- **Probabilidad:** Media
- **Impacto:** Medio
- **Mitigación:**
  - Buffer de 1-2 semanas
  - MVP approach (skip non-critical features)
  - Weekly progress reviews
  - Scope control estricto

---

## 📝 NOTAS FINALES

### Features Postergadas (Fase 3 - Opcional)

Estos módulos NO se implementarán en las 6 semanas pero pueden agregarse después:

1. **Weekly Points Tracking Backend**
   - Esfuerzo: 3 días
   - Impacto: Medio
   - Razón: Config ya funciona, tracking local es suficiente por ahora

2. **Notifications Real-time (WebSocket)**
   - Esfuerzo: 2 días
   - Impacto: Bajo
   - Razón: Backend ya existe, polling funciona

3. **Workout Plan Templates Backend**
   - Esfuerzo: 2 días
   - Impacto: Bajo
   - Razón: Templates hardcoded funcionan bien

4. **Benchmarks Customization**
   - Esfuerzo: 2 días
   - Impacto: Bajo
   - Razón: Hardcoded benchmarks son estándar

### Próximos Pasos Después de Semana 6

1. **Monitoring & Maintenance** (continuo)
   - Monitorear error rates
   - Optimizar queries lentas
   - Fix bugs reportados

2. **User Feedback** (semana 7)
   - Recoger feedback de coaches
   - Recoger feedback de players
   - Priorizar improvements

3. **Phase 3 Planning** (semana 8)
   - Decidir si implementar features postergadas
   - Plan de optimización
   - New features roadmap

---

## 📞 CONTACTO

**Para preguntas sobre el plan:**
- Technical Lead: [Nombre]
- Product Owner: [Nombre]
- GitHub Issues: [Link al repo]

**Para reportar problemas durante implementación:**
- Crear issue en GitHub con label `backend-integration`
- Slack channel: #rhinos-dev
- Daily standup: 10:00 AM

---

**¡Éxito con la implementación! 🚀**

*Última actualización: 2025-10-29*
