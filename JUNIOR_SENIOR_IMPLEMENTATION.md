# Junior/Senior Age Groups Implementation Plan

**Branch:** `feature/junior-senior-support`
**Created:** 2025-11-12
**Status:** 🚧 In Progress

## Objetivo

Implementar soporte para dos categorías de edad (Juniors y Seniors) con separación automática de contenido:
- Usuarios seleccionan su categoría al registrarse
- El sistema automáticamente muestra solo contenido relevante para su grupo
- Leaderboards completamente separados
- Planes y sesiones pueden ser para ambos grupos o específicos
- Juniors solo interactúan con juniors en sesiones privadas

---

## Fase 1: Análisis y Verificación de Código Existente

### 🔍 Archivos Críticos a Revisar
- [x] Verificar todas las queries de `User` en backend
- [x] Verificar queries de `TrainingTemplate`
- [x] Verificar queries de `TrainingSession`
- [x] Verificar queries de `TrainingAssignment`
- [x] Verificar queries de `PlayerWeeklyPoints` (leaderboard)
- [x] Verificar componentes frontend que usan `currentUser`
- [x] Verificar sistema de puntos y compliance
- [x] Verificar sistema de asignación de planes

### ✅ Backwards Compatibility Checklist
- [x] Plan para usuarios existentes sin `ageGroup` (tratarlos como 'both')
- [x] Plan para templates existentes sin `targetAgeGroup` (default 'both')
- [x] Plan para sesiones existentes sin `targetAgeGroup` (default 'both')
- [x] Verificar que queries con WHERE ageGroup no rompan con valores null

### 🔴 **BUG CRÍTICO ENCONTRADO - DEBE ARREGLARSE PRIMERO**

**Archivo:** `backend/src/routes/assignments.ts`
**Línea:** 97
**Problema:** El código usa `assignment.playerId` pero el schema define `playerIds` (array)

```typescript
// ACTUAL (INCORRECTO):
if (req.user.role === 'player' && assignment.playerId !== req.user.userId) {

// DEBE SER:
if (req.user.role === 'player' && !assignment.playerIds.includes(req.user.userId)) {
```

**Impacto:** Players no pueden ver detalles de assignments individuales (endpoint GET /:id falla)
**Prioridad:** 🔴 **CRÍTICA** - Arreglar antes de continuar

### 📊 Análisis Completado

**Resumen de Hallazgos:**
- ✅ **1 BUG CRÍTICO** encontrado (assignments.ts línea 97)
- ✅ **0 BREAKING CHANGES** para implementación de age groups
- ✅ **Todos los campos serán nullable/optional** - backwards compatible
- ✅ **Defaults a 'both'** aseguran que contenido existente sea visible
- ✅ **TypeScript ayudará** a detectar problemas en compile time

**Archivos que Necesitan Modificación:**
- Backend: 8 archivos principales
- Frontend: 5 archivos principales
- Total estimado: ~20 archivos

**Nivel de Riesgo:** MEDIO-BAJO (con implementación cuidadosa)

---

## Fase 1.5: ✅ ARREGLAR BUG CRÍTICO (COMPLETADO)

### 📋 Archivo a Modificar
- [x] `backend/src/routes/assignments.ts` (línea 97)

### Fix del Bug
**Ubicación:** Línea 97

```typescript
// ANTES (INCORRECTO):
if (req.user.role === 'player' && assignment.playerId !== req.user.userId) {
  return res.status(403).json({ error: 'Access denied' });
}

// DESPUÉS (CORRECTO):
if (req.user.role === 'player' && !assignment.playerIds.includes(req.user.userId)) {
  return res.status(403).json({ error: 'Access denied' });
}
```

### ✅ Criterios de Éxito Fase 1.5
- [x] Bug arreglado en línea 97
- [x] Código compila sin errores
- [x] Backend arranca correctamente
- [ ] Test manual: Player puede ver sus assignments (pendiente de probar)

