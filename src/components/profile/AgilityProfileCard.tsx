import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Link, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useI18n } from '../../i18n/I18nProvider';
import type { AgilitySummary } from '../../types/testing';

interface AgilityProfileCardProps {
  summary: AgilitySummary | null;
  change: number | null;
}

export const AgilityProfileCard: React.FC<AgilityProfileCardProps> = ({ summary, change }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatChange = (changeVal: number | null) => {
    if (changeVal === null) return '';
    if (changeVal > 0) return `+${changeVal}`;
    return changeVal.toString();
  };

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
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 240 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('profile.agility.title')}
        </Typography>
        <Link
          component="button"
          variant="caption"
          onClick={() => navigate('/testing/agility')}
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {summary ? t('profile.testAgain') : t('profile.testNow')}
        </Link>
      </Box>

      {!summary ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('profile.agility.noData')}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h2" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {summary.agilityScore}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('profile.agility.scoreLabel')}
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
              label={t(`tests.agility.label.${summary.label.toLowerCase()}` as any)}
              color={getLabelColor(summary.label)}
              size="small"
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
            {t(('tests.tier.' + summary.tier) as any)} | {new Date(summary.dateISO).toLocaleDateString()}
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
          <DialogTitle>{t('profile.agility.detailedResults')}</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
              {t('profile.testResults')}
            </Typography>
            <Table size="small">
              <TableBody>
                {summary.byTest.filter(result => !result.skipped).map(result => (
                  <TableRow key={result.key}>
                    <TableCell><strong>{t(`tests.agility.${result.key}`)}</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="primary">
                        {result.timeSeconds ? `${result.timeSeconds.toFixed(2)}s` : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('profile.testInfo')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('profile.agility.tier')}:</strong> {t(`tests.tier.${summary.tier}`)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('profile.testDate')}:</strong> {new Date(summary.dateISO).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('profile.agility.scoreLabel')}:</strong> {summary.agilityScore}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>{t('common.close')}</Button>
            <Button variant="contained" onClick={() => { setDialogOpen(false); navigate('/testing/agility'); }}>
              {t('profile.testAgain')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};
