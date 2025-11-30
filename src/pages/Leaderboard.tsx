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
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useI18n } from '../i18n/I18nProvider';
import { leaderboardService } from '../services/api';
import { getUser } from '../services/userProfile';
import type { Position } from '../types/exercise';

const positions: Position[] = ['RB', 'WR', 'LB', 'OL', 'DB', 'QB', 'DL', 'TE', 'K/P'];

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
  targetPoints: number;
  workoutDays: number;
  compliancePct: number;
  attendancePct: number;
  freeSharePct: number;
  teamTrainingDays: number;
  coachWorkoutDays: number;
  personalWorkoutDays: number;
  lastUpdated: string;
}

export const Leaderboard: React.FC = () => {
  const { t } = useI18n();
  const currentUser = getUser();
  const monthOptions = getMonthOptions(t);

  // Default to current month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [positionFilter, setPositionFilter] = useState<Position | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        // Load leaderboard for selected month (or current month by default)
        const response = selectedMonth === defaultMonth
          ? await leaderboardService.getCurrentWeek() // This now returns current month
          : await leaderboardService.getMonth(selectedMonth);

        // Filter leaderboard by user's allowed categories
        let allowedLeaderboard = response.leaderboard;

        if (currentUser) {
          if (currentUser.role === 'player' && currentUser.ageCategory) {
            // Players see only their category
            allowedLeaderboard = response.leaderboard.filter(
              (entry: LeaderboardEntry) => entry.ageCategory === currentUser.ageCategory
            );
          } else if (currentUser.role === 'coach' && currentUser.coachCategories && currentUser.coachCategories.length > 0) {
            // Coaches see only their assigned categories
            allowedLeaderboard = response.leaderboard.filter(
              (entry: LeaderboardEntry) => entry.ageCategory && currentUser.coachCategories!.includes(entry.ageCategory)
            );
          }
        }

        // Extract unique categories from allowed leaderboard data
        const categories = Array.from(
          new Set(
            allowedLeaderboard
              .map((entry: LeaderboardEntry) => entry.ageCategory)
              .filter((cat): cat is string => !!cat)
          )
        ).sort();
        setAvailableCategories(categories);

        // Apply additional filters (position and category)
        let filtered = allowedLeaderboard;

        if (positionFilter) {
          filtered = filtered.filter((entry: LeaderboardEntry) => entry.position === positionFilter);
        }

        if (categoryFilter) {
          filtered = filtered.filter((entry: LeaderboardEntry) => entry.ageCategory === categoryFilter);
        }

        setData(filtered);
      } catch (error) {
        console.error('[LEADERBOARD] Failed to load:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedMonth, positionFilter, categoryFilter]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('leaderboard.title')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
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

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('leaderboard.filterByPosition')}</InputLabel>
          <Select
            value={positionFilter}
            label={t('leaderboard.filterByPosition')}
            onChange={(e) => setPositionFilter(e.target.value as Position | '')}
          >
            <MenuItem value="">
              <em>{t('leaderboard.allPositions')}</em>
            </MenuItem>
            {positions.map((pos) => (
              <MenuItem key={pos} value={pos}>
                {t(`position.${pos}` as any)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Age Category Filter - only show if categories exist in data */}
        {availableCategories.length > 0 && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Age Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Age Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              {availableCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {t('leaderboard.rank')}
                  <Tooltip title={t('leaderboard.rankInfo')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                {t('leaderboard.player')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {t('leaderboard.pos')}
                  <Tooltip title={t('leaderboard.posInfo')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('leaderboard.score')}
                  <Tooltip title={t('leaderboard.scoreInfo')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('leaderboard.compliance')}
                  <Tooltip title={t('leaderboard.complianceInfo')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('leaderboard.attendance')}
                  <Tooltip title={t('leaderboard.attendanceInfo')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {t('leaderboard.freeShare')}
                  <Tooltip title={t('leaderboard.freeShareInfo')} arrow>
                    <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                    #{row.rank}
                  </TableCell>
                  <TableCell>{row.playerName}</TableCell>
                  <TableCell>{row.position}</TableCell>
                  <TableCell align="right">{row.totalPoints.toFixed(1)}</TableCell>
                  <TableCell align="right">{row.compliancePct}%</TableCell>
                  <TableCell align="right">{row.attendancePct}%</TableCell>
                  <TableCell align="right">{row.freeSharePct}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
