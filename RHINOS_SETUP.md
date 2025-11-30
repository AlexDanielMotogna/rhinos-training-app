# Rhinos Training App - Setup Instructions

## 🏈 Configuración Inicial para USR Rhinos

### Paso 1: Inicializar Categorías del Equipo

Para configurar las categorías de los Rhinos (Kampfmannschaft y Jugend):

1. **Acceder al Panel de Admin:**
   - Iniciar sesión como entrenador/coach
   - Navegar a: **Admin → System → Age Categories**

2. **Agregar las Categorías:**
   - Click en "Add Category"
   - Agregar: **Kampfmannschaft**
   - Click en "Add Category" nuevamente
   - Agregar: **Jugend**

**O usar el método rápido de inicialización por defecto:**
- Si está vacío, el botón "Initialize Default Categories" aparecerá
- Esto agregará categorías estándar de fútbol americano
- Luego puedes **eliminar todas** y agregar solo:
  - Kampfmannschaft
  - Jugend

### Paso 2: Registro de Usuarios

Una vez configuradas las categorías, **todos los nuevos usuarios** (jugadores y entrenadores) deberán:

#### **Para Jugadores:**
Durante el registro, seleccionar su categoría:
- ☑️ **Kampfmannschaft** (equipo principal)
- ☑️ **Jugend** (juventud)

#### **Para Entrenadores:**
Durante el registro, seleccionar las categorías que entrenan (pueden seleccionar múltiples):
- ☑️ Kampfmannschaft
- ☑️ Jugend
- ☑️ Ambas (con checkboxes)

---

## 📋 Características del Sistema de Categorías

### **Filtrado Automático**
Una vez que los usuarios tienen categorías asignadas:

1. **Leaderboard (Tabla de Clasificación):**
   - Filtrar jugadores por categoría
   - Ver solo Kampfmannschaft o solo Jugend

2. **Reports (Informes):**
   - Reportes diarios/semanales/mensuales por categoría
   - Estadísticas separadas para cada equipo

3. **Profile (Perfil):**
   - Jugadores pueden actualizar su categoría en "Edit Profile"
   - Entrenadores pueden actualizar sus categorías asignadas

---

## 🎯 Flujo Completo

### **Primera Configuración (Coach/Admin):**
1. ✅ Login como coach
2. ✅ Admin → System → Age Categories
3. ✅ Agregar "Kampfmannschaft" y "Jugend"
4. ✅ Listo para registrar usuarios

### **Registro de Jugador:**
```
Nombre: Alex Müller
Email: alex@rhinos.at
Role: Player
Position: RB
Team Category: Kampfmannschaft ← OBLIGATORIO
[resto de campos...]
```

### **Registro de Entrenador:**
```
Nombre: Coach Schmidt
Email: schmidt@rhinos.at
Role: Coach
Categories You Coach:
  ☑️ Kampfmannschaft
  ☑️ Jugend
Coach Code: [código admin]
[resto de campos...]
```

---

## 🔧 Código de Inicialización Rápida (Opcional)

Si quieres inicializar las categorías directamente en la base de datos:

```javascript
// En la consola del navegador (después de login como coach):
const { updateAgeCategories } = await import('./services/teamSettings');
await updateAgeCategories(['Kampfmannschaft', 'Jugend']);
console.log('✅ Categorías inicializadas para USR Rhinos');
```

---

## 📱 UI Mejorada

### **Selector para Jugadores:**
- Dropdown simple con las opciones:
  - Kampfmannschaft
  - Jugend

### **Selector para Entrenadores:**
- Dropdown múltiple con checkboxes:
  - ☐ Kampfmannschaft
  - ☐ Jugend
  - Pueden seleccionar ambas si entrenan ambas categorías

---

## ✅ Validación

El sistema **NO permitirá** crear cuenta sin seleccionar categoría si las categorías están configuradas:

- ❌ Botón "Sign Up" deshabilitado si falta categoría
- ✅ Botón "Sign Up" habilitado solo cuando categoría está seleccionada

---

## 🌐 Multi-idioma

Los labels son bilingües para facilitar el uso:
- **"Team Category / Mannschaft"** (para jugadores)
- **"Categories You Coach / Kategorien die Sie trainieren"** (para entrenadores)

---

## 📊 Beneficios

1. **Organización:** Separación clara entre Kampfmannschaft y Jugend
2. **Reportes:** Estadísticas independientes por categoría
3. **Filtrado:** Leaderboards y reportes filtrados
4. **Escalabilidad:** Fácil agregar más categorías en el futuro (U19, U17, etc.)
5. **SaaS Ready:** Sistema preparado para múltiples equipos y deportes

---

## 🚀 ¿Listo para Usar?

1. ✅ Sistema de categorías implementado
2. ✅ Validación en registro habilitada
3. ✅ Filtros en Leaderboard y Reports funcionando
4. ✅ UI bilingüe (EN/DE)
5. ✅ Build exitoso (8.65 kB para Auth.tsx)

**Solo falta:** Inicializar las dos categorías en el Admin panel y comenzar a registrar usuarios!

---

**Última actualización:** 2025-11-30
**Versión:** 1.0 - Rhinos Category System
