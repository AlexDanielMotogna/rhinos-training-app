import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createDynamicTheme } from './theme';
import { I18nProvider } from './i18n/I18nProvider';
import { AppShell } from './components/AppShell';
import { HardNotification } from './components/HardNotification';
import { AttendancePollModal } from './components/AttendancePollModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { getUser } from './services/userProfile';
import type { HardNotification as HardNotificationType } from './types/notification';
import type { AttendancePoll } from './types/attendancePoll';
import { getTeamBranding } from './services/teamSettings';
import { initializeDrillData } from './services/drillDataInit';
import { getActivePoll, hasUserVoted } from './services/attendancePollService';

// Lazy load all page components
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
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
const Team = lazy(() => import('./pages/Team').then(m => ({ default: m.Team })));
const TrainingSessions = lazy(() => import('./pages/TrainingSessions').then(m => ({ default: m.TrainingSessions })));
const Configuration = lazy(() => import('./pages/Configuration').then(m => ({ default: m.Configuration })));
const DrillSessions = lazy(() => import('./components/DrillTrainingPlan').then(m => ({ default: m.DrillTrainingPlan })));

function App() {
  // Initialize drill data on app startup
  useEffect(() => {
    initializeDrillData();
  }, []);

  // Initialize branding (favicon and title) on app startup
  useEffect(() => {
    const branding = getTeamBranding();

    // Update document title
    if (branding.appName) {
      document.title = branding.appName;
    }

    // Update favicon
    if (branding.faviconUrl) {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = branding.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, []);

  const [currentUser, setCurrentUser] = useState(() => getUser());
  const [hardNotification, setHardNotification] = useState<HardNotificationType | null>(null);
  const [activePoll, setActivePoll] = useState<AttendancePoll | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);

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

  // Check for active attendance poll
  useEffect(() => {
    const checkActivePoll = async () => {
      if (currentUser) {
        const poll = await getActivePoll();
        if (poll && !(await hasUserVoted(poll.id, currentUser.id))) {
          setActivePoll(poll);
          setShowPollModal(true);
        }
      }
    };
    checkActivePoll();
  }, [currentUser]);

  // Check periodically for new polls (every 30 seconds)
  useEffect(() => {
    if (!currentUser) return;

    const checkForPolls = async () => {
      // Don't check if modal is already open (prevents resetting user's selection)
      if (showPollModal) return;

      const poll = await getActivePoll();
      if (poll && !(await hasUserVoted(poll.id, currentUser.id))) {
        setActivePoll(poll);
        setShowPollModal(true);
      }
    };

    const interval = setInterval(checkForPolls, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser, showPollModal]);

  const handleClosePollModal = async () => {
    // Only allow closing if user has voted
    if (currentUser && activePoll) {
      const hasVoted = await hasUserVoted(activePoll.id, currentUser.id);
      if (hasVoted) {
        setShowPollModal(false);
        setActivePoll(null);
      }
    }
  };

  // Create dynamic theme based on branding
  const theme = useMemo(() => {
    const branding = getTeamBranding();
    return createDynamicTheme(branding);
  }, []); // Empty dependency array - theme only created once on mount

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nProvider defaultLocale="en">
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                currentUser ? <Navigate to="/training" replace /> : <Suspense fallback={<LoadingSpinner />}><Auth /></Suspense>
              }
            />

            <Route
              path="/reset-password"
              element={<Suspense fallback={<LoadingSpinner />}><ResetPassword /></Suspense>}
            />

            {currentUser ? (
              <Route element={<AppShell><Suspense fallback={<LoadingSpinner />}><Outlet /></Suspense></AppShell>}>
                <Route path="/training" element={<MyTraining />} />
                <Route path="/stats" element={<MyStats />} />
                <Route path="/tests" element={<Tests />} />
                <Route path="/tests/strength" element={<TestsStrength />} />
                <Route path="/tests/speed" element={<TestsSpeed />} />
                <Route path="/tests/power" element={<TestsPower />} />
                <Route path="/tests/agility" element={<TestsAgility />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:playerId" element={<Profile />} />
                <Route path="/team" element={<Team />} />
                <Route path="/training-sessions" element={<TrainingSessions />} />
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
                <Route
                  path="/configuration"
                  element={
                    currentUser.role === 'coach'
                      ? <Configuration />
                      : <Navigate to="/training" replace />
                  }
                />
                <Route
                  path="/drill-sessions"
                  element={
                    currentUser.role === 'coach'
                      ? <DrillSessions />
                      : <Navigate to="/training" replace />
                  }
                />
                <Route path="*" element={<Navigate to="/training" replace />} />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to="/" replace />} />
            )}
          </Routes>

          <HardNotification
            notification={hardNotification}
            onAcknowledge={handleAcknowledgeNotification}
          />

          {/* Attendance Poll Modal - Mandatory until voted */}
          {showPollModal && activePoll && (
            <AttendancePollModal
              poll={activePoll}
              onClose={handleClosePollModal}
              canDismiss={false}
            />
          )}
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
