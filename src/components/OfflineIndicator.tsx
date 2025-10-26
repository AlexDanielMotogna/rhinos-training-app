import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Typography,
  LinearProgress,
  Divider,
} from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncIcon from '@mui/icons-material/Sync';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GroupIcon from '@mui/icons-material/Group';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useOffline } from '../hooks/useOffline';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, lastSync, pendingSyncItems, cacheStats, manualSync, prefetch } =
    useOffline();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSync = async () => {
    handleClose();
    await manualSync();
  };

  const handlePrefetch = async () => {
    handleClose();
    await prefetch(14);
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    const minutes = Math.floor((Date.now() - lastSync) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Box>
      <Tooltip title={isOnline ? 'Online - Click for sync options' : 'Offline mode'}>
        <IconButton onClick={handleClick} color="inherit" size="small">
          <Badge badgeContent={pendingSyncItems} color="warning">
            {isSyncing ? (
              <SyncIcon className="rotating" />
            ) : isOnline ? (
              <CloudDoneIcon />
            ) : (
              <CloudOffIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Status Header */}
        <Box sx={{ px: 2, py: 1, minWidth: 280 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {isOnline ? (
              <Chip
                icon={<CloudDoneIcon />}
                label="Online"
                color="success"
                size="small"
              />
            ) : (
              <Chip
                icon={<CloudOffIcon />}
                label="Offline"
                color="warning"
                size="small"
              />
            )}
            {isSyncing && <Chip label="Syncing..." size="small" />}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Last sync: {formatLastSync()}
          </Typography>

          {isSyncing && (
            <LinearProgress sx={{ mt: 1 }} />
          )}
        </Box>

        <Divider />

        {/* Cache Stats */}
        {cacheStats && (
          <>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Offline Cache
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon fontSize="small" />
                <Typography variant="body2">
                  {cacheStats.trainingSessions} sessions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="body2">
                  {cacheStats.attendance} attendance records
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenterIcon fontSize="small" />
                <Typography variant="body2">
                  {cacheStats.workouts} workouts
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon fontSize="small" />
                <Typography variant="body2">
                  {cacheStats.users} team members
                </Typography>
              </Box>
              {cacheStats.pendingSync > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HourglassEmptyIcon fontSize="small" color="warning" />
                  <Typography variant="body2" color="warning.main">
                    {cacheStats.pendingSync} pending sync
                  </Typography>
                </Box>
              )}
            </Box>
            <Divider />
          </>
        )}

        {/* Actions */}
        <MenuItem onClick={handleSync} disabled={!isOnline || isSyncing}>
          <SyncIcon fontSize="small" sx={{ mr: 1 }} />
          Sync Now
        </MenuItem>
        <MenuItem onClick={handlePrefetch} disabled={!isOnline || isSyncing}>
          <CloudQueueIcon fontSize="small" sx={{ mr: 1 }} />
          Download for Offline
        </MenuItem>
      </Menu>

      {/* Add rotation animation for sync icon */}
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Box>
  );
};