### 🧪 Test Manual
- [ ] Login como player
- [ ] Navegar a My Training
- [ ] Click en un assignment específico
- [ ] Verificar que no hay error 403
- [ ] Verificar que se muestran detalles del assignment

**✅ COMPLETADO:** Bug arreglado. Ahora podemos continuar con age groups de forma segura.

---

## Fase 2: Database Schema Changes

### 📋 Archivos a Modificar
- [ ] `backend/prisma/schema.prisma`

### Cambios en Schema

#### User Model
```prisma
model User {
  // ... campos existentes ...
  ageGroup        String?  // 'junior' | 'senior' (null para coaches y backwards compatibility)
}
```

#### TrainingTemplate Model
```prisma
model TrainingTemplate {
  // ... campos existentes ...
  targetAgeGroup  String   @default("both")  // 'both' | 'junior' | 'senior'
}
```

#### TrainingSession Model
```prisma
model TrainingSession {
  // ... campos existentes ...
  targetAgeGroup  String   @default("both")  // 'both' | 'junior' | 'senior'
}
```

#### PlayerWeeklyPoints Model (si necesita cambios)
```prisma
model PlayerWeeklyPoints {
  // ... campos existentes ...
  ageGroup        String?  // Para filtrar leaderboard por grupo
}
```

### 🔨 Comandos
- [ ] `cd backend && npx prisma db push`
- [ ] Verificar que el schema se aplicó correctamente en MongoDB
- [ ] Probar que usuarios existentes siguen funcionando

### ✅ Criterios de Éxito Fase 2
- [ ] Schema actualizado sin errores
- [ ] Campos agregados correctamente a MongoDB
- [ ] Backend arranca sin problemas
- [ ] Usuarios existentes pueden seguir logueándose
- [ ] No hay errores en console

---

## Fase 3: Backend - Auth System

### 📋 Archivos a Modificar
- [ ] `backend/src/routes/auth.ts`

### Cambios Detallados

#### 3.1 Signup Schema
**Ubicación:** `backend/src/routes/auth.ts` (líneas ~42-60)

```typescript
const signupSchema = z.object({
  // ... campos existentes ...
  ageGroup: z.enum(['junior', 'senior']).optional(), // Solo para players
});
```

#### 3.2 User Creation
**Ubicación:** `backend/src/routes/auth.ts` (líneas ~70-100)

```typescript
const user = await prisma.user.create({
  data: {
    // ... campos existentes ...
    ageGroup: data.role === 'player' ? data.ageGroup : null, // Solo players tienen ageGroup
  },
});
```

#### 3.3 Response Include ageGroup
**Ubicación:** `backend/src/routes/auth.ts` (response objects)

```typescript
return res.status(201).json({
  token,
  user: {
    // ... campos existentes ...
    ageGroup: user.ageGroup,
  },
});
```

### ✅ Criterios de Éxito Fase 3
- [ ] Signup acepta campo `ageGroup`
- [ ] ageGroup se guarda correctamente en DB
- [ ] Login devuelve ageGroup en respuesta
- [ ] Coaches no tienen ageGroup (null)
- [ ] Players sin ageGroup (legacy) siguen funcionando
- [ ] Validación rechaza valores inválidos

### 🧪 Tests Manuales
- [ ] Crear nuevo player junior → verificar ageGroup='junior'
- [ ] Crear nuevo player senior → verificar ageGroup='senior'
- [ ] Crear nuevo coach → verificar ageGroup=null
- [ ] Login con player existente → verificar que funciona

---

## Fase 4: Backend - Leaderboard Filtering

### 📋 Archivos a Modificar
- [ ] `backend/src/routes/leaderboard.ts`

### Cambios Detallados

#### 4.1 Obtener ageGroup del Usuario Autenticado
**Ubicación:** `backend/src/routes/leaderboard.ts` (líneas ~40-50)

```typescript
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    // Get user's age group
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { ageGroup: true, role: true },
    });

    // ... continuar con query
  }
});
```

#### 4.2 Filtrar PlayerWeeklyPoints por ageGroup
**Ubicación:** `backend/src/routes/leaderboard.ts` (líneas ~46-55)

