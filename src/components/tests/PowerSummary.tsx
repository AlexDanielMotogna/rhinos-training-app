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
import type { PowerSummary as PowerSummaryType, Tier } from '../../types/testing';
import { formatDistance } from '../../services/powerCalc';

interface PowerSummaryProps {
  summary: PowerSummaryType;
  onTierChange: (tier: Tier) => void;
}

export const PowerSummary: React.FC<PowerSummaryProps> = ({ summary, onTierChange }) => {
  const { t } = useI18n();

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'EXPLOSIVE':
        return 'success';
      case 'STRONG':
        return 'primary';
      case 'AVERAGE':
        return 'warning';
      case 'WEAK':
        return 'error';
      default:
        return 'default';
    }
  };

  const getResultDisplay = (result: typeof summary.byTest[0]): string => {
    if (result.skipped) return '-';

    if (result.key === 'verticalJump' && result.heightCm) {
      return formatDistance(result.heightCm);
    }

    if (result.key === 'broadJump' && result.distanceCm) {
      return formatDistance(result.distanceCm);
    }

    return '-';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t('tests.power.summary')}
      </Typography>

      {/* Power Score */}
      <Box sx={{ textAlign: 'center', my: 3 }}>
        <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
          {summary.powerScore}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('tests.power.scoreLabel')}
        </Typography>
      </Box>

      {/* Performance Label */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Chip
          label={t(`tests.power.label.${summary.label.toLowerCase()}` as any)}
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
              <TableCell><strong>{t('tests.power.testName')}</strong></TableCell>
              <TableCell align="right"><strong>{t('tests.result')}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.byTest.map(result => (
              <TableRow key={result.key}>
                <TableCell>{t(`tests.power.${result.key}`)}</TableCell>
                <TableCell align="right">{getResultDisplay(result)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
