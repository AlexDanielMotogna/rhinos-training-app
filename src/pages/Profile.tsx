import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useI18n } from '../i18n/I18nProvider';
import { getUser, getMockKPIs, getMockProjection } from '../services/mock';
import { StrengthProfileCard } from '../components/profile/StrengthProfileCard';
import { StrengthBars } from '../components/profile/StrengthBars';
import type { KPISnapshot, ProjectionRow } from '../types/kpi';
import type { StrengthSummary } from '../types/testing';

export const Profile: React.FC = () => {
  const { t } = useI18n();
  const [kpis, setKpis] = useState<KPISnapshot | null>(null);
  const [projection, setProjection] = useState<ProjectionRow[]>([]);
  const [strengthSummary, setStrengthSummary] = useState<StrengthSummary | null>(null);

  const user = getUser();

  useEffect(() => {
    setKpis(getMockKPIs());
    setProjection(getMockProjection());

    // Load last strength test from localStorage
    const lastTest = localStorage.getItem('lastStrengthTest');
    if (lastTest) {
      try {
        setStrengthSummary(JSON.parse(lastTest));
      } catch (e) {
        console.error('Failed to parse strength test data', e);
      }
    }
  }, []);

  if (!user || !kpis) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  const metricCards = [
    { label: t('profile.level'), value: kpis.levelScore, color: 'primary.main' },
    { label: t('profile.weeklyScore'), value: kpis.weeklyScore, color: 'secondary.main' },
    { label: t('profile.weeklyMinutes'), value: kpis.weeklyMinutes, color: 'success.main' },
  ];

  const detailMetrics = [
    { label: t('profile.planMinutes'), value: `${kpis.planMinutes} min` },
    { label: t('profile.freeMinutes'), value: `${kpis.freeMinutes} min` },
    { label: t('profile.freeShare'), value: `${kpis.freeSharePct}%` },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('nav.profile')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                #{user.jerseyNumber}
              </Box>
              <Box>
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(`position.${user.position}` as any)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Chip label={`${user.age} years`} size="small" />
              <Chip label={`${user.weightKg} kg`} size="small" />
              <Chip label={`${user.heightCm} cm`} size="small" />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('profile.metrics')}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metricCards.map((metric) => (
          <Grid item xs={12} sm={4} key={metric.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: metric.color, fontWeight: 700 }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {detailMetrics.map((metric) => (
          <Grid item xs={12} sm={4} key={metric.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h6">{metric.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('profile.labels')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {kpis.labels.map((label) => (
              <Chip
                key={label}
                label={t(`label.${label}` as any)}
                color="secondary"
                size="medium"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Strength Testing Results */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('profile.strength.title')}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <StrengthProfileCard summary={strengthSummary} />
        </Grid>
        <Grid item xs={12} md={6}>
          {strengthSummary && (
            <StrengthBars
              segments={{
                legs: strengthSummary.bySegment.legs.score,
                arms: strengthSummary.bySegment.arms.score,
                back: strengthSummary.bySegment.back.score,
                shoulders: strengthSummary.bySegment.shoulders.score,
                core: strengthSummary.bySegment.core.score,
              }}
              meta={{
                legs: strengthSummary.bySegment.legs.detail,
                arms: strengthSummary.bySegment.arms.detail,
                back: strengthSummary.bySegment.back.detail,
                shoulders: strengthSummary.bySegment.shoulders.detail,
                core: strengthSummary.bySegment.core.detail,
              }}
            />
          )}
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('profile.projection')}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Week</TableCell>
              <TableCell align="right">{t('profile.level')}</TableCell>
              <TableCell align="right">{t('profile.compliance')} %</TableCell>
              <TableCell align="right">{t('profile.totalMinutes')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projection.map((row) => (
              <TableRow key={row.week}>
                <TableCell>{row.week}</TableCell>
                <TableCell align="right">{row.score}</TableCell>
                <TableCell align="right">{row.compliance.toFixed(1)}</TableCell>
                <TableCell align="right">{row.totalMin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