```typescript
// Solo filtrar si es player con ageGroup definido
const whereClause: any = { week: currentWeek };
if (currentUser?.role === 'player' && currentUser.ageGroup) {
  // Players ven solo su grupo
  whereClause.ageGroup = currentUser.ageGroup;
}
// Coaches ven todos (no agregar filtro)

const weeklyPoints = await prisma.playerWeeklyPoints.findMany({
  where: whereClause,
  orderBy: { totalPoints: 'desc' },
});
```

#### 4.3 Actualizar Cálculo de Puntos (si necesario)
**Ubicación:** Verificar donde se crean/actualizan `PlayerWeeklyPoints`

- [ ] Encontrar donde se crean registros de `PlayerWeeklyPoints`
- [ ] Asegurar que se guarda `ageGroup` del usuario
- [ ] Verificar que puntos existentes siguen funcionando

### ✅ Criterios de Éxito Fase 4
- [ ] Junior ve solo leaderboard de juniors
- [ ] Senior ve solo leaderboard de seniors
- [ ] Coach ve leaderboard completo (ambos grupos)
- [ ] Players sin ageGroup ven leaderboard completo (backwards compatibility)
- [ ] Puntos se calculan correctamente para ambos grupos

### 🧪 Tests Manuales
- [ ] Login como junior → ver solo juniors en leaderboard
- [ ] Login como senior → ver solo seniors en leaderboard
- [ ] Login como coach → ver todos en leaderboard
- [ ] Login como player legacy (sin ageGroup) → ver todos

---

## Fase 5: Backend - Templates & Assignments Filtering

### 📋 Archivos a Modificar
- [ ] `backend/src/routes/templates.ts`
- [ ] `backend/src/routes/assignments.ts`

### Cambios Detallados

#### 5.1 Templates - Agregar targetAgeGroup al Schema
**Ubicación:** `backend/src/routes/templates.ts` (create/update schemas)

```typescript
const createTemplateSchema = z.object({
  // ... campos existentes ...
  targetAgeGroup: z.enum(['both', 'junior', 'senior']).default('both'),
});
```

#### 5.2 Templates - Filtrado en GET
**Ubicación:** `backend/src/routes/templates.ts` (GET route)

```typescript
// GET /api/templates - Solo mostrar templates apropiados
router.get('/', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const whereClause: any = { isActive: true };

  // Si es player con ageGroup, filtrar templates
  if (user?.role === 'player' && user.ageGroup) {
    whereClause.targetAgeGroup = { in: ['both', user.ageGroup] };
  }
  // Coaches ven todos los templates

  const templates = await prisma.trainingTemplate.findMany({ where: whereClause });
  // ...
});
```

#### 5.3 Assignments - Validación al Asignar
**Ubicación:** `backend/src/routes/assignments.ts` (CREATE assignment)

```typescript
// Validar que los players tienen el ageGroup correcto para el template
const template = await prisma.trainingTemplate.findUnique({ where: { id: templateId } });
const players = await prisma.user.findMany({ where: { id: { in: playerIds } } });

if (template.targetAgeGroup !== 'both') {
  const invalidPlayers = players.filter(p => p.ageGroup !== template.targetAgeGroup);
  if (invalidPlayers.length > 0) {
    return res.status(400).json({
      error: `Cannot assign ${template.targetAgeGroup} template to players of different age group`,
      invalidPlayers: invalidPlayers.map(p => p.name),
    });
  }
}
```

#### 5.4 Assignments - Filtrado en GET
**Ubicación:** `backend/src/routes/assignments.ts` (GET route)

```typescript
// Al obtener assignments, filtrar por ageGroup del player
router.get('/', authenticate, async (req, res) => {
  const userId = (req as any).user.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  let assignments = await prisma.trainingAssignment.findMany({
    where: { active: true },
    include: { template: true },
  });

  // Si es player, filtrar assignments apropiados
  if (user?.role === 'player') {
    assignments = assignments.filter(a => {
      const template = a.template;
      return template.targetAgeGroup === 'both' || template.targetAgeGroup === user.ageGroup;
    });
  }

  res.json(assignments);
});
```

