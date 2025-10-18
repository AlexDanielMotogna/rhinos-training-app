import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  Alert,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useI18n } from '../i18n/I18nProvider';
import { WorkoutBlock } from '../components/workout/WorkoutBlock';
import { CoachBlockWorkoutDialog } from '../components/workout/CoachBlockWorkoutDialog';
import { FreeSessionDialog } from '../components/workout/FreeSessionDialog';
import { WorkoutHistory } from '../components/workout/WorkoutHistory';
import { EditWorkoutDialog } from '../components/workout/EditWorkoutDialog';
import { WorkoutReportDialog } from '../components/workout/WorkoutReportDialog';
import { ReportsHistory } from '../components/workout/ReportsHistory';
import { FinishWorkoutDialog } from '../components/workout/FinishWorkoutDialog';
import { PlanCard } from '../components/plan/PlanCard';
import { PlanBuilderDialog } from '../components/plan/PlanBuilderDialog';
import { StartWorkoutDialog } from '../components/plan/StartWorkoutDialog';
import { getUser } from '../services/mock';
import { getActiveAssignmentsForPlayer, getTrainingTypes, getTemplatesForPosition } from '../services/trainingBuilder';
import { saveWorkoutLog, getWorkoutLogsByUser, getWorkoutLogs, deleteWorkoutLog, updateWorkoutLog, type WorkoutLog } from '../services/workoutLog';
import { getUserPlans, createUserPlan, updateUserPlan, deleteUserPlan, duplicateUserPlan, markPlanAsUsed } from '../services/userPlan';
import type { TrainingTypeKey, PositionTemplate, TemplateBlock } from '../types/template';
import type { WorkoutPayload, WorkoutEntry } from '../types/workout';
import type { UserPlanTemplate, PlanExercise } from '../types/userPlan';
import { sanitizeYouTubeUrl } from '../services/yt';
import { analyzeWorkout, estimateWorkoutDuration, type WorkoutReport } from '../services/workoutAnalysis';
import { saveWorkoutReport } from '../services/workoutReports';
import { generateAIWorkoutReport, getAPIKey } from '../services/aiInsights';

type SessionView = 'my' | 'team';
type MySessionTab = 'plans' | 'history' | 'reports';
type TeamSessionTab = 'plan' | 'history' | 'reports';

