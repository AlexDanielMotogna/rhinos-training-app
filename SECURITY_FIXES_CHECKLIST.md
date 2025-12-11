# 🔧 Security Fixes Implementation Checklist
**Complete Step-by-Step Guide**

---

## 📋 Overview

This checklist guides you through fixing all 23 security issues identified in the audit. Follow in order for maximum efficiency.

**Estimated Total Time:** 40-60 developer hours
**Priority:** 🔴 CRITICAL → 🟠 HIGH → 🟡 MEDIUM → 🟢 LOW

---

## 🚀 PHASE 1: IMMEDIATE FIXES (24-48 hours)

### ✅ Task 1: Set Up Centralized Logging with Sentry

**Time:** 2-3 hours
**Files:** Multiple
**Priority:** 🔴 CRITICAL

**Steps:**

1. **Create Sentry Account**
   ```bash
   # Follow: SENTRY_SETUP.md → "Account Setup" section
   □ Created account at sentry.io
   □ Created frontend project, saved DSN
   □ Created backend project, saved DSN
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   npm install @sentry/react @sentry/tracing

   # Backend
   cd backend
   npm install @sentry/node @sentry/tracing
   ```

3. **Implement Logger Services**
   ```bash
   □ Created: src/services/logger.ts
   □ Created: backend/src/utils/logger.ts
   □ Both files already provided in repo
   ```

4. **Configure Sentry**
   ```bash
   # Follow: SENTRY_SETUP.md → "Frontend Integration" & "Backend Integration"
   □ Created: src/services/sentry.ts
   □ Updated: src/main.tsx
   □ Updated: src/App.tsx
   □ Created: backend/src/utils/sentry.ts
   □ Updated: backend/src/index.ts
   □ Updated: backend/src/middleware/auth.ts
   ```

5. **Add Environment Variables**
   ```bash
   # Local .env
   □ Added VITE_SENTRY_DSN to .env
   □ Added SENTRY_DSN to backend/.env

   # Production (Vercel)
   □ Added VITE_SENTRY_DSN
   □ Added VITE_APP_VERSION

   # Production (Railway)
   □ Added SENTRY_DSN
   ```

6. **Test**
   ```bash
   npm run build && npm run preview

   # Trigger test error in app
   # Check Sentry dashboard for error
   □ Test error appears in Sentry
   ```

**Validation:**
- ✅ `[Sentry] Initialized successfully` in console
- ✅ Test error appears in Sentry dashboard within 10 seconds
- ✅ No console.log statements visible in production

---

### ✅ Task 2: Replace ALL Console Statements

**Time:** 8-10 hours
**Files:** 100 files
**Priority:** 🔴 CRITICAL (C-002)

**Strategy:** Replace incrementally, service by service

#### Step 1: Frontend Core Services (High Priority)

**src/services/api.ts** (22 console statements)
```typescript
// BEFORE
console.log(`[API REQUEST] ${method} ${url}`);
console.error(`[API ERROR] ${endpoint}:`, error);

// AFTER
import { logger } from './logger';
logger.apiRequest(method, url);
logger.error('API request failed', error, { endpoint });
```

**Files to update:**
```bash
□ src/services/api.ts (22 statements)
□ src/services/aiInsights.ts (Remove user data logging)
□ src/hooks/usePollSSE.ts (16 statements)
□ src/services/workoutReports.ts (21 statements)
□ src/services/workoutLog.ts (25 statements)
□ src/services/notifications.ts (13 statements)
□ src/services/attendancePollService.ts (25 statements)
```

#### Step 2: Frontend Components

```bash
□ src/pages/MyTraining.tsx (13 statements)
□ src/pages/Admin.tsx (21 statements)
□ src/pages/Profile.tsx (12 statements)
□ src/pages/Team.tsx (4 statements)
□ src/pages/TrainingSessions.tsx (11 statements)
□ src/components/AttendancePollModal.tsx (8 statements)
□ src/components/DrillManager.tsx (6 statements)
□ src/components/EquipmentManager.tsx (5 statements)
```

#### Step 3: Backend Routes

**backend/src/routes/auth.ts** (Critical - handles passwords)
```typescript
// BEFORE
console.error('Failed to send welcome email:', err);

// AFTER
import { logger } from '../utils/logger.js';
logger.error('Failed to send welcome email', err);
```

**Files to update:**
```bash
□ backend/src/routes/auth.ts (6 statements)
□ backend/src/routes/drills.ts (23 statements)
□ backend/src/routes/workouts.ts (27 statements)
□ backend/src/routes/exercises.ts (7 statements)
□ backend/src/routes/admin.ts (6 statements)
□ backend/src/middleware/auth.ts (3 statements - CRITICAL)
```