### ✅ Criterios de Éxito Fase 5
- [ ] Templates pueden crearse con targetAgeGroup
- [ ] Junior ve solo templates para juniors/both
- [ ] Senior ve solo templates para seniors/both
- [ ] Coach ve todos los templates
- [ ] Asignaciones validan ageGroup correctamente
- [ ] No se puede asignar plan junior a senior (y viceversa)
- [ ] Templates existentes tienen default 'both'

### 🧪 Tests Manuales
- [ ] Coach crea template para juniors → solo juniors lo ven
- [ ] Coach crea template para seniors → solo seniors lo ven
- [ ] Coach crea template para both → todos lo ven
- [ ] Intentar asignar template junior a senior → error
- [ ] Player junior ve solo sus templates apropiados

---

## Fase 6: Backend - Training Sessions Filtering

### 📋 Archivos a Modificar
- [ ] `backend/src/routes/trainings.ts`

### Cambios Detallados

#### 6.1 Agregar targetAgeGroup al Schema
**Ubicación:** `backend/src/routes/trainings.ts` (create schema, líneas ~14-28)

```typescript
const createTrainingSchema = z.object({
  // ... campos existentes ...
  targetAgeGroup: z.enum(['both', 'junior', 'senior']).default('both'),
});
```

#### 6.2 Filtrado Automático en GET
**Ubicación:** `backend/src/routes/trainings.ts` (GET /api/trainings, líneas ~34-66)

```typescript
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { from, days } = req.query;

    let filter: any = {};

    // Filtro por fecha (existente)
    if (from && days) {
      // ... código existente ...
    }

    // Filtrar por ageGroup del usuario
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user?.role === 'player' && user.ageGroup) {
        // Players ven solo sesiones para su grupo o 'both'
        filter.targetAgeGroup = { in: ['both', user.ageGroup] };
      }
      // Coaches ven todas las sesiones
    }

    const sessions = await prisma.trainingSession.findMany({
      where: filter,
      orderBy: { date: 'asc' },
    });

    res.json(sessions.map(s => ({
      ...s,
      attendees: s.attendees as any,
      version: 1,
      updatedAt: s.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Get trainings error:', error);
    res.status(500).json({ error: 'Failed to fetch training sessions' });
  }
});
```

#### 6.3 Auto-asignar targetAgeGroup en CREATE (Private Sessions)
**Ubicación:** `backend/src/routes/trainings.ts` (POST route, líneas ~97-184)

```typescript
router.post('/', async (req, res) => {
  try {
    const data = createTrainingSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Auto-asignar targetAgeGroup para sesiones privadas
    let targetAgeGroup = data.targetAgeGroup || 'both';
    if (data.sessionCategory === 'private' && user.ageGroup) {
      // Private sessions heredan ageGroup del creador
      targetAgeGroup = user.ageGroup;
    }

    const session = await prisma.trainingSession.create({
      data: {
        creatorId: userId,
        creatorName: user.name,
        sessionCategory: data.sessionCategory,
        type: data.type,
        title: data.title,
        location: data.location,
        address: data.address,
        date: data.date,
        time: data.time,
        description: data.description,
        attendees: data.attendees as any,
        targetAgeGroup, // NUEVO
      },
    });

    // ... resto del código (poll creation, notifications, etc.)
  }
});
```

#### 6.4 Validación en RSVP (Private Sessions)
**Ubicación:** `backend/src/routes/trainings.ts` (POST /:id/rsvp, líneas ~256-314)

```typescript
router.post('/:id/rsvp', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, status } = req.body;

    // ... validaciones existentes ...

    const session = await prisma.trainingSession.findUnique({ where: { id } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Validar ageGroup para private sessions
    if (session.sessionCategory === 'private' && session.targetAgeGroup !== 'both') {
      if (user.ageGroup !== session.targetAgeGroup) {
        return res.status(403).json({
          error: `This session is only for ${session.targetAgeGroup} players`,
        });
      }
    }

    // ... resto del código existente ...
  }
});
```

