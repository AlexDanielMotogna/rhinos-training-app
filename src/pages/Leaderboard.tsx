import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useI18n } from '../i18n/I18nProvider';
import { leaderboardService } from '../services/api';
import { getUser } from '../services/userProfile';

// Month names for i18n
const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

// App launch date - only show months from this date onwards
const APP_LAUNCH_YEAR = 2025;
const APP_LAUNCH_MONTH = 1; // January 2025

// Generate month options from app launch to current month
const getMonthOptions = (t: (key: string) => string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const months = [];

  // Start from app launch date, go up to current month
  for (let year = APP_LAUNCH_YEAR; year <= currentYear; year++) {
    const startMonth = (year === APP_LAUNCH_YEAR) ? APP_LAUNCH_MONTH : 1;
    const endMonth = (year === currentYear) ? currentMonth : 12;

    for (let m = startMonth; m <= endMonth; m++) {
      const monthStr = `${year}-${m.toString().padStart(2, '0')}`;
      const monthName = t(`months.${MONTH_KEYS[m - 1]}`);
      months.push({ value: monthStr, label: `${monthName} ${year}` });
    }
  }

  // Reverse to show most recent first
  return months.reverse();
};

interface LeaderboardEntry {
  rank: number;
  userId: string;
  playerName: string;
  position: string;
  ageCategory?: string;
  totalPoints: number;
  workoutDays: number;
}

export const Leaderboard: React.FC = () => {
  const { t } = useI18n();
  const currentUser = getUser();
  const monthOptions = getMonthOptions(t);

  // Default to current month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        // Load leaderboard for selected month
        const response = selectedMonth === defaultMonth
          ? await leaderboardService.getCurrentWeek()
          : await leaderboardService.getMonth(selectedMonth);

        // Backend already filters by user's category, just use the data
        setData(response.leaderboard || []);
      } catch (error) {
        console.error('[LEADERBOARD] Failed to load:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedMonth]);

  // Get medal color for top 3
  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'transparent';
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('leaderboard.title')}
      </Typography>

      {/* Points System Info - Collapsed by default */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              {t('leaderboard.howPointsWork')}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t('leaderboard.pointsDescription')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label={`${t('leaderboard.pointsLight')}: 1 ${t('leaderboard.pointsUnit')}`}
              size="small"
              sx={{ backgroundColor: '#90CAF9' }}
            />
            <Chip
              label={`${t('leaderboard.pointsModerate')}: 2 ${t('leaderboard.pointsUnit')}`}
              size="small"
              sx={{ backgroundColor: '#FFB74D' }}
            />
            <Chip
              label={`${t('leaderboard.pointsTeam')}: 2.5 ${t('leaderboard.pointsUnit')}`}
              size="small"
              sx={{ backgroundColor: '#66BB6A', color: 'white' }}
            />
            <Chip
              label={`${t('leaderboard.pointsIntensive')}: 3 ${t('leaderboard.pointsUnit')}`}
              size="small"
              sx={{ backgroundColor: '#EF5350', color: 'white' }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Month selector */}
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>{t('leaderboard.month')}</InputLabel>
          <Select
            value={selectedMonth}
            label={t('leaderboard.month')}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600, width: 60 }}>
                #
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                {t('leaderboard.player')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, width: 80 }}>
                {t('leaderboard.pos')}
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600, width: 100 }}>
                {t('leaderboard.points')}
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600, width: 120 }}>
                {t('leaderboard.daysTrained')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t('leaderboard.noData')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.userId}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                    backgroundColor: row.rank <= 3 ? `${getMedalColor(row.rank)}15` : undefined,
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {row.rank <= 3 && (
                        <EmojiEventsIcon sx={{ color: getMedalColor(row.rank), fontSize: 20 }} />
                      )}
                      {row.rank}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: row.rank <= 3 ? 600 : 400 }}>
                    {row.playerName}
                  </TableCell>
                  <TableCell>{row.position || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {row.totalPoints.toFixed(1)}
                  </TableCell>
                  <TableCell align="right">
                    {row.workoutDays}
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
