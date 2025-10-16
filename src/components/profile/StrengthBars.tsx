import React from 'react';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import type { Segment } from '../../types/testing';

interface StrengthBarsProps {
  segments: Record<Segment, number>; // score 0-100
  meta: Record<Segment, string>; // display value like "1.45× BW" or "120s"
}

const segmentOrder: Segment[] = ['legs', 'arms', 'back', 'shoulders', 'core'];

export const StrengthBars: React.FC<StrengthBarsProps> = ({ segments, meta }) => {
  const { t } = useI18n();

  const getBarColor = (score: number): 'success' | 'primary' | 'warning' | 'error' => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('profile.strength.segments')}
      </Typography>

      {segmentOrder.map(segment => {
        const score = segments[segment] || 0;
        const metaText = meta[segment] || '-';
        const barColor = getBarColor(score);

        return (
          <Box key={segment} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>
                {t(`profile.strength.${segment}`)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {metaText}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(score, 100)}
                color={barColor}
                sx={{
                  flex: 1,
                  height: 10,
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                {score}%
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
};
