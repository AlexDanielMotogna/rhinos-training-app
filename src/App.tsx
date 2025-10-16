import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { I18nProvider } from './i18n/I18nProvider';
import { AppShell } from './components/AppShell';
import { HardNotification } from './components/HardNotification';
import { Auth } from './pages/Auth';
import { MyTraining } from './pages/MyTraining';
import { Profile } from './pages/Profile';
import { Attendance } from './pages/Attendance';
import { Leaderboard } from './pages/Leaderboard';
import { Coach } from './pages/Coach';
import { Admin } from './pages/Admin';
import { getUser, initializeDemoProfiles } from './services/mock';
import type { HardNotification as HardNotificationType } from './types/notification';

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
                <Route path="/profile" element={<Profile />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/coach" element={<Coach />} />
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
