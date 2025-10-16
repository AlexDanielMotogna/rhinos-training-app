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
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useI18n } from '../i18n/I18nProvider';
import { getMockLeaderboard } from '../services/mock';
import type { LeaderboardRow } from '../types/leaderboard';
import type { Position } from '../types/exercise';

const positions: Position[] = ['RB', 'WR', 'LB', 'OL', 'DB', 'QB', 'DL', 'TE', 'K/P'];

export const Leaderboard: React.FC = () => {
  const { t } = useI18n();
  const [window, setWindow] = useState<'7d' | '30d'>('7d');
  const [positionFilter, setPositionFilter] = useState<Position | ''>('');
  const [data, setData] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    const mockData = getMockLeaderboard();
    const filtered = positionFilter
      ? mockData.filter((row) => row.position === positionFilter)
      : mockData;
    setData(filtered);
  }, [positionFilter]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('leaderboard.title')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>{t('leaderboard.window')}</InputLabel>
          <Select
            value={window}
            label={t('leaderboard.window')}
            onChange={(e) => setWindow(e.target.value as '7d' | '30d')}
          >
            <MenuItem value="7d">{t('leaderboard.7d')}</MenuItem>
            <MenuItem value="30d">{t('leaderboard.30d')}</MenuItem>
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
            {data.map((row) => (
              <TableRow
                key={row.rank}
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
                <TableCell align="right">{row.scoreAvg}</TableCell>
                <TableCell align="right">{row.compliancePct}%</TableCell>
                <TableCell align="right">{row.attendancePct}%</TableCell>
                <TableCell align="right">{row.freeSharePct}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
