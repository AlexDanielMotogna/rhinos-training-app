import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useI18n } from '../i18n/I18nProvider';

export const LoadingSpinner: React.FC = () => {
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
        // Use primary color background to prevent white flash during lazy loading
        backgroundColor: 'primary.main',
      }}
    >
      <CircularProgress size={60} thickness={4} sx={{ color: 'white' }} />
      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
        {t('common.loading')}
      </Typography>
    </Box>
  );
};
