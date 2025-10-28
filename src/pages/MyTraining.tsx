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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import { assignmentService, trainingTypeService, workoutService } from '../services/api';
import {
  getCachedTrainingTypes,
  getPlayerAssignments,
  db,
  addToOutbox,
} from '../services/db';
import { isOnline } from '../services/sync';
import { saveWorkoutLog, getWorkoutLogsByUser, getWorkoutLogs, deleteWorkoutLog, updateWorkoutLog, syncWorkoutLogsFromBackend, type WorkoutLog } from '../services/workoutLog';
import { getUserPlans, createUserPlan, updateUserPlan, deleteUserPlan, duplicateUserPlan, markPlanAsUsed, syncUserPlansFromBackend } from '../services/userPlan';
import type { TrainingTypeKey, TemplateBlock } from '../types/template';
import type { WorkoutPayload, WorkoutEntry } from '../types/workout';
import type { UserPlanTemplate, PlanExercise } from '../types/userPlan';
import { sanitizeYouTubeUrl } from '../services/yt';
import { analyzeWorkout, estimateWorkoutDuration, type WorkoutReport } from '../services/workoutAnalysis';
import { saveWorkoutReport, syncWorkoutReportsFromBackend } from '../services/workoutReports';
import { generateAIWorkoutReport, getAPIKey } from '../services/aiInsights';
import { addWorkoutPoints } from '../services/pointsSystem';

type SessionView = 'my' | 'team';
type MySessionTab = 'plans' | 'history' | 'reports';
type TeamSessionTab = 'plan' | 'history' | 'reports';