### ✅ Criterios de Éxito Fase 6
- [ ] Team sessions pueden crearse con targetAgeGroup específico
- [ ] Private sessions automáticamente heredan ageGroup del creador
- [ ] Junior solo ve sesiones para juniors/both
- [ ] Senior solo ve sesiones para seniors/both
- [ ] Coach ve todas las sesiones
- [ ] Junior no puede hacer RSVP a sesión de seniors
- [ ] Senior no puede hacer RSVP a sesión de juniors
- [ ] Sesiones existentes tienen default 'both'

### 🧪 Tests Manuales
- [ ] Coach crea team session para juniors → solo juniors la ven
- [ ] Junior crea private session → solo juniors pueden unirse
- [ ] Senior crea private session → solo seniors pueden unirse
- [ ] Coach crea session para 'both' → todos la ven
- [ ] Intentar que junior haga RSVP a sesión de seniors → error

---

## Fase 7: Frontend - TypeScript Types

### 📋 Archivos a Modificar
- [ ] `src/services/api.ts`
- [ ] `src/services/userProfile.ts`
- [ ] `src/types/trainingSession.ts`
- [ ] `src/types/template.ts` (si existe)

### Cambios Detallados

#### 7.1 API Types
**Archivo:** `src/services/api.ts`

```typescript
// Agregar ageGroup a SignupData
export interface SignupData {
  email: string;
  password: string;
  name: string;
  role: 'player' | 'coach';
  coachCode?: string;
  jerseyNumber?: number;
  birthDate?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  position?: string;
  sex?: 'male' | 'female';
  ageGroup?: 'junior' | 'senior'; // NUEVO
}

// Agregar ageGroup a AuthResponse
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'player' | 'coach';
    // ... otros campos ...
    ageGroup?: 'junior' | 'senior'; // NUEVO
  };
}
```

