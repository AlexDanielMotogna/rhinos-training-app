import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useI18n } from '../../i18n/I18nProvider';
import { getReportsByUser, deleteWorkoutReport, type SavedWorkoutReport } from '../../services/workoutReports';
import { WorkoutReportDialog } from './WorkoutReportDialog';
import type { WorkoutSource } from '../../types/workout';

interface ReportsHistoryProps {
  userId: string;
  source?: WorkoutSource; // Filter by coach or player workouts
}

export const ReportsHistory: React.FC<ReportsHistoryProps> = ({ userId, source }) => {
  const { t } = useI18n();
  const [reports, setReports] = useState<SavedWorkoutReport[]>(() => getReportsByUser(userId, source));
  const [selectedReport, setSelectedReport] = useState<SavedWorkoutReport | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const refreshReports = () => {
    setReports(getReportsByUser(userId, source));
  };

  const handleDelete = (reportId: string) => {
    if (window.confirm(t('workout.confirmDelete'))) {
      deleteWorkoutReport(reportId);
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
