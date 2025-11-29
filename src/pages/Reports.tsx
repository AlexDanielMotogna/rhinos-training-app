import React, { useState, useEffect, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useI18n } from '../i18n/I18nProvider';
import { getStatusColor, getStatusIcon, getTrendDirection, getTrendColor } from '../services/reports';
import { reportsService } from '../services/api';
import type { DailyReport, WeeklyReport, MonthlyReport, ReportPeriod, PlayerStatus } from '../types/report';
import type { Position } from '../types/exercise';

type UnitFilter = 'all' | 'offense' | 'defense';

// Position categories
const OFFENSE_POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL'];
const DEFENSE_POSITIONS: Position[] = ['DL', 'LB', 'DB'];
const ALL_POSITIONS: Position[] = [...OFFENSE_POSITIONS, ...DEFENSE_POSITIONS, 'K/P'];

export const Reports: React.FC = () => {
  const { t } = useI18n();
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [unitFilter, setUnitFilter] = useState<UnitFilter>('all');
  const [positionFilter, setPositionFilter] = useState<Position | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | 'all'>('all');
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [sessionCarouselIndex, setSessionCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    if (!isOnline()) {
      setError('Offline - Cannot load reports');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load all reports from backend
      const [daily, weekly, monthly] = await Promise.all([
        reportsService.getDailyReport(),
        reportsService.getWeeklyReport(),
        reportsService.getMonthlyReport(),
      ]);

      setDailyReport(daily);
      setWeeklyReport(weekly);
      setMonthlyReport(monthly);
    } catch (err: any) {
      console.error('[REPORTS] Load error:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Reset position filter when unit filter changes
  useEffect(() => {
    setPositionFilter('all');
  }, [unitFilter]);

  // Reset carousel when period changes
  useEffect(() => {
    setSessionCarouselIndex(0);
  }, [period]);

  const currentReport = period === 'day' ? dailyReport : period === 'week' ? weeklyReport : monthlyReport;

  // Get available positions based on unit filter
  const availablePositions = useMemo(() => {
    if (unitFilter === 'offense') return OFFENSE_POSITIONS;
    if (unitFilter === 'defense') return DEFENSE_POSITIONS;
    return ALL_POSITIONS;
  }, [unitFilter]);

  // Filter players based on unit, position, and status
  const filteredPlayers = useMemo(() => {
    if (!currentReport) return [];

    let filtered = [...currentReport.players];

    // Apply unit filter
    if (unitFilter === 'offense') {
      filtered = filtered.filter(p => OFFENSE_POSITIONS.includes(p.position));
    } else if (unitFilter === 'defense') {
      filtered = filtered.filter(p => DEFENSE_POSITIONS.includes(p.position));
    }

    // Apply position filter
    if (positionFilter !== 'all') {
      filtered = filtered.filter(p => p.position === positionFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    return filtered;
  }, [currentReport, unitFilter, positionFilter, statusFilter]);

  // Recalculate summary for filtered players
  const filteredSummary = useMemo(() => {
    if (!currentReport || filteredPlayers.length === 0) return currentReport?.summary;

    const activePlayers = filteredPlayers.filter(p => p.status === 'active').length;
    const partialPlayers = filteredPlayers.filter(p => p.status === 'partial').length;
    const absentPlayers = filteredPlayers.filter(p => p.status === 'absent').length;
    const avgScore = Math.round(filteredPlayers.reduce((sum, p) => sum + p.currentScore, 0) / filteredPlayers.length);
    const avgCompliance = Math.round(filteredPlayers.reduce((sum, p) => sum + p.compliance, 0) / filteredPlayers.length);
    const totalMinutes = filteredPlayers.reduce((sum, p) => sum + p.minutesTrained, 0);

    return {
      ...currentReport.summary,
      totalPlayers: filteredPlayers.length,
      activePlayers,
      partialPlayers,
      absentPlayers,
      avgScore,
      avgCompliance,
      totalMinutes,
      avgMinutesPerPlayer: Math.round(totalMinutes / filteredPlayers.length),
    };
  }, [currentReport, filteredPlayers]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        {!isOnline() && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Reports require an internet connection
          </Typography>
        )}
      </Box>
    );
  }

  if (!currentReport || !filteredSummary) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No report data available
        </Typography>
      </Box>
    );
  }

  const summary = filteredSummary;
  const players = filteredPlayers;

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

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Tabs value={unitFilter} onChange={(_, val) => setUnitFilter(val)} variant="fullWidth">
            <Tab label={t('reports.filters.all')} value="all" />
            <Tab label={t('reports.filters.offense')} value="offense" />
            <Tab label={t('reports.filters.defense')} value="defense" />
          </Tabs>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>{t('reports.filters.position')}</InputLabel>
            <Select
              value={positionFilter}
              label={t('reports.filters.position')}
              onChange={(e) => setPositionFilter(e.target.value as Position | 'all')}
            >
              <MenuItem value="all">{t('reports.filters.allPositions')}</MenuItem>
              {availablePositions.map((pos) => (
                <MenuItem key={pos} value={pos}>
                  {pos}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>{t('reports.filters.status')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('reports.filters.status')}
              onChange={(e) => setStatusFilter(e.target.value as PlayerStatus | 'all')}
            >
              <MenuItem value="all">{t('reports.filters.allStatuses')}</MenuItem>
              <MenuItem value="active">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                  {t('reports.status.active')}
                </Box>
              </MenuItem>
              <MenuItem value="partial">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon fontSize="small" color="warning" />
                  {t('reports.status.partial')}
                </Box>
              </MenuItem>
              <MenuItem value="absent">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon fontSize="small" color="error" />
                  {t('reports.status.absent')}
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

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
                <Chip
                  icon={<CheckCircleIcon />}
                  label={summary.activePlayers}
                  color="success"
                />
                <Typography variant="body2">{t('reports.status.active')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<WarningIcon />}
                  label={summary.partialPlayers}
                  color="warning"
                />
                <Typography variant="body2">{t('reports.status.partial')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<CancelIcon />}
                  label={summary.absentPlayers}
                  color="error"
                />
                <Typography variant="body2">{t('reports.status.absent')}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Team Training Sessions Carousel */}
      {summary.teamSessions && summary.teamSessions.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                {t('reports.teamSessionsTitle')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setSessionCarouselIndex(Math.max(0, sessionCarouselIndex - 3))}
                  disabled={sessionCarouselIndex === 0}
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 60, textAlign: 'center' }}>
                  {sessionCarouselIndex + 1}-{Math.min(sessionCarouselIndex + 3, summary.teamSessions.length)} / {summary.teamSessions.length}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setSessionCarouselIndex(Math.min(summary.teamSessions!.length - 3, sessionCarouselIndex + 3))}
                  disabled={sessionCarouselIndex >= summary.teamSessions.length - 3}
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Grid container spacing={2}>
              {summary.teamSessions.slice(sessionCarouselIndex, sessionCarouselIndex + 3).map((session, index) => (
                <Grid item xs={12} sm={4} key={sessionCarouselIndex + index}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(session.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, my: 0.5 }}>
                      {session.startTime} - {session.endTime}
                    </Typography>
                    {session.location && (
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                        {session.location}
                      </Typography>
                    )}
                    {session.address && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {session.address}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                        {session.playersAttended}/{session.totalPlayers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('reports.sessionAttendance')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Player Activity Table */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('reports.playerActivity')}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {t('reports.player')}
                  <Tooltip title={t('reports.tooltips.player')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {t('reports.position')}
                  <Tooltip title={t('reports.tooltips.position')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  {t('reports.status')}
                  <Tooltip title={t('reports.tooltips.status')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('reports.workouts')}
                  <Tooltip title={t('reports.tooltips.workouts')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              {(period === 'week' || period === 'month') && (
                <>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      {t('reports.daysTrained')}
                      <Tooltip title={t('reports.tooltips.daysTrained')} arrow>
                        <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      {t('reports.teamAttendance')}
                      <Tooltip title={t('reports.tooltips.teamAttendance')} arrow>
                        <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </>
              )}
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('reports.minutes')}
                  <Tooltip title={t('reports.tooltips.minutes')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('reports.score')}
                  <Tooltip title={t('reports.tooltips.score')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('reports.trend')}
                  <Tooltip title={t('reports.tooltips.trend')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('reports.compliance')}
                  <Tooltip title={t('reports.tooltips.compliance')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
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
                    icon={
                      getStatusIcon(player.status) === 'active' ? <CheckCircleIcon /> :
                      getStatusIcon(player.status) === 'partial' ? <WarningIcon /> :
                      <CancelIcon />
                    }
                    label=""
                    color={getStatusColor(player.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {player.workoutsCompleted}/{player.workoutsAssigned}
                </TableCell>
                {(period === 'week' || period === 'month') && player.daysTrainedInPeriod !== undefined && (
                  <>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {player.daysTrainedInPeriod}/{player.totalDaysInPeriod}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {player.teamSessionsAttended || 0}/{player.totalTeamSessions || 0}
                      </Typography>
                    </TableCell>
                  </>
                )}
                <TableCell align="right">{player.minutesTrained}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {player.currentScore}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {getTrendDirection(player.scoreTrend) === 'up' && (
                      <TrendingUpIcon fontSize="small" color="success" />
                    )}
                    {getTrendDirection(player.scoreTrend) === 'down' && (
                      <TrendingDownIcon fontSize="small" color="error" />
                    )}
                    {getTrendDirection(player.scoreTrend) === 'flat' && (
                      <TrendingFlatIcon fontSize="small" color="warning" />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ color: `${getTrendColor(player.scoreTrend)}.main` }}
                    >
                      {player.scoreTrend > 0 ? '+' : ''}
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