#### 7.2 User Profile Types
**Archivo:** `src/services/userProfile.ts`

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'player' | 'coach';
  // ... otros campos existentes ...
  ageGroup?: 'junior' | 'senior'; // NUEVO
}
```

#### 7.3 Training Session Types
**Archivo:** `src/types/trainingSession.ts`

```typescript
export interface TrainingSession {
  id: string;
  creatorId: string;
  creatorName: string;
  sessionCategory: SessionCategory;
  type: SessionType;
  title: string;
  location: string;
  address?: string;
  date: string;
  time: string;
  description?: string;
  attendees: Attendee[];
  checkIns?: CheckIn[];
  createdAt: string;
  targetAgeGroup?: 'both' | 'junior' | 'senior'; // NUEVO
}
```

#### 7.4 Helper Types
**Archivo:** Crear `src/types/ageGroup.ts` (NUEVO)

```typescript
export type AgeGroup = 'junior' | 'senior';
export type TargetAgeGroup = 'both' | 'junior' | 'senior';
```

### ✅ Criterios de Éxito Fase 7
- [ ] No hay errores de TypeScript
- [ ] Todos los tipos están actualizados
- [ ] IDE muestra autocompletado correcto para ageGroup
- [ ] Builds sin warnings

### 🧪 Tests
- [ ] `npm run build` → sin errores TypeScript
- [ ] VSCode no muestra errores en archivos modificados

---

## Fase 8: Frontend - Auth UI (Signup)

### 📋 Archivos a Modificar
- [ ] `src/pages/Auth.tsx`
- [ ] `src/i18n/messages/en.ts`
- [ ] `src/i18n/messages/de.ts`

### Cambios Detallados

#### 8.1 Agregar State para ageGroup
**Ubicación:** `src/pages/Auth.tsx` (state declarations)

```typescript
const [formData, setFormData] = useState({
  // ... campos existentes ...
  ageGroup: 'junior' as 'junior' | 'senior',
});
```

#### 8.2 Agregar Selector en UI
**Ubicación:** `src/pages/Auth.tsx` (render signup form)

```tsx
{/* Mostrar selector de ageGroup solo si role es 'player' */}
{formData.role === 'player' && (
  <FormControl fullWidth sx={{ mb: 2 }}>
    <InputLabel>{t('auth.ageGroup')}</InputLabel>
    <Select
      value={formData.ageGroup}
      onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value as 'junior' | 'senior' })}
      label={t('auth.ageGroup')}
    >
      <MenuItem value="junior">{t('auth.junior')}</MenuItem>
      <MenuItem value="senior">{t('auth.senior')}</MenuItem>
    </Select>
  </FormControl>
)}
```

#### 8.3 Incluir ageGroup en Signup Request
**Ubicación:** `src/pages/Auth.tsx` (handleSignup function)

```typescript
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const signupData: SignupData = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role: formData.role,
      // ... otros campos ...
      ageGroup: formData.role === 'player' ? formData.ageGroup : undefined, // Solo para players
    };

    const response = await authService.signup(signupData);
    // ... resto del código ...
  }
};
```

#### 8.4 Agregar Traducciones
**Archivo:** `src/i18n/messages/en.ts`

```typescript
export const en = {
  // ... traducciones existentes ...
  'auth.ageGroup': 'Age Group',
  'auth.junior': 'Junior',
  'auth.senior': 'Senior',
  'auth.selectAgeGroup': 'Select your age group',
};
```

**Archivo:** `src/i18n/messages/de.ts`

```typescript
export const de = {
  // ... traducciones existentes ...
  'auth.ageGroup': 'Altersgruppe',
  'auth.junior': 'Junior',
  'auth.senior': 'Senior',
  'auth.selectAgeGroup': 'Wählen Sie Ihre Altersgruppe',
};
```

### ✅ Criterios de Éxito Fase 8
- [ ] Selector aparece solo cuando role='player'
- [ ] Default es 'junior'
- [ ] Selector desaparece si cambian a coach
- [ ] ageGroup se envía correctamente en signup
- [ ] Traducciones funcionan en inglés y alemán
- [ ] UI se ve bien en mobile y desktop

### 🧪 Tests Manuales
- [ ] Signup como coach → no ver selector ageGroup
- [ ] Signup como player → ver selector ageGroup
- [ ] Cambiar de player a coach → selector desaparece
- [ ] Registrar junior → verificar en DB que ageGroup='junior'
- [ ] Registrar senior → verificar en DB que ageGroup='senior'
- [ ] Cambiar idioma → traducciones correctas

---

## Fase 9: Frontend - Admin/Coach UI (Creating Plans & Sessions)

### 📋 Archivos a Modificar
- [ ] `src/pages/Admin.tsx`
- [ ] `src/i18n/messages/en.ts`
- [ ] `src/i18n/messages/de.ts`

### Cambios Detallados

#### 9.1 Training Builder - Agregar Selector targetAgeGroup
**Ubicación:** `src/pages/Admin.tsx` (Training Builder section)

```tsx
// State para targetAgeGroup
const [targetAgeGroup, setTargetAgeGroup] = useState<'both' | 'junior' | 'senior'>('both');

// En el formulario de crear template
<FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel>{t('admin.targetAgeGroup')}</InputLabel>
  <Select
    value={targetAgeGroup}
    onChange={(e) => setTargetAgeGroup(e.target.value as any)}
    label={t('admin.targetAgeGroup')}
  >
    <MenuItem value="both">{t('admin.targetAll')}</MenuItem>
    <MenuItem value="junior">{t('admin.targetJuniors')}</MenuItem>
    <MenuItem value="senior">{t('admin.targetSeniors')}</MenuItem>
  </Select>
</FormControl>
```

#### 9.2 Team Sessions - Agregar Selector targetAgeGroup
**Ubicación:** `src/pages/Admin.tsx` (Team Sessions creation dialog)

Similar al anterior, agregar selector en el dialog de crear sesión de equipo.

#### 9.3 Assignments - Mostrar Age Group de Jugadores
**Ubicación:** `src/pages/Admin.tsx` (player selection para assignments)

```tsx
// Mostrar badge de ageGroup junto al nombre del jugador
<Chip
  label={player.ageGroup === 'junior' ? 'Junior' : 'Senior'}
  size="small"
  color={player.ageGroup === 'junior' ? 'primary' : 'secondary'}
  sx={{ ml: 1 }}
