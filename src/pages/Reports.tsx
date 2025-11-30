import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import RemoveIcon from '@mui/icons-material/Remove';
import { useI18n } from '../i18n/I18nProvider';
import { reportsService } from '../services/api';

interface PlayerDay {
  id: string;
  name: string;
  position: string;
  ageCategory?: string;
  days: Record<string, 'self' | 'team' | null>;
  totalDays: number;
}

interface WeeklyOverview {
  weekStart: string;
  weekEnd: string;
  weekDays: string[];
  players: PlayerDay[];
  summary: {
    totalPlayers: number;
    playersTrained: number;
  };
}

// Day name abbreviations
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const Reports: React.FC = () => {
  const { t, language } = useI18n();
  const dayNames = language === 'de' ? DAY_NAMES_DE : DAY_NAMES;

  const [data, setData] = useState<WeeklyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  // Calculate week start date based on offset
  const getWeekStartDate = (offset: number): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff + (offset * 7));
    return weekStart.toISOString().split('T')[0];
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const startDate = getWeekStartDate(weekOffset);
        const response = await reportsService.getWeeklyOverview(startDate);
        setData(response);
      } catch (error) {
        console.error('[REPORTS] Failed to load:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [weekOffset]);

  // Format date range for display
  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const locale = language === 'de' ? 'de-DE' : 'en-US';
    return `${startDate.toLocaleDateString(locale, options)} - ${endDate.toLocaleDateString(locale, options)}, ${startDate.getFullYear()}`;
  };

  // Render training status icon
  const renderDayStatus = (status: 'self' | 'team' | null) => {
    if (status === 'team') {
      return <SportsFootballIcon sx={{ color: '#4CAF50', fontSize: 24 }} />;
    }
    if (status === 'self') {
      return <CheckCircleIcon sx={{ color: '#2196F3', fontSize: 24 }} />;
    }
    return <RemoveIcon sx={{ color: '#E0E0E0', fontSize: 24 }} />;
  };

  // Check if we can go to next week (not future)
  const canGoNext = weekOffset < 0;

  return (
    <Box>
      {/* Header with navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          {t('reports.weeklyOverview')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setWeekOffset(prev => prev - 1)} size="small">
            <ArrowBackIosNewIcon />
          </IconButton>

          <Typography variant="body1" sx={{ minWidth: 180, textAlign: 'center' }}>
            {data ? formatDateRange(data.weekStart, data.weekEnd) : '...'}
          </Typography>

          <IconButton
            onClick={() => setWeekOffset(prev => prev + 1)}
            size="small"
            disabled={!canGoNext}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Summary */}
      {data && !loading && (
        <Paper sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" color="primary" fontWeight={700}>
              {data.summary.playersTrained}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              /
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {data.summary.totalPlayers}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('reports.playersTrained')}
            </Typography>
          </Box>
          {data.summary.playersTrained === 0 && (
            <Chip label={t('reports.noOneTrainedYet')} color="warning" size="small" />
          )}
          {data.summary.playersTrained === data.summary.totalPlayers && data.summary.totalPlayers > 0 && (
            <Chip label={t('reports.everyoneTrained')} color="success" size="small" />
          )}
        </Paper>
      )}

      {/* Legend */}
      <Box sx={{ mb: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ color: '#2196F3', fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            {t('reports.selfTraining')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SportsFootballIcon sx={{ color: '#4CAF50', fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            {t('reports.teamSession')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <RemoveIcon sx={{ color: '#E0E0E0', fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            {t('reports.noTraining')}
          </Typography>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 1.5 }}>
                {t('reports.player')}
              </TableCell>
              {dayNames.map((day, i) => (
                <TableCell key={i} align="center" sx={{ color: 'white', fontWeight: 600, width: 65, px: 1.5, py: 1.5 }}>
                  {day}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ color: 'white', fontWeight: 600, width: 80, px: 1.5, py: 1.5 }}>
                {t('reports.total')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !data || data.players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t('reports.noPlayers')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.players.map((player, idx) => (
                <TableRow
                  key={player.id}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                    backgroundColor: player.totalDays === 0 ? '#FFF3E0' : undefined,
                  }}
                >
                  <TableCell sx={{ py: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {player.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {player.position}
                      </Typography>
                    </Box>
                  </TableCell>
                  {data.weekDays.map((day, i) => (
                    <TableCell key={day} align="center" sx={{ px: 1.5, py: 1.5 }}>
                      {renderDayStatus(player.days[day])}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ px: 1.5, py: 1.5 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={player.totalDays === 0 ? 'error' : player.totalDays >= 3 ? 'success.main' : 'text.primary'}
                    >
                      {player.totalDays}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
