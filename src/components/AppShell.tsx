import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import GroupIcon from '@mui/icons-material/Group';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationBell } from './NotificationBell';
import { OfflineIndicator } from './OfflineIndicator';
import {
  logout,
  getUser,
} from '../services/mock';
import { notificationService } from '../services/api';
import { isOnline } from '../services/sync';
import type { Notification } from '../types/notification';
import RhinosLogo from '../assets/imgs/USR_Allgemein_Quard_Transparent.png';
import { getTeamBranding } from '../services/teamSettings';
import { toastService } from '../services/toast';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = getUser();
  const branding = getTeamBranding();

  useEffect(() => {
    // Load notifications from backend
    const loadNotifications = async () => {
      if (!isOnline()) {
        console.log('[NOTIFICATIONS] Offline - skipping notification sync');
        return;
      }

      try {
        const backendNotifications = await notificationService.getAll();

        // Convert backend format (createdAt as string) to frontend format (timestamp as Date)
        const formattedNotifications = backendNotifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.createdAt),
          read: n.read,
          actionUrl: n.actionUrl,
        }));

        setNotifications(formattedNotifications);
        console.log(`[NOTIFICATIONS] Loaded ${formattedNotifications.length} notifications`);
      } catch (error) {
        console.error('[NOTIFICATIONS] Failed to load notifications:', error);
      }
    };

    loadNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { key: 'myTraining', label: t('nav.myTraining'), icon: <FitnessCenterIcon />, path: '/training', showForAll: true },
    { key: 'myCalendar', label: 'My Calendar', icon: <CalendarMonthIcon />, path: '/stats', showForAll: true },
    { key: 'tests', label: t('nav.tests'), icon: <AssessmentIcon />, path: '/tests', showForAll: true },
    { key: 'profile', label: t('nav.profile'), icon: <PersonIcon />, path: '/profile', showForAll: true },
    { key: 'team', label: t('nav.team'), icon: <GroupIcon />, path: '/team', showForAll: true },
    { key: 'trainingSessions', label: t('nav.trainingSessions'), icon: <GroupsIcon />, path: '/training-sessions', showForAll: true },
    { key: 'leaderboard', label: t('nav.leaderboard'), icon: <LeaderboardIcon />, path: '/leaderboard', showForAll: true },
    { key: 'videos', label: t('nav.videos'), icon: <OndemandVideoIcon />, path: '/videos', showForAll: true },
    { key: 'drillSessions', label: t('nav.drillSessions'), icon: <SportsFootballIcon />, path: '/drill-sessions', showForAll: false, coachOnly: true },
    { key: 'reports', label: t('nav.reports'), icon: <DescriptionIcon />, path: '/reports', showForAll: false, coachOnly: true },
    { key: 'videosAdmin', label: t('nav.videosAdmin'), icon: <VideoLibraryIcon />, path: '/videos-admin', showForAll: false, coachOnly: true },
    { key: 'admin', label: t('nav.admin'), icon: <AdminPanelSettingsIcon />, path: '/admin', showForAll: false, coachOnly: true },
    { key: 'configuration', label: 'Configuration', icon: <SettingsIcon />, path: '/configuration', showForAll: false, coachOnly: true },
  ];

  const visibleMenuItems = menuItems.filter(item =>
    item.showForAll || (item.coachOnly && user?.role === 'coach')
  );

  const handleNavigation = (path: string) => {
    // Close drawer immediately for better UX
    setDrawerOpen(false);
    // Small delay to allow drawer animation to start before navigation
    setTimeout(() => {
      navigate(path);
    }, 100);
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    // Clear all user data
    logout();
    toastService.logoutSuccess();
    // Force immediate navigation to login page
    // Use replace to prevent going back to authenticated pages
    navigate('/', { replace: true });
  };

  const handleMarkAsRead = async (id: string) => {
    if (!isOnline()) {
      console.warn('[NOTIFICATIONS] Cannot mark as read while offline');
      return;
    }

    try {
      await notificationService.markAsRead(id);

      // Update local state optimistically
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!isOnline()) {
      console.warn('[NOTIFICATIONS] Cannot mark all as read while offline');
      return;
    }

    try {
      await notificationService.markAllAsRead();

      // Update local state optimistically
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={2}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2 } }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{
              mr: { xs: 0.5, sm: 2 },
              p: { xs: 1, sm: 1.5 }
            }}
          >
            <MenuIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '0.95rem', sm: '1.25rem' },
              fontWeight: 600,
            }}
          >
            {t('app.title')}
          </Typography>

          <NotificationBell
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onNotificationClick={handleNotificationClick}
          />

          <OfflineIndicator />

          <LanguageSwitcher />

          <IconButton
            color="inherit"
            onClick={handleLogout}
            sx={{
              ml: { xs: 0.5, sm: 1 },
              p: { xs: 1, sm: 1.5 }
            }}
            title={t('nav.logout')}
          >
            <LogoutIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={() => setDrawerOpen(false)}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: 'primary.main',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                component="img"
                src={branding.logoUrl || RhinosLogo}
                alt={`${branding.appName} Logo`}
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: 'contain',
                }}
              />
              <Typography variant="h6">{branding.appName || t('app.title')}</Typography>
            </Box>
            {user && (
              <Box sx={{ pl: 0.5 }}>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {user.role === 'coach' ? t('auth.roleCoach') : `#${user.jerseyNumber} ${user.position}`}
                </Typography>
              </Box>
            )}
          </Box>

          <List>
            {visibleMenuItems.map((item) => (
              <ListItem key={item.key} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}

            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={t('nav.logout')} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: 'calc(100vh - 64px)' }}>
        <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};
