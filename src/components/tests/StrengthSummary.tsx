import React from 'react';
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import type { StrengthSummary as StrengthSummaryType, Tier, Segment } from '../../types/testing';

interface StrengthSummaryProps {
  summary: StrengthSummaryType;
  onTierChange: (tier: Tier) => void;
  onSave: () => void;
}

const segments: Segment[] = ['legs', 'arms', 'back', 'shoulders', 'core'];

export const StrengthSummary: React.FC<StrengthSummaryProps> = ({
  summary,
  onTierChange,
  onSave,
}) => {
  const { t } = useI18n();

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'MACHINE':
        return 'success';
      case 'STEADY':
        return 'primary';
      case 'IRREGULAR':
        return 'warning';
      case 'LAZY':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">{t('tests.summary')}</Typography>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('tests.tier')}</InputLabel>
            <Select
              value={summary.tier}
              label={t('tests.tier')}
              onChange={e => onTierChange(e.target.value as Tier)}
            >
              <MenuItem value="pro">{t('tests.tier.pro')}</MenuItem>
              <MenuItem value="semi">{t('tests.tier.semi')}</MenuItem>
              <MenuItem value="club">{t('tests.tier.club')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Strength Index Card */}
        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            bgcolor: 'primary.lighter',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <Typography variant="h3" color="primary.main">
            {summary.strengthIndex}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {t('tests.index')}
          </Typography>
          <Chip
            label={t(`tests.label.${summary.label.toLowerCase()}` as any)}
            color={getLabelColor(summary.label)}
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Segment Scores Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>{t('tests.segment.title')}</strong></TableCell>
                <TableCell align="right"><strong>{t('tests.score')}</strong></TableCell>
                <TableCell><strong>{t('tests.detail')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {segments.map(segment => (
                <TableRow key={segment}>
                  <TableCell>{t(`tests.segment.${segment}`)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${summary.bySegment[segment].score}%`}
                      color={
                        summary.bySegment[segment].score >= 85
                          ? 'success'
                          : summary.bySegment[segment].score >= 70
                          ? 'primary'
                          : summary.bySegment[segment].score >= 50
                          ? 'warning'
                          : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{summary.bySegment[segment].detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Individual Test Results */}
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          {t('tests.individualResults')}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>{t('tests.exercise')}</strong></TableCell>
                <TableCell align="right"><strong>{t('tests.estimated1RM')}</strong></TableCell>
                <TableCell align="right"><strong>{t('tests.relativeToBW')}</strong></TableCell>
                <TableCell align="right"><strong>{t('tests.seconds')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.byTest.map(result => (
                <TableRow key={result.key}>
                  <TableCell>{t(`tests.${result.key}`)}</TableCell>
                  <TableCell align="right">
                    {result.skipped ? (
                      <Chip label={t('tests.skipped')} size="small" />
                    ) : result.oneRmEstKg ? (
                      `${result.oneRmEstKg.toFixed(1)} kg`
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {!result.skipped && result.oneRmRel ? `${result.oneRmRel.toFixed(2)}× BW` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {!result.skipped && result.seconds ? `${result.seconds} s` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="contained"
          color="success"
          fullWidth
          sx={{ mt: 3 }}
          onClick={onSave}
        >
          {t('tests.saveResults')}
        </Button>
      </Paper>
    </Box>
  );
};
