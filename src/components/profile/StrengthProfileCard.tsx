import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Link, LinearProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useI18n } from '../../i18n/I18nProvider';
import type { StrengthSummary, Segment } from '../../types/testing';

interface StrengthProfileCardProps {
  summary: StrengthSummary | null;
  change: number | null;
}

export const StrengthProfileCard: React.FC<StrengthProfileCardProps> = ({ summary, change }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previousSummary, setPreviousSummary] = useState<StrengthSummary | null>(null);

  // Load previous test when dialog opens
  React.useEffect(() => {
    if (dialogOpen) {
      const prevTest = localStorage.getItem('lastStrengthTest_previous');
      if (prevTest) {
        try {
          setPreviousSummary(JSON.parse(prevTest));
        } catch (e) {
          console.error('Failed to parse previous strength test', e);
        }
      }
    }
  }, [dialogOpen]);

  const formatChange = (changeVal: number | null) => {
    if (changeVal === null) return '';
    if (changeVal > 0) return `+${changeVal}`;
    return changeVal.toString();
  };

  const segmentOrder: Segment[] = ['legs', 'arms', 'back', 'shoulders', 'core'];

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
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 240 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('profile.strength.title')}
        </Typography>
        <Link
          component="button"
          variant="caption"
          onClick={() => navigate('/testing/strength')}
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {summary ? t('profile.testAgain') : t('profile.testNow')}
        </Link>
      </Box>

      {!summary ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {segmentOrder.map(segment => (
            <Box key={segment} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {t(`profile.strength.${segment}`)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  -
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={0}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  backgroundColor: 'action.hover',
                }}
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {summary.strengthIndex}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('profile.strength.index')}
            </Typography>
            {change !== null && (
              <Typography
                variant="body2"
                sx={{
                  color: change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary',
                  fontWeight: 600,
                  mt: 0.5
                }}
              >
                {formatChange(change)} {t('profile.sinceLastTest')}
              </Typography>
            )}
          </Box>

          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Chip
              label={t(`tests.label.${summary.label.toLowerCase()}` as any)}
              color={getLabelColor(summary.label)}
              size="small"
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
            {t(`tests.tier.${summary.tier}`)} | {new Date(summary.dateISO).toLocaleDateString()}
          </Typography>

          <Button
            variant="text"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ alignSelf: 'center' }}
          >
            {t('profile.seeResults')}
          </Button>
        </Box>
      )}

      {/* Results Dialog */}
      {summary && summary.byTest && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{t('profile.strength.detailedResults')}</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
              {t('profile.exerciseDetails')}
            </Typography>
            <Table size="small">
              <TableBody>
                {summary.byTest.filter(result => !result.skipped).map(result => (
                  <TableRow key={result.key}>
                    <TableCell><strong>{t(`tests.${result.key}`)}</strong></TableCell>
                    <TableCell align="right">
                      {result.weightKg && result.reps ? (
                        <Typography variant="body2">
                          {result.weightKg}kg × {result.reps} reps
                        </Typography>
                      ) : result.seconds ? (
                        <Typography variant="body2">
                          {result.seconds}s
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {result.oneRmEstKg && (
                        <Typography variant="body2" color="primary">
                          1RM: {result.oneRmEstKg.toFixed(1)}kg ({result.oneRmRel?.toFixed(2)}× BW)
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {summary.bySegment && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                  {t('profile.segmentScores')}
                </Typography>
                <Table size="small">
                  <TableBody>
                    {segmentOrder.map(segment => {
                      const segmentData = summary.bySegment?.[segment];
                      if (!segmentData) return null;
                      return (
                        <TableRow key={segment}>
                          <TableCell><strong>{t(`profile.strength.${segment}`)}</strong></TableCell>
                          <TableCell align="right">{segmentData.detail || '-'}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${segmentData.score || 0}%`}
                              size="small"
                              color={segmentData.score >= 85 ? 'success' : segmentData.score >= 70 ? 'primary' : segmentData.score >= 50 ? 'warning' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('profile.testInfo')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('profile.strength.tier')}:</strong> {t(`tests.tier.${summary.tier}`)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('profile.testDate')}:</strong> {new Date(summary.dateISO).toLocaleDateString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('profile.strength.index')}:</strong> {summary.strengthIndex}
                </Typography>
                {change !== null && (
                  <Chip
                    label={formatChange(change)}
                    size="small"
                    sx={{
                      backgroundColor: change > 0 ? 'success.light' : change < 0 ? 'error.light' : 'grey.200',
                      color: change > 0 ? 'success.dark' : change < 0 ? 'error.dark' : 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Box>
              {previousSummary && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {t('profile.previousTest')}: {previousSummary.strengthIndex} ({new Date(previousSummary.dateISO).toLocaleDateString()})
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>{t('common.close')}</Button>
            <Button variant="contained" onClick={() => { setDialogOpen(false); navigate('/testing/strength'); }}>
              {t('profile.testAgain')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};
