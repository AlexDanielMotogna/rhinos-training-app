import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Button } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createDynamicTheme } from './theme';
import { I18nProvider } from './i18n/I18nProvider';
import { AppShell } from './components/AppShell';
import { AttendancePollModal } from './components/AttendancePollModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getUser } from './services/userProfile';
import { MyTraining } from './pages/MyTraining';
import type { AttendancePoll } from './types/attendancePoll';
import { getTeamBrandingAsync, getCachedBranding, cacheBranding } from './services/teamSettings';
import type { TeamBranding } from './types/teamSettings';
import { initializeDrillData } from './services/drillDataInit';
import { getActivePoll, hasUserVoted } from './services/attendancePollService';
import { cleanupMockNotifications } from './services/mock';

/**
 * Helper to create lazy-loaded components with error handling
 * Prevents blank screens when chunks fail to load
 */
const createLazyComponent = (
  importFn: () => Promise<any>,
  componentName: string
) => {
  return lazy(() =>
    importFn()
      .catch((error) => {
        console.error(`Failed to load component ${componentName}:`, error);
        // Return a fallback component instead of crashing
        return {
          default: () => (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                gap: 2,
                p: 3,
              }}
            >
              <Typography variant="h6" color="error">
                Failed to load {componentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please check your internet connection and try again
              </Typography>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </Box>
          ),
        };
      })
  );
};

// Lazy load all page components with error handling
// NOTE: MyTraining is imported directly (not lazy) to avoid double loading spinner
const Auth = createLazyComponent(() => import('./pages/Auth').then(m => ({ default: m.Auth })), 'Auth');
const ResetPassword = createLazyComponent(() => import('./pages/ResetPassword'), 'ResetPassword');
const MyStats = createLazyComponent(() => import('./pages/MyStats').then(m => ({ default: m.MyStats })), 'MyStats');
const Profile = createLazyComponent(() => import('./pages/Profile').then(m => ({ default: m.Profile })), 'Profile');
const Attendance = createLazyComponent(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })), 'Attendance');
const Leaderboard = createLazyComponent(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })), 'Leaderboard');
const Admin = createLazyComponent(() => import('./pages/Admin').then(m => ({ default: m.Admin })), 'Admin');
const Tests = createLazyComponent(() => import('./pages/Tests').then(m => ({ default: m.Tests })), 'Tests');
const TestsStrength = createLazyComponent(() => import('./pages/TestsStrength').then(m => ({ default: m.TestsStrength })), 'TestsStrength');
const TestsSpeed = createLazyComponent(() => import('./pages/TestsSpeed').then(m => ({ default: m.TestsSpeed })), 'TestsSpeed');
const TestsPower = createLazyComponent(() => import('./pages/TestsPower').then(m => ({ default: m.TestsPower })), 'TestsPower');
const TestsAgility = createLazyComponent(() => import('./pages/TestsAgility').then(m => ({ default: m.TestsAgility })), 'TestsAgility');
const Reports = createLazyComponent(() => import('./pages/Reports').then(m => ({ default: m.Reports })), 'Reports');
const Videos = createLazyComponent(() => import('./pages/Videos').then(m => ({ default: m.Videos })), 'Videos');
const VideosAdmin = createLazyComponent(() => import('./pages/VideosAdmin').then(m => ({ default: m.VideosAdmin })), 'VideosAdmin');
const Team = createLazyComponent(() => import('./pages/Team').then(m => ({ default: m.Team })), 'Team');
const TrainingSessions = createLazyComponent(() => import('./pages/TrainingSessions').then(m => ({ default: m.TrainingSessions })), 'TrainingSessions');
const Organization = createLazyComponent(() => import('./pages/Organization').then(m => ({ default: m.Organization })), 'Organization');
const DrillSessionsManage = createLazyComponent(() => import('./components/DrillTrainingPlan').then(m => ({ default: m.DrillTrainingPlan })), 'DrillSessionsManage');
const DrillbookView = createLazyComponent(() => import('./pages/DrillbookView').then(m => ({ default: m.DrillbookView })), 'DrillbookView');
const Spielplan = createLazyComponent(() => import('./pages/Spielplan').then(m => ({ default: m.Spielplan })), 'Spielplan');

/**
 * Wrap lazy component with Suspense - inline spinner for pages inside AppShell
 */
const withLazy = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner inline={true} />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

