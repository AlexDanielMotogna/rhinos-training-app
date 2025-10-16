import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import type { SpeedSummary } from '../../types/testing';

interface SpeedProfileCardProps {
  summary: SpeedSummary | null;
}

export const SpeedProfileCard: React.FC<SpeedProfileCardProps> = ({ summary }) => {
  const { t } = useI18n();

  if (!summary) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('profile.speed.noData')}
        </Typography>
      </Paper>
    );
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'ELITE':
        return 'success';
      case 'FAST':
        return 'primary';
      case 'AVERAGE':
        return 'warning';
      case 'SLOW':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('profile.speed.title')}
      </Typography>

      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
          {summary.speedScore}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('profile.speed.scoreLabel')}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Chip
          label={t(`tests.speed.label.${summary.label.toLowerCase()}` as any)}
          color={getLabelColor(summary.label)}
          size="medium"
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
        {t(('tests.tier.' + summary.tier) as any)} | {new Date(summary.dateISO).toLocaleDateString()}
      </Typography>
    </Paper>
  );
};
