import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useI18n } from '../i18n/I18nProvider';

interface LoadingSpinnerProps {
  /** If true, uses primary color background (for login/auth pages). Default: false */
  fullPageBackground?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullPageBackground = false }) => {
  const { t } = useI18n();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        // Only use primary background for login/auth pages to prevent white flash
        // For lazy-loaded pages, inherit background from body/theme
        ...(fullPageBackground && { backgroundColor: 'primary.main' }),
      }}
    >
      <CircularProgress
        size={60}
        thickness={4}
        sx={{ color: fullPageBackground ? 'white' : 'primary.main' }}
      />
      <Typography
        variant="h6"
        sx={{ color: fullPageBackground ? 'rgba(255,255,255,0.8)' : 'text.primary' }}
      >
        {t('common.loading')}
      </Typography>
    </Box>
  );
};
