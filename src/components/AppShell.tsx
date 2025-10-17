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
import EventIcon from '@mui/icons-material/Event';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import GroupIcon from '@mui/icons-material/Group';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationBell } from './NotificationBell';
import {
  logout,
  getUser,
  getMockNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/mock';
import type { Notification } from '../types/notification';
import RhinosLogo from '../assets/imgs/USR_Allgemein_Quard_Transparent.png';

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

  useEffect(() => {
    // Load notifications
    setNotifications(getMockNotifications());

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      setNotifications(getMockNotifications());
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
    { key: 'attendance', label: t('nav.attendance'), icon: <EventIcon />, path: '/attendance', showForAll: true },
    { key: 'leaderboard', label: t('nav.leaderboard'), icon: <LeaderboardIcon />, path: '/leaderboard', showForAll: true },
    { key: 'videos', label: t('nav.videos'), icon: <OndemandVideoIcon />, path: '/videos', showForAll: true },
    { key: 'reports', label: t('nav.reports'), icon: <DescriptionIcon />, path: '/reports', showForAll: false, coachOnly: true },
    { key: 'videosAdmin', label: t('nav.videosAdmin'), icon: <VideoLibraryIcon />, path: '/videos-admin', showForAll: false, coachOnly: true },
    { key: 'admin', label: t('nav.admin'), icon: <AdminPanelSettingsIcon />, path: '/admin', showForAll: false, coachOnly: true },
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
    logout();
    navigate('/');
  };

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(getMockNotifications());
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    setNotifications(getMockNotifications());
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
                src={RhinosLogo}
                alt="Rhinos Logo"
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: 'contain',
                }}
              />
              <Typography variant="h6">{t('app.title')}</Typography>
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
