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
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" color="text.secondary">
        {t('common.loading')}
      </Typography>
    </Box>
  );
};
