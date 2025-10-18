import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useI18n } from '../../i18n/I18nProvider';
import type { WorkoutReport } from '../../services/workoutAnalysis';

interface WorkoutReportDialogProps {
  open: boolean;
  onClose: () => void;
  report: WorkoutReport | null;
  workoutTitle: string;
}

export const WorkoutReportDialog: React.FC<WorkoutReportDialogProps> = ({
  open,
  onClose,
  report,
  workoutTitle,
}) => {
  const { t } = useI18n();

  if (!report) return null;

  // Check if report was AI-generated (will have more personalized insights)
  const isAIGenerated = 'aiGenerated' in report && report.aiGenerated === true;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return t('report.excellent');
    if (score >= 70) return t('report.good');
    if (score >= 50) return t('report.average');
    return t('report.needsWork');
  };

  const getRecoveryColor = (demand: string): 'success' | 'warning' | 'error' => {
    if (demand === 'low') return 'success';
    if (demand === 'medium') return 'warning';
    return 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FitnessCenterIcon color="primary" />
          <Box>
            <Typography variant="h6">{t('report.title')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {workoutTitle} • {report.duration} {t('report.minutes')}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Performance Scores */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          {t('report.performanceScores')}
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: t('report.intensity'), score: report.intensityScore },
            { label: t('report.workCapacity'), score: report.workCapacityScore },
            { label: t('report.athleticQuality'), score: report.athleticQualityScore },
            { label: t('report.positionFit'), score: report.positionRelevanceScore },
          ].map((item) => (
            <Grid item xs={6} sm={3} key={item.label}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: getScoreColor(item.score), fontWeight: 700 }}>
                  {item.score}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" sx={{ color: getScoreColor(item.score), fontWeight: 600 }}>
                  {getScoreLabel(item.score)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Workout Breakdown */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('report.breakdown')}
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Show volume for strength workouts */}
          {report.totalVolume > 0 && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                {t('report.totalVolume')}
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {report.totalVolume.toLocaleString()} kg
              </Typography>
            </Grid>
          )}
          {/* Show distance for cardio workouts */}
          {report.totalDistance && report.totalDistance > 0 && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Total Distance
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {report.totalDistance.toFixed(2)} km
              </Typography>
            </Grid>
          )}
          {/* Always show these */}
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              {t('report.avgRPE')}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {report.avgRPE}/10
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              {t('report.setsCompleted')}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {report.setsCompleted}/{report.setsPlanned}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              {t('report.duration')}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {report.duration} {t('report.minutes')}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Athletic Focus */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('report.athleticFocus')}
        </Typography>
        <Box sx={{ mb: 3 }}>
          {report.powerWork > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">{t('report.powerDevelopment')}</Typography>
                <Typography variant="caption" fontWeight={600}>{report.powerWork}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={report.powerWork} sx={{ height: 6, borderRadius: 1 }} />
            </Box>
          )}
          {report.strengthWork > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">{t('report.strengthBuilding')}</Typography>
                <Typography variant="caption" fontWeight={600}>{report.strengthWork}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={report.strengthWork} color="secondary" sx={{ height: 6, borderRadius: 1 }} />
            </Box>
          )}
          {report.speedWork > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption">{t('report.speedWork')}</Typography>
                <Typography variant="caption" fontWeight={600}>{report.speedWork}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={report.speedWork} color="info" sx={{ height: 6, borderRadius: 1 }} />
            </Box>
          )}
        </Box>

        {/* Highlights */}
        {(report.strengths.length > 0 || report.warnings.length > 0) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('report.highlights')}
            </Typography>

            {/* Strengths */}
            {report.strengths.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {report.strengths.map((strength, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                    <Typography variant="body2">{t(strength as any)}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Warnings */}
            {report.warnings.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {report.warnings.map((warning, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon fontSize="small" sx={{ color: 'warning.main' }} />
                    <Typography variant="body2">{t(warning as any)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Progress */}
        {(report.volumeChange !== null || report.intensityChange !== null) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon fontSize="small" />
              {t('report.progress')}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {report.volumeChange !== null && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('report.volumeChange')}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ color: report.volumeChange > 0 ? 'success.main' : report.volumeChange < 0 ? 'error.main' : 'text.primary' }}
                  >
                    {report.volumeChange > 0 ? '+' : ''}{report.volumeChange}%
                  </Typography>
                </Grid>
              )}
              {report.intensityChange !== null && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('report.intensityChange')}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ color: report.intensityChange > 0 ? 'success.main' : report.intensityChange < 0 ? 'error.main' : 'text.primary' }}
                  >
                    {report.intensityChange > 0 ? '+' : ''}{report.intensityChange}%
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {/* Recovery */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('report.recovery')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip
            label={t(`report.recoveryDemand.${report.recoveryDemand}`)}
            color={getRecoveryColor(report.recoveryDemand)}
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            {report.recommendedRestHours}h {t('report.recommended')}
          </Typography>
        </Box>

        {/* Coach Insights */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {t('report.coachInsights')}
            </Typography>
            {isAIGenerated && (
              <Chip
                icon={<AutoAwesomeIcon />}
                label="AI-Powered"
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            )}
          </Box>

          <Alert
            severity={isAIGenerated ? "success" : "info"}
            icon={isAIGenerated ? <AutoAwesomeIcon /> : undefined}
            sx={isAIGenerated ? {
              bgcolor: 'success.lighter',
              '& .MuiAlert-icon': { color: 'success.main' }
            } : undefined}
          >
            <Typography variant="body2">
              {isAIGenerated ? report.coachInsights : t(report.coachInsights as any)}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
