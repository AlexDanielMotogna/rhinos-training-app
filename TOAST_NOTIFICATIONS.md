# Sistema de Notificaciones Toast

Sistema completo de notificaciones implementado con `react-toastify` para toda la aplicación.

## ✅ Configuración Completada

- ✅ `react-toastify` instalado
- ✅ `ToastContainer` agregado en `App.tsx`
- ✅ Servicio centralizado creado en `src/services/toast.tsx` con iconos Material-UI
- ✅ Notificaciones implementadas en múltiples componentes (Admin, Auth, Profile, MyTraining)

## 📋 Cómo Usar

### 1. Importar el servicio

```typescript
import { toastService } from '../services/toast';
```

### 2. Usar las notificaciones

#### Notificaciones Básicas
```typescript
toastService.success('¡Operación exitosa!');
toastService.error('Algo salió mal');
toastService.info('Información importante');
toastService.warning('Advertencia');
```

#### Operaciones CRUD
```typescript
// Éxito
toastService.created('Exercise');      // "✅ Exercise created successfully!"
toastService.updated('Plan');          // "✅ Plan updated successfully!"
toastService.deleted('Training');      // "🗑️ Training deleted successfully!"
toastService.duplicated('Template');   // "📋 Template duplicated successfully!"
toastService.saved('Workout');         // "💾 Workout saved successfully!"

// Errores
toastService.createError('exercise', 'Validation failed');
toastService.updateError('plan');
toastService.deleteError('training');
toastService.loadError('data', 'Network error');
```

#### Autenticación
```typescript
toastService.loginSuccess('John Doe');  // "👋 Welcome back, John Doe!"
toastService.logoutSuccess();           // "👋 Logged out successfully"
toastService.authError('Invalid credentials');
```

#### Operaciones de Red
```typescript
toastService.syncSuccess();    // "🔄 Synced successfully!"
toastService.syncError();      // "❌ Sync failed"
toastService.offline();        // "📡 You are offline"
toastService.online();         // "📡 You are back online!"
```

#### Workouts & Sesiones
```typescript
toastService.workoutCompleted();         // "🎉 Workout completed!"
toastService.workoutStarted('Leg Day');  // "🏋️ Starting: Leg Day"
toastService.checkInSuccess();           // "✅ Checked in successfully!"
toastService.checkInError();             // "❌ Check-in failed"
```

#### Asignaciones
```typescript
toastService.assigned('Template', 'Team A');  // "✅ Template assigned to Team A"
toastService.unassigned('Player');            // "✅ Player unassigned"
```

#### Otras Utilidades
```typescript
toastService.validationError('Please fill all fields');
toastService.copied('Link');              // "📋 Link copied to clipboard"
toastService.permissionDenied();          // "🔒 No permission"
```

#### Promesas (para operaciones async)
```typescript
const promise = fetchData();
toastService.promise(promise, {
  pending: 'Loading...',
  success: 'Data loaded successfully!',
  error: 'Failed to load data'
});
```

#### Loading States
```typescript
const toastId = toastService.loading('Saving...');
// ... hacer algo
toastService.update(toastId, 'success', 'Saved successfully!');
```

## 🎯 Lugares donde Agregar Notificaciones

### Alta Prioridad (Ya implementados o por implementar)

#### MyTraining.tsx ✅
- ✅ Eliminar plan
- ✅ Duplicar plan
- ✅ Crear plan (PlanBuilderDialog)
- ✅ Editar plan (PlanBuilderDialog)
- ✅ Completar workout
- ✅ Guardar workout
- ✅ Validaciones de plan (nombre vacío, sin ejercicios)

#### Admin.tsx ✅
- ✅ Crear/Editar/Eliminar ejercicio
- ✅ Crear/Editar/Eliminar training type
- ✅ Crear/Eliminar team session
- ✅ Actualizar policies
- ✅ Actualizar team settings
- ✅ Actualizar AI coach configuration
- ✅ Crear/Editar/Eliminar template
- ✅ Crear/Editar/Eliminar assignment

#### Auth.tsx ✅
- ✅ Login exitoso
- ✅ Login fallido
- ✅ Registro exitoso
- ✅ Registro fallido
- ✅ Logout
- ✅ Validación de password

#### Profile.tsx ✅
- ✅ Actualizar perfil
- ✅ Error al actualizar perfil
- ✅ Actualizar privacy settings
- ✅ Validación de teléfono

#### TrainingSessions.tsx ✅
- ✅ Crear/Editar/Eliminar sesión
- ✅ Check-in exitoso/fallido

#### Attendance.tsx ✅
- ✅ Marcar asistencia (check-in)
- ✅ Votar en poll de asistencia (AttendancePollModal)

#### Admin - Templates ✅
- ✅ Crear/Editar/Eliminar template (already implemented in Admin.tsx)
- ✅ Asignar template a jugadores (already implemented in Admin.tsx)

#### DrillManager.tsx ✅
- ✅ Crear/Editar drill
- ✅ Eliminar drill
- ✅ Subir sketch
- ✅ Error al subir sketch

#### DrillCategoryManager.tsx ✅
- ✅ Crear/Editar/Eliminar categoría
- ✅ Seed categorías por defecto

### Media Prioridad

#### WorkoutHistory.tsx ✅
- ✅ Eliminar workout log (handled in MyTraining.tsx)
- ✅ Editar workout log (handled in MyTraining.tsx)

#### Reports.tsx ✅
- ✅ No aplica - componente solo de lectura, no hay operaciones de crear/eliminar

#### VideosAdmin.tsx ✅
- ✅ Crear/Editar video
- ✅ Eliminar video
- ✅ Toggle status (published/draft)
- ✅ Error al guardar/eliminar

### Baja Prioridad

#### Sync Operations ✅
- ✅ Online/Offline detection (toastService.online() / toastService.offline())
- ✅ Background sync success/failure (toastService.syncSuccess() / toastService.syncError())

#### Tests ✅
- ✅ Auto-guardado silencioso (no requiere toast - UX intencional)
- ✅ Sync en background sin notificaciones

## 🎨 Personalización

El servicio toast está configurado con:
- ⏱️ AutoClose: 3 segundos (5 para errores)
- 📍 Position: top-right
- 🎨 Theme: colored
- 🖱️ Draggable: sí
- ⏸️ PauseOnHover: sí

Para cambiar estas opciones, edita `src/services/toast.ts` o pasa opciones personalizadas:

```typescript
toastService.success('¡Éxito!', {
  autoClose: 5000,
  position: 'bottom-center',
  theme: 'dark'
});
```

## 📝 Ejemplo Completo

```typescript
const handleDeleteExercise = async (exerciseId: string) => {
  if (!window.confirm('¿Seguro que quieres eliminar este ejercicio?')) {
    return;
  }

  try {
    const toastId = toastService.loading('Deleting exercise...');
    await deleteExercise(exerciseId);
    toastService.update(toastId, 'success', '✅ Exercise deleted!');
    // O simplemente:
    // toastService.deleted('Exercise');
    await refreshExercises();
  } catch (error) {
    toastService.deleteError('exercise', error.message);
  }
};
```

## 🔗 Documentación Completa

Ver la documentación completa de react-toastify:
https://fkhadra.github.io/react-toastify/introduction
