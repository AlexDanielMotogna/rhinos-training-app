import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import type { StrengthSummary } from '../../types/testing';

interface StrengthProfileCardProps {
  summary: StrengthSummary | null;
}

export const StrengthProfileCard: React.FC<StrengthProfileCardProps> = ({ summary }) => {
  const { t } = useI18n();

  if (!summary) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('profile.strength.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('profile.strength.noData')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'MACHINE':
        return 'success';
      case 'STEADY':
        return 'primary';
      case 'IRREGULAR':
        return 'warning';
      case 'LAZY':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateISO: string) => {
    const date = new Date(dateISO);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('profile.strength.title')}
        </Typography>

        {/* Strength Index - Big */}
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
            {summary.strengthIndex}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('profile.strength.index')}
          </Typography>
        </Box>

        {/* Label */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Chip
            label={t(`tests.label.${summary.label.toLowerCase()}` as any)}
            color={getLabelColor(summary.label)}
            size="medium"
          />
        </Box>

        {/* Tier & Date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('profile.strength.tier')}: <strong>{t(`tests.tier.${summary.tier}`)}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(summary.dateISO)}
          </Typography>
        </Box>

        {/* Coach Note Placeholder */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'info.lighter',
            borderRadius: 1,
            borderLeft: 3,
            borderColor: 'info.main',
          }}
        >
          <Typography variant="caption" color="info.dark">
            <strong>{t('profile.strength.coachNote')}:</strong> {t('profile.strength.aiTip')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