/>
```

#### 9.4 Agregar Traducciones
**Archivo:** `src/i18n/messages/en.ts`

```typescript
export const en = {
  // ... existentes ...
  'admin.targetAgeGroup': 'Target Age Group',
  'admin.targetAll': 'All Players (Juniors & Seniors)',
  'admin.targetJuniors': 'Juniors Only',
  'admin.targetSeniors': 'Seniors Only',
  'admin.ageGroupBadge': 'Age Group',
};
```

**Archivo:** `src/i18n/messages/de.ts`

```typescript
export const de = {
  // ... existentes ...
  'admin.targetAgeGroup': 'Ziel-Altersgruppe',
  'admin.targetAll': 'Alle Spieler (Junioren & Senioren)',
  'admin.targetJuniors': 'Nur Junioren',
  'admin.targetSeniors': 'Nur Senioren',
  'admin.ageGroupBadge': 'Altersgruppe',
};
```

### ✅ Criterios de Éxito Fase 9
- [ ] Coach puede seleccionar targetAgeGroup al crear templates
- [ ] Coach puede seleccionar targetAgeGroup al crear sesiones de equipo
- [ ] Se muestra badge de ageGroup junto a cada jugador
- [ ] Default es 'both' para templates y sesiones
- [ ] Traducciones correctas en ambos idiomas

### 🧪 Tests Manuales
- [ ] Crear template para juniors → selector funciona
- [ ] Crear template para seniors → selector funciona
- [ ] Crear template para both → selector funciona
- [ ] Ver lista de jugadores → badges visibles
- [ ] Cambiar idioma → traducciones correctas

---

## Fase 10: Frontend - Verificación de Filtrado Automático

### 📋 Archivos a Verificar (NO modificar, solo testear)
- [ ] `src/pages/Leaderboard.tsx`
- [ ] `src/pages/MyTraining.tsx`
- [ ] `src/pages/TrainingSessions.tsx`

### Tests de Integración

#### 10.1 Leaderboard
- [ ] Login como junior → ver solo juniors en ranking
- [ ] Login como senior → ver solo seniors en ranking
- [ ] Login como coach → ver todos los jugadores
- [ ] Verificar que puntos se muestran correctamente

#### 10.2 My Training
- [ ] Login como junior → ver solo planes para juniors/both
- [ ] Login como senior → ver solo planes para seniors/both
- [ ] Login como coach → ver todos los planes
- [ ] Verificar que assignments se filtran correctamente

#### 10.3 Training Sessions
- [ ] Login como junior → ver solo sesiones para juniors/both
- [ ] Login como senior → ver solo sesiones para seniors/both
- [ ] Login como coach → ver todas las sesiones
- [ ] Junior intenta unirse a sesión de seniors → debe fallar
- [ ] Senior intenta unirse a sesión de juniors → debe fallar

### ✅ Criterios de Éxito Fase 10
- [ ] Filtrado funciona automáticamente sin cambios en UI
- [ ] No hay errores en console
- [ ] Datos se cargan correctamente
- [ ] Validaciones de RSVP funcionan
- [ ] UX es fluida y transparente

---

## Fase 11: Testing Completo & Backwards Compatibility

### 🧪 Tests con Usuarios Legacy (sin ageGroup)

#### 11.1 Crear Usuario Legacy en DB
```javascript
// Manualmente en MongoDB o via script
db.users.insertOne({
  email: "legacy@test.com",
  name: "Legacy Player",
  role: "player",
  // ageGroup: null (no incluir el campo)
  // ... otros campos requeridos
});
```

#### 11.2 Tests
- [ ] Login como legacy player → no errores
- [ ] Ver leaderboard → funciona (ve todos o comportamiento definido)
- [ ] Ver training plans → funciona
- [ ] Ver sessions → funciona
- [ ] Puede hacer RSVP → funciona

### 🧪 Tests con Templates/Sessions Legacy (sin targetAgeGroup)

#### 11.3 Verificar Default Values
- [ ] Templates existentes tienen targetAgeGroup='both' (por default)
- [ ] Sessions existentes tienen targetAgeGroup='both' (por default)
- [ ] Legacy templates son visibles para todos

### 🧪 Tests de Edge Cases
- [ ] Coach crea template para juniors, intenta asignar a senior → error apropiado
- [ ] Junior intenta crear private session → auto-asignado a juniors
- [ ] Senior intenta crear private session → auto-asignado a seniors
- [ ] Usuario cambia de junior a senior (manualmente en DB) → ve contenido correcto
- [ ] Session 'both' acepta RSVP de ambos grupos

### ✅ Criterios de Éxito Fase 11
- [ ] 0 breaking changes para usuarios existentes
- [ ] Backwards compatibility perfecta
- [ ] Edge cases manejados correctamente
- [ ] No hay data loss

---

## Fase 12: Commit & Merge

### 📝 Pre-merge Checklist
- [ ] Todos los tests manuales pasados
- [ ] No hay errores en console (frontend)
- [ ] No hay errores en logs (backend)
- [ ] TypeScript compila sin errores
- [ ] Build production exitoso
- [ ] Verificar que no rompió funcionalidad existente

### 🔨 Comandos
```bash
# Verificar estado
git status