export const MyTraining: React.FC = () => {
  const { t } = useI18n();
  const [sessionView, setSessionView] = useState<SessionView>('my');
  const [mySessionTab, setMySessionTab] = useState<MySessionTab>('plans');
  const [teamSessionTab, setTeamSessionTab] = useState<TeamSessionTab>('plan');
  const [activeTab, setActiveTab] = useState<TrainingTypeKey>('strength_conditioning');
  // const [template, setTemplate] = useState<PositionTemplate | null>(null); // No longer needed - using assignment.template directly
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
  const [trainingTypes, setTrainingTypes] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState(() =>
    user ? getWorkoutLogsByUser(user.id) : []
  );

  // Load training types and assignments from backend (with offline support)
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const online = isOnline();
      console.log(`📡 Loading data - ${online ? 'ONLINE' : 'OFFLINE'} mode`);

      try {
        let types: any[] = [];
        let playerAssignments: any[] = [];

        if (online) {
          // Online: Fetch from API and cache
          try {
            types = await trainingTypeService.getAll() as any[];

            // Cache training types in IndexedDB
            await db.trainingTypes.bulkPut(
              types.map((tt: any) => ({
                ...tt,
                syncedAt: new Date().toISOString(),
              }))
            );

            const allAssignments = await assignmentService.getAll() as any[];
            const today = new Date().toISOString().split('T')[0];

            // Filter active assignments for this player
            playerAssignments = allAssignments.filter((a: any) =>
              a.active &&
              a.playerIds?.includes(user.id) &&
              a.startDate <= today &&
              (!a.endDate || a.endDate >= today)
            );

            // Cache assignments in IndexedDB
            await db.trainingAssignments.bulkPut(
              allAssignments.map((a: any) => ({
                ...a,
                syncedAt: new Date().toISOString(),
              }))
            );

            console.log('✅ Loaded from API and cached');

            // Sync workout logs, reports, and user plans from backend
            await syncWorkoutLogsFromBackend(user.id);
            await syncWorkoutReportsFromBackend(user.id);
            await syncUserPlansFromBackend(user.id);

            // Refresh local state after sync
            refreshWorkoutHistory();
          } catch (apiError) {
            console.warn('⚠️ API failed, falling back to cache:', apiError);
            // If API fails but we're online, fall back to cache
            types = await getCachedTrainingTypes();
            playerAssignments = await getPlayerAssignments(user.id);
            console.log('📦 Loaded from cache (API error)');
          }
        } else {
          // Offline: Load from cache
          types = await getCachedTrainingTypes();
          playerAssignments = await getPlayerAssignments(user.id);
          console.log('📦 Loaded from offline cache');
        }

        // Filter only active assignments with dates
        const today = new Date().toISOString().split('T')[0];
        const activeFiltered = playerAssignments.filter((a: any) =>
          a.active &&
          a.startDate <= today &&
          (!a.endDate || a.endDate >= today)
        );

        setTrainingTypes(types);
        setActiveAssignments(activeFiltered);
        console.log('🎯 Loaded assignments:', activeFiltered);
      } catch (error) {
        console.error('❌ Error loading data:', error);
      }
    };

    loadData();
  }, [user?.id]);

  // Load user plans
  useEffect(() => {
    if (user) {
      setUserPlans(getUserPlans(user.id));
    }
  }, [user?.id]);

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

  // No longer needed - using assignment.template directly in Team Sessions
  // useEffect(() => {
  //   if (user) {
  //     const templates = getTemplatesForPosition(user.position);
  //     const trainingTemplate = templates[activeTab];
  //     if (trainingTemplate) {
  //       const positionTemplate: PositionTemplate = {
  //         blocks: trainingTemplate.blocks.map(block => ({
  //           order: block.order,
  //           title: block.title,
  //           items: block.exercises,
  //           globalSets: (block as any).globalSets,
  //           exerciseConfigs: (block as any).exerciseConfigs,
  //         }))
  //       };
  //       setTemplate(positionTemplate);
  //     } else {
  //       setTemplate(null);
  //     }
  //   }
  // }, [user?.position, activeTab]);

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

      // Default duration for free sessions (60 minutes)
      const duration = 60;

      // Generate and save workout report for free sessions
      const report = await generateWorkoutReport(
        payload.entries,
        duration,
        t('training.freeSessions')
      );
      await saveWorkoutReport(user.id, t('training.freeSessions'), report, 'player', payload.entries);

      // Add points to player's weekly total
      const totalSets = payload.entries.reduce((sum, e) => sum + (e.setData?.length || e.sets || 0), 0);
      const totalVolume = payload.entries.reduce((sum, e) => {
        if (e.setData) {
          return sum + e.setData.reduce((setSum, set) => setSum + ((set.reps || 0) * (set.kg || 0)), 0);
        }
        return sum + ((e.reps || 0) * (e.kg || 0) * (e.sets || 0));
      }, 0);
      const totalDistance = payload.entries.reduce((sum, e) => {
        if (e.setData) {
          return sum + e.setData.reduce((setSum, set) => setSum + (set.distance || 0), 0);
        }
        return sum + (e.distance || 0);
      }, 0);
      addWorkoutPoints(
        user.id,
        t('training.freeSessions'),
        duration,
        'personal',
        totalSets,
        totalVolume,
        totalDistance > 0 ? totalDistance : undefined,
        payload.notes
      );

      setWorkoutReport(report);
      setLastWorkoutTitle(t('training.freeSessions'));
      setShowWorkoutReport(true);
    }
  };

  const handleDeleteWorkout = async (logId: string) => {
    if (window.confirm(t('workout.confirmDelete'))) {
      // Soft delete - hides from history but keeps for stats
      await deleteWorkoutLog(logId);
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
  const handleCreatePlan = async (planName: string, exercises: PlanExercise[], warmupMinutes?: number) => {
    if (user) {
      await createUserPlan({
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

  const handleUpdatePlan = async (planName: string, exercises: PlanExercise[], warmupMinutes?: number) => {
    if (editingPlan) {
      await updateUserPlan(editingPlan.id, {
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

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      await deleteUserPlan(planId);
      refreshUserPlans();
      setSuccessMessage('Plan deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDuplicatePlan = async (planId: string) => {
    await duplicateUserPlan(planId);
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
    const estimatedMinutes = estimateWorkoutDuration(entries, startingPlan?.warmupMinutes);

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

      // Save to localStorage first (offline support)
      const allLogs = getWorkoutLogs();
      allLogs.push(workoutLog);
      localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));

      // Save to IndexedDB for offline persistence
      await db.workouts.put({
        ...workoutLog,
        planId: workoutLog.planTemplateId,
        trainingType: 'strength',
        completedAt: workoutLog.createdAt,
        exercises: workoutLog.entries,
        syncedAt: new Date().toISOString(),
      });

      // Try to save to backend (will work if online)
      const online = isOnline();
      if (online) {
        try {
          await workoutService.create({
            date: today,
            entries: workoutLog.entries,
            notes: workoutLog.notes,
            source: 'player',
            planTemplateId: workoutLog.planTemplateId,
            planName: workoutLog.planName,
            duration: workoutLog.duration,
            planMetadata: workoutLog.planMetadata,
            completionPercentage: workoutLog.completionPercentage,
          });
          console.log('✅ Player workout saved to backend');
        } catch (error) {
          console.warn('⚠️ Failed to save player workout to backend, will sync later:', error);
          await addToOutbox('workout', 'create', workoutLog);
        }
      } else {
        await addToOutbox('workout', 'create', workoutLog);
        console.log('📦 Player workout queued for sync when online');
      }

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

      // Save report to localStorage and backend
      await saveWorkoutReport(user.id, startingPlan.name, report, 'player', entries);

      // Add points to player's weekly total
      const totalSets = entries.reduce((sum, e) => sum + (e.setData?.length || e.sets || 0), 0);
      const totalVolume = entries.reduce((sum, e) => {
        if (e.setData) {
          return sum + e.setData.reduce((setSum, set) => setSum + ((set.reps || 0) * (set.kg || 0)), 0);
        }
        return sum + ((e.reps || 0) * (e.kg || 0) * (e.sets || 0));
      }, 0);
      const totalDistance = entries.reduce((sum, e) => {
        if (e.setData) {
          return sum + e.setData.reduce((setSum, set) => setSum + (set.distance || 0), 0);
        }
        return sum + (e.distance || 0);
      }, 0);
      addWorkoutPoints(
        user.id,
        startingPlan.name,
        duration,
        'personal',
        totalSets,
        totalVolume,
        totalDistance > 0 ? totalDistance : undefined,
        notes
      );

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

      // Save to localStorage first (offline support)
      const allLogs = getWorkoutLogs();
      allLogs.push(workoutLog);
      localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));

      // Save to IndexedDB for offline persistence
      await db.workouts.put({
        ...workoutLog,
        planId: workoutLog.planName,
        trainingType: activeTab === 'strength_conditioning' ? 'strength' : 'sprints',
        completedAt: workoutLog.createdAt,
        exercises: workoutLog.entries,
        syncedAt: new Date().toISOString(),
      });

      // Try to save to backend (will work if online)
      const online = isOnline();
      if (online) {
        try {
          await workoutService.create({
            date: today,
            entries: workoutLog.entries,
            notes: workoutLog.notes,
            source: 'coach',
            planName: workoutLog.planName,
            duration: workoutLog.duration,
            planMetadata: workoutLog.planMetadata,
            completionPercentage: workoutLog.completionPercentage,
          });
          console.log('✅ Workout saved to backend');
        } catch (error) {
          console.warn('⚠️ Failed to save workout to backend, will sync later:', error);
          // Add to outbox for later sync
          await addToOutbox('workout', 'create', workoutLog);
        }
      } else {
        // Offline: add to outbox for later sync
        await addToOutbox('workout', 'create', workoutLog);
        console.log('📦 Workout queued for sync when online');
      }

      refreshWorkoutHistory();

      // Generate and save workout report
      const report = await generateWorkoutReport(
        entries,
        duration,
        selectedBlock.title,
        notes
      );

      // Save report to localStorage and backend
      await saveWorkoutReport(user.id, selectedBlock.title, report, 'coach', entries);

      // Add points to player's weekly total
      const totalSets = entries.reduce((sum, e) => sum + (e.setData?.length || e.sets || 0), 0);
      const totalVolume = entries.reduce((sum, e) => {
        if (e.setData) {
          return sum + e.setData.reduce((setSum, set) => setSum + ((set.reps || 0) * (set.kg || 0)), 0);
        }
        return sum + ((e.reps || 0) * (e.kg || 0) * (e.sets || 0));
      }, 0);
      const totalDistance = entries.reduce((sum, e) => {
        if (e.setData) {
          return sum + e.setData.reduce((setSum, set) => setSum + (set.distance || 0), 0);
        }
        return sum + (e.distance || 0);
      }, 0);
      addWorkoutPoints(
        user.id,
        selectedBlock.title,
        duration,
        'coach',
        totalSets,
        totalVolume,
        totalDistance > 0 ? totalDistance : undefined,
        notes
      );

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
                sx={{
                  mb: 3,
                  py: 1.5,
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { sm: '200px' },
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

                {activeAssignments
                  .filter(assignment => assignment.template) // Filter out assignments without template
                  .map((assignment) => {
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
                        return activeAssignments.some(assignment => assignment.template && assignment.template.trainingTypeId === tt.id);
                      })
                      .map((tt) => {
                        // Use actual training type name from the assignment
                        const assignment = activeAssignments.find(a => a.template && a.template.trainingTypeId === tt.id);
                        const displayName = assignment?.template?.trainingTypeName || tt.nameEN;

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
                  {(() => {
                    const activeTrainingType = trainingTypes.find(tt => tt.key === activeTab);
                    console.log('🔍 Looking for assignment:', {
                      activeTab,
                      activeTrainingTypeId: activeTrainingType?.id,
                      availableAssignments: activeAssignments.map(a => ({
                        id: a.id,
                        trainingTypeId: a.template?.trainingTypeId
                      }))
                    });

                    const assignment = activeAssignments.find(a => a.template && a.template.trainingTypeId === activeTrainingType?.id);

                    if (!assignment || !assignment.template) {
                      return (
                        <Alert severity="info">
                          No training plan available for this type
                        </Alert>
                      );
                    }

                    const { currentWeek } = calculateProgress(assignment.startDate, assignment.endDate);

                    // Helper function to group blocks by day
                    const groupBlocksByDay = (blocks: typeof assignment.template.blocks) => {
                      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      const grouped = new Map<number, typeof assignment.template.blocks>();
                      const unscheduled: typeof assignment.template.blocks = [];

                      blocks.forEach(block => {
                        const dayNum = (block as any).dayNumber;
                        if (dayNum && dayNum >= 1 && dayNum <= 7) {
                          if (!grouped.has(dayNum)) {
                            grouped.set(dayNum, []);
                          }
                          grouped.get(dayNum)!.push(block);
                        } else {
                          unscheduled.push(block);
                        }
                      });

                      const dayGroups = Array.from(grouped.entries())
                        .sort(([a], [b]) => a - b)
                        .map(([dayNum, dayBlocks]) => ({
                          dayNumber: dayNum,
                          dayName: `${dayNames[dayNum - 1]} / Day ${dayNum}`,
                          blocks: dayBlocks
                        }));

                      return { dayGroups, unscheduled };
                    };

                    // Helper function to group blocks by session within a day
                    const groupBlocksBySession = (blocks: typeof assignment.template.blocks) => {
                      const grouped = new Map<string, typeof assignment.template.blocks>();

                      blocks.forEach(block => {
                        const sessionKey = (block as any).sessionName || '_default';
                        if (!grouped.has(sessionKey)) {
                          grouped.set(sessionKey, []);
                        }
                        grouped.get(sessionKey)!.push(block);
                      });

                      return Array.from(grouped.entries()).map(([name, blocks]) => ({
                        name: name === '_default' ? '' : name,
                        blocks: blocks.sort((a, b) => a.order - b.order)
                      }));
                    };

                    const { dayGroups, unscheduled } = groupBlocksByDay(assignment.template.blocks);

                    return (
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                          {t('training.coachPlan')}
                        </Typography>

                        {/* Weekly Notes */}
                        {assignment.template.weeklyNotes && (
                          <Alert severity="info" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              📋 Week {currentWeek} of {assignment.template.durationWeeks} - Progression Notes
                            </Typography>
                            <Typography variant="body2">
                              {assignment.template.weeklyNotes}
                            </Typography>
                          </Alert>
                        )}

                        {/* Days with expandable sessions */}
                        {dayGroups.length > 0 ? (
                          dayGroups.map((dayGroup) => {
                            const sessions = groupBlocksBySession(dayGroup.blocks);

                            return (
                              <Accordion key={dayGroup.dayNumber} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                      {dayGroup.dayName}
                                    </Typography>
                                  </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                  {sessions.map((session, sIdx) => (
                                    <Box key={sIdx} sx={{ mb: 3 }}>
                                      {session.name && (
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                                          {session.name}
                                        </Typography>
                                      )}

                                      {session.blocks.map(block => {
                                        // Convert TrainingBlock to TemplateBlock format
                                        const templateBlock = {
                                          order: block.order,
                                          title: block.title,
                                          items: (block as any).items || (block as any).exercises || [],
                                          globalSets: (block as any).globalSets,
                                          exerciseConfigs: (block as any).exerciseConfigs,
                                        };
                                        return (
                                          <WorkoutBlock
                                            key={block.order}
                                            block={templateBlock}
                                            showLogButtons={false}
                                            onStartBlock={undefined}
                                            onVideoClick={handleVideoClick}
                                            trainingType={activeTab}
                                          />
                                        );
                                      })}

                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => {
                                          // Combine all blocks from this session/day into one workout
                                          const allExercises: any[] = [];
                                          const allExerciseConfigs: any[] = [];

                                          session.blocks.forEach(block => {
                                            const blockExercises = (block as any).items || (block as any).exercises || [];
                                            allExercises.push(...blockExercises);

                                            // Preserve exercise configs from each block
                                            const blockConfigs = (block as any).exerciseConfigs || [];
                                            allExerciseConfigs.push(...blockConfigs);
                                          });

                                          // Create a combined block with all exercises
                                          const combinedBlock = {
                                            order: 1,
                                            title: session.name || dayGroup.dayName,
                                            items: allExercises,
                                            globalSets: undefined, // Don't use global sets for combined blocks
                                            exerciseConfigs: allExerciseConfigs,
                                          };

                                          handleStartBlock(combinedBlock);
                                        }}
                                        sx={{ mt: 1 }}
                                      >
                                        Start {session.name || 'Workout'}
                                      </Button>
                                    </Box>
                                  ))}
                                </AccordionDetails>
                              </Accordion>
                            );
                          })
                        ) : unscheduled.length > 0 ? (
                          // Show unscheduled blocks as before (flat list)
                          <Box>
                            {unscheduled
                              .sort((a, b) => a.order - b.order)
                              .map((block) => {
                                // Convert TrainingBlock to TemplateBlock format
                                const templateBlock = {
                                  order: block.order,
                                  title: block.title,
                                  items: (block as any).items || (block as any).exercises || [],
                                  globalSets: (block as any).globalSets,
                                  exerciseConfigs: (block as any).exerciseConfigs,
                                };
                                return (
                                  <WorkoutBlock
                                    key={block.order}
                                    block={templateBlock}
                                    showLogButtons={false}
                                    onStartBlock={handleStartBlock}
                                    onVideoClick={handleVideoClick}
                                    trainingType={activeTab}
                                  />
                                );
                              })}
                          </Box>
                        ) : (
                          <Alert severity="info">
                            No blocks configured for this program yet
                          </Alert>
                        )}
                      </Box>
                    );
                  })()}
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
