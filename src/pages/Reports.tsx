import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useI18n } from '../i18n/I18nProvider';
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport, getStatusColor, getStatusIcon, getTrendIcon, getTrendColor } from '../services/reports';
import type { DailyReport, WeeklyReport, MonthlyReport, ReportPeriod } from '../types/report';

export const Reports: React.FC = () => {
  const { t } = useI18n();
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);

  useEffect(() => {
    // Load reports
    setDailyReport(generateDailyReport());
    setWeeklyReport(generateWeeklyReport());
    setMonthlyReport(generateMonthlyReport());
  }, []);

  const currentReport = period === 'day' ? dailyReport : period === 'week' ? weeklyReport : monthlyReport;

  if (!currentReport) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  const { summary, players } = currentReport;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('reports.title')}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('reports.subtitle')} - {new Date(summary.dateISO).toLocaleDateString()}
      </Typography>

      {/* Period Tabs */}
      <Tabs value={period} onChange={(_, val) => setPeriod(val)} sx={{ mb: 3 }}>
        <Tab label={t('reports.day')} value="day" />
        <Tab label={t('reports.week')} value="week" />
        <Tab label={t('reports.month')} value="month" />
      </Tabs>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                {summary.activePlayers}/{summary.totalPlayers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('reports.activePlayers')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {summary.avgScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('reports.avgScore')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                {summary.avgCompliance}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('reports.avgCompliance')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 700 }}>
                {summary.totalMinutes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('reports.totalMinutes')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('reports.statusBreakdown')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={`✅ ${summary.activePlayers}`} color="success" />
                <Typography variant="body2">{t('reports.status.active')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={`⚠️ ${summary.partialPlayers}`} color="warning" />
                <Typography variant="body2">{t('reports.status.partial')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={`❌ ${summary.absentPlayers}`} color="error" />
                <Typography variant="body2">{t('reports.status.absent')}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Player Activity Table */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('reports.playerActivity')}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                {t('reports.player')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                {t('reports.position')}
              </TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>
                {t('reports.status')}
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                {t('reports.workouts')}
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                {t('reports.minutes')}
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                {t('reports.score')}
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                {t('reports.trend')}
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                {t('reports.compliance')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={player.playerId}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                }}
              >
                <TableCell sx={{ fontWeight: 600 }}>{player.playerName}</TableCell>
                <TableCell>{player.position}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={getStatusIcon(player.status)}
                    color={getStatusColor(player.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {player.workoutsCompleted}/{player.workoutsAssigned}
                </TableCell>
                <TableCell align="right">{player.minutesTrained}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {player.currentScore}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: `${getTrendColor(player.scoreTrend)}.main` }}
                    >
                      {getTrendIcon(player.scoreTrend)} {player.scoreTrend > 0 ? '+' : ''}
                      {player.scoreTrend.toFixed(1)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box>
                    <Typography variant="body2">{player.compliance}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={player.compliance}
                      color={player.compliance >= 80 ? 'success' : player.compliance >= 50 ? 'warning' : 'error'}
                      sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Monthly Improvements/Declines */}
      {period === 'month' && monthlyReport && (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon color="success" />
                  <Typography variant="h6">{t('reports.topImprovements')}</Typography>
                </Box>
                {monthlyReport.improvements.map((item) => (
                  <Box key={item.playerId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{item.playerName}</Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                      +{item.improvement.toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingDownIcon color="error" />
                  <Typography variant="h6">{t('reports.needsAttention')}</Typography>
                </Box>
                {monthlyReport.declines.map((item) => (
                  <Box key={item.playerId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{item.playerName}</Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                      {item.decline.toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