function App() {
  // Initialize drill data on app startup
  // DISABLED: Drills/Equipment should be created manually by coaches via Admin panel
  // The auto-initialization was causing 400 errors on backend due to validation issues
  // useEffect(() => {
  //   initializeDrillData();
  // }, []);

  // State for branding - initialized from cache to prevent color flash on refresh
  const [branding, setBranding] = useState<TeamBranding>(() => getCachedBranding());

  // Clean up old mock data on app startup
  useEffect(() => {
    cleanupMockNotifications();
  }, []);

  // Initialize branding from database on app startup
  useEffect(() => {
    const loadBranding = async () => {
      const brandingData = await getTeamBrandingAsync();
      setBranding(brandingData);

      // Cache branding for instant loading on next refresh (prevents color flash)
      cacheBranding(brandingData);

      // Update document title
      if (brandingData.appName) {
        document.title = brandingData.appName;
      }

      // Update favicon
      if (brandingData.faviconUrl) {
        const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = brandingData.faviconUrl;
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      // Update theme-color meta tag for mobile browser chrome
      if (brandingData.primaryColor) {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
          themeColorMeta.setAttribute('content', brandingData.primaryColor);
        }
      }
    };
    loadBranding();
  }, []);

  const [currentUser, setCurrentUser] = useState(() => getUser());
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

    // Listen for immediate logout events
    const handleLogout = () => {
      setCurrentUser(null);
    };

    window.addEventListener('user-logout', handleLogout);

    // Check every 1 second for faster logout response (fallback)
    const interval = setInterval(checkUser, 1000);

    return () => {
      window.removeEventListener('user-logout', handleLogout);
      clearInterval(interval);
    };
  }, [currentUser]);

  // Check for active attendance poll - only once on mount
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, not on currentUser changes

  // Check periodically for new polls (every 30 seconds)
  useEffect(() => {
    if (!currentUser) return;

    const checkForPolls = async () => {
      // Don't check if modal is already open (prevents resetting user's selection)
      if (showPollModal) return;

      const poll = await getActivePoll();
      const user = getUser(); // Get fresh user data
      if (poll && user && !(await hasUserVoted(poll.id, user.id))) {
        setActivePoll(poll);
        setShowPollModal(true);
      }
    };

    const interval = setInterval(checkForPolls, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPollModal]); // Only depend on showPollModal, not currentUser

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

  // Create dynamic theme based on branding from database
  const theme = useMemo(() => {
    return createDynamicTheme(branding);
  }, [branding]); // Re-create theme when branding changes

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <I18nProvider defaultLocale="en">
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                currentUser ? <Navigate to="/training" replace /> : <ErrorBoundary><Suspense fallback={<LoadingSpinner fullPageBackground={true} />}><Auth /></Suspense></ErrorBoundary>
              }
            />

            <Route
              path="/reset-password"
              element={<ErrorBoundary><Suspense fallback={<LoadingSpinner fullPageBackground={true} />}><ResetPassword /></Suspense></ErrorBoundary>}
            />

            {currentUser ? (
              <Route element={<AppShell><Outlet /></AppShell>}>
                <Route path="/training" element={<MyTraining />} />
                <Route path="/stats" element={withLazy(MyStats)} />
                <Route path="/spielplan" element={withLazy(Spielplan)} />
                <Route path="/tests" element={withLazy(Tests)} />
                <Route path="/tests/strength" element={withLazy(TestsStrength)} />
                <Route path="/tests/speed" element={withLazy(TestsSpeed)} />
                <Route path="/tests/power" element={withLazy(TestsPower)} />
                <Route path="/tests/agility" element={withLazy(TestsAgility)} />
                <Route path="/profile" element={withLazy(Profile)} />
                <Route path="/profile/:playerId" element={withLazy(Profile)} />
                <Route path="/team" element={withLazy(Team)} />
                <Route path="/training-sessions" element={withLazy(TrainingSessions)} />
                <Route path="/drillbook" element={withLazy(DrillbookView)} />
                <Route path="/attendance" element={withLazy(Attendance)} />
                <Route path="/leaderboard" element={withLazy(Leaderboard)} />
                <Route path="/videos" element={withLazy(Videos)} />
                <Route
                  path="/videos-admin"
                  element={
                    currentUser.role === 'coach'
                      ? withLazy(VideosAdmin)
                      : <Navigate to="/training" replace />
                  }
                />
                <Route
                  path="/reports"
                  element={
                    currentUser.role === 'coach'
                      ? withLazy(Reports)
                      : <Navigate to="/training" replace />
                  }
                />
                <Route
                  path="/admin"
                  element={
                    currentUser.role === 'coach'
                      ? withLazy(Admin)
                      : <Navigate to="/training" replace />
                  }
                />
                <Route
                  path="/organization"
                  element={
                    currentUser.role === 'coach'
                      ? withLazy(Organization)
                      : <Navigate to="/training" replace />
                  }
                />
                <Route
                  path="/drill-sessions-manage"
                  element={
                    currentUser.role === 'coach'
                      ? withLazy(DrillSessionsManage)
                      : <Navigate to="/training" replace />
                  }
                />
                <Route path="*" element={<Navigate to="/training" replace />} />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to="/" replace />} />
            )}
          </Routes>

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
