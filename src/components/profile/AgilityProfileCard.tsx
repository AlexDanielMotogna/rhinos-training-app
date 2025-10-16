import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import type { AgilitySummary } from '../../types/testing';

interface AgilityProfileCardProps {
  summary: AgilitySummary | null;
}

export const AgilityProfileCard: React.FC<AgilityProfileCardProps> = ({ summary }) => {
  const { t } = useI18n();

  if (!summary) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('profile.agility.noData')}
        </Typography>
      </Paper>
    );
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'ELITE':
        return 'success';
      case 'QUICK':
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
        {t('profile.agility.title')}
      </Typography>

      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
          {summary.agilityScore}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('profile.agility.scoreLabel')}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Chip
          label={t(`tests.agility.label.${summary.label.toLowerCase()}` as any)}
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
