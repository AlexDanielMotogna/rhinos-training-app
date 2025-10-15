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
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import SportsIcon from '@mui/icons-material/Sports';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
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
    { key: 'profile', label: t('nav.profile'), icon: <PersonIcon />, path: '/profile', showForAll: true },
    { key: 'attendance', label: t('nav.attendance'), icon: <EventIcon />, path: '/attendance', showForAll: true },
    { key: 'leaderboard', label: t('nav.leaderboard'), icon: <LeaderboardIcon />, path: '/leaderboard', showForAll: true },
    { key: 'coach', label: t('nav.coach'), icon: <SportsIcon />, path: '/coach', showForAll: true },
    { key: 'admin', label: t('nav.admin'), icon: <AdminPanelSettingsIcon />, path: '/admin', showForAll: false, coachOnly: true },
  ];

  const visibleMenuItems = menuItems.filter(item =>
    item.showForAll || (item.coachOnly && user?.role === 'coach')
  );

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
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
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('app.title')}
          </Typography>

          <NotificationBell
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onNotificationClick={handleNotificationClick}
          />

          <LanguageSwitcher />
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
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              component="img"
              src="/src/assets/imgs/USR_Allgemein_Quard_Transparent.png"
              alt="Rhinos Logo"
              sx={{
                width: 40,
                height: 40,
                objectFit: 'contain',
              }}
            />
            <Typography variant="h6">{t('app.title')}</Typography>
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
