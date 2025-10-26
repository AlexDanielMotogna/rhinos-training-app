# Cloudinary Setup Guide

Cloudinary se usa para subir y gestionar imágenes en la nube (avatares de jugadores, logos del equipo, etc.).

## 📋 Crear Cuenta

1. Ve a https://cloudinary.com/
2. Haz clic en "Sign Up for Free"
3. Completa el registro (puedes usar Google/GitHub)

## 🔑 Obtener Credenciales

1. Una vez dentro, ve al **Dashboard**
2. En la sección "Account Details" verás:
   ```
   Cloud Name: dxxxxxxx
   API Key: 123456789012345
   API Secret: abcdefghijklmnopqrstuvwxyz
   ```

## ⚙️ Configurar en el Backend

1. Abre `backend/.env` (si no existe, copia de `.env.example`)
2. Añade las credenciales:
   ```env
   CLOUDINARY_CLOUD_NAME="dxxxxxxx"
   CLOUDINARY_API_KEY="123456789012345"
   CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz"
   CLOUDINARY_FOLDER="rhinos-training"
   ```

## 📁 Estructura de Carpetas en Cloudinary

Las imágenes se organizarán así:

```
rhinos-training/
├── avatars/          ← Fotos de perfil de jugadores/coaches
│   ├── avatar-user123.jpg
│   ├── avatar-user456.jpg
│   └── ...
├── logos/            ← Logos del equipo
│   ├── team-logo.png
│   └── favicon.png
└── misc/             ← Otras imágenes
```

## 🎯 Uso de las APIs

### Subir Avatar (Jugador/Coach)

**Endpoint:** `POST /api/upload/avatar`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**
```
avatar: [FILE] (max 5MB, solo imágenes)
```

**Response:**
```json
{
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://res.cloudinary.com/dxxxxxxx/image/upload/v1234567890/rhinos-training/avatars/avatar-user123.jpg"
}
```

### Eliminar Avatar

**Endpoint:** `DELETE /api/upload/avatar`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Avatar deleted successfully"
}
```

### Subir Logo del Equipo (Solo Coaches)

**Endpoint:** `POST /api/upload/team-logo`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**
```
logo: [FILE] (max 5MB, solo imágenes)
```

**Response:**
```json
{
  "message": "Team logo uploaded successfully",
  "logoUrl": "https://res.cloudinary.com/dxxxxxxx/image/upload/v1234567890/rhinos-training/logos/logo.png"
}
```

## 🎨 Transformaciones Automáticas

Cloudinary automáticamente optimiza las imágenes:

### Avatares
- Tamaño: 400x400px
- Crop: centrado en la cara (face detection)
- Formato: WebP automático (menor tamaño)
- Calidad: Auto-optimizado

### Logos
- Tamaño: max 500x500px
- Crop: fit (mantiene proporciones)
- Formato: WebP/PNG automático
- Transparencia preservada

## 💰 Límites del Plan Gratuito

- ✅ 25 créditos/mes
- ✅ 25GB storage
- ✅ 25GB bandwidth
- ✅ Transformaciones ilimitadas

**Estimación para Rhinos:**
- ~50 jugadores con avatar = ~2MB storage
- ~100 views/día de avatares = ~60MB/mes bandwidth
- **Muy dentro del plan gratuito** 🎉

## 🔒 Seguridad

### ⚠️ NUNCA hagas esto:
- ❌ Exponer las credenciales en el frontend
- ❌ Commitear el archivo `.env` a Git
- ❌ Compartir las API keys públicamente

### ✅ Buenas prácticas:
- ✅ Solo backend tiene acceso a las credenciales
- ✅ Frontend solo recibe URLs públicas de Cloudinary
- ✅ Validar tipo de archivo (solo imágenes)
- ✅ Limitar tamaño de archivo (5MB max)

## 🧪 Probar con Postman/Thunder Client

1. Primero login para obtener token:
   ```http
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json

   {
     "email": "player@rhinos.com",
     "password": "password123"
   }
   ```

2. Copiar el `token` de la respuesta

3. Subir avatar:
   - Method: POST
   - URL: `http://localhost:5000/api/upload/avatar`
   - Headers:
     - `Authorization: Bearer YOUR_TOKEN_HERE`
   - Body:
     - Type: form-data
     - Key: `avatar` | Value: [Select File]

4. Verificar en Cloudinary Dashboard → Media Library

## 📚 Referencias

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

## 🆘 Troubleshooting

### Error: "Invalid API credentials"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que no haya espacios extras
- Reinicia el servidor backend (`npm run dev`)

### Error: "Failed to upload image"
- Verifica que el archivo sea una imagen válida
- Comprueba que el tamaño sea menor a 5MB
- Revisa los logs del backend para más detalles

### Error: "Only image files are allowed"
- Solo se aceptan: JPG, PNG, GIF, WebP
- NO se aceptan: PDF, ZIP, TXT, etc.

---

**Última actualización:** 2025-10-24
