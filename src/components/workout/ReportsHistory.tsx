import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useI18n } from '../../i18n/I18nProvider';
import { getReportsByUser, deleteWorkoutReport, syncWorkoutReportsFromBackend, type SavedWorkoutReport } from '../../services/workoutReports';
import { WorkoutReportDialog } from './WorkoutReportDialog';
import type { WorkoutSource } from '../../types/workout';

interface ReportsHistoryProps {
  userId: string;
  source?: WorkoutSource; // Filter by coach or player workouts
}

export const ReportsHistory: React.FC<ReportsHistoryProps> = ({ userId, source }) => {
  const { t } = useI18n();
  const [reports, setReports] = useState<SavedWorkoutReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedWorkoutReport | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Track request ID to prevent race conditions
  const requestIdRef = useRef(0);

  // Sync from backend on mount
  useEffect(() => {
    const loadReports = async () => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);

      // Sync from backend first
      console.log('[REPORTS] Syncing reports from backend...');
      await syncWorkoutReportsFromBackend(userId);

      // Only update state if this is still the latest request
      if (currentRequestId !== requestIdRef.current) return;

      // Then load from localStorage (which now has synced data)
      const loadedReports = getReportsByUser(userId, source);
      console.log('[REPORTS] Loaded reports:', loadedReports.length);
      setReports(loadedReports);
      setLoading(false);
    };

    loadReports();
  }, [userId, source]);

  const refreshReports = () => {
    setReports(getReportsByUser(userId, source));
  };

  const handleDelete = async (reportId: string) => {
    if (window.confirm(t('workout.confirmDelete'))) {
      await deleteWorkoutReport(reportId);
      refreshReports();
    }
  };

  const handleViewReport = (report: SavedWorkoutReport) => {
    setSelectedReport(report);
    setShowReportDialog(true);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('workout.noReportsYet') || 'No workout reports yet. Complete a workout to see your first report!'}
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {reports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: '1rem', mb: 0.5 }}>
                      {report.workoutTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(report.createdAt).toLocaleDateString()} • {report.duration} {t('report.minutes')}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleViewReport(report)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(report.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Performance Scores */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ color: getScoreColor(report.intensityScore), fontWeight: 700 }}>
                        {report.intensityScore}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('report.intensity')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ color: getScoreColor(report.workCapacityScore), fontWeight: 700 }}>
                        {report.workCapacityScore}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('report.workCapacity')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ color: getScoreColor(report.athleticQualityScore), fontWeight: 700 }}>
                        {report.athleticQualityScore}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('report.athleticQuality')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ color: getScoreColor(report.positionRelevanceScore), fontWeight: 700 }}>
                        {report.positionRelevanceScore}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('report.positionFit')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Quick Stats */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<FitnessCenterIcon />}
                    label={`${report.totalVolume} kg`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${report.setsCompleted}/${report.setsPlanned} sets`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`RPE ${report.avgRPE}/10`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* View Report Dialog */}
      {selectedReport && (
        <WorkoutReportDialog
          open={showReportDialog}
          onClose={() => {
            setShowReportDialog(false);
            setSelectedReport(null);
          }}
          report={selectedReport}
          workoutTitle={selectedReport.workoutTitle}
        />
      )}
    </Box>
  );
};