#### Step 4: Backend Utilities

```bash
□ backend/src/utils/sseManager.ts (7 statements)
□ backend/src/utils/cronJobs.ts (8 statements)
□ backend/src/utils/email.ts (2 statements)
□ backend/src/utils/cloudinary.ts (3 statements)
```

**Progress Tracking:**
```
Frontend:  _____ / 45 files updated
Backend:   _____ / 55 files updated
Total:     _____ / 100 files updated
```

---

### ✅ Task 3: Remove Sensitive Data from LocalStorage

**Time:** 3-4 hours
**Priority:** 🔴 CRITICAL (C-003)

**⚠️ WARNING:** This requires backend changes to implement httpOnly cookies

#### Option A: Quick Fix (Temporary)

**Keep localStorage for now, but scrub logs:**

```typescript
// src/services/api.ts
// Update logger calls to never log token
logger.apiRequest(method, endpoint, {
  // Don't log token or headers with auth
  method,
  endpoint
});
```

#### Option B: Proper Fix (Recommended, but takes longer)

**1. Backend: Implement Cookie-Based Auth**

```typescript
// backend/src/routes/auth.ts
// AFTER generating token:
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Send user data (no token in response body)
res.json({ user });
```

**2. Backend: Update Auth Middleware**

```typescript
// backend/src/middleware/auth.ts
export const authenticateToken = (req, res, next) => {
  // Get token from cookie instead of Authorization header
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // ... rest of validation
};
```

**3. Backend: Install cookie-parser**

```bash
cd backend
npm install cookie-parser
```

```typescript
// backend/src/index.ts
import cookieParser from 'cookie-parser';

app.use(cookieParser());
```

**4. Frontend: Remove localStorage Token Storage**

```typescript
// src/services/api.ts

// REMOVE:
localStorage.setItem('auth_token', token);
localStorage.getItem('auth_token');

// Tokens now in httpOnly cookies (automatic)
// Just make requests, browser sends cookie
```

**5. Frontend: Update API Calls**

```typescript
// src/services/api.ts
const response = await fetch(`${API_URL}${endpoint}`, {
  ...options,
  credentials: 'include', // ← IMPORTANT: Send cookies
  headers: {
    'Content-Type': 'application/json',
    // Remove Authorization header (cookie used instead)
  },
});
```

**Checklist:**
```bash
□ Backend: Installed cookie-parser
□ Backend: Updated auth.ts to set cookies
□ Backend: Updated middleware to read cookies
□ Frontend: Removed localStorage token storage
□ Frontend: Added credentials: 'include' to all fetches
□ Tested: Login still works
□ Tested: Protected routes still work
□ Tested: Logout clears cookie
```

**Validation:**
- ✅ No `auth_token` in localStorage
- ✅ Cookie visible in DevTools → Application → Cookies
- ✅ Cookie has `HttpOnly` flag
- ✅ Protected routes still accessible

---

### ✅ Task 4: Implement CSRF Protection

**Time:** 2 hours
**Priority:** 🔴 CRITICAL (C-004)
**Prerequisite:** Task 3 (cookies) must be done first

**1. Install CSRF Package**

```bash
cd backend
npm install csurf
```

**2. Configure CSRF Middleware**

```typescript
// backend/src/index.ts
import csrf from 'csurf';

// AFTER cookie-parser
app.use(cookieParser());

// CSRF protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Endpoint to get CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

**3. Frontend: Get and Send CSRF Token**

```typescript
// src/services/api.ts

// Get CSRF token on app init
let csrfToken: string | null = null;

