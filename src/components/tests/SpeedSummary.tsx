import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import type { SpeedSummary as SpeedSummaryType, Tier } from '../../types/testing';
import { formatTime } from '../../services/speedCalc';

interface SpeedSummaryProps {
  summary: SpeedSummaryType;
  onTierChange: (tier: Tier) => void;
}

export const SpeedSummary: React.FC<SpeedSummaryProps> = ({ summary, onTierChange }) => {
  const { t } = useI18n();

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'ELITE':
        return 'success';
      case 'FAST':
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t('tests.speed.summary')}
      </Typography>

      {/* Speed Score */}
      <Box sx={{ textAlign: 'center', my: 3 }}>
        <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
          {summary.speedScore}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('tests.speed.scoreLabel')}
        </Typography>
      </Box>

      {/* Performance Label */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Chip
          label={t(`tests.speed.label.${summary.label.toLowerCase()}` as any)}
          color={getLabelColor(summary.label)}
          size="medium"
        />
      </Box>

      {/* Tier Selector */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>{t('tests.compareTo')}</InputLabel>
        <Select
          value={summary.tier}
          label={t('tests.compareTo')}
          onChange={e => onTierChange(e.target.value as Tier)}
        >
          <MenuItem value="pro">{t('tests.tier.pro')}</MenuItem>
          <MenuItem value="semi">{t('tests.tier.semi')}</MenuItem>
          <MenuItem value="club">{t('tests.tier.club')}</MenuItem>
        </Select>
      </FormControl>

      {/* Results Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>{t('tests.speed.testName')}</strong></TableCell>
              <TableCell align="right"><strong>{t('tests.result')}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.byTest.map(result => (
              <TableRow key={result.key}>
                <TableCell>{t(`tests.speed.${result.key}`)}</TableCell>
                <TableCell align="right">
                  {result.skipped || !result.timeSeconds ? '-' : formatTime(result.timeSeconds)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
