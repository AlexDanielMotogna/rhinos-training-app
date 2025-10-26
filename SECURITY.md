# 🔒 Security Guidelines - Rhinos Training App

## ⚠️ ARCHIVOS SENSIBLES - NUNCA SUBIR A GIT

Los siguientes archivos contienen información sensible y **NUNCA** deben ser commiteados al repositorio:

### Backend Environment Files
```
backend/.env                    ← DATOS SENSIBLES
backend/.env.local
backend/.env.development
backend/.env.production
```

**Contienen:**
- MongoDB connection string (usuario/password de base de datos)
- JWT_SECRET (clave para firmar tokens)
- BREVO_API_KEY (clave API de servicio de email)
- Códigos de acceso (COACH_CODE)

### Archivos de Credenciales
```
**/api-keys.json
**/secrets.json
**/credentials.json
**/.credentials
**/*.pem
**/*.key
**/*.cert
```

---

## ✅ ARCHIVOS SEGUROS PARA COMMITEAR

Estos archivos **SÍ** pueden y deben subirse al repositorio:

### Template Files (Ejemplos sin datos reales)
```
backend/.env.example            ← Plantilla SIN datos sensibles
```

**Uso:** Copiar `.env.example` → `.env` y rellenar con datos reales

---

## 🛡️ Buenas Prácticas

### 1. Antes de Hacer Commit
Verifica que NO estás incluyendo archivos sensibles:
```bash
git status
# Asegúrate de que NO aparecen archivos .env
```

### 2. Si Accidentalmente Commiteaste Datos Sensibles

**⚠️ PELIGRO: Si ya hiciste push a GitHub, las credenciales están comprometidas**

**Pasos inmediatos:**
1. **Rotar credenciales INMEDIATAMENTE:**
   - Cambiar password de MongoDB
   - Regenerar API key de Brevo
   - Cambiar JWT_SECRET
   - Cambiar COACH_CODE

2. **Limpiar historial de Git:**
```bash
# CUIDADO: Esto reescribe el historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

3. **Alternativa más segura:** Usar [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

### 3. Variables de Entorno en Producción

**NUNCA:**
- Hardcodear secretos en el código
- Commitear archivos .env
- Compartir .env por email/Slack/Discord

**SÍ:**
- Usar variables de entorno del sistema
- Usar servicios de gestión de secretos (AWS Secrets Manager, Railway Secrets, etc.)
- Cada desarrollador tiene su propio .env local

### 4. Rotar Credenciales Regularmente

**Cada 3-6 meses cambiar:**
- JWT_SECRET
- Database passwords
- API keys

---

## 🔐 Qué Hacer si Sospechas una Brecha

1. **Rotar todas las credenciales inmediatamente**
2. **Revisar logs de acceso:**
   - MongoDB Atlas → Database Access → Activity Feed
   - Brevo → Statistics → Email logs
3. **Notificar al equipo**
4. **Investigar el origen de la brecha**

---

## 📋 Checklist de Seguridad

### Desarrollo Local
- [ ] Archivo `.env` NO está en Git
- [ ] Usas `.env.example` como template
- [ ] JWT_SECRET es aleatorio y largo (min 32 chars)
- [ ] Passwords de MongoDB son fuertes
- [ ] API keys de Brevo están restringidas

### Deployment (Producción)
- [ ] Variables de entorno configuradas en plataforma de hosting
- [ ] MongoDB IP whitelist configurada correctamente
- [ ] HTTPS habilitado
- [ ] CORS configurado solo para dominios autorizados
- [ ] Rate limiting activado en endpoints de auth
- [ ] Logs de errores NO exponen información sensible

---

## 🚨 Contacto de Emergencia

Si descubres una vulnerabilidad de seguridad:
1. **NO** abras un issue público en GitHub
2. Contacta directamente al equipo técnico
3. Documenta los pasos para reproducir

---

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [JWT Best Practices](https://curity.io/resources/learn/jwt-best-practices/)

---

**Última actualización:** 2025-10-24