export async function initCsrfToken() {
  try {
    const response = await fetch(`${API_URL}/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    csrfToken = data.csrfToken;
  } catch (error) {
    logger.error('Failed to get CSRF token', error);
  }
}

// Include CSRF token in all state-changing requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  // Add CSRF token for POST/PUT/DELETE
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // ... rest of fetch
}
```

**4. Initialize CSRF on App Load**

```typescript
// src/App.tsx
import { initCsrfToken } from './services/api';

useEffect(() => {
  initCsrfToken();
}, []);
```

**Checklist:**
```bash
□ Installed csurf package
□ Added CSRF middleware to backend
□ Created /api/csrf-token endpoint
□ Frontend fetches CSRF token on init
□ Frontend sends X-CSRF-Token header
□ Tested: POST/PUT/DELETE requests work
□ Tested: Requests without token fail (403)
```

---

## 🟠 PHASE 2: HIGH PRIORITY (Week 1)

### ✅ Task 5: Backend Role Verification

**Time:** 4-5 hours
**Priority:** 🟠 HIGH (H-005)

**1. Create Role Middleware**

```typescript
// backend/src/middleware/roles.ts
import { Request, Response, NextFunction } from 'express';

export const requireCoach = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'coach') {
    logger.warn('Unauthorized access attempt', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path,
    });

    return res.status(403).json({ error: 'Forbidden: Coach access required' });
  }

  next();
};

export const requirePlayer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'player') {
    return res.status(403).json({ error: 'Forbidden: Player access required' });
  }

  next();
};
```

**2. Apply to Protected Routes**

```typescript
// backend/src/routes/admin.ts
import { requireCoach } from '../middleware/roles.js';

// BEFORE
router.post('/drills', authenticateToken, async (req, res) => {
  // ❌ Anyone with valid token can create
});

// AFTER
router.post('/drills', authenticateToken, requireCoach, async (req, res) => {
  // ✅ Only coaches can create
});
```

**Routes to protect:**
```bash
□ /api/admin/* (all routes → requireCoach)
□ /api/drills POST/PUT/DELETE → requireCoach
□ /api/exercises POST/PUT/DELETE → requireCoach
□ /api/templates POST/PUT/DELETE → requireCoach
□ /api/assignments POST/PUT/DELETE → requireCoach
□ /api/training-types POST/PUT/DELETE → requireCoach
□ /api/team-settings PUT → requireCoach
□ /api/points-config PUT → requireCoach
□ /api/attendance-polls POST → requireCoach
□ /api/divisions POST/PUT/DELETE → requireCoach
□ /api/teams POST/PUT/DELETE → requireCoach
□ /api/matches POST/PUT/DELETE → requireCoach
```

**Validation:**
```bash
# Test as player:
curl -X POST http://localhost:5000/api/drills \
  -H "Cookie: auth_token=PLAYER_TOKEN" \
  -d '{"name":"Test"}'

# Should return: 403 Forbidden
□ Coach endpoints reject player tokens
□ Player endpoints still work for players
```

---

### ✅ Task 6: Coach Code Backend Validation

**Time:** 2 hours
**Priority:** 🟠 HIGH (H-006)

**1. Validate on Backend**

```typescript
// backend/src/routes/auth.ts

router.post('/signup', async (req, res) => {
  const { email, password, name, role, coachCode } = req.body;

  // Validate coach code if role is coach
  if (role === 'coach') {
    const validCoachCode = process.env.COACH_CODE;

    if (!coachCode || coachCode !== validCoachCode) {
      logger.warn('Invalid coach code attempt', { email, attemptedCode: coachCode });

      return res.status(403).json({
        error: 'Invalid coach code. Contact administrator for the correct code.',
      });
    }
  }

  // ... rest of signup logic
});
```

**2. Add Rate Limiting (Task 7)**

**Validation:**
```bash
# Test with wrong code:
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","role":"coach","coachCode":"WRONG"}'

# Should return: 403 Invalid coach code
□ Wrong coach code rejected
□ Correct coach code accepted
□ No coach code for players works
```

---

### ✅ Task 7: Rate Limiting on Auth Endpoints

**Time:** 1-2 hours
**Priority:** 🟠 HIGH (H-007)

**1. Install Rate Limiter**

```bash
cd backend
npm install express-rate-limit
```

**2. Configure Rate Limiting**

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

// Login rate limiter: 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Signup rate limiter: 3 signups per hour per IP
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many accounts created. Please try again in an hour.',
});

// General API rate limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests. Please slow down.',
});
```

**3. Apply to Routes**

```typescript
// backend/src/routes/auth.ts
import { loginLimiter, signupLimiter } from '../middleware/rateLimiter.js';

router.post('/login', loginLimiter, async (req, res) => {
  // ...
});

router.post('/signup', signupLimiter, async (req, res) => {
  // ...
});

// backend/src/index.ts
import { apiLimiter } from './middleware/rateLimiter.js';

// Apply to all API routes
app.use('/api', apiLimiter);
```

**Validation:**
```bash
# Test login rate limit:
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 6th request should return: 429 Too Many Requests
□ Rate limits enforced on login
□ Rate limits enforced on signup
□ Rate limits enforced on general API
```

---

### ✅ Task 8: Fix ErrorBoundary Environment Check

**Time:** 15 minutes
**Priority:** 🟠 HIGH (H-003)

```typescript
// src/components/ErrorBoundary.tsx

