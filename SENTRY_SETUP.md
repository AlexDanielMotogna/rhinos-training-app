# 🔍 Sentry Integration Guide
**Complete Setup for Production Error Monitoring**

---

## 📋 Table of Contents
1. [What is Sentry?](#what-is-sentry)
2. [Why Sentry for This App](#why-sentry)
3. [Account Setup](#account-setup)
4. [Frontend Integration](#frontend-integration)
5. [Backend Integration](#backend-integration)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)
9. [Best Practices](#best-practices)

---

## 🎯 What is Sentry?

Sentry is an **error tracking and performance monitoring** platform that helps you:
- **Catch errors** in production before users report them
- **Debug issues** with full stack traces and context
- **Monitor performance** and identify bottlenecks
- **Track releases** and see which version introduced bugs
- **Get alerts** when errors spike or new issues appear

---

## 🤔 Why Sentry for This App?

### Current Problems (From Audit)
- ❌ 748 console.log statements cluttering logs
- ❌ No visibility into production errors
- ❌ Users experience crashes without developers knowing
- ❌ Debug info exposed in browser console
- ❌ No way to track error trends

### After Sentry Integration
- ✅ Clean production logs (no console statements)
- ✅ All errors automatically captured and reported
- ✅ Stack traces with user context (what they were doing)
- ✅ Performance monitoring (slow API calls, etc.)
- ✅ Email/Slack alerts for critical errors
- ✅ Error trends and analytics

---

## 🚀 Account Setup

### Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Choose "Create an account" (FREE tier available)
3. Select plan:
   - **Free:** 5,000 errors/month, 10,000 performance units
   - **Recommended for production:** Team plan ($26/month) - 50k errors

### Step 2: Create Projects

Create **TWO** projects (one for frontend, one for backend):

#### Frontend Project
1. Click "Create Project"
2. **Platform:** React
3. **Project Name:** `teamtrainer-frontend`
4. **Alert Frequency:** "Alert me on every new issue"
5. Click "Create Project"
6. **SAVE THE DSN** (looks like: `https://abc123@o123.ingest.sentry.io/456`)

#### Backend Project
1. Click "Create Project" again
2. **Platform:** Node.js
3. **Project Name:** `teamtrainer-backend`
4. **Alert Frequency:** "Alert me on every new issue"
5. Click "Create Project"
6. **SAVE THE DSN**

---

## 🎨 Frontend Integration

### Step 1: Install Sentry SDK

```bash
cd "c:\Users\Lian Li\Desktop\Rhinos-Training-App"
npm install @sentry/react @sentry/tracing
```

### Step 2: Create Sentry Service

Create `src/services/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only active in production builds
 */
export function initSentry() {
  // Only initialize in production
  if (!import.meta.env.PROD) {
    console.log('[Sentry] Skipping initialization (development mode)');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.error('[Sentry] No DSN provided, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,

    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        // Trace all navigation and route changes
        tracingOrigins: [
          'localhost',
          'rhinos-training.at',
          'rhinos-training-app-production.up.railway.app',
          /^\//,
        ],
      }),
    ],

    // Set sample rates
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

    // Environment
    environment: import.meta.env.MODE,

    // Release tracking (update this on each deploy)
    release: `teamtrainer-frontend@${import.meta.env.VITE_APP_VERSION || 'dev'}`,

    // Before sending events, scrub sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from event
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Remove tokens from URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/token=[^&]+/g, 'token=REDACTED');
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Network errors (often not actionable)
      'NetworkError',
      'Failed to fetch',
      // User cancelled operations
      'AbortError',
    ],
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * Set user context for better error tracking
 */
export function setSentryUser(user: { id: string; email: string; role: string } | null) {
  if (!import.meta.env.PROD) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email, // ⚠️ PII - ensure Sentry has data scrubbing enabled
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Log custom events (non-errors)
 */
export function logEvent(message: string, context?: Record<string, any>) {
  if (!import.meta.env.PROD) return;

  Sentry.captureMessage(message, {
    level: 'info',
    extra: context,
  });
}

/**
 * Log errors manually
 */
export function logError(error: Error, context?: Record<string, any>) {
  if (!import.meta.env.PROD) {
    console.error('[Error]', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}
```

### Step 3: Update main.tsx

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { initSentry } from './services/sentry';
import './index.css';

// Initialize Sentry FIRST (before anything else)
initSentry();

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  if (import.meta.env.PROD) {
    Sentry.captureException(event.reason, {
      contexts: {
        promise: {
          reason: event.reason,
          promise: event.promise,
        },
      },
    });
  }

  event.preventDefault();
});

// Wrap App in Sentry ErrorBoundary
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, resetError }) => (
        <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
          <h1>Something went wrong</h1>
          <p>We've been notified and are working on a fix.</p>
          <button onClick={resetError}>Try again</button>
          {!import.meta.env.PROD && (
            <details style={{ marginTop: '1rem' }}>
              <summary>Error details</summary>
              <pre style={{ overflow: 'auto', background: '#f5f5f5', padding: '1rem' }}>
                {error?.toString()}
                {componentStack}
              </pre>
            </details>
          )}
        </div>
      )}
      showDialog={false}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
```

### Step 4: Update App.tsx

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { setSentryUser } from './services/sentry';
import { getUser } from './services/userProfile';

function App() {
  useEffect(() => {
    // Set user context when app loads
    const user = getUser();
    setSentryUser(user);
  }, []);

  // ... rest of App component
}
```

### Step 5: Add Environment Variables

Update `.env.example`:
```bash
# Sentry Error Tracking
VITE_SENTRY_DSN=https://YOUR_DSN_HERE@o123.ingest.sentry.io/456
VITE_APP_VERSION=1.0.0
```

Create `.env.production` (if you commit this, NO SECRETS!):
```bash
VITE_SENTRY_DSN=https://YOUR_PRODUCTION_DSN@o123.ingest.sentry.io/456
VITE_APP_VERSION=1.0.0
```

---

## 🖥️ Backend Integration

### Step 1: Install Sentry SDK

```bash
cd backend
npm install @sentry/node @sentry/tracing
```

### Step 2: Create Sentry Utility

Create `backend/src/utils/sentry.ts`:

```typescript
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

export function initSentry() {
  // Only in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Sentry] Skipping initialization (development mode)');
    return;
  }

  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.error('[Sentry] No DSN provided, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of requests

    environment: process.env.NODE_ENV || 'development',
    release: `teamtrainer-backend@${process.env.npm_package_version || 'dev'}`,

    // Before sending, scrub sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive query params
      if (event.request?.query_string) {
        event.request.query_string = event.request.query_string.replace(
          /token=[^&]+/g,
          'token=REDACTED'
        );
      }

      return event;
    },
  });

  console.log('[Sentry] Initialized successfully');
}

export function setSentryUser(user: { id: string; email: string; role: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}
```

### Step 3: Update backend/src/index.ts

```typescript
// backend/src/index.ts
import express from 'express';
import * as Sentry from '@sentry/node';
import { initSentry } from './utils/sentry.js';

// Initialize Sentry FIRST
initSentry();

const app = express();

// Sentry request handler MUST be the first middleware
app.use(Sentry.Handlers.requestHandler());

// Sentry tracing middleware (optional, for performance)
app.use(Sentry.Handlers.tracingHandler());

// ... your other middleware (cors, body-parser, etc.)

// ... your routes

// Sentry error handler MUST be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Your error handler (after Sentry)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Don't log to console in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});
```

### Step 4: Update Auth Middleware

```typescript
// backend/src/middleware/auth.ts
import { setSentryUser, clearSentryUser } from '../utils/sentry.js';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ... existing auth logic

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = decoded;

    // Set Sentry user context
    setSentryUser({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch (error) {
    clearSentryUser();

    // Don't log auth failures to Sentry (would be too noisy)
    // But do log in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AUTH] Authentication error:', error);
    }

    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Step 5: Add Environment Variables

Update `backend/.env.example`:
```bash
# Sentry Error Tracking
SENTRY_DSN=https://YOUR_BACKEND_DSN@o123.ingest.sentry.io/789
```

Add to `backend/.env` (DON'T COMMIT):
```bash
SENTRY_DSN=https://YOUR_BACKEND_DSN@o123.ingest.sentry.io/789
```

---

## 🎛️ Configuration

### Railway Configuration (Backend)

1. Go to your Railway project: https://railway.app
2. Select your backend service
3. Go to **Variables** tab
4. Add variable:
   - **Key:** `SENTRY_DSN`
   - **Value:** `https://YOUR_BACKEND_DSN@o123.ingest.sentry.io/789`
5. Click "Add" → Railway will auto-redeploy

### Vercel Configuration (Frontend)

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Select "teamtrainer" project
3. Go to **Settings** → **Environment Variables**
4. Add variables:
   - **VITE_SENTRY_DSN:** `https://YOUR_FRONTEND_DSN@o123.ingest.sentry.io/456`
   - **VITE_APP_VERSION:** `1.0.0`
5. Environment: ✅ Production, ✅ Preview, ✅ Development
6. Save → Go to **Deployments** → **Redeploy**

---

## 🧪 Testing

### Test in Development

```bash
# Frontend
npm run dev

# In browser console, trigger an error:
throw new Error('Test error for Sentry');

# You should see: "[Sentry] Skipping initialization (development mode)"
# This is CORRECT - Sentry only active in production
```

### Test in Production (Staging)

1. Build production bundle:
```bash
npm run build
npm run preview
```

2. Trigger test error in app
3. Check Sentry dashboard (should appear within ~10 seconds)

### Manual Test Error

Add temporary button to test Sentry:

```typescript
// src/pages/Profile.tsx (temporarily)
import { logError } from '../services/sentry';

// Add button:
<Button onClick={() => {
  logError(new Error('Test Sentry integration'), {
    source: 'Manual test',
    user: 'test@example.com',
  });
}}>
  Test Sentry
</Button>
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

```
□ Sentry account created
□ Frontend project created, DSN saved
□ Backend project created, DSN saved
□ Frontend: @sentry/react installed
□ Backend: @sentry/node installed
□ Environment variables configured (Vercel + Railway)
□ Code deployed to staging and tested
□ Test error appears in Sentry dashboard
```

### Deploy

```bash
# Commit changes
git add .
git commit -m "Add Sentry error tracking and monitoring"
git push

# Vercel and Railway auto-deploy
# Wait 2-3 minutes for deployment
```

### Verify Production

1. Visit https://rhinos-training.at
2. Open browser console
3. Look for: `[Sentry] Initialized successfully`
4. Trigger test error (or wait for natural errors)
5. Check Sentry dashboard: https://sentry.io/organizations/YOUR_ORG/issues/

---

## 📊 Sentry Dashboard Usage

### View Errors

1. Go to **Issues** tab
2. See all errors, sorted by frequency
3. Click an error to see:
   - Full stack trace
   - User context (who experienced it)
   - Breadcrumbs (what user did before error)
   - Device/browser info
   - Error frequency graph

### Set Up Alerts

1. Go to **Alerts** → **Create Alert**
2. **Alert Type:** Issues
3. **Conditions:**
   - "When an issue is first seen"
   - "When an issue changes state from resolved to unresolved"
   - "When issue count exceeds 10 in 1 hour"
4. **Actions:**
   - ✅ Send email to: your-email@example.com
   - ✅ Send Slack message (optional, connect Slack first)
5. Save alert rule

### Monitor Performance

1. Go to **Performance** tab
2. See:
   - Slowest transactions (API calls, page loads)
   - Throughput (requests per minute)
   - Apdex score (user satisfaction metric)
3. Click transaction to see detailed trace

---

## 💡 Best Practices

### DO's ✅

1. **Always scrub sensitive data**
   ```typescript
   beforeSend(event) {
     delete event.request?.headers?.['authorization'];
     return event;
   }
   ```

2. **Set user context** (helps debug user-specific issues)
   ```typescript
   setSentryUser(user);
   ```

3. **Add breadcrumbs** for important actions
   ```typescript
   Sentry.addBreadcrumb({
     category: 'workout',
     message: 'User started workout session',
     level: 'info',
   });
   ```

4. **Use environments** (production, staging, development)
   ```typescript
   environment: import.meta.env.MODE
   ```

5. **Set releases** (track which version has bugs)
   ```typescript
   release: 'teamtrainer-frontend@1.2.3'
   ```

### DON'Ts ❌

1. **Don't log passwords/tokens**
   - Always use `beforeSend` to scrub

2. **Don't send every error in development**
   - Only enable in production

3. **Don't ignore GDPR**
   - Enable data scrubbing in Sentry settings
   - Don't log PII without user consent

4. **Don't set sample rate to 100%**
   - Performance monitoring at 100% = expensive
   - 10-20% is sufficient

5. **Don't forget to handle Sentry errors**
   ```typescript
   try {
     Sentry.captureException(error);
   } catch (sentryError) {
     console.error('Sentry failed:', sentryError);
   }
   ```

---

## 🔒 Privacy & GDPR

### Data Scrubbing (REQUIRED for GDPR)

1. Go to Sentry project settings
2. **Data Scrubbing** section
3. Enable:
   - ✅ "Scrub Sensitive Data"
   - ✅ "Use default scrubbers"
4. Add custom patterns:
   - `password`
   - `token`
   - `api_key`
   - `secret`
5. Save changes

### User Consent

If users are in EU, you may need consent before tracking:

```typescript
// Check if user has consented
const hasConsent = localStorage.getItem('analytics_consent') === 'true';

if (hasConsent) {
  initSentry();
}
```

---

## 💰 Pricing

| Plan | Price | Errors/Month | Performance | Best For |
|------|-------|--------------|-------------|----------|
| **Developer** | FREE | 5,000 | 10k units | Testing, small apps |
| **Team** | $26/mo | 50,000 | 100k units | **RECOMMENDED** for your app |
| **Business** | $80/mo | 150,000 | 500k units | High-traffic apps |

**Estimate for TeamTrainer:**
- Current users: ~50-100
- Estimated errors: 1,000-5,000/month
- **Recommendation:** Start with FREE, upgrade to Team if needed

---

## 🆘 Troubleshooting

### Issue: "No DSN provided"
**Solution:** Check environment variables are set correctly
```bash
echo $VITE_SENTRY_DSN  # Should print DSN
```

### Issue: Errors not appearing in Sentry
**Checklist:**
- ✅ Sentry initialized? (check console for "[Sentry] Initialized")
- ✅ Running in production mode? (`import.meta.env.PROD === true`)
- ✅ DSN correct? (no typos)
- ✅ Internet connection? (errors sent via HTTP)
- ✅ Firewall blocking? (check browser network tab)

### Issue: Too many errors (quota exceeded)
**Solutions:**
1. Increase sample rate filtering
2. Add more errors to `ignoreErrors` list
3. Fix the bugs causing errors!
4. Upgrade Sentry plan

### Issue: PII leaking in error logs
**Solution:** Update `beforeSend` hook to scrub more data

---

## 📚 Additional Resources

- **Sentry Docs:** https://docs.sentry.io/
- **React Integration:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Node.js Integration:** https://docs.sentry.io/platforms/node/
- **Best Practices:** https://docs.sentry.io/product/sentry-basics/guides/
- **GDPR Compliance:** https://sentry.io/security/

---

## ✅ Success Criteria

After setup, you should have:
- ✅ All production errors automatically reported
- ✅ Email alerts on new issues
- ✅ Performance monitoring showing slow API calls
- ✅ Clean console logs (no more debug spam)
- ✅ User context in error reports
- ✅ Release tracking for deployments

**Next:** See LOGGER_IMPLEMENTATION.md for removing console.log statements

---

**Document Version:** 1.0
**Last Updated:** 2025-12-11
