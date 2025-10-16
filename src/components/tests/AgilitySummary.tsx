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
import type { AgilitySummary as AgilitySummaryType, Tier } from '../../types/testing';
import { formatTime } from '../../services/agilityCalc';

interface AgilitySummaryProps {
  summary: AgilitySummaryType;
  onTierChange: (tier: Tier) => void;
}

export const AgilitySummary: React.FC<AgilitySummaryProps> = ({ summary, onTierChange }) => {
  const { t } = useI18n();

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'ELITE':
        return 'success';
      case 'QUICK':
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
        {t('tests.agility.summary')}
      </Typography>

      {/* Agility Score */}
      <Box sx={{ textAlign: 'center', my: 3 }}>
        <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
          {summary.agilityScore}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('tests.agility.scoreLabel')}
        </Typography>
      </Box>

      {/* Performance Label */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Chip
          label={t(`tests.agility.label.${summary.label.toLowerCase()}` as any)}
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
              <TableCell><strong>{t('tests.agility.testName')}</strong></TableCell>
              <TableCell align="right"><strong>{t('tests.result')}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.byTest.map(result => (
              <TableRow key={result.key}>
                <TableCell>{t(`tests.agility.${result.key}`)}</TableCell>
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
