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
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DescriptionIcon from '@mui/icons-material/Description';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { toastService } from '../services/toast';
import { WorkoutBlock } from '../components/workout/WorkoutBlock';
import { CoachBlockWorkoutDialog } from '../components/workout/CoachBlockWorkoutDialog';
import { FreeSessionDialog } from '../components/workout/FreeSessionDialog';
import { WorkoutHistory } from '../components/workout/WorkoutHistory';
import { EditWorkoutDialog } from '../components/workout/EditWorkoutDialog';
import { WorkoutReportDialog } from '../components/workout/WorkoutReportDialog';
import { ReportsHistory } from '../components/workout/ReportsHistory';
import { FinishWorkoutDialog } from '../components/workout/FinishWorkoutDialog';
import { DayWorkoutDialog } from '../components/workout/DayWorkoutDialog';
import { PlanCard } from '../components/plan/PlanCard';
import { PlanBuilderDialog } from '../components/plan/PlanBuilderDialog';
import { StartWorkoutDialog } from '../components/plan/StartWorkoutDialog';
import { getUser } from '../services/userProfile';
import { assignmentService, trainingTypeService, workoutService } from '../services/api';
import { saveWorkoutLog, getWorkoutLogsByUser, getWorkoutLogs, deleteWorkoutLog, updateWorkoutLog, syncWorkoutLogsFromBackend, type WorkoutLog } from '../services/workoutLog';
import { getUserPlans, getUserPlansFromBackend, createUserPlan, updateUserPlan, deleteUserPlan, duplicateUserPlan, markPlanAsUsed } from '../services/userPlan';
import type { TrainingTypeKey, TemplateBlock } from '../types/template';
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL params or defaults
  const getInitialView = (): SessionView => {
    const view = searchParams.get('view');
    return view === 'my' || view === 'team' ? view : 'team';
  };

  const getInitialMyTab = (): MySessionTab => {
    const tab = searchParams.get('myTab');
    return tab === 'plans' || tab === 'history' || tab === 'reports' ? tab : 'plans';
  };

  const getInitialTeamTab = (): TeamSessionTab => {
    const tab = searchParams.get('teamTab');
    return tab === 'plan' || tab === 'history' || tab === 'reports' ? tab : 'plan';
  };

  const [sessionView, setSessionViewState] = useState<SessionView>(getInitialView);
  const [mySessionTab, setMySessionTabState] = useState<MySessionTab>(getInitialMyTab);
  const [teamSessionTab, setTeamSessionTabState] = useState<TeamSessionTab>(getInitialTeamTab);

  // Update URL when tabs change
  const setSessionView = (view: SessionView) => {
    setSessionViewState(view);
    setSearchParams(prev => {
      prev.set('view', view);
      return prev;
    }, { replace: true });
  };

  const setMySessionTab = (tab: MySessionTab) => {
    setMySessionTabState(tab);
    setSearchParams(prev => {
      prev.set('myTab', tab);
      return prev;
    }, { replace: true });
  };

  const setTeamSessionTab = (tab: TeamSessionTab) => {
    setTeamSessionTabState(tab);
    setSearchParams(prev => {
      prev.set('teamTab', tab);
      return prev;
    }, { replace: true });
  };
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
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayWorkout, setShowDayWorkout] = useState(false);
  const [dayWorkoutBlocks, setDayWorkoutBlocks] = useState<TemplateBlock[]>([]);
  const [dayWorkoutName, setDayWorkoutName] = useState('');

  const user = getUser();
  const [trainingTypes, setTrainingTypes] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(!!user); // Only loading if user exists
  const [workoutHistory, setWorkoutHistory] = useState(() =>
    user ? getWorkoutLogsByUser(user.id) : []
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load all data from backend in parallel
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);

      try {
        // Fetch all data in parallel for better performance
        const [types, allAssignments, userPlans] = await Promise.all([
          trainingTypeService.getAll() as Promise<any[]>,
          assignmentService.getAll() as Promise<any[]>,
          getUserPlansFromBackend(user.id),
        ]);

        const today = new Date().toISOString().split('T')[0];

        // Filter active assignments
        // - Coaches see ALL active assignments
        // - Players only see assignments they are included in
        const playerAssignments = allAssignments.filter((a: any) => {
          const isActive = a.active && a.startDate <= today && (!a.endDate || a.endDate >= today);
          if (!isActive) return false;

          // Coaches see all active assignments
          if (user.role === 'coach') return true;

          // Players only see their assigned sessions
          return a.playerIds?.includes(user.id);
        });

        // Update all state at once
        setTrainingTypes(types);
        setActiveAssignments(playerAssignments);
        setUserPlans(userPlans);
        refreshWorkoutHistory();
      } catch (error) {
        console.error('Failed to load training data:', error);
        toastService.error('Failed to load training data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user?.id]);

  const refreshUserPlans = async () => {
    if (user) {
      console.log('[MY TRAINING] Refreshing user plans...');
      const plans = await getUserPlansFromBackend(user.id);
      setUserPlans(plans);
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

  // Sync and refresh workout history when switching to history tabs
  useEffect(() => {
    const syncAndRefresh = async () => {
      if (!user) return;

      const shouldSync =
        (sessionView === 'team' && teamSessionTab === 'history') ||
        (sessionView === 'my' && mySessionTab === 'history');

      if (shouldSync) {
        setHistoryLoading(true);
        console.log('[MY TRAINING] Syncing workout history for tab change...');
        try {
          if (navigator.onLine) {
            await syncWorkoutLogsFromBackend(user.id);
          }
          refreshWorkoutHistory();
        } finally {
          setHistoryLoading(false);
        }
      }
    };

    syncAndRefresh();
  }, [sessionView, teamSessionTab, mySessionTab, user?.id]);

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

      setWorkoutReport(report);
      setLastWorkoutTitle(t('training.freeSessions'));
      setShowWorkoutReport(true);
    }
  };

  const handleDeleteWorkout = async (logId: string) => {
    if (window.confirm(t('workout.confirmDelete'))) {
      try {
        // Soft delete - hides from history but keeps for stats
        await deleteWorkoutLog(logId);
        refreshWorkoutHistory();
        toastService.deleted('Workout');
        setSuccessMessage('');
      } catch (error) {
        toastService.deleteError('workout', error instanceof Error ? error.message : undefined);
      }
    }
  };

  const handleEditWorkout = (workout: WorkoutLog) => {
    setEditWorkout(workout);
  };

  const handleSaveEditedWorkout = (workoutId: string, entries: WorkoutEntry[], notes?: string) => {
    updateWorkoutLog(workoutId, { entries, notes });
    refreshWorkoutHistory();
    setEditWorkout(null);
    toastService.saved('Workout');
    setSuccessMessage('');
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
      try {
        await createUserPlan({
          userId: user.id,
          name: planName,
          exercises,
          warmupMinutes,
        });
        await refreshUserPlans();
        toastService.created('Plan');
        setSuccessMessage('');
      } catch (error) {
        toastService.createError('plan', error instanceof Error ? error.message : undefined);
      }
    }
  };

  const handleUpdatePlan = async (planName: string, exercises: PlanExercise[], warmupMinutes?: number) => {
    if (editingPlan) {
      try {
        await updateUserPlan(editingPlan.id, {
          name: planName,
          exercises,
          warmupMinutes,
        });
        await refreshUserPlans();
        setEditingPlan(null);
        toastService.updated('Plan');
        setSuccessMessage('');
      } catch (error) {
        toastService.updateError('plan', error instanceof Error ? error.message : undefined);
      }
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteUserPlan(planId);
        await refreshUserPlans();
        toastService.deleted('Plan');
        setSuccessMessage('');
      } catch (error) {
        toastService.deleteError('plan', error instanceof Error ? error.message : undefined);
      }
    }
  };

  const handleDuplicatePlan = async (planId: string) => {
    try {
      await duplicateUserPlan(planId);
      await refreshUserPlans();
      toastService.duplicated('Plan');
      setSuccessMessage('');
    } catch (error) {
      toastService.error('Failed to duplicate plan', { autoClose: 5000 });
    }
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
  const handleFinishWorkout = async (entries: WorkoutEntry[], notes: string, duration: number, workoutDate?: string) => {
    if (user && startingPlan) {
      const today = workoutDate || new Date().toISOString().split('T')[0];

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

      // Save to localStorage
      const allLogs = getWorkoutLogs();
      allLogs.push(workoutLog);
      localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));

      // Save to backend
      try {
        const backendWorkout = await workoutService.create({
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

        // Update local workout with backend ID to prevent duplicates
        if (backendWorkout && backendWorkout.id) {
          workoutLog.id = backendWorkout.id;
          const allLogs = getWorkoutLogs();
          const index = allLogs.findIndex(log => log.id !== backendWorkout.id && log.date === workoutLog.date && log.createdAt === workoutLog.createdAt);
          if (index !== -1) {
            allLogs[index] = workoutLog;
            localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));
            console.log('✅ Updated local workout with backend ID:', backendWorkout.id);
          }
        }
      } catch (error) {
        console.error('Failed to save player workout to backend:', error);
        throw error;
      }

      markPlanAsUsed(startingPlan.id);
      await refreshUserPlans();
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

      setWorkoutReport(report);
      setLastWorkoutTitle(startingPlan.name);
      setShowWorkoutReport(true);
      setStartingPlan(null);
      setShowStartWorkout(false); // Close StartWorkoutDialog after everything is done

      // Show success toast
      toastService.workoutCompleted();
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

  const handleFinishBlockWorkout = async (entries: WorkoutEntry[], notes: string, duration: number, workoutDate?: string) => {
    if (user && selectedBlock) {
      const today = workoutDate || new Date().toISOString().split('T')[0];

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

      // Save to localStorage
      const allLogs = getWorkoutLogs();
      allLogs.push(workoutLog);
      localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));

      // Save to backend
      try {
        const backendWorkout = await workoutService.create({
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

        // Update local workout with backend ID to prevent duplicates
        if (backendWorkout && backendWorkout.id) {
          workoutLog.id = backendWorkout.id;
          const allLogsUpdated = getWorkoutLogs();
          const index = allLogsUpdated.findIndex(log => log.id !== backendWorkout.id && log.date === workoutLog.date && log.createdAt === workoutLog.createdAt);
          if (index !== -1) {
            allLogsUpdated[index] = workoutLog;
            localStorage.setItem('rhinos_workouts', JSON.stringify(allLogsUpdated));
            console.log('✅ Updated local workout with backend ID:', backendWorkout.id);
          }
        }
      } catch (error) {
        console.error('Failed to save workout to backend:', error);
        throw error;
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

      setWorkoutReport(report);
      setLastWorkoutTitle(selectedBlock.title);
      setShowWorkoutReport(true);
      setSelectedBlock(null);
      setShowBlockWorkout(false); // Close CoachBlockWorkoutDialog after everything is done

      // Show success toast
      toastService.workoutCompleted();
    }
  };

  const handleFinishDayWorkout = async (entries: WorkoutEntry[], notes: string, duration: number, dayName: string) => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];

      // Calculate plan metadata for completion tracking
      const totalExercises = dayWorkoutBlocks.reduce((sum, block) => sum + block.items.length, 0);
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
        planName: dayName,
        duration,
        createdAt: new Date().toISOString(),
        planMetadata: {
          totalExercises,
          totalTargetSets,
        },
        completionPercentage,
      };

      // Save to localStorage
      const allLogs = getWorkoutLogs();
      allLogs.push(workoutLog);
      localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));

      // Save to backend
      try {
        const backendWorkout = await workoutService.create({
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

        // Update local workout with backend ID to prevent duplicates
        if (backendWorkout && backendWorkout.id) {
          workoutLog.id = backendWorkout.id;
          const allLogsUpdated = getWorkoutLogs();
          const index = allLogsUpdated.findIndex(log => log.id !== backendWorkout.id && log.date === workoutLog.date && log.createdAt === workoutLog.createdAt);
          if (index !== -1) {
            allLogsUpdated[index] = workoutLog;
            localStorage.setItem('rhinos_workouts', JSON.stringify(allLogsUpdated));
            console.log('✅ Updated local workout with backend ID:', backendWorkout.id);
          }
        }
      } catch (error) {
        console.error('Failed to save workout to backend:', error);
        throw error;
      }

      refreshWorkoutHistory();

      // Generate and save workout report
      const report = await generateWorkoutReport(
        entries,
        duration,
        dayName,
        notes
      );

      await saveWorkoutReport(user.id, dayName, report, 'coach', entries);

      setWorkoutReport(report);
      setLastWorkoutTitle(dayName);
      setShowWorkoutReport(true);
      setShowDayWorkout(false);

      // Show success toast
      toastService.workoutCompleted();
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
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <WorkoutHistory
                  workouts={workoutHistory.filter(w => w.source === 'player')}
                  onDelete={handleDeleteWorkout}
                  onEdit={handleEditWorkout}
                />
              )}
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
          {isLoadingData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
              <CircularProgress />
              <Typography variant="caption" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          ) : activeAssignments.length > 0 ? (
            <>
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
                  {/* Assigned Programs Cards */}
                  <Box sx={{ mb: 4 }}>
                    {activeAssignments
                      .filter(assignment => assignment.template) // Filter out assignments without template
                      .map((assignment) => {
                        const { currentWeek, totalWeeks, progressPercent } = calculateProgress(
                          assignment.startDate,
                          assignment.endDate
                        );

                        // Helper to get unique days from blocks
                        const getAvailableDays = (blocks: any[]) => {
                          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                          const daysSet = new Set<number>();
                          blocks.forEach(block => {
                            const dayNum = (block as any).dayNumber;
                            if (dayNum && dayNum >= 1 && dayNum <= 7) {
                              daysSet.add(dayNum);
                            }
                          });
                          return Array.from(daysSet).sort().map(num => dayNames[num - 1].substring(0, 3));
                        };

                        const availableDays = getAvailableDays(assignment.template.blocks);

                        return (
                          <Card
                            key={assignment.id}
                            sx={{
                              mb: 2,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 4,
                              }
                            }}
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowAssignmentDialog(true);
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
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

                            <Box sx={{ mb: 2 }}>
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

                            {availableDays.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  Training Days:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {availableDays.map(day => (
                                    <Chip
                                      key={day}
                                      label={day}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'primary.light',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}

                            <Alert severity="info" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FitnessCenterIcon fontSize="small" />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  Click to start training
                                </Typography>
                              </Box>
                            </Alert>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </>
              )}

              {/* History Tab */}
              {teamSessionTab === 'history' && (
                historyLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <WorkoutHistory
                    workouts={workoutHistory.filter(w => w.source === 'coach')}
                    onDelete={handleDeleteWorkout}
                    onEdit={handleEditWorkout}
                  />
                )
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
          onConfirm={(duration, workoutDate) => {
            // Call the appropriate finish handler based on context
            if (startingPlan) {
              handleFinishWorkout(pendingWorkout.entries, pendingWorkout.notes, duration, workoutDate);
            } else if (selectedBlock) {
              handleFinishBlockWorkout(pendingWorkout.entries, pendingWorkout.notes, duration, workoutDate);
            }
            setShowFinishDialog(false);
            setPendingWorkout(null);
          }}
          elapsedMinutes={pendingWorkout.elapsedMinutes}
          estimatedMinutes={pendingWorkout.estimatedMinutes}
          totalSets={pendingWorkout.totalSets}
        />
      )}

      {/* Assignment Day Selection Dialog */}
      <Dialog
        open={showAssignmentDialog}
        onClose={() => {
          setShowAssignmentDialog(false);
          setSelectedAssignment(null);
          setSelectedDay(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          {selectedAssignment && (() => {
            const { currentWeek } = calculateProgress(selectedAssignment.startDate, selectedAssignment.endDate);

            // Group blocks by day
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const dayGroups = new Map<number, any[]>();

            selectedAssignment.template.blocks.forEach((block: any) => {
              const dayNum = block.dayNumber;
              if (dayNum && dayNum >= 1 && dayNum <= 7) {
                if (!dayGroups.has(dayNum)) {
                  dayGroups.set(dayNum, []);
                }
                dayGroups.get(dayNum)!.push(block);
              }
            });

            const sortedDays = Array.from(dayGroups.entries()).sort(([a], [b]) => a - b);

            // If a day is selected, show that day's blocks
            if (selectedDay !== null) {
              const dayBlocks = dayGroups.get(selectedDay) || [];
              const dayName = dayNames[selectedDay - 1];
              const dayFullName = `${dayName} / Day ${selectedDay}`;

              // Convert to template blocks
              const templateBlocks: TemplateBlock[] = dayBlocks
                .sort((a, b) => a.order - b.order)
                .map(block => ({
                  order: block.order,
                  title: block.title,
                  items: (block as any).items || (block as any).exercises || [],
                  globalSets: (block as any).globalSets,
                  exerciseConfigs: (block as any).exerciseConfigs,
                }));

              const totalExercises = templateBlocks.reduce((sum, b) => sum + b.items.length, 0);

              return (
                <Box>
                  {/* Back button */}
                  <Button
                    onClick={() => setSelectedDay(null)}
                    sx={{ mb: 2 }}
                    startIcon={<ExpandMoreIcon sx={{ transform: 'rotate(90deg)' }} />}
                  >
                    Back to days
                  </Button>

                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                    {dayFullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {selectedAssignment.template.trainingTypeName} - Week {currentWeek}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {templateBlocks.length} block{templateBlocks.length > 1 ? 's' : ''} • {totalExercises} exercise{totalExercises > 1 ? 's' : ''}
                  </Typography>

                  {/* Preview of blocks */}
                  {templateBlocks.map((block, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <WorkoutBlock
                        block={block}
                        showLogButtons={false}
                        onStartBlock={undefined}
                        onVideoClick={handleVideoClick}
                        trainingType={activeTab}
                      />
                    </Box>
                  ))}

                  {/* Single button to start the entire day */}
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => {
                      setDayWorkoutBlocks(templateBlocks);
                      setDayWorkoutName(dayFullName);
                      setShowDayWorkout(true);
                      setShowAssignmentDialog(false);
                      setSelectedDay(null);
                    }}
                    sx={{
                      mt: 3,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                    }}
                    startIcon={<FitnessCenterIcon />}
                  >
                    Start Training - {dayFullName}
                  </Button>
                </Box>
              );
            }

            // Default view: Show day selection
            return (
              <Box>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                  {selectedAssignment.template.trainingTypeName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Week {currentWeek} - Select a training day
                </Typography>

                {selectedAssignment.template.weeklyNotes && (
                  <Alert severity="info" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <DescriptionIcon fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Week {currentWeek} Notes
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {selectedAssignment.template.weeklyNotes}
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sortedDays.map(([dayNum, blocks]) => {
                    const dayName = dayNames[dayNum - 1];
                    const sessionCount = blocks.length;
                    const totalExercises = blocks.reduce((sum: number, b: any) =>
                      sum + ((b.items || b.exercises || []).length), 0
                    );

                    return (
                      <Card
                        key={dayNum}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: 3,
                          }
                        }}
                        onClick={() => setSelectedDay(dayNum)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {dayName} / Day {dayNum}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {sessionCount} session{sessionCount > 1 ? 's' : ''} • {totalExercises} exercise{totalExercises > 1 ? 's' : ''}
                              </Typography>
                            </Box>
                            <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)', color: 'text.secondary' }} />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>

                {sortedDays.length === 0 && (
                  <Alert severity="warning">
                    No training days scheduled for this program
                  </Alert>
                )}
              </Box>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Day Workout Dialog - Handles full day training with multiple blocks */}
      <DayWorkoutDialog
        open={showDayWorkout}
        blocks={dayWorkoutBlocks}
        dayName={dayWorkoutName}
        trainingTypeName={selectedAssignment?.template?.trainingTypeName || ''}
        trainingType={activeTab}
        onClose={() => {
          setShowDayWorkout(false);
          setDayWorkoutBlocks([]);
          setDayWorkoutName('');
        }}
        onFinish={handleFinishDayWorkout}
      />
    </Box>
  );
};
