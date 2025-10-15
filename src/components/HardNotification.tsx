import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import type { HardNotification as HardNotificationType } from '../types/notification';
import { useI18n } from '../i18n/I18nProvider';

interface HardNotificationProps {
  notification: HardNotificationType | null;
  onAcknowledge: () => void;
}

export const HardNotification: React.FC<HardNotificationProps> = ({
  notification,
  onAcknowledge,
}) => {
  const { t } = useI18n();

  if (!notification) return null;

  const severityColors = {
    low: 'info.main',
    medium: 'warning.main',
    high: 'error.main',
  };

  return (
    <Dialog
      open={true}
      fullScreen
      disableEscapeKeyDown
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: severityColors[notification.severity],
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <WarningIcon fontSize="large" />
          <Typography variant="h5" component="span">
            {notification.title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
          px: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            mb: 4,
            maxWidth: '600px',
          }}
        >
          {notification.message}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t('notify.hard.cta')}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'center',
          pb: 4,
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={onAcknowledge}
          sx={{
            minWidth: 200,
            py: 1.5,
          }}
        >
          {t('notify.hard.cta')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