# Agregar todos los cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: Add junior/senior age groups with automatic content filtering

- Add ageGroup field to User model (junior | senior)
- Add targetAgeGroup to TrainingTemplate and TrainingSession
- Implement automatic filtering of leaderboard, plans, and sessions by age group
- Add age group selection to signup flow
- Add target age group selector for coaches creating content
- Separate leaderboards for juniors and seniors
- Validate private sessions: juniors only with juniors, seniors only with seniors
- Full backwards compatibility for existing users/data

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin feature/junior-senior-support
```

### 🔄 Merge a Main
- [ ] Crear Pull Request en GitHub
- [ ] Review de cambios
- [ ] Aprobar PR
- [ ] Merge a main
- [ ] Verificar en producción

### 🛑 Rollback Plan (si algo sale mal)
```bash
# Volver a main
git checkout main

# Si ya se hizo merge y hay problemas
git revert <commit-hash>
git push origin main

# O rollback completo
git reset --hard <commit-antes-del-merge>
git push origin main --force # ⚠️ Solo en emergencia
```

---

## Notas Importantes

### ⚠️ Cuidados Especiales
1. **Siempre probar con usuarios legacy** (sin ageGroup) antes de avanzar
2. **Verificar queries de DB** - que WHERE clauses con null no rompan nada
3. **Default values** - asegurar que 'both' sea el default en targetAgeGroup
4. **Coaches** - nunca tienen ageGroup, siempre pueden ver todo
5. **Private sessions** - validación estricta de age group

### 🐛 Si Algo Sale Mal
1. **No entrar en pánico** - estamos en branch separado
2. **Revisar logs** - backend console y browser console
3. **Verificar DB** - que schema se aplicó correctamente
4. **Rollback a commit anterior** en el branch
5. **Pedir ayuda** si es necesario

### 📊 Métricas de Éxito
- ✅ 0 breaking changes
- ✅ Separación completa de contenido por age group
- ✅ UX transparente (automática)
- ✅ Backwards compatibility al 100%
- ✅ Coaches pueden gestionar ambos grupos fácilmente

---

## Estado Actual

**Última actualización:** 2025-11-12
**Fase actual:** Fase 1 - Análisis
**Próximo paso:** Verificar código existente antes de tocar schema

---

## Log de Cambios

### 2025-11-12
- ✅ Branch `feature/junior-senior-support` creado
- ✅ Documento de implementación creado
- ⏳ Iniciando Fase 1: Análisis
