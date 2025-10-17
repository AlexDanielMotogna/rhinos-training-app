import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { I18nProvider } from './i18n/I18nProvider';
import { AppShell } from './components/AppShell';
import { HardNotification } from './components/HardNotification';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getUser, initializeDemoProfiles } from './services/mock';
import type { HardNotification as HardNotificationType } from './types/notification';

// Lazy load all page components
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const MyTraining = lazy(() => import('./pages/MyTraining').then(m => ({ default: m.MyTraining })));
const MyStats = lazy(() => import('./pages/MyStats').then(m => ({ default: m.MyStats })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Tests = lazy(() => import('./pages/Tests').then(m => ({ default: m.Tests })));
const TestsStrength = lazy(() => import('./pages/TestsStrength').then(m => ({ default: m.TestsStrength })));
const TestsSpeed = lazy(() => import('./pages/TestsSpeed').then(m => ({ default: m.TestsSpeed })));
const TestsPower = lazy(() => import('./pages/TestsPower').then(m => ({ default: m.TestsPower })));
const TestsAgility = lazy(() => import('./pages/TestsAgility').then(m => ({ default: m.TestsAgility })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Videos = lazy(() => import('./pages/Videos').then(m => ({ default: m.Videos })));
const VideosAdmin = lazy(() => import('./pages/VideosAdmin').then(m => ({ default: m.VideosAdmin })));

function App() {
  // Initialize demo profiles on app startup
  useEffect(() => {
    initializeDemoProfiles();
  }, []);

  const [currentUser, setCurrentUser] = useState(() => getUser());
  const [hardNotification, setHardNotification] = useState<HardNotificationType | null>(null);

  useEffect(() => {
    // Check for user changes periodically (for same-tab updates only)
    // Note: We don't sync between tabs to allow multiple users in different tabs for testing
    const checkUser = () => {
      const user = getUser();
      if (JSON.stringify(user) !== JSON.stringify(currentUser)) {
        setCurrentUser(user);
      }
    };

    const interval = setInterval(checkUser, 100);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser]);

  useEffect(() => {
    // Simulate hard notification check (would come from backend in real app)
    if (currentUser) {
      const hasSeenNotification = localStorage.getItem('hardNotificationAcked');
      if (!hasSeenNotification) {
        // Simulate low adherence + high free share scenario
        setTimeout(() => {
          setHardNotification({
            id: 'hard-1',
            title: 'Action Required',
            message: 'Your adherence to the coach plan is low (55%) and your free work share is high (45%). Please focus on completing your assigned plan to improve your performance and team standing.',
            severity: 'high',
            timestamp: new Date(),
          });
        }, 2000);
      }
    }
  }, [currentUser]);

  const handleAcknowledgeNotification = () => {
    localStorage.setItem('hardNotificationAcked', 'true');
    setHardNotification(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nProvider defaultLocale="en">
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route
                path="/"
                element={
                  currentUser ? <Navigate to="/training" replace /> : <Auth />
                }
              />

              {currentUser ? (
                <Route element={<AppShell><Outlet /></AppShell>}>
                  <Route path="/training" element={<MyTraining />} />
                  <Route path="/stats" element={<MyStats />} />
                  <Route path="/tests" element={<Tests />} />
                  <Route path="/tests/strength" element={<TestsStrength />} />
                  <Route path="/tests/speed" element={<TestsSpeed />} />
                  <Route path="/tests/power" element={<TestsPower />} />
                  <Route path="/tests/agility" element={<TestsAgility />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/videos" element={<Videos />} />
                  <Route
                    path="/videos-admin"
                    element={
                      currentUser.role === 'coach'
                        ? <VideosAdmin />
                        : <Navigate to="/training" replace />
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      currentUser.role === 'coach'
                        ? <Reports />
                        : <Navigate to="/training" replace />
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      currentUser.role === 'coach'
                        ? <Admin />
                        : <Navigate to="/training" replace />
                    }
                  />
                  <Route path="*" element={<Navigate to="/training" replace />} />
                </Route>
              ) : (
                <Route path="*" element={<Navigate to="/" replace />} />
              )}
            </Routes>
          </Suspense>

          <HardNotification
            notification={hardNotification}
            onAcknowledge={handleAcknowledgeNotification}
          />
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