export const MyTraining: React.FC = () => {
  const { t } = useI18n();
  const [sessionView, setSessionView] = useState<SessionView>('my');
  const [mySessionTab, setMySessionTab] = useState<MySessionTab>('plans');
  const [teamSessionTab, setTeamSessionTab] = useState<TeamSessionTab>('plan');
  const [activeTab, setActiveTab] = useState<TrainingTypeKey>('strength_conditioning');
  const [template, setTemplate] = useState<PositionTemplate | null>(null);
  const [showFreeSession, setShowFreeSession] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editWorkout, setEditWorkout] = useState<WorkoutLog | null>(null);
  const [userPlans, setUserPlans] = useState<UserPlanTemplate[]>([]);
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);
  const [editingPlan, setEditingPlan] = useState<UserPlanTemplate | null>(null);
  const [startingPlan, setStartingPlan] = useState<UserPlanTemplate | null>(null);
  const [showStartWorkout, setShowStartWorkout] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TemplateBlock | null>(null);
  const [showBlockWorkout, setShowBlockWorkout] = useState(false);
  const [workoutReport, setWorkoutReport] = useState<WorkoutReport | null>(null);
  const [showWorkoutReport, setShowWorkoutReport] = useState(false);
  const [lastWorkoutTitle, setLastWorkoutTitle] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [pendingWorkout, setPendingWorkout] = useState<{
    entries: WorkoutEntry[];
    notes: string;
    elapsedMinutes: number;
    estimatedMinutes: number;
    totalSets: number;
  } | null>(null);

  const user = getUser();
  const trainingTypes = getTrainingTypes();
  const activeAssignments = user ? getActiveAssignmentsForPlayer(user.id) : [];
  const [workoutHistory, setWorkoutHistory] = useState(() =>
    user ? getWorkoutLogsByUser(user.id) : []
  );

  // Load user plans
  useEffect(() => {
    if (user) {
      setUserPlans(getUserPlans(user.id));
    }
  }, [user]);

  const refreshUserPlans = () => {
    if (user) {
      setUserPlans(getUserPlans(user.id));
    }
  };

  // Calculate program progress
  const calculateProgress = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const totalWeeks = Math.ceil(totalDays / 7);
    const currentWeek = Math.min(Math.ceil(elapsedDays / 7), totalWeeks);
    const progressPercent = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

    return { currentWeek, totalWeeks, progressPercent };
  };

  useEffect(() => {
    if (user) {
      const templates = getTemplatesForPosition(user.position);
      const trainingTemplate = templates[activeTab];

      if (trainingTemplate) {
        // Convert TrainingTemplate to PositionTemplate format
        const positionTemplate: PositionTemplate = {
          blocks: trainingTemplate.blocks.map(block => ({
            order: block.order,
            title: block.title,
            items: block.exercises,
            globalSets: (block as any).globalSets,
            exerciseConfigs: (block as any).exerciseConfigs,
          }))
        };
        setTemplate(positionTemplate);
      } else {
        setTemplate(null);
      }
    }
  }, [user, activeTab]);

  const refreshWorkoutHistory = () => {
    if (user) {
      setWorkoutHistory(getWorkoutLogsByUser(user.id));
    }
  };

  /**
   * Generate workout report - tries AI first, falls back to algorithm
   */
  const generateWorkoutReport = async (
    entries: WorkoutEntry[],
    duration: number,
    workoutTitle: string,
    workoutNotes?: string
  ): Promise<WorkoutReport> => {
    if (!user) {
      // Shouldn't happen, but fallback to algorithm
      return analyzeWorkout(entries, duration, user!.id, user!.position);
    }

    const apiKey = getAPIKey();

    if (apiKey) {
      // Show loading state
      setGeneratingReport(true);

      try {
        // Try AI report generation
        const aiResult = await generateAIWorkoutReport(
          entries,
          duration,
          workoutTitle,
          user.position,
          user.name,
          apiKey,
          workoutNotes,
          user.weightKg,
          user.heightCm
        );

        if (aiResult.success && aiResult.report) {
          console.log('✅ AI-generated workout report');
          setGeneratingReport(false);
          return aiResult.report;
        } else {
          console.warn('⚠️ AI report failed, using algorithm fallback:', aiResult.error);
        }
      } catch (error) {
        console.error('AI report generation error:', error);
      } finally {
        setGeneratingReport(false);
      }
    }

    // Fallback to algorithm if no API key or AI failed
    console.log('📊 Using algorithm-based workout report');
    return analyzeWorkout(entries, duration, user.id, user.position);
  };

  const handleSaveFreeSession = async (payload: WorkoutPayload) => {
    if (user) {
      saveWorkoutLog(user.id, payload);
      refreshWorkoutHistory();
      setShowFreeSession(false);

      // Generate and save workout report for free sessions
      // Note: Free sessions don't track duration, so we estimate 60 minutes
      const report = await generateWorkoutReport(
        payload.entries,
        60, // Default duration for free sessions
        t('training.freeSessions')
      );
      saveWorkoutReport(user.id, t('training.freeSessions'), report, 'player', payload.entries);

      setWorkoutReport(report);
      setLastWorkoutTitle(t('training.freeSessions'));
      setShowWorkoutReport(true);
    }
  };

  const handleDeleteWorkout = (logId: string) => {
    if (window.confirm(t('workout.confirmDelete'))) {
      // Soft delete - hides from history but keeps for stats
      deleteWorkoutLog(logId);
      refreshWorkoutHistory();
      setSuccessMessage(t('workout.workoutDeleted'));
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleEditWorkout = (workout: WorkoutLog) => {
    setEditWorkout(workout);
  };

  const handleSaveEditedWorkout = (workoutId: string, entries: WorkoutEntry[], notes?: string) => {
    updateWorkoutLog(workoutId, { entries, notes });
    refreshWorkoutHistory();
    setEditWorkout(null);
    setSuccessMessage(t('workout.workoutUpdated'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleVideoClick = (url: string) => {
    const sanitized = sanitizeYouTubeUrl(url);
    if (sanitized) {
      setVideoUrl(sanitized);
    }
  };

  // Plan handlers
  const handleCreatePlan = (planName: string, exercises: PlanExercise[], warmupMinutes?: number) => {
    if (user) {
      createUserPlan({
        userId: user.id,
        name: planName,
        exercises,
        warmupMinutes,
      });
      refreshUserPlans();
      setSuccessMessage('Plan created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleUpdatePlan = (planName: string, exercises: PlanExercise[], warmupMinutes?: number) => {
    if (editingPlan) {
      updateUserPlan(editingPlan.id, {
        name: planName,
        exercises,
        warmupMinutes,
      });
      refreshUserPlans();
      setEditingPlan(null);
      setSuccessMessage('Plan updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      deleteUserPlan(planId);
      refreshUserPlans();
      setSuccessMessage('Plan deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDuplicatePlan = (planId: string) => {
    duplicateUserPlan(planId);
    refreshUserPlans();
    setSuccessMessage('Plan duplicated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleStartPlan = (plan: UserPlanTemplate) => {
    setStartingPlan(plan);
    setShowStartWorkout(true);
  };

  // Interceptor: Show duration dialog instead of saving directly
  const handleFinishWorkoutRequest = (entries: WorkoutEntry[], notes: string, elapsedMinutes: number) => {
    const totalSets = entries.reduce((sum, entry) => sum + (entry.setData?.length || 0), 0);
    const estimatedMinutes = estimateWorkoutDuration(entries);

    setPendingWorkout({
      entries,
      notes,
      elapsedMinutes,
      estimatedMinutes,
      totalSets,
    });
    setShowFinishDialog(true);
  };

  // Actual save function (called after duration confirmation)
  const handleFinishWorkout = async (entries: WorkoutEntry[], notes: string, duration: number) => {
    if (user && startingPlan) {
      const today = new Date().toISOString().split('T')[0];

      // Calculate plan metadata for completion tracking
      const totalExercises = startingPlan.exercises.length;
      const totalTargetSets = entries.reduce((sum, entry) => sum + (entry.sets || 0), 0);

      // Calculate completion percentage based on completed sets vs target sets
      let completedSets = 0;
      entries.forEach(entry => {
        completedSets += entry.setData?.length || 0;
      });

      const completionPercentage = totalTargetSets > 0
        ? Math.round((completedSets / totalTargetSets) * 100)
        : 0;

      const workoutLog = {
        id: crypto.randomUUID(),
        userId: user.id,
        date: today,
        entries,
        notes,
        source: 'player' as const,
        planTemplateId: startingPlan.id,
        planName: startingPlan.name,
        duration,
        createdAt: new Date().toISOString(),
        planMetadata: {
          totalExercises,
          totalTargetSets,
        },
        completionPercentage,
      };

      const allLogs = getWorkoutLogs();
      allLogs.push(workoutLog);
      localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));

      markPlanAsUsed(startingPlan.id);
      refreshUserPlans();
      refreshWorkoutHistory();

      // Generate and save workout report
      const report = await generateWorkoutReport(
        entries,
        duration,
        startingPlan.name,
        notes
      );
      saveWorkoutReport(user.id, startingPlan.name, report, 'player', entries);

      setWorkoutReport(report);
      setLastWorkoutTitle(startingPlan.name);
      setShowWorkoutReport(true);
      setStartingPlan(null);
      setShowStartWorkout(false); // Close StartWorkoutDialog after everything is done
    }
  };

  // Coach block handlers
  const handleStartBlock = (block: TemplateBlock) => {
    setSelectedBlock(block);
    setShowBlockWorkout(true);
  };

  // Interceptor for block workouts
  const handleFinishBlockWorkoutRequest = (entries: WorkoutEntry[], notes: string, elapsedMinutes: number) => {
    const totalSets = entries.reduce((sum, entry) => sum + (entry.setData?.length || 0), 0);
    const estimatedMinutes = estimateWorkoutDuration(entries);

    setPendingWorkout({
      entries,
      notes,
      elapsedMinutes,
      estimatedMinutes,
      totalSets,
    });
    setShowFinishDialog(true);
  };

  const handleFinishBlockWorkout = async (entries: WorkoutEntry[], notes: string, duration: number) => {
    if (user && selectedBlock) {
      const today = new Date().toISOString().split('T')[0];

      // Calculate plan metadata for completion tracking
      const totalExercises = selectedBlock.items.length;
      const totalTargetSets = entries.reduce((sum, entry) => sum + (entry.sets || 0), 0);

      // Calculate completion percentage based on completed sets vs target sets
      let completedSets = 0;
      entries.forEach(entry => {
        completedSets += entry.setData?.length || 0;
      });

      const completionPercentage = totalTargetSets > 0
        ? Math.round((completedSets / totalTargetSets) * 100)
        : 0;

      const workoutLog = {
        id: crypto.randomUUID(),
        userId: user.id,
        date: today,
        entries,
        notes,
        source: 'coach' as const,
        planName: selectedBlock.title,
        duration,
        createdAt: new Date().toISOString(),
        planMetadata: {
          totalExercises,
          totalTargetSets,
        },
        completionPercentage,
      };

      const allLogs = getWorkoutLogs();
      allLogs.push(workoutLog);
      localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));

      refreshWorkoutHistory();

      // Generate and save workout report
      const report = await generateWorkoutReport(
        entries,
        duration,
        selectedBlock.title,
        notes
      );
      saveWorkoutReport(user.id, selectedBlock.title, report, 'coach', entries);

      setWorkoutReport(report);
      setLastWorkoutTitle(selectedBlock.title);
      setShowWorkoutReport(true);
      setSelectedBlock(null);
      setShowBlockWorkout(false); // Close CoachBlockWorkoutDialog after everything is done
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('nav.myTraining')}</Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Main Session Tabs: My Sessions vs Team Sessions */}
      <Tabs
        value={sessionView}
        onChange={(_, value) => setSessionView(value as SessionView)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="my" label={t('training.mySessions')} />
        <Tab value="team" label={t('training.teamSessions')} />
      </Tabs>

      {/* MY SESSIONS VIEW */}
      {sessionView === 'my' && (
        <Box>
          {/* Sub-tabs: My Plans / History / My Reports */}
          <Tabs
            value={mySessionTab}
            onChange={(_, value) => setMySessionTab(value as MySessionTab)}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="plans" label="My Plans" />
            <Tab value="history" label="History" />
            <Tab value="reports" label="My Reports" />
          </Tabs>

          {/* My Plans Tab */}
          {mySessionTab === 'plans' && (
            <Box>
              {/* Create Button - Full width on mobile */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingPlan(null);
                  setShowPlanBuilder(true);
                }}
                fullWidth
                sx={{
                  mb: 3,
                  py: 1.5,
                }}
              >
                Create New Plan
              </Button>

              {userPlans.length === 0 ? (
                <Alert severity="info">
                  No workout plans yet. Click "Create New Plan" to build your first workout template!
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {userPlans.map(plan => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onStart={handleStartPlan}
                      onEdit={(plan) => {
                        setEditingPlan(plan);
                        setShowPlanBuilder(true);
                      }}
                      onDelete={handleDeletePlan}
                      onDuplicate={handleDuplicatePlan}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* History Tab */}
          {mySessionTab === 'history' && (
            <Box>
              <WorkoutHistory
                workouts={workoutHistory.filter(w => w.source === 'player')}
                onDelete={handleDeleteWorkout}
                onEdit={handleEditWorkout}
              />
            </Box>
          )}

          {/* My Reports Tab */}
          {mySessionTab === 'reports' && user && (
            <Box>
              <ReportsHistory userId={user.id} source="player" />
            </Box>
          )}
        </Box>
      )}

      {/* TEAM SESSIONS VIEW */}
      {sessionView === 'team' && (
        <Box>
          {/* Assigned Programs Section */}
          {activeAssignments.length > 0 ? (
            <>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  {t('training.yourAssignedPrograms')}
                </Typography>

                {activeAssignments.map((assignment) => {
                  const { currentWeek, totalWeeks, progressPercent } = calculateProgress(
                    assignment.startDate,
                    assignment.endDate
                  );

                  return (
                    <Card key={assignment.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>
                              {assignment.template.trainingTypeName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip
                                label={`Week ${currentWeek} of ${totalWeeks}`}
                                size="small"
                                color="primary"
                              />
                              <Chip
                                label={`${assignment.template.frequencyPerWeek}x per week`}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {assignment.startDate} → {assignment.endDate}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {t('training.programProgress')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(progressPercent)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>

                        <Alert severity="info" sx={{ mt: 2 }}>
                          {t('training.completeTraining', { frequency: assignment.template.frequencyPerWeek })}
                        </Alert>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              {/* Team Session Tabs: Training Plan / History / My Reports */}
              <Tabs
                value={teamSessionTab}
                onChange={(_, value) => setTeamSessionTab(value as TeamSessionTab)}
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab value="plan" label="Training Plan" />
                <Tab value="history" label="History" />
                <Tab value="reports" label="My Reports" />
              </Tabs>

              {/* Training Plan Tab */}
              {teamSessionTab === 'plan' && (
                <>
                  {/* Training Type Tabs - Only show assigned programs */}
                  <Tabs
                    value={activeTab}
                    onChange={(_, value) => setActiveTab(value)}
                    sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    {trainingTypes
                      .filter((tt) => {
                        // Only show tabs for training types that are in activeAssignments
                        return activeAssignments.some(assignment => assignment.template.trainingTypeId === tt.id);
                      })
                      .map((tt) => {
                        // Use actual training type name from the assignment
                        const assignment = activeAssignments.find(a => a.template.trainingTypeId === tt.id);
                        const displayName = assignment?.template.trainingTypeName || tt.nameEN;

                        return (
                          <Tab
                            key={tt.key}
                            value={tt.key}
                            label={displayName}
                          />
                        );
                      })}
                  </Tabs>

                  {/* Coach Plan Exercises */}
                  {template ? (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                        {t('training.coachPlan')}
                      </Typography>

                      {template.blocks
                        .sort((a, b) => a.order - b.order)
                        .map((block) => (
                          <WorkoutBlock
                            key={block.order}
                            block={block}
                            showLogButtons={false}
                            onStartBlock={handleStartBlock}
                            onVideoClick={handleVideoClick}
                            trainingType={activeTab}
                          />
                        ))}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      No training plan available for this type
                    </Alert>
                  )}
                </>
              )}

              {/* History Tab */}
              {teamSessionTab === 'history' && (
                <WorkoutHistory
                  workouts={workoutHistory.filter(w => w.source === 'coach')}
                  onDelete={handleDeleteWorkout}
                  onEdit={handleEditWorkout}
                />
              )}

              {/* My Reports Tab */}
              {teamSessionTab === 'reports' && user && (
                <Box>
                  <ReportsHistory userId={user.id} source="coach" />
                </Box>
              )}
            </>
          ) : (
            <Alert severity="warning">
              {t('training.noProgramAssigned')}
            </Alert>
          )}
        </Box>
      )}

      <FreeSessionDialog
        open={showFreeSession}
        onClose={() => setShowFreeSession(false)}
        onSave={handleSaveFreeSession}
      />

      <EditWorkoutDialog
        open={Boolean(editWorkout)}
        workout={editWorkout}
        onClose={() => setEditWorkout(null)}
        onSave={handleSaveEditedWorkout}
      />

      <PlanBuilderDialog
        open={showPlanBuilder}
        editingPlan={editingPlan}
        onClose={() => {
          setShowPlanBuilder(false);
          setEditingPlan(null);
        }}
        onSave={editingPlan ? handleUpdatePlan : handleCreatePlan}
      />

      <StartWorkoutDialog
        open={showStartWorkout}
        plan={startingPlan}
        onClose={() => {
          setShowStartWorkout(false);
          setStartingPlan(null);
        }}
        onFinish={handleFinishWorkoutRequest}
      />

      <CoachBlockWorkoutDialog
        open={showBlockWorkout}
        block={selectedBlock}
        blockTitle={selectedBlock?.title || ''}
        trainingType={activeTab}
        onClose={() => {
          setShowBlockWorkout(false);
          setSelectedBlock(null);
        }}
        onFinish={handleFinishBlockWorkoutRequest}
      />

      <Dialog
        open={Boolean(videoUrl)}
        onClose={() => setVideoUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {videoUrl && (
            <Box
              component="iframe"
              src={videoUrl}
              sx={{
                width: '100%',
                height: { xs: 300, sm: 400, md: 500 },
                border: 'none',
              }}
              title="Exercise Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Workout Report Dialog */}
      <WorkoutReportDialog
        open={showWorkoutReport}
        onClose={() => setShowWorkoutReport(false)}
        report={workoutReport}
        workoutTitle={lastWorkoutTitle}
      />

      {/* Generating Report Loading Dialog */}
      <Dialog open={generatingReport} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 3 }}>
            <CircularProgress size={60} />
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <AutoAwesomeIcon color="primary" />
                <Typography variant="h6">
                  Generating AI Report
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Analyzing your workout performance...
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Finish Workout Duration Dialog */}
      {pendingWorkout && (
        <FinishWorkoutDialog
          open={showFinishDialog}
          onClose={() => {
            setShowFinishDialog(false);
            setPendingWorkout(null);
          }}
          onConfirm={(duration) => {
            // Call the appropriate finish handler based on context
            if (startingPlan) {
              handleFinishWorkout(pendingWorkout.entries, pendingWorkout.notes, duration);
            } else if (selectedBlock) {
              handleFinishBlockWorkout(pendingWorkout.entries, pendingWorkout.notes, duration);
            }
            setShowFinishDialog(false);
            setPendingWorkout(null);
          }}
          elapsedMinutes={pendingWorkout.elapsedMinutes}
          estimatedMinutes={pendingWorkout.estimatedMinutes}
          totalSets={pendingWorkout.totalSets}
        />
      )}
    </Box>
  );
};