// BEFORE
{process.env.NODE_ENV === 'development' && (

// AFTER
{import.meta.env.DEV && (
```

**Validation:**
```bash
npm run build && npm run preview

# Trigger error in production build
# Stack trace should NOT be visible
□ No stack traces in production build
□ Stack traces still visible in dev mode
```

---

## 🟡 PHASE 3: MEDIUM PRIORITY (Weeks 2-4)

### ✅ Task 9: Add Global Promise Rejection Handler

**Time:** 30 minutes
**Priority:** 🟡 MEDIUM (M-005)

```typescript
// src/main.tsx

// Add BEFORE ReactDOM.render
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason, {
    promise: event.promise,
  });

  if (import.meta.env.PROD) {
    // Show user-friendly message
    console.error('An unexpected error occurred. We have been notified.');
  }

  event.preventDefault();
});

window.addEventListener('error', (event) => {
  logger.error('Uncaught error', event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});
```

---

### ✅ Task 10: Add Granular Error Boundaries

**Time:** 2-3 hours
**Priority:** 🟡 MEDIUM (M-006)

**1. Create Feature Error Boundary**

```typescript
// src/components/FeatureErrorBoundary.tsx
import React from 'react';
import { Alert, Button, Box } from '@mui/material';
import { logger } from '../services/logger';

interface Props {
  children: React.ReactNode;
  featureName: string;
  fallback?: React.ReactNode;
}

export class FeatureErrorBoundary extends React.Component<Props> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`Error in ${this.props.featureName}`, error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <strong>{this.props.featureName} Error</strong>
            <p>This feature encountered an error. Try refreshing the page.</p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

**2. Wrap Features**

```typescript
// src/App.tsx

<Route path="/admin" element={
  <FeatureErrorBoundary featureName="Admin Panel">
    <Admin />
  </FeatureErrorBoundary>
} />

<Route path="/training" element={
  <FeatureErrorBoundary featureName="Training">
    <MyTraining />
  </FeatureErrorBoundary>
} />
```

---

### ✅ Task 11: Strengthen Password Requirements

**Time:** 1 hour
**Priority:** 🟡 MEDIUM (M-007)

**1. Backend Validation**

```typescript
// backend/src/utils/passwordValidator.ts
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

**2. Frontend Validation**

```typescript
// src/pages/Auth.tsx
<TextField
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
  fullWidth
  inputProps={{ minLength: 10 }}
  error={isSignup && password.length > 0 && password.length < 10}
  helperText={
    isSignup
      ? "Min 10 characters: uppercase, lowercase, number, special character"
      : ""
  }
/>
```

---

### ✅ Task 12: Fix Email Validation

**Time:** 1 hour
**Priority:** 🟡 MEDIUM (M-008)

```typescript
// backend/src/utils/emailValidator.ts
export function validateEmail(email: string): boolean {
  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  if (email.includes('..')) return false; // No consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (email.length > 254) return false; // RFC max length

  return true;
}
```

---

## 🟢 PHASE 4: LOW PRIORITY (Next Sprint)

### ✅ Task 13: Add Security Headers

**Time:** 1 hour
**Priority:** 🟢 LOW (L-002)

```typescript
// backend/src/index.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## 📊 Progress Tracking

### Overall Progress

```
Phase 1 (CRITICAL):     _____ / 4 tasks completed
Phase 2 (HIGH):         _____ / 4 tasks completed
Phase 3 (MEDIUM):       _____ / 4 tasks completed
Phase 4 (LOW):          _____ / 1 task completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                  _____ / 13 tasks completed
```

### Key Metrics

```
□ 0 CRITICAL issues remaining
□ 0 HIGH issues remaining
□ All console.log replaced with logger
□ Sentry capturing all production errors
□ No sensitive data in logs
□ Backend role verification on all protected routes
□ Rate limiting active on auth endpoints
□ CSRF protection enabled
```

---

## 🎯 Success Criteria

After completing all tasks:

- ✅ **No console statements in production** (all replaced with logger)
- ✅ **Sentry dashboard showing errors** (not console)
- ✅ **Auth tokens in httpOnly cookies** (not localStorage)
- ✅ **CSRF protection active** (state-changing requests require token)
- ✅ **Backend role checks** (client-side checks are UX only)
- ✅ **Rate limiting prevents brute force** (5 login attempts / 15 min)
- ✅ **Strong passwords required** (10+ chars, mixed case, numbers, special)
- ✅ **All errors tracked** (unhandled promises captured)
- ✅ **Granular error boundaries** (features fail independently)

---

## 🆘 Getting Help

**Stuck on a task?**
1. Check the detailed guides:
   - SENTRY_SETUP.md → Sentry configuration
   - SECURITY_AUDIT_2025.md → Vulnerability details
2. Review logger.ts → Usage examples
3. Test incrementally → Don't wait until all done

**Found new issues?**
- Document in SECURITY_AUDIT_2025.md
- Add to this checklist
- Prioritize by severity

---

**Last Updated:** 2025-12-11
**Version:** 1.0
