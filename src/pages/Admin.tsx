import React, { useState, useEffect } from 'react';
import { ExerciseCategoryManager } from '../components/admin/ExerciseCategoryManager';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  Checkbox,
  Pagination,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
  ListItemIcon,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CategoryIcon from '@mui/icons-material/Category';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useI18n } from '../i18n/I18nProvider';
import type { Exercise, ExerciseCategory, Position, MuscleGroup } from '../types/exercise';
import type { TrainingTemplate, TrainingAssignment } from '../types/trainingBuilder';
// Note: TrainingTypes now loaded from backend via trainingTypeService
import { getUser } from '../services/userProfile';
import { exerciseService, templateService, assignmentService, userService, trainingTypeService, exerciseCategoryService } from '../services/api';
import { BlockInfoManager } from '../components/admin/BlockInfoManager';
import { PointsSystemManager } from '../components/admin/PointsSystemManager';
import { getAllBlockInfo } from '../services/blockInfo';
import { DrillManager } from '../components/DrillManager';
import { EquipmentManager } from '../components/EquipmentManager';
import { DrillCategoryManager } from '../components/DrillCategoryManager';
import { VideoTagsManager } from '../components/VideoTagsManager';
import { VideosAdmin } from './VideosAdmin';
import { getTeamSettings, updateTeamSettings, syncTeamSettingsFromBackend } from '../services/teamSettings';
import type { SeasonPhase, TeamLevel } from '../types/teamSettings';
import { validateAPIKey } from '../services/aiInsights';
import RhinosLogo from '../assets/imgs/USR_Allgemein_Quard_Transparent.png';
import { NotificationTemplates, getNotificationStatus, requestNotificationPermission } from '../services/notifications';
import { toastService } from '../services/toast';
import { createSession, getTeamSessions, deleteSession } from '../services/trainingSessions';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { extractYouTubeVideoId } from '../services/yt';

interface TeamSession {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string;
  endTime: string;
  type: string;
  location?: string; // Venue/facility name (e.g., "Sporthalle Nord")
  address?: string; // City/address (e.g., "Frankfurt am Main, Sportplatz 1")
}

interface Policy {
  maxFreeSessionsPerDay: number;
  maxFreeSharePctPerWeek: number;
  allowedCategories: ExerciseCategory[];
}

interface TrainingType {
  id: string;
  key: string;
  nameEN: string;
  nameDE: string;
  season: 'in-season' | 'off-season' | 'pre-season';
  active: boolean;
}

export const Admin: React.FC = () => {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const [exercisesMenuOpen, setExercisesMenuOpen] = useState(true);
  const [trainingMenuOpen, setTrainingMenuOpen] = useState(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [resourcesMenuOpen, setResourcesMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const user = getUser();

  // Exercise Management State
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exercisePage, setExercisePage] = useState(0);
  const [exercisesPerPage] = useState(20);
  const [exerciseCategories, setExerciseCategories] = useState<any[]>([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [exerciseMuscleGroupFilter, setExerciseMuscleGroupFilter] = useState<MuscleGroup | 'all'>('all');
  const [newExercise, setNewExercise] = useState<Partial<Exercise & { trainingTypes?: string[] }>>({
    name: '',
    category: 'strength', // Default to first category key
    muscleGroups: [],
    isGlobal: true,
    youtubeUrl: '',
    trainingTypes: [],
  });

  // Sessions Management State
  const [sessions, setSessions] = useState<TeamSession[]>([]);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState<Partial<TeamSession>>({
    date: new Date().toISOString().split('T')[0], // Today's date
    startTime: '19:00',
    endTime: '21:00',
    type: 'Team Training',
    location: '',
    address: '',
  });

  // Team Settings State
  const [teamSettings, setTeamSettings] = useState(() => getTeamSettings());
  const [seasonPhase, setSeasonPhase] = useState<SeasonPhase>(teamSettings.seasonPhase);
  const [teamLevel, setTeamLevel] = useState<TeamLevel>(teamSettings.teamLevel);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // AI Coach State
  const [teamApiKey, setTeamApiKey] = useState<string>(teamSettings.aiApiKey || '');
  const [apiKeyValidating, setApiKeyValidating] = useState(false);
  const [apiKeyValidationResult, setApiKeyValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [aiCoachSaved, setAiCoachSaved] = useState(false);

  // User Population State
  const [isPopulatingUsers, setIsPopulatingUsers] = useState(false);
  const [populationResult, setPopulationResult] = useState<string | null>(null);

  // View Training Dialog State
  const [viewTrainingDialogOpen, setViewTrainingDialogOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<TrainingTemplate | null>(null);

  // Video Player State
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');

  // Day Filter State
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  // Sync team settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      await syncTeamSettingsFromBackend();
      const settings = getTeamSettings();
      setTeamSettings(settings);
      setSeasonPhase(settings.seasonPhase);
      setTeamLevel(settings.teamLevel);
      setTeamApiKey(settings.aiApiKey || '');
    };
    loadSettings();
  }, []);

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Load exercises from backend on mount
  React.useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await exerciseService.getAll() as Exercise[];
        setExercises(data);
      } catch (error) {
        console.error('Error loading exercises:', error);
        // Start with empty array if API fails
        setExercises([]);
        alert('Failed to load exercises from server. Please refresh the page.');
      }
    };
    loadExercises();
  }, []);

  // Load exercise categories from backend on mount
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await exerciseCategoryService.getActive();
        setExerciseCategories(data);
      } catch (error) {
        console.error('Error loading exercise categories:', error);
        // Fallback to empty array
        setExerciseCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Load templates from backend on mount
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await templateService.getAll() as TrainingTemplate[];
        setTemplates(data);
      } catch (error) {
        console.error('Error loading templates:', error);
        // Start with empty array - no localStorage fallback to avoid ID conflicts
        setTemplates([]);
      }
    };
    loadTemplates();
  }, []);

  // Load assignments from backend on mount
  React.useEffect(() => {
    const loadAssignments = async () => {
      try {
        const data = await assignmentService.getAll() as TrainingAssignment[];
        setAssignments(data);
      } catch (error) {
        console.error('Error loading assignments:', error);
        // Start with empty array if API fails
        setAssignments([]);
      }
    };
    loadAssignments();
  }, []);

  // Load team sessions from service on mount
  React.useEffect(() => {
    const loadTeamSessions = async () => {
      const teamSessions = await getTeamSessions();
      const adminSessions: TeamSession[] = teamSessions.map(ts => ({
        id: ts.id,
        date: ts.date,
        startTime: ts.time,
        endTime: calculateEndTime(ts.time, 120), // Default 2 hours
        type: ts.title,
        location: ts.location,
        address: ts.address,
      }));
      setSessions(adminSessions);
    };
    loadTeamSessions();
  }, []);

  // Policies Management State
  const [policies, setPolicies] = useState<Policy>({
    maxFreeSessionsPerDay: 2,
    maxFreeSharePctPerWeek: 40,
    allowedCategories: ['Strength', 'Speed', 'Conditioning', 'Mobility', 'Recovery'],
  });
  const [policiesModified, setPoliciesModified] = useState(false);

  // Training Types Management State
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
  const [trainingTypeDialogOpen, setTrainingTypeDialogOpen] = useState(false);
  const [editingTrainingType, setEditingTrainingType] = useState<TrainingType | null>(null);
  const [newTrainingType, setNewTrainingType] = useState<Partial<TrainingType>>({
    key: '',
    nameEN: '',
    nameDE: '',
    season: 'off-season',
    active: true,
  });

  // Load training types from backend on mount
  React.useEffect(() => {
    const loadTrainingTypes = async () => {
      try {
        const data = await trainingTypeService.getAll() as TrainingType[];
        setTrainingTypes(data);
      } catch (error) {
        console.error('Error loading training types:', error);
        setTrainingTypes([]);
      }
    };
    loadTrainingTypes();
  }, []);

  // Training Builder State
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);
  const [newTemplateData, setNewTemplateData] = useState<{
    trainingTypeId: string;
    positions: Position[];
    durationWeeks: number;
    frequencyPerWeek: string;
    weeklyNotes?: string;
    blocks: {
      title: string;
      order: number;
      dayOfWeek?: string;
      dayNumber?: number;
      sessionName?: string;
      exerciseIds: string[];
      globalSets?: number;
      exerciseConfigs?: { exerciseId: string; sets?: number }[];
    }[];
  }>({
    trainingTypeId: '',
    positions: ['RB'],
    durationWeeks: 8,
    frequencyPerWeek: '2-3',
    weeklyNotes: '',
    blocks: [],
  });
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [currentBlock, setCurrentBlock] = useState<{
    title: string;
    dayOfWeek?: string;
    dayNumber?: number;
    sessionName?: string;
    exerciseIds: string[];
    globalSets?: number;
    exerciseConfigs?: { exerciseId: string; sets?: number }[];
  }>({
    title: '',
    dayOfWeek: undefined,
    dayNumber: undefined,
    sessionName: '',
    exerciseIds: [],
    globalSets: undefined,
    exerciseConfigs: [],
  });

  // Assignment State
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignToAllPlayers, setAssignToAllPlayers] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TrainingAssignment | null>(null);
  const [newAssignment, setNewAssignment] = useState<{
    templateId: string;
    playerIds: string[];
    startDate: string;
  }>({
    templateId: '',
    playerIds: [],
    startDate: new Date().toISOString().split('T')[0],
  });
  // Load users (players) from backend
  const [users, setUsers] = useState<any[]>([]);

  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await userService.getAllUsers() as any[];
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      }
    };
    loadUsers();
  }, []);

  // Filter only players for assignments
  const players = users.filter((u: any) => u.role === 'player');

  // Load block info from backend
  const [blockInfo, setBlockInfo] = useState<any[]>([]);

  React.useEffect(() => {
    const loadBlockInfo = async () => {
      try {
        const data = await getAllBlockInfo();
        setBlockInfo(data);
      } catch (error) {
        console.error('Error loading block info:', error);
        setBlockInfo([]);
      }
    };
    loadBlockInfo();
  }, []);

  // Exercise Management Handlers
  const handleOpenExerciseDialog = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setNewExercise(exercise);
    } else {
      setEditingExercise(null);
      setNewExercise({
        name: '',
        category: 'Strength',
        muscleGroups: [],
        isGlobal: true,
        youtubeUrl: '',
      });
    }
    setExerciseDialogOpen(true);
  };

  const handleSaveExercise = async () => {
    try {
      if (editingExercise) {
        // Update existing
        const updated = await exerciseService.update(editingExercise.id, newExercise) as Exercise;
        setExercises(exercises.map(ex =>
          ex.id === editingExercise.id ? updated : ex
        ));
        toastService.updated('Exercise');
      } else {
        // Create new
        const created = await exerciseService.create({
          name: newExercise.name!,
          category: newExercise.category!,
          muscleGroups: newExercise.muscleGroups || [],
          isGlobal: true,
          positionTags: [], // Empty array - exercises are universal
          youtubeUrl: newExercise.youtubeUrl,
          descriptionEN: newExercise.descriptionEN,
          descriptionDE: newExercise.descriptionDE,
        }) as Exercise;
        setExercises([...exercises, created]);
        toastService.created('Exercise');
      }
      setExerciseDialogOpen(false);
      setEditingExercise(null);
      setNewExercise({
        name: '',
        category: 'Strength',
        muscleGroups: [],
        isGlobal: true,
        youtubeUrl: '',
        trainingTypes: [],
      });
    } catch (error) {
      console.error('Error saving exercise:', error);
      toastService.createError('exercise', error instanceof Error ? error.message : undefined);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        await exerciseService.delete(id);
        setExercises(exercises.filter(ex => ex.id !== id));
        toastService.deleted('Exercise');
      } catch (error) {
        console.error('Error deleting exercise:', error);
        toastService.deleteError('exercise', error instanceof Error ? error.message : undefined);
      }
    }
  };

  // Sessions Management Handlers
  const handleSaveSession = async () => {
    const currentUser = getUser();
    if (!currentUser) return;

    try {
      // Create team session in unified service
      const createdSession = await createSession({
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        sessionCategory: 'team',
        type: 'coach-plan',
        title: newSession.type!,
        location: newSession.location || 'TBD',
        address: newSession.address,
        date: newSession.date!,
        time: newSession.startTime!,
        description: `Team training from ${newSession.startTime} to ${newSession.endTime}`,
        attendees: [],
      });

      // Update local admin state
      const session: TeamSession = {
        id: createdSession.id,
        date: newSession.date!,
        startTime: newSession.startTime!,
        endTime: newSession.endTime!,
        type: newSession.type!,
        location: newSession.location,
        address: newSession.address,
      };
      setSessions([...sessions, session].sort((a, b) => a.date.localeCompare(b.date)));

      // Send notification about new session
      const sessionDate = new Date(session.date);
      const formattedDate = sessionDate.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const notificationTitle = t('notifications.newTeamSession.title');
      const notificationBody = t('notifications.newTeamSession.body')
        .replace('{date}', formattedDate)
        .replace('{time}', session.startTime)
        .replace('{location}', session.location || '');

      await NotificationTemplates.newTeamSession(notificationTitle, notificationBody);

      toastService.created('Team Session');

      setSessionDialogOpen(false);
      setNewSession({
        date: new Date().toISOString().split('T')[0],
        startTime: '19:00',
        endTime: '21:00',
        type: 'Team Training',
        location: '',
        address: '',
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toastService.createError('session', error instanceof Error ? error.message : undefined);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        // Delete from unified service
        await deleteSession(id);
        // Update local admin state
        setSessions(sessions.filter(s => s.id !== id));
        toastService.deleted('Team Session');
      } catch (error) {
        console.error('Error deleting session:', error);
        toastService.deleteError('session', error instanceof Error ? error.message : undefined);
      }
    }
  };

  // Team Settings Handlers
  const handleSaveTeamSettings = async () => {
    if (!user) return;

    try {
      const updated = await updateTeamSettings(seasonPhase, teamLevel, user.name);
      setTeamSettings(updated);
      setSettingsSaved(true);
      toastService.updated('Team Settings');

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSettingsSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save team settings:', error);
      toastService.updateError('team settings', error instanceof Error ? error.message : undefined);
    }
  };

  // AI Coach Configuration Handlers
  const handleTestAPIKey = async () => {
    if (!teamApiKey.trim()) {
      setApiKeyValidationResult({ valid: false, error: 'Please enter an API key' });
      return;
    }

    setApiKeyValidating(true);
    setApiKeyValidationResult(null);

    const result = await validateAPIKey(teamApiKey.trim());
    setApiKeyValidationResult(result);
    setApiKeyValidating(false);
  };

  const handleSaveAICoachConfig = () => {
    if (!user) return;

    try {
      // Get current team settings
      const currentSettings = getTeamSettings();

      // Update with new API key
      const updatedSettings = {
        ...currentSettings,
        aiApiKey: teamApiKey.trim() || undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: user.name,
      };

      // Save to localStorage
      localStorage.setItem('teamSettings', JSON.stringify(updatedSettings));
      setTeamSettings(updatedSettings);
      setAiCoachSaved(true);
      toastService.updated('AI Coach Configuration');

      // Clear validation result and show success
      setApiKeyValidationResult(null);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setAiCoachSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save AI coach config:', error);
      toastService.updateError('AI coach configuration', error instanceof Error ? error.message : undefined);
    }
  };

  // User Population Handlers
  const handlePopulateUsers = async () => {
    if (!window.confirm('This will populate the database with mock users. Continue?')) {
      return;
    }

    setIsPopulatingUsers(true);
    setPopulationResult(null);

    try {
      const response = await fetch('/api/admin/populate-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setPopulationResult(`Success! Created/updated ${result.results.length} users. Total: ${result.summary.totalUsers} users (${result.summary.players} players, ${result.summary.coaches} coaches).`);
      } else {
        setPopulationResult(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Population error:', error);
      setPopulationResult(`Error: Failed to populate users`);
    } finally {
      setIsPopulatingUsers(false);
      
      // Clear result after 10 seconds
      setTimeout(() => {
        setPopulationResult(null);
      }, 10000);
    }
  };

  // Policies Management Handlers
  const handleSavePolicies = () => {
    try {
      // In real app, would save to backend
      setPoliciesModified(false);
      toastService.updated('Policies');
    } catch (error) {
      console.error('Failed to save policies:', error);
      toastService.updateError('policies', error instanceof Error ? error.message : undefined);
    }
  };

  // Training Types Management Handlers
  const handleSaveTrainingType = async () => {
    try {
      // Generate key from nameEN if key is empty
      let generatedKey: string;
      if (newTrainingType.key) {
        // User provided a custom key - sanitize it
        generatedKey = newTrainingType.key
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
      } else {
        // Auto-generate from nameEN
        generatedKey = newTrainingType.nameEN!
          .toLowerCase()
          .trim()
          .replace(/\s*&\s*/g, '_') // Replace " & " with "_"
          .replace(/\s+/g, '_')       // Replace spaces with "_"
          .replace(/[^a-z0-9_]/g, '') // Remove special chars
          .replace(/_+/g, '_');       // Remove duplicate underscores
      }

      const data = {
        key: generatedKey,
        nameEN: newTrainingType.nameEN!,
        nameDE: newTrainingType.nameDE!,
        season: newTrainingType.season!,
        active: newTrainingType.active ?? true,
      };

      if (editingTrainingType) {
        const updated = await trainingTypeService.update(editingTrainingType.id, data) as TrainingType;
        setTrainingTypes(trainingTypes.map(tt => tt.id === editingTrainingType.id ? updated : tt));
        toastService.updated('Training Type');
      } else {
        const created = await trainingTypeService.create(data) as TrainingType;
        setTrainingTypes([...trainingTypes, created]);
        toastService.created('Training Type');
      }

      setTrainingTypeDialogOpen(false);
      setEditingTrainingType(null);
      setNewTrainingType({
        key: '',
        nameEN: '',
        nameDE: '',
        season: 'off-season',
        active: true,
      });
    } catch (error) {
      console.error('Error saving training type:', error);
      toastService.createError('training type', error instanceof Error ? error.message : undefined);
    }
  };

  const handleToggleTrainingType = async (id: string) => {
    try {
      const trainingType = trainingTypes.find(tt => tt.id === id);
      if (!trainingType) return;

      const updated = await trainingTypeService.update(id, {
        active: !trainingType.active,
      }) as TrainingType;
      setTrainingTypes(trainingTypes.map(tt => tt.id === id ? updated : tt));
      toastService.updated('Training Type');
    } catch (error) {
      console.error('Error toggling training type:', error);
      toastService.updateError('training type', error instanceof Error ? error.message : undefined);
    }
  };

  const handleEditTrainingType = (trainingType: TrainingType) => {
    setEditingTrainingType(trainingType);
    setNewTrainingType({
      key: trainingType.key,
      nameEN: trainingType.nameEN,
      nameDE: trainingType.nameDE,
      season: trainingType.season,
      active: trainingType.active,
    });
    setTrainingTypeDialogOpen(true);
  };

  const handleDeleteTrainingType = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this training type?')) {
      try {
        await trainingTypeService.delete(id);
        setTrainingTypes(trainingTypes.filter(tt => tt.id !== id));
        toastService.deleted('Training Type');
      } catch (error) {
        console.error('Error deleting training type:', error);
        toastService.deleteError('training type', error instanceof Error ? error.message : undefined);
      }
    }
  };

  // Training Builder Handlers
  const handleOpenTemplateDialog = (template?: TrainingTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setNewTemplateData({
        trainingTypeId: template.trainingTypeId,
        positions: template.positions || ['RB'],
        durationWeeks: template.durationWeeks || 8,
        frequencyPerWeek: template.frequencyPerWeek || '2-3',
        weeklyNotes: template.weeklyNotes || '',
        blocks: template.blocks?.map(b => {
          // Blocks can have 'exercises' or 'items' depending on the source
          const exerciseList = (b as any).exercises || (b as any).items || [];
          return {
            title: b.title,
            order: b.order,
            dayOfWeek: (b as any).dayOfWeek,
            dayNumber: (b as any).dayNumber,
            sessionName: (b as any).sessionName,
            exerciseIds: exerciseList.map((ex: any) => ex.id),
            globalSets: (b as any).globalSets,
            exerciseConfigs: (b as any).exerciseConfigs,
          };
        }) || [],
      });
    } else {
      setEditingTemplate(null);
      setNewTemplateData({
        trainingTypeId: trainingTypes[0]?.id || '',
        positions: ['RB'],
        durationWeeks: 8,
        frequencyPerWeek: '2-3',
        weeklyNotes: '',
        blocks: [],
      });
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      // Convert exerciseIds to full Exercise objects
      const blocksWithItems = newTemplateData.blocks.map(block => {
        const items = block.exerciseIds
          .map(id => exercises.find(ex => ex.id === id))
          .filter(Boolean) as Exercise[];

        return {
          order: block.order,
          title: block.title,
          items: items,
          dayNumber: block.dayNumber,
          dayOfWeek: block.dayOfWeek,
          sessionName: block.sessionName,
          globalSets: block.globalSets,
          exerciseConfigs: block.exerciseConfigs,
        };
      });

      // Find training type name for the template name
      const selectedTrainingType = trainingTypes.find(tt => tt.id === newTemplateData.trainingTypeId);
      const trainingTypeName = selectedTrainingType?.nameEN || 'Training';

      // Convert local template structure to backend format
      const templateData = {
        name: `${newTemplateData.positions.join(', ')} - ${trainingTypeName}`,
        trainingType: newTemplateData.trainingTypeId,
        position: newTemplateData.positions.length === 1 ? newTemplateData.positions[0] : null, // Legacy
        positions: newTemplateData.positions, // New: array of positions
        season: 'off-season' as 'off-season' | 'in-season' | 'pre-season',
        durationWeeks: newTemplateData.durationWeeks,
        frequencyPerWeek: newTemplateData.frequencyPerWeek,
        weeklyNotes: newTemplateData.weeklyNotes || '',
        blocks: blocksWithItems,
        isActive: true,
      };

      if (editingTemplate) {
        const updated = await templateService.update(editingTemplate.id, templateData) as TrainingTemplate;
        setTemplates(templates.map(t => t.id === editingTemplate.id ? updated : t));
        toastService.updated('Template');
      } else {
        const created = await templateService.create(templateData) as TrainingTemplate;
        setTemplates([...templates, created]);
        toastService.created('Template');
      }
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toastService.createError('template', error instanceof Error ? error.message : undefined);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templateService.delete(id);
        setTemplates(templates.filter(t => t.id !== id));
        toastService.deleted('Template');
      } catch (error) {
        console.error('Error deleting template:', error);
        toastService.deleteError('template', error instanceof Error ? error.message : undefined);
      }
    }
  };

  const handleAddBlock = () => {
    setEditingBlockIndex(null);
    setCurrentBlock({
      title: '',
      dayOfWeek: undefined,
      dayNumber: undefined,
      sessionName: '',
      exerciseIds: [],
      globalSets: undefined,
      exerciseConfigs: [],
    });
    setExerciseSearchQuery(''); // Reset search
    setBlockDialogOpen(true);
  };

  const handleEditBlock = (index: number) => {
    setEditingBlockIndex(index);
    const block = newTemplateData.blocks[index];
    setCurrentBlock({
      title: block.title,
      dayOfWeek: block.dayOfWeek,
      dayNumber: block.dayNumber,
      sessionName: block.sessionName,
      exerciseIds: block.exerciseIds,
      globalSets: block.globalSets,
      exerciseConfigs: block.exerciseConfigs || [],
    });
    setExerciseSearchQuery(''); // Reset search
    setBlockDialogOpen(true);
  };

  const handleSaveBlock = () => {
    if (editingBlockIndex !== null) {
      // Update existing block
      const updatedBlocks = [...newTemplateData.blocks];
      updatedBlocks[editingBlockIndex] = {
        ...updatedBlocks[editingBlockIndex],
        title: currentBlock.title,
        dayOfWeek: currentBlock.dayOfWeek,
        dayNumber: currentBlock.dayNumber,
        sessionName: currentBlock.sessionName,
        exerciseIds: currentBlock.exerciseIds,
        globalSets: currentBlock.globalSets,
        exerciseConfigs: currentBlock.exerciseConfigs,
      };
      setNewTemplateData({
        ...newTemplateData,
        blocks: updatedBlocks,
      });
    } else {
      // Add new block
      const newBlock = {
        title: currentBlock.title,
        order: newTemplateData.blocks.length + 1,
        dayOfWeek: currentBlock.dayOfWeek,
        dayNumber: currentBlock.dayNumber,
        sessionName: currentBlock.sessionName,
        exerciseIds: currentBlock.exerciseIds,
        globalSets: currentBlock.globalSets,
        exerciseConfigs: currentBlock.exerciseConfigs,
      };
      setNewTemplateData({
        ...newTemplateData,
        blocks: [...newTemplateData.blocks, newBlock],
      });
    }
    setBlockDialogOpen(false);
    setEditingBlockIndex(null);
  };

  const handleRemoveBlock = (index: number) => {
    const updated = newTemplateData.blocks.filter((_, i) => i !== index);
    setNewTemplateData({
      ...newTemplateData,
      blocks: updated.map((b, i) => ({ ...b, order: i + 1 })),
    });
  };

  // Assignment Handlers
  const getPlayersForTemplate = (templateId: string): string[] => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !template.positions) return [];

    return players
      .filter((player: any) => template.positions?.includes(player.position))
      .map((player: any) => player.id);
  };

  const handleOpenAssignDialog = (assignment?: TrainingAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setNewAssignment({
        templateId: assignment.templateId,
        playerIds: assignment.playerIds,
        startDate: assignment.startDate,
      });
    } else {
      setEditingAssignment(null);
      setNewAssignment({
        templateId: '',
        playerIds: [],
        startDate: new Date().toISOString().split('T')[0],
      });
    }
    setAssignDialogOpen(true);
  };

  const handleSaveAssignment = async () => {
    const currentUser = getUser();
    if (!currentUser) return;

    try {
      const playerIds = assignToAllPlayers
        ? getPlayersForTemplate(newAssignment.templateId)
        : newAssignment.playerIds;

      // Get the template
      const template = templates.find(t => t.id === newAssignment.templateId);
      if (!template) {
        alert('Template not found!');
        return;
      }

      // Calculate end date based on template duration
      const startDate = new Date(newAssignment.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (template.durationWeeks * 7));

      // Create ONE assignment with multiple players
      const assignmentData = {
        templateId: newAssignment.templateId,
        playerIds: playerIds,
        startDate: newAssignment.startDate,
        endDate: endDate.toISOString().split('T')[0],
        active: true,
      };

      if (editingAssignment) {
        await assignmentService.update(editingAssignment.id, assignmentData);
        toastService.updated('Assignment');
      } else {
        await assignmentService.create(assignmentData);
        toastService.created('Assignment');
      }

      // Reload assignments
      const updatedAssignments = await assignmentService.getAll() as TrainingAssignment[];
      setAssignments(updatedAssignments);

      setAssignDialogOpen(false);
      setAssignToAllPlayers(false);
      setEditingAssignment(null);
      setNewAssignment({
        templateId: '',
        playerIds: [],
        startDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error saving assignment:', error);
      toastService.createError('assignment', error instanceof Error ? error.message : undefined);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await assignmentService.delete(id);
        setAssignments(assignments.filter(a => a.id !== id));
        toastService.deleted('Assignment');
      } catch (error) {
        console.error('Error deleting assignment:', error);
        toastService.deleteError('assignment', error instanceof Error ? error.message : undefined);
      }
    }
  };

  const positions: Position[] = ['RB', 'WR', 'LB', 'OL', 'DB', 'QB', 'DL', 'TE', 'K/P'];

  // Helper function to group blocks by session within a day
  const groupBlocksBySession = (blocks: typeof newTemplateData.blocks) => {
    const grouped = new Map<string, typeof newTemplateData.blocks>();

    blocks.forEach(block => {
      const sessionKey = block.sessionName || '_default';
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

  // Helper function to group blocks by day
  const groupBlocksByDay = (blocks: typeof newTemplateData.blocks) => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const grouped = new Map<number, typeof newTemplateData.blocks>();
    const unscheduled: typeof newTemplateData.blocks = [];

    blocks.forEach(block => {
      const dayNum = block.dayNumber;
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
        sessions: groupBlocksBySession(dayBlocks)
      }));

    return { dayGroups, unscheduled };
  };

  // Filter exercises based on training type
  const getFilteredExercises = (trainingTypeId: string): Exercise[] => {
    const trainingType = trainingTypes.find(tt => tt.id === trainingTypeId);
    if (!trainingType) return exercises;

    const key = trainingType.key.toLowerCase();

    // Strength & Conditioning: Strength, Plyometrics, Conditioning, Mobility, Recovery
    if (key.includes('strength') || key.includes('conditioning')) {
      return exercises.filter(ex => {
        const categoryLower = ex.category.toLowerCase();
        return ['strength', 'plyometrics', 'conditioning', 'mobility', 'recovery'].includes(categoryLower);
      });
    }

    // Sprints / Speed: Speed, COD, Technique, Conditioning, Mobility, Recovery
    if (key.includes('sprint') || key.includes('speed')) {
      return exercises.filter(ex => {
        const categoryLower = ex.category.toLowerCase();
        return ['speed', 'cod', 'technique', 'conditioning', 'mobility', 'recovery'].includes(categoryLower);
      });
    }

    // Default: show all exercises from backend
    return exercises;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src={RhinosLogo}
            alt="Rhinos Logo"
            sx={{
              width: 50,
              height: 50,
              objectFit: 'contain',
            }}
          />
          <Typography variant="h4">
            {t('admin.title')}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          v1.0.3-notifications
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t('admin.coachOnlyAccess')}
      </Alert>

      <Grid container spacing={3}>
        {/* Left Sidebar Menu */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ position: 'sticky', top: 16 }}>
            <List component="nav">
              {/* Exercises Menu */}
              <ListItemButton onClick={() => setExercisesMenuOpen(!exercisesMenuOpen)}>
                <ListItemIcon><FitnessCenterIcon /></ListItemIcon>
                <ListItemText primary="Exercises" />
                {exercisesMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={exercisesMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 2} onClick={() => setActiveTab(2)}>
                    <ListItemText primary={t('admin.exercisesTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 3} onClick={() => setActiveTab(3)}>
                    <ListItemText primary={t('admin.exerciseCategoriesTab')} />
                  </ListItemButton>
                </List>
              </Collapse>

              <Divider />

              {/* Training Menu */}
              <ListItemButton onClick={() => setTrainingMenuOpen(!trainingMenuOpen)}>
                <ListItemIcon><CategoryIcon /></ListItemIcon>
                <ListItemText primary="Training" />
                {trainingMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={trainingMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 0} onClick={() => setActiveTab(0)}>
                    <ListItemText primary={t('admin.trainingBuilderTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 1} onClick={() => setActiveTab(1)}>
                    <ListItemText primary="Assign Programs" />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 5} onClick={() => setActiveTab(5)}>
                    <ListItemText primary={t('admin.trainingTypesTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 7} onClick={() => setActiveTab(7)}>
                    <ListItemText primary={t('admin.blockInfoTab')} />
                  </ListItemButton>
                </List>
              </Collapse>

              <Divider />

              {/* Team Menu */}
              <ListItemButton onClick={() => setTeamMenuOpen(!teamMenuOpen)}>
                <ListItemIcon><GroupsIcon /></ListItemIcon>
                <ListItemText primary="Team" />
                {teamMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={teamMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 4} onClick={() => setActiveTab(4)}>
                    <ListItemText primary={t('admin.sessionsTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 6} onClick={() => setActiveTab(6)}>
                    <ListItemText primary={t('admin.policiesTab')} />
                  </ListItemButton>
                </List>
              </Collapse>

              <Divider />

              {/* Resources Menu */}
              <ListItemButton onClick={() => setResourcesMenuOpen(!resourcesMenuOpen)}>
                <ListItemIcon><LibraryBooksIcon /></ListItemIcon>
                <ListItemText primary="Resources" />
                {resourcesMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={resourcesMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 11} onClick={() => setActiveTab(11)}>
                    <ListItemText primary={t('admin.drillbookTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 13} onClick={() => setActiveTab(13)}>
                    <ListItemText primary={t('admin.drillCategoriesTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 12} onClick={() => setActiveTab(12)}>
                    <ListItemText primary={t('admin.equipmentTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 15} onClick={() => setActiveTab(15)}>
                    <ListItemText primary={t('nav.videosAdmin')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 14} onClick={() => setActiveTab(14)}>
                    <ListItemText primary="Video Tags" />
                  </ListItemButton>
                </List>
              </Collapse>

              <Divider />

              {/* System Menu */}
              <ListItemButton onClick={() => setSystemMenuOpen(!systemMenuOpen)}>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="System" />
                {systemMenuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={systemMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 8} onClick={() => setActiveTab(8)}>
                    <ListItemText primary={t('admin.teamSettingsTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 9} onClick={() => setActiveTab(9)}>
                    <ListItemText primary={t('admin.aiCoachTab')} />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: 4 }} selected={activeTab === 10} onClick={() => setActiveTab(10)}>
                    <ListItemText primary={t('admin.pointsSystemTab')} />
                  </ListItemButton>
                </List>
              </Collapse>
            </List>
          </Paper>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={9}>

      {/* Training Builder Tab */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {t('admin.trainingTemplates')} ({templates.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenTemplateDialog()}
            >
              {t('admin.createTemplate')}
            </Button>
          </Box>

          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          <Typography variant="h6">
                            {template.trainingTypeName}
                          </Typography>
                          {template.positions?.map((pos) => (
                            <Chip key={pos} label={pos} size="small" color="primary" />
                          ))}
                          <Chip
                            label={template.active ? 'Active' : 'Inactive'}
                            size="small"
                            color={template.active ? 'success' : 'default'}
                          />
                        </Box>

                        {template.durationWeeks && template.frequencyPerWeek && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {template.durationWeeks} weeks • {template.frequencyPerWeek}x/week
                          </Typography>
                        )}

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {template.blocks.length} block(s)
                        </Typography>

                        {/* Group blocks by day */}
                        {(() => {
                          const blocksByDay: Record<string, any[]> = {};
                          template.blocks.forEach((block: any) => {
                            const day = block.dayOfWeek || block.dayNumber?.toString() || 'Unassigned';
                            if (!blocksByDay[day]) {
                              blocksByDay[day] = [];
                            }
                            blocksByDay[day].push(block);
                          });

                          const days = Object.keys(blocksByDay).sort();

                          return days.map((day) => (
                            <Box key={day} sx={{ mb: 1.5 }}>
                              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ display: 'block', mb: 0.5 }}>
                                {day}
                              </Typography>
                              {blocksByDay[day].map((block: any, idx: number) => (
                                <Box key={block.id} sx={{ ml: 1, mb: 0.5 }}>
                                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                                    • {block.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5 }}>
                                    {((block as any).exercises?.length || (block as any).items?.length || 0)} exercise(s)
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ));
                        })()}
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => {
                            setViewingTemplate(template);
                            setViewTrainingDialogOpen(true);
                          }}
                          title="View Training Details"
                        >
                          <SearchIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenTemplateDialog(template)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Assign Programs Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Assign Programs ({assignments.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAssignDialog()}
            >
              Assign Program
            </Button>
          </Box>

          <Grid container spacing={2}>
            {assignments.map((assignment) => {
              const template = templates.find(t => t.id === assignment.templateId);
              // Handle both playerIds array (new) and playerId singular (old)
              const playerIdsArray = (assignment as any).playerIds || [(assignment as any).playerId];
              const assignedPlayers = players.filter((p: any) => playerIdsArray && playerIdsArray.includes(p.id));

              return (
                <Grid item xs={12} md={6} key={assignment.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {template?.trainingTypeName || 'Unknown Template'}
                          </Typography>

                          {template && template.durationWeeks && template.frequencyPerWeek && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {template.durationWeeks} weeks • {template.frequencyPerWeek}x/week
                            </Typography>
                          )}

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {assignment.startDate} → {assignment.endDate}
                          </Typography>

                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Players ({assignedPlayers.length}):
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {assignedPlayers.map((player: any) => (
                                <Chip
                                  key={player.id}
                                  label={`#${player.jerseyNumber} ${player.name}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>

                          <Chip
                            label={assignment.active ? 'Active' : 'Inactive'}
                            size="small"
                            color={assignment.active ? 'success' : 'default'}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenAssignDialog(assignment)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Exercises Management Tab */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {t('admin.exerciseCatalog')} ({(() => {
                const filtered = exercises.filter(ex => {
                  // Search filter (name and category)
                  if (exerciseSearchQuery) {
                    const searchLower = exerciseSearchQuery.toLowerCase();
                    const nameMatch = ex.name.toLowerCase().includes(searchLower);
                    const categoryMatch = ex.category.toLowerCase().includes(searchLower);
                    if (!nameMatch && !categoryMatch) {
                      return false;
                    }
                  }
                  // Muscle group filter
                  if (exerciseMuscleGroupFilter !== 'all' && !ex.muscleGroups?.includes(exerciseMuscleGroupFilter)) {
                    return false;
                  }
                  return true;
                });
                return filtered.length;
              })()} {t('admin.exercises')})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenExerciseDialog()}
            >
              {t('admin.addExercise')}
            </Button>
          </Box>

          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name or category..."
                value={exerciseSearchQuery}
                onChange={(e) => {
                  setExerciseSearchQuery(e.target.value);
                  setExercisePage(0); // Reset to first page
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Muscle Group</InputLabel>
                <Select
                  value={exerciseMuscleGroupFilter}
                  label="Muscle Group"
                  onChange={(e) => {
                    setExerciseMuscleGroupFilter(e.target.value as MuscleGroup | 'all');
                    setExercisePage(0); // Reset to first page
                  }}
                >
                  <MenuItem value="all">All Muscle Groups</MenuItem>
                  <MenuItem value="legs">Legs</MenuItem>
                  <MenuItem value="chest">Chest</MenuItem>
                  <MenuItem value="back">Back</MenuItem>
                  <MenuItem value="shoulders">Shoulders</MenuItem>
                  <MenuItem value="arms">Arms</MenuItem>
                  <MenuItem value="core">Core</MenuItem>
                  <MenuItem value="full-body">Full Body</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Video</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exercises
                  .filter(ex => {
                    // Search filter (name and category)
                    if (exerciseSearchQuery) {
                      const searchLower = exerciseSearchQuery.toLowerCase();
                      const nameMatch = ex.name.toLowerCase().includes(searchLower);
                      const categoryMatch = ex.category.toLowerCase().includes(searchLower);
                      if (!nameMatch && !categoryMatch) {
                        return false;
                      }
                    }
                    // Muscle group filter
                    if (exerciseMuscleGroupFilter !== 'all' && !ex.muscleGroups?.includes(exerciseMuscleGroupFilter)) {
                      return false;
                    }
                    return true;
                  })
                  .slice(exercisePage * exercisesPerPage, (exercisePage + 1) * exercisesPerPage)
                  .map((exercise) => {
                    // Extract YouTube video ID from URL
                    const getYouTubeVideoId = (url: string) => {
                      if (!url) return null;
                      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/);
                      return match ? match[1] : null;
                    };

                    const videoId = getYouTubeVideoId(exercise.youtubeUrl || '');
                    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

                    return (
                      <TableRow key={exercise.id}>
                        <TableCell>{exercise.name}</TableCell>
                        <TableCell>
                          <Chip label={exercise.category} size="small" />
                        </TableCell>
                        <TableCell>
                          {exercise.youtubeUrl ? (
                            thumbnailUrl ? (
                              <Box
                                component="img"
                                src={thumbnailUrl}
                                alt={exercise.name}
                                sx={{
                                  width: 120,
                                  height: 68,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  '&:hover': {
                                    opacity: 0.8,
                                    boxShadow: 2,
                                  }
                                }}
                                onClick={() => window.open(exercise.youtubeUrl, '_blank')}
                                onError={(e) => {
                                  // If thumbnail fails to load, show broken indicator
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const parent = (e.target as HTMLElement).parentElement;
                                  if (parent) {
                                    const chip = document.createElement('div');
                                    chip.textContent = '❌ Video not found';
                                    chip.style.color = 'red';
                                    chip.style.fontSize = '12px';
                                    chip.style.fontWeight = 'bold';
                                    parent.appendChild(chip);
                                  }
                                }}
                              />
                            ) : (
                              <Chip label="Invalid URL" size="small" color="warning" />
                            )
                          ) : (
                            <Chip label="No video" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenExerciseDialog(exercise)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteExercise(exercise.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {(() => {
                const filtered = exercises.filter(ex => {
                  // Search filter (name and category)
                  if (exerciseSearchQuery) {
                    const searchLower = exerciseSearchQuery.toLowerCase();
                    const nameMatch = ex.name.toLowerCase().includes(searchLower);
                    const categoryMatch = ex.category.toLowerCase().includes(searchLower);
                    if (!nameMatch && !categoryMatch) {
                      return false;
                    }
                  }
                  // Muscle group filter
                  if (exerciseMuscleGroupFilter !== 'all' && !ex.muscleGroups?.includes(exerciseMuscleGroupFilter)) {
                    return false;
                  }
                  return true;
                });
                const start = exercisePage * exercisesPerPage + 1;
                const end = Math.min((exercisePage + 1) * exercisesPerPage, filtered.length);
                return `${start}-${end} of ${filtered.length}`;
              })()} exercises
            </Typography>
            <Pagination
              count={Math.ceil(
                exercises.filter(ex => {
                  // Search filter (name and category)
                  if (exerciseSearchQuery) {
                    const searchLower = exerciseSearchQuery.toLowerCase();
                    const nameMatch = ex.name.toLowerCase().includes(searchLower);
                    const categoryMatch = ex.category.toLowerCase().includes(searchLower);
                    if (!nameMatch && !categoryMatch) {
                      return false;
                    }
                  }
                  // Muscle group filter
                  if (exerciseMuscleGroupFilter !== 'all' && !ex.muscleGroups?.includes(exerciseMuscleGroupFilter)) {
                    return false;
                  }
                  return true;
                }).length / exercisesPerPage
              )}
              page={exercisePage + 1}
              onChange={(_, page) => setExercisePage(page - 1)}
              color="primary"
            />
          </Box>
        </Box>
      )}

      {/* Exercise Categories Tab */}
      {activeTab === 3 && (
        <ExerciseCategoryManager />
      )}

      {/* Sessions Management Tab */}
      {activeTab === 4 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {t('admin.teamSessions')} ({sessions.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSessionDialogOpen(true)}
            >
              {t('admin.addSession')}
            </Button>
          </Box>

          <Grid container spacing={2}>
            {sessions.map((session) => {
              const sessionDate = new Date(session.date);
              const dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
              const formattedDate = sessionDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <Grid item xs={12} md={6} key={session.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6">
                            {dayName}
                          </Typography>
                          <Typography variant="body2" color="primary" sx={{ mb: 0.5 }}>
                            {formattedDate}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {session.startTime} - {session.endTime}
                          </Typography>
                          {session.location && (
                            <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                              {session.location}
                            </Typography>
                          )}
                          {session.address && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {session.address}
                            </Typography>
                          )}
                          <Chip label={session.type} size="small" sx={{ mt: 1 }} />
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Training Types Management Tab */}
      {activeTab === 5 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {t('admin.trainingTypes')} ({trainingTypes.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTrainingTypeDialogOpen(true)}
            >
              {t('admin.addTrainingType')}
            </Button>
          </Box>

          <Grid container spacing={2}>
            {trainingTypes.map((trainingType) => (
              <Grid item xs={12} md={6} key={trainingType.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6">
                            {trainingType.nameEN}
                          </Typography>
                          <Chip
                            label={trainingType.active ? 'Active' : 'Inactive'}
                            size="small"
                            color={trainingType.active ? 'success' : 'default'}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          DE: {trainingType.nameDE}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Key: {trainingType.key}
                        </Typography>
                        <Chip label={trainingType.season} size="small" sx={{ mt: 1 }} />
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditTrainingType(trainingType)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTrainingType(trainingType.id)}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Policies Management Tab */}
      {activeTab === 6 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('admin.trainingPolicies')}
          </Typography>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('admin.maxFreeSessionsPerDay')}
                  </Typography>
                  <TextField
                    type="number"
                    value={policies.maxFreeSessionsPerDay}
                    onChange={(e) => {
                      setPolicies({ ...policies, maxFreeSessionsPerDay: Number(e.target.value) });
                      setPoliciesModified(true);
                    }}
                    inputProps={{ min: 0, max: 10 }}
                    fullWidth
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('admin.maxFreeSharePctPerWeek')}
                  </Typography>
                  <TextField
                    type="number"
                    value={policies.maxFreeSharePctPerWeek}
                    onChange={(e) => {
                      setPolicies({ ...policies, maxFreeSharePctPerWeek: Number(e.target.value) });
                      setPoliciesModified(true);
                    }}
                    inputProps={{ min: 0, max: 100 }}
                    fullWidth
                    helperText="%"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('admin.allowedCategories')}
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      multiple
                      value={policies.allowedCategories}
                      onChange={(e) => {
                        setPolicies({ ...policies, allowedCategories: e.target.value as ExerciseCategory[] });
                        setPoliciesModified(true);
                      }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      }}
                    >
                      {exerciseCategories.map((cat) => (
                        <MenuItem key={cat.key || cat.name} value={cat.key || cat.name}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      Click outside or press ESC to close
                    </Typography>
                  </FormControl>
                </Box>

                {policiesModified && (
                  <Alert severity="warning">
                    {t('admin.unsavedChanges')}
                  </Alert>
                )}

                <Button
                  variant="contained"
                  onClick={handleSavePolicies}
                  disabled={!policiesModified}
                  fullWidth
                >
                  {t('admin.savePolicies')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Block Info Management Tab */}
      {activeTab === 7 && <BlockInfoManager />}

      {/* Team Settings Tab */}
      {activeTab === 8 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('teamSettings.title')}
          </Typography>

          {settingsSaved && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {t('teamSettings.settingsSaved')}
            </Alert>
          )}

          <Card>
            <CardContent>
              <Grid container spacing={3}>
                {/* Season Phase */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('teamSettings.seasonPhase')}</InputLabel>
                    <Select
                      value={seasonPhase}
                      label={t('teamSettings.seasonPhase')}
                      onChange={(e) => setSeasonPhase(e.target.value as SeasonPhase)}
                    >
                      <MenuItem value="off-season">
                        {t('teamSettings.phase.off-season')}
                      </MenuItem>
                      <MenuItem value="pre-season">
                        {t('teamSettings.phase.pre-season')}
                      </MenuItem>
                      <MenuItem value="in-season">
                        {t('teamSettings.phase.in-season')}
                      </MenuItem>
                      <MenuItem value="post-season">
                        {t('teamSettings.phase.post-season')}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t(`teamSettings.phaseDesc.${seasonPhase}`)}
                  </Typography>
                </Grid>

                {/* Team Level */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('teamSettings.teamLevel')}</InputLabel>
                    <Select
                      value={teamLevel}
                      label={t('teamSettings.teamLevel')}
                      onChange={(e) => setTeamLevel(e.target.value as TeamLevel)}
                    >
                      <MenuItem value="amateur">
                        {t('teamSettings.level.amateur')}
                      </MenuItem>
                      <MenuItem value="semi-pro">
                        {t('teamSettings.level.semi-pro')}
                      </MenuItem>
                      <MenuItem value="college">
                        {t('teamSettings.level.college')}
                      </MenuItem>
                      <MenuItem value="pro">
                        {t('teamSettings.level.pro')}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t(`teamSettings.levelDesc.${teamLevel}`)}
                  </Typography>
                </Grid>

                {/* Current Settings Display */}
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {t('teamSettings.currentConfig')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('teamSettings.seasonPhase')}:</strong> {t(`teamSettings.phase.${seasonPhase}`)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('teamSettings.teamLevel')}:</strong> {t(`teamSettings.level.${teamLevel}`)}
                    </Typography>
                    {teamSettings.updatedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Last updated by {teamSettings.updatedBy} on {new Date(teamSettings.updatedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Save Button */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveTeamSettings}
                      disabled={
                        seasonPhase === teamSettings.seasonPhase &&
                        teamLevel === teamSettings.teamLevel
                      }
                    >
                      {t('teamSettings.saveSettings')}
                    </Button>
                  </Box>
                </Grid>

                {/* Impact Info */}
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      {t('teamSettings.impact')}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Exercise Dialog */}
      <Dialog
        open={exerciseDialogOpen}
        onClose={() => setExerciseDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingExercise ? t('admin.editExercise') : t('admin.addExercise')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('admin.exerciseName')}
              value={newExercise.name}
              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>{t('admin.category')}</InputLabel>
              <Select
                value={newExercise.category}
                label={t('admin.category')}
                onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
              >
                {exerciseCategories.map((cat) => (
                  <MenuItem key={cat.key} value={cat.key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: cat.color,
                        }}
                      />
                      {cat.nameEN}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('muscleGroup.filter')}</InputLabel>
              <Select
                multiple
                value={newExercise.muscleGroups || []}
                label={t('muscleGroup.filter')}
                onChange={(e) => setNewExercise({ ...newExercise, muscleGroups: e.target.value as MuscleGroup[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as MuscleGroup[]).map((value) => (
                      <Chip key={value} label={t(`muscleGroup.${value}` as any)} size="small" />
                    ))}
                  </Box>
                )}
              >
                {(['legs', 'chest', 'back', 'shoulders', 'arms', 'core', 'full-body'] as MuscleGroup[]).map((group) => (
                  <MenuItem key={group} value={group}>
                    {t(`muscleGroup.${group}` as any)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={t('admin.youtubeUrl')}
              value={newExercise.youtubeUrl || ''}
              onChange={(e) => setNewExercise({ ...newExercise, youtubeUrl: e.target.value })}
              fullWidth
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExerciseDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSaveExercise}
            variant="contained"
            disabled={!newExercise.name}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Dialog */}
      <Dialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('admin.addSession')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('admin.date')}
              type="date"
              value={newSession.date}
              onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
            />

            <TextField
              label={t('admin.startTime')}
              type="time"
              value={newSession.startTime}
              onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label={t('admin.endTime')}
              type="time"
              value={newSession.endTime}
              onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label={t('admin.sessionType')}
              value={newSession.type}
              onChange={(e) => setNewSession({ ...newSession, type: e.target.value })}
              fullWidth
              required
              placeholder="Team Training, Practice, Game, etc."
            />

            <TextField
              label={t('admin.location')}
              value={newSession.location || ''}
              onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
              fullWidth
              placeholder="Sporthalle Nord, Main Stadium, etc."
              helperText={t('admin.locationHelper')}
            />

            <TextField
              label={t('admin.address')}
              value={newSession.address || ''}
              onChange={(e) => setNewSession({ ...newSession, address: e.target.value })}
              fullWidth
              placeholder="Frankfurt am Main, Sportplatz 1"
              helperText={t('admin.addressHelper')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSaveSession} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Training Type Dialog */}
      <Dialog
        open={trainingTypeDialogOpen}
        onClose={() => setTrainingTypeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingTrainingType ? t('admin.editTrainingType') : t('admin.addTrainingType')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('admin.trainingTypeNameEN')}
              value={newTrainingType.nameEN}
              onChange={(e) => setNewTrainingType({ ...newTrainingType, nameEN: e.target.value })}
              fullWidth
              required
              placeholder="Strength & Conditioning"
            />

            <TextField
              label={t('admin.trainingTypeNameDE')}
              value={newTrainingType.nameDE}
              onChange={(e) => setNewTrainingType({ ...newTrainingType, nameDE: e.target.value })}
              fullWidth
              required
              placeholder="Kraft & Kondition"
            />

            <TextField
              label="Key (for system integration)"
              value={newTrainingType.key}
              onChange={(e) => setNewTrainingType({ ...newTrainingType, key: e.target.value })}
              fullWidth
              placeholder="strength_conditioning"
              helperText="Use lowercase, underscores instead of spaces. Leave empty to auto-generate."
            />

            <FormControl fullWidth>
              <InputLabel>{t('admin.season')}</InputLabel>
              <Select
                value={newTrainingType.season}
                label={t('admin.season')}
                onChange={(e) => setNewTrainingType({ ...newTrainingType, season: e.target.value as any })}
              >
                <MenuItem value="off-season">Off-Season</MenuItem>
                <MenuItem value="pre-season">Pre-Season</MenuItem>
                <MenuItem value="in-season">In-Season</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info">
              {newTrainingType.key
                ? `Key will be: "${newTrainingType.key}"`
                : 'The training type key will be auto-generated from the English name (e.g., "Strength & Conditioning" → "strength_conditioning")'}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrainingTypeDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSaveTrainingType}
            variant="contained"
            disabled={!newTrainingType.nameEN || !newTrainingType.nameDE}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Training Template Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? t('admin.editTemplate') : t('admin.createTemplate')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>{t('admin.trainingType')}</InputLabel>
              <Select
                value={newTemplateData.trainingTypeId}
                label={t('admin.trainingType')}
                onChange={(e) => setNewTemplateData({ ...newTemplateData, trainingTypeId: e.target.value })}
              >
                {trainingTypes.filter(tt => tt.active).map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.nameEN}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>{t('admin.position')}</InputLabel>
              <Select
                multiple
                value={newTemplateData.positions}
                label={t('admin.position')}
                onChange={(e) => setNewTemplateData({ ...newTemplateData, positions: e.target.value as Position[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {positions.map((pos) => (
                  <MenuItem key={pos} value={pos}>{pos}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Click outside or press ESC to close
              </Typography>
            </FormControl>

            <TextField
              label="Program Duration (weeks)"
              type="number"
              value={newTemplateData.durationWeeks}
              onChange={(e) => setNewTemplateData({ ...newTemplateData, durationWeeks: Number(e.target.value) })}
              fullWidth
              required
              inputProps={{ min: 1, max: 52 }}
              helperText="How many weeks should this program last?"
            />

            <TextField
              label="Frequency (times per week)"
              value={newTemplateData.frequencyPerWeek}
              onChange={(e) => setNewTemplateData({ ...newTemplateData, frequencyPerWeek: e.target.value })}
              fullWidth
              required
              placeholder="2-3, 3, 4-5, etc."
              helperText="Recommended training frequency per week (e.g., '2-3' or '3')"
            />

            <TextField
              label="Weekly Progression Notes (optional)"
              value={newTemplateData.weeklyNotes}
              onChange={(e) => setNewTemplateData({ ...newTemplateData, weeklyNotes: e.target.value })}
              fullWidth
              multiline
              rows={4}
              placeholder="Example: Weeks 1-2: 60-70% 1RM, 8-10 reps, tempo 3-1-1&#10;Weeks 3-4: 70-75% 1RM, 6-8 reps..."
              helperText="Add progression notes for players (e.g., intensity by week, tempo changes, etc.)"
            />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('admin.blocks')}
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddBlock}
                >
                  {t('admin.addBlock')}
                </Button>
              </Box>

              {newTemplateData.blocks.length === 0 && (
                <Alert severity="info">
                  {t('admin.noBlocksYet')}
                </Alert>
              )}

              {(() => {
                const { dayGroups, unscheduled } = groupBlocksByDay(newTemplateData.blocks);

                return (
                  <>
                    {/* Blocks grouped by day */}
                    {dayGroups.map((dayGroup) => (
                      <Card key={dayGroup.dayNumber} sx={{ mb: 2, bgcolor: 'primary.lighter' }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                            {dayGroup.dayName}
                          </Typography>

                          {dayGroup.sessions.map((session, sIdx) => (
                            <Box key={sIdx} sx={{ ml: session.name ? 2 : 0, mb: session.name ? 2 : 0 }}>
                              {session.name && (
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                                  {session.name}
                                </Typography>
                              )}

                              {session.blocks.map((block) => {
                                const blockIndex = newTemplateData.blocks.findIndex(b => b.order === block.order);
                                return (
                                  <Card key={block.order} sx={{ mb: 1, ml: session.name ? 2 : 0 }}>
                                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                          <Typography variant="body2" fontWeight={600}>
                                            • {block.title}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {block.exerciseIds.length} exercise(s)
                                            {block.globalSets && ` • ${block.globalSets} sets`}
                                          </Typography>
                                        </Box>
                                        <Box>
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleEditBlock(blockIndex)}
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveBlock(blockIndex)}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    ))}

                    {/* Unscheduled blocks (no day assigned) */}
                    {unscheduled.length > 0 && (
                      <Card sx={{ mb: 2, bgcolor: 'warning.lighter' }}>
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'warning.dark' }}>
                            ⚠️ Unscheduled Blocks (no day assigned)
                          </Typography>
                          {unscheduled.map((block) => {
                            const blockIndex = newTemplateData.blocks.findIndex(b => b.order === block.order);
                            return (
                              <Card key={block.order} sx={{ mb: 1 }}>
                                <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>
                                        {block.title}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {block.exerciseIds.length} exercise(s)
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleEditBlock(blockIndex)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveBlock(blockIndex)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={!newTemplateData.trainingTypeId || !newTemplateData.positions || newTemplateData.positions.length === 0 || newTemplateData.blocks.length === 0}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => {
          setBlockDialogOpen(false);
          setEditingBlockIndex(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBlockIndex !== null ? t('admin.editBlock') : t('admin.addBlock')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Assign to Day</InputLabel>
              <Select
                value={currentBlock.dayNumber ?? ''}
                label="Assign to Day"
                onChange={(e) => {
                  const value = e.target.value;
                  const dayNum = value === '' ? undefined : Number(value);
                  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  setCurrentBlock({
                    ...currentBlock,
                    dayNumber: dayNum,
                    dayOfWeek: dayNum ? `${dayNames[dayNum - 1]} / Day ${dayNum}` : undefined
                  });
                }}
              >
                <MenuItem value="">
                  <em>No specific day (flexible)</em>
                </MenuItem>
                <MenuItem value={1}>Monday / Day 1</MenuItem>
                <MenuItem value={2}>Tuesday / Day 2</MenuItem>
                <MenuItem value={3}>Wednesday / Day 3</MenuItem>
                <MenuItem value={4}>Thursday / Day 4</MenuItem>
                <MenuItem value={5}>Friday / Day 5</MenuItem>
                <MenuItem value={6}>Saturday / Day 6</MenuItem>
                <MenuItem value={7}>Sunday / Day 7</MenuItem>
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Select which day this block belongs to (optional)
              </Typography>
            </FormControl>

            <TextField
              label="Session Name (optional)"
              value={currentBlock.sessionName || ''}
              onChange={(e) => setCurrentBlock({ ...currentBlock, sessionName: e.target.value || undefined })}
              fullWidth
              placeholder="e.g., Morning Session, Evening Conditioning, Session 1"
              helperText="Used to group multiple blocks in the same day (leave empty if only one session)"
            />

            <FormControl fullWidth required>
              <InputLabel>{t('admin.blockTitle')}</InputLabel>
              <Select
                value={currentBlock.title}
                label={t('admin.blockTitle')}
                onChange={(e) => setCurrentBlock({ ...currentBlock, title: e.target.value })}
              >
                {/* Existing blocks from this template */}
                {newTemplateData.blocks.length > 0 && [
                  <MenuItem key="header-existing" disabled sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'primary.main' }}>
                    ── EXISTING BLOCKS ──
                  </MenuItem>,
                  ...newTemplateData.blocks.map((block) => (
                    <MenuItem key={`existing-block-${block.order}`} value={block.title}>
                      {block.title} ({block.exerciseIds.length} exercises)
                    </MenuItem>
                  )),
                  <MenuItem key="divider1" disabled sx={{ p: 0, m: 0 }}>
                    <Box sx={{ width: '100%', height: '1px', bgcolor: 'divider' }} />
                  </MenuItem>
                ]}

                {/* Block Info - blocks with configured descriptions */}
                {(() => {
                  const trainingType = trainingTypes.find(tt => tt.id === newTemplateData.trainingTypeId);
                  const trainingTypeKey = trainingType?.key;
                  const trainingTypeId = trainingType?.id;

                  // Filter by BOTH trainingTypeKey (for new records) AND trainingType ID (for compatibility)
                  const relevantBlocks = blockInfo.filter((bi: any) =>
                    bi.trainingTypeKey === trainingTypeKey || bi.trainingType === trainingTypeId
                  );

                  if (relevantBlocks.length > 0) {
                    return [
                      <MenuItem key="header-blockinfo" disabled sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'info.main' }}>
                        ── CONFIGURED BLOCKS ──
                      </MenuItem>,
                      ...relevantBlocks.map((bi: any) => (
                        <MenuItem key={`blockinfo-${bi.id}`} value={bi.blockName}>
                          {bi.blockName}
                        </MenuItem>
                      ))
                    ];
                  }
                  return null;
                })()}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Need a new block? Create it in the "Block Info" tab first
              </Typography>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {t('admin.selectExercises')}
              </Typography>

              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search exercises..."
                value={exerciseSearchQuery}
                onChange={(e) => setExerciseSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
                size="small"
              />

              {/* Exercise List with Thumbnails */}
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 400,
                  overflow: 'auto',
                  bgcolor: 'background.default'
                }}
              >
                <List dense>
                  {(exerciseSearchQuery
                    ? exercises // When searching, show ALL exercises
                    : getFilteredExercises(newTemplateData.trainingTypeId) // When not searching, filter by training type
                  )
                    .filter(exercise =>
                      !exerciseSearchQuery || // If no search query, show all (from getFilteredExercises)
                      exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
                      exercise.category.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
                    )
                    .map((exercise) => {
                      const isSelected = currentBlock.exerciseIds.includes(exercise.id);
                      const videoId = extractYouTubeVideoId(exercise.youtubeUrl || '');
                      const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

                      return (
                        <ListItem
                          key={exercise.id}
                          disablePadding
                          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                          <ListItemButton
                            selected={isSelected}
                            onClick={() => {
                              const newExerciseIds = isSelected
                                ? currentBlock.exerciseIds.filter(id => id !== exercise.id)
                                : [...currentBlock.exerciseIds, exercise.id];

                              // Initialize exerciseConfigs for new exercises
                              const newConfigs = newExerciseIds.map(exId => {
                                const existing = currentBlock.exerciseConfigs?.find(c => c.exerciseId === exId);
                                return existing || { exerciseId: exId, sets: undefined };
                              });

                              setCurrentBlock({
                                ...currentBlock,
                                exerciseIds: newExerciseIds,
                                exerciseConfigs: newConfigs
                              });
                            }}
                            sx={{ gap: 2, py: 1 }}
                          >
                            {/* Thumbnail */}
                            {thumbnailUrl ? (
                              <Box
                                component="img"
                                src={thumbnailUrl}
                                alt={exercise.name}
                                sx={{
                                  width: 80,
                                  height: 45,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  flexShrink: 0,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 80,
                                  height: 45,
                                  bgcolor: 'action.hover',
                                  borderRadius: 1,
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                              >
                                <Typography variant="caption" color="text.disabled">
                                  No video
                                </Typography>
                              </Box>
                            )}

                            {/* Exercise Info */}
                            <ListItemText
                              primary={exercise.name}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                  <Chip label={exercise.category} size="small" />
                                  {exercise.muscleGroups?.map((group) => (
                                    <Chip
                                      key={group}
                                      label={t(`muscleGroup.${group}` as any)}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              }
                            />

                            {/* Selection Indicator */}
                            {isSelected && (
                              <Chip
                                label="✓"
                                size="small"
                                color="primary"
                                sx={{ minWidth: 32, height: 24 }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                </List>
              </Paper>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {currentBlock.exerciseIds.length} exercise(s) selected
              </Typography>
            </Box>

            {currentBlock.exerciseIds.length > 0 && (
              <>
                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Sets Configuration
                  </Typography>

                  <TextField
                    label="Global Sets (apply to all exercises)"
                    type="number"
                    value={currentBlock.globalSets || ''}
                    onChange={(e) => setCurrentBlock({ ...currentBlock, globalSets: e.target.value ? Number(e.target.value) : undefined })}
                    fullWidth
                    inputProps={{ min: 1, max: 10 }}
                    helperText="Leave empty if you want to set sets individually per exercise"
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Or set individual sets per exercise (overrides global):
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    {currentBlock.exerciseIds.map((exerciseId) => {
                      const exercise = getFilteredExercises(newTemplateData.trainingTypeId).find(ex => ex.id === exerciseId);
                      const config = currentBlock.exerciseConfigs?.find(c => c.exerciseId === exerciseId);
                      const unit = config?.unit || 'reps';

                      return (
                        <Box key={exerciseId} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                            {exercise?.name}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Sets Field */}
                            <TextField
                              label="Sets"
                              type="number"
                              value={config?.sets || ''}
                              onChange={(e) => {
                                const newConfigs = [...(currentBlock.exerciseConfigs || [])];
                                const configIndex = newConfigs.findIndex(c => c.exerciseId === exerciseId);
                                const newSets = e.target.value ? Number(e.target.value) : undefined;

                                if (configIndex >= 0) {
                                  newConfigs[configIndex] = { ...newConfigs[configIndex], sets: newSets };
                                } else {
                                  newConfigs.push({ exerciseId, sets: newSets, reps: undefined, unit: 'reps' });
                                }

                                setCurrentBlock({ ...currentBlock, exerciseConfigs: newConfigs });
                              }}
                              size="small"
                              inputProps={{ min: 1, max: 10 }}
                              sx={{ width: 100 }}
                            />

                            {/* Reps/Duration Field */}
                            <TextField
                              label={unit === 'reps' ? 'Reps' : unit === 'meters' ? 'Meters' : 'Seconds'}
                              type="number"
                              value={config?.reps || ''}
                              onChange={(e) => {
                                const newConfigs = [...(currentBlock.exerciseConfigs || [])];
                                const configIndex = newConfigs.findIndex(c => c.exerciseId === exerciseId);
                                const newReps = e.target.value ? Number(e.target.value) : undefined;

                                if (configIndex >= 0) {
                                  newConfigs[configIndex] = { ...newConfigs[configIndex], reps: newReps };
                                } else {
                                  newConfigs.push({ exerciseId, sets: undefined, reps: newReps, unit });
                                }

                                setCurrentBlock({ ...currentBlock, exerciseConfigs: newConfigs });
                              }}
                              size="small"
                              inputProps={{ min: 1, max: unit === 'reps' ? 100 : unit === 'meters' ? 500 : 300 }}
                              sx={{ width: 120 }}
                            />

                            {/* Toggle between Reps, Seconds, and Meters */}
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <InputLabel>Unit</InputLabel>
                              <Select
                                value={unit}
                                label="Unit"
                                onChange={(e) => {
                                  const newUnit = e.target.value as 'reps' | 'seconds' | 'meters';
                                  const newConfigs = [...(currentBlock.exerciseConfigs || [])];
                                  const configIndex = newConfigs.findIndex(c => c.exerciseId === exerciseId);

                                  if (configIndex >= 0) {
                                    newConfigs[configIndex] = { ...newConfigs[configIndex], unit: newUnit };
                                  } else {
                                    newConfigs.push({ exerciseId, sets: undefined, reps: undefined, unit: newUnit });
                                  }

                                  setCurrentBlock({ ...currentBlock, exerciseConfigs: newConfigs });
                                }}
                              >
                                <MenuItem value="reps">Reps</MenuItem>
                                <MenuItem value="seconds">Seconds</MenuItem>
                                <MenuItem value="meters">Meters</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </>
            )}

            <Alert severity="info">
              Select exercises that belong to this block. You can set a global number of sets or configure each exercise individually.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setBlockDialogOpen(false);
            setEditingBlockIndex(null);
          }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSaveBlock}
            variant="contained"
            disabled={!currentBlock.title || currentBlock.exerciseIds.length === 0}
          >
            {editingBlockIndex !== null ? t('common.save') : t('admin.addBlock')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setEditingAssignment(null);
          setAssignToAllPlayers(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingAssignment ? 'Edit Program Assignment' : 'Assign Program to Players'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Select Template</InputLabel>
              <Select
                value={newAssignment.templateId}
                label="Select Template"
                onChange={(e) => setNewAssignment({ ...newAssignment, templateId: e.target.value })}
              >
                {templates.filter((t: any) => t.active !== false).map((template: any) => {
                  // Template is enriched by backend with trainingTypeName
                  const displayName = template.trainingTypeName || 'Unknown';
                  const positions = template.positions ? template.positions.join(', ') : 'All';

                  return (
                    <MenuItem key={template.id} value={template.id}>
                      {displayName} - {positions}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={assignToAllPlayers}
                  onChange={(e) => setAssignToAllPlayers(e.target.checked)}
                  disabled={!newAssignment.templateId}
                />
              }
              label={`Assign to all players from template positions${
                newAssignment.templateId
                  ? ` (${templates.find(t => t.id === newAssignment.templateId)?.positions?.join(', ')})`
                  : ''
              }`}
            />

            <FormControl fullWidth required disabled={assignToAllPlayers}>
              <InputLabel>Select Players</InputLabel>
              <Select
                multiple
                value={assignToAllPlayers ? [] : newAssignment.playerIds}
                label="Select Players"
                onChange={(e) => setNewAssignment({ ...newAssignment, playerIds: e.target.value as string[] })}
                renderValue={(selected) =>
                  assignToAllPlayers
                    ? `All ${getPlayersForTemplate(newAssignment.templateId).length} players from template positions`
                    : `${selected.length} player(s) selected`
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {players
                  .filter((player: any) => {
                    // If no template selected, show all players
                    if (!newAssignment.templateId) return true;

                    const template = templates.find(t => t.id === newAssignment.templateId);

                    // If template has no positions or player has no position, include player
                    if (!template?.positions || template.positions.length === 0) return true;
                    if (!player.position) return false;

                    return template.positions.includes(player.position);
                  })
                  .map((player: any) => (
                    <MenuItem key={player.id} value={player.id}>
                      #{player.jerseyNumber || '?'} {player.name} ({player.position || 'No position'})
                    </MenuItem>
                  ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {assignToAllPlayers
                  ? 'Checkbox is enabled - all matching players will be assigned'
                  : 'Click outside or press ESC to close'}
              </Typography>
            </FormControl>

            <TextField
              label="Start Date"
              type="date"
              value={newAssignment.startDate}
              onChange={(e) => setNewAssignment({ ...newAssignment, startDate: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              helperText="The end date will be calculated automatically based on program duration"
            />

            <Alert severity="info">
              Players will see this program in their "My Training" page starting from the start date.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAssignDialogOpen(false);
            setEditingAssignment(null);
            setAssignToAllPlayers(false);
          }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSaveAssignment}
            variant="contained"
            disabled={
              !newAssignment.templateId ||
              (!assignToAllPlayers && newAssignment.playerIds.length === 0)
            }
          >
            {editingAssignment ? 'Update Assignment' : 'Assign Program'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Coach Configuration Tab */}
      {activeTab === 9 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('admin.aiCoachTab')}
          </Typography>

          {aiCoachSaved && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {t('admin.aiCoachSaved')}
            </Alert>
          )}

          <Card>
            <CardContent>
              <Grid container spacing={3}>
                {/* Info Alert */}
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      {t('admin.aiCoachInfo')}
                    </Typography>
                  </Alert>
                </Grid>

                {/* Team API Key */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.teamApiKey')}
                    value={teamApiKey}
                    onChange={(e) => {
                      setTeamApiKey(e.target.value);
                      setApiKeyValidationResult(null);
                    }}
                    placeholder="sk-..."
                    type="password"
                    helperText={t('admin.teamApiKeyHelp')}
                  />
                </Grid>

                {/* Test Button */}
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={handleTestAPIKey}
                    disabled={!teamApiKey.trim() || apiKeyValidating}
                  >
                    {apiKeyValidating ? t('admin.testing') : t('admin.testApiKey')}
                  </Button>
                </Grid>

                {/* Validation Result */}
                {apiKeyValidationResult && (
                  <Grid item xs={12}>
                    <Alert severity={apiKeyValidationResult.valid ? 'success' : 'error'}>
                      <Typography variant="body2">
                        {apiKeyValidationResult.valid
                          ? t('admin.apiKeyValid')
                          : `${t('admin.apiKeyInvalid')}: ${apiKeyValidationResult.error}`}
                      </Typography>
                    </Alert>
                  </Grid>
                )}

                {/* Save Button */}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleSaveAICoachConfig}
                    disabled={teamApiKey === (teamSettings.aiApiKey || '')}
                  >
                    {t('admin.saveAICoach')}
                  </Button>
                  {teamApiKey && (
                    <Button
                      sx={{ ml: 2 }}
                      onClick={() => {
                        setTeamApiKey('');
                        setApiKeyValidationResult(null);
                      }}
                    >
                      {t('admin.clearApiKey')}
                    </Button>
                  )}
                </Grid>

                {/* Current Configuration */}
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {t('admin.currentAIConfig')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('admin.teamApiKeyStatus')}:</strong>{' '}
                      {teamSettings.aiApiKey
                        ? t('admin.configured')
                        : t('admin.notConfigured')}
                    </Typography>
                    {teamSettings.updatedAt && teamSettings.aiApiKey && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Last updated by {teamSettings.updatedBy} on{' '}
                        {new Date(teamSettings.updatedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Usage Info */}
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      {t('admin.aiCoachUsageInfo')}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Points System Configuration Tab */}
      {activeTab === 10 && <PointsSystemManager />}

      {/* Drillbook Tab */}
      {activeTab === 11 && <DrillManager />}

      {/* Equipment Tab */}
      {activeTab === 12 && <EquipmentManager />}

      {/* Drill Categories Tab */}
      {activeTab === 13 && <DrillCategoryManager />}

      {/* Videos Admin Tab */}
      {activeTab === 15 && <VideosAdmin />}

      {/* Video Tags Tab */}
      {activeTab === 14 && <VideoTagsManager />}

      {/* View Training Dialog */}
      <Dialog
        open={viewTrainingDialogOpen}
        onClose={() => {
          setViewTrainingDialogOpen(false);
          setSelectedDayFilter('all');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {viewingTemplate?.trainingTypeName || 'Training Details'}
            </Typography>
            {viewingTemplate?.positions && viewingTemplate.positions.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {viewingTemplate.positions.map((pos) => (
                  <Chip key={pos} label={pos} size="small" color="primary" />
                ))}
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingTemplate && (() => {
            // Group blocks by day
            const blocksByDay: Record<string, any[]> = {};
            viewingTemplate.blocks.forEach((block: any) => {
              const day = block.dayOfWeek || block.dayNumber?.toString() || block.sessionName || 'Unassigned';
              if (!blocksByDay[day]) {
                blocksByDay[day] = [];
              }
              blocksByDay[day].push(block);
            });

            const allDays = Object.keys(blocksByDay).sort();
            const filteredDays = selectedDayFilter === 'all'
              ? allDays
              : allDays.filter(day => day === selectedDayFilter);

            return (
              <Box>
                {/* Template Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Duration: {viewingTemplate.durationWeeks} weeks • Frequency: {viewingTemplate.frequencyPerWeek}x/week
                  </Typography>
                  {viewingTemplate.weeklyNotes && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">{viewingTemplate.weeklyNotes}</Typography>
                    </Alert>
                  )}
                </Box>

                {/* Day Filter */}
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter by Day</InputLabel>
                    <Select
                      value={selectedDayFilter}
                      label="Filter by Day"
                      onChange={(e) => setSelectedDayFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Days</MenuItem>
                      {allDays.map((day) => (
                        <MenuItem key={day} value={day}>{day}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Days and Blocks */}
                {filteredDays.map((day) => (
                  <Box key={day} sx={{ mb: 4 }}>
                    {/* Day Header */}
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText'
                      }}
                    >
                      <Typography variant="h5" fontWeight={600}>
                        {day}
                      </Typography>
                      <Typography variant="body2">
                        {blocksByDay[day].length} block(s)
                      </Typography>
                    </Paper>

                    {/* Blocks for this day */}
                    {blocksByDay[day].map((block: any, blockIdx: number) => (
                <Paper key={block.id || blockIdx} elevation={2} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    {blockIdx + 1}. {block.title}
                  </Typography>

                  {/* Block metadata */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {block.dayOfWeek && (
                      <Chip label={`Day: ${block.dayOfWeek}`} size="small" variant="outlined" />
                    )}
                    {block.dayNumber && (
                      <Chip label={`Day ${block.dayNumber}`} size="small" variant="outlined" />
                    )}
                    {block.sessionName && (
                      <Chip label={block.sessionName} size="small" variant="outlined" />
                    )}
                    {block.globalSets && (
                      <Chip label={`${block.globalSets} sets`} size="small" color="secondary" />
                    )}
                  </Box>

                  {/* Exercise List */}
                  <List dense>
                    {(block.exercises || block.items || []).map((exercise: any, exIdx: number) => {
                      // Get specific sets config for this exercise
                      const exerciseConfig = block.exerciseConfigs?.find(
                        (config: any) => config.exerciseId === exercise.id
                      );
                      const sets = exerciseConfig?.sets || block.globalSets || '-';

                      return (
                        <ListItem
                          key={exercise.id || exIdx}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: 'background.paper',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight={500}>
                                  {exIdx + 1}. {exercise.name}
                                </Typography>
                                <Chip label={`${sets} sets`} size="small" color="primary" />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Muscle Groups: {exercise.muscleGroups.join(', ')}
                                  </Typography>
                                )}
                                {exercise.youtubeUrl && (
                                  <Box
                                    sx={{
                                      mt: 1,
                                      cursor: 'pointer',
                                      position: 'relative',
                                      '&:hover': { opacity: 0.8 },
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      maxWidth: 200,
                                    }}
                                    onClick={() => {
                                      setCurrentVideoUrl(exercise.youtubeUrl);
                                      setVideoPlayerOpen(true);
                                    }}
                                  >
                                    <img
                                      src={`https://img.youtube.com/vi/${extractYouTubeVideoId(exercise.youtubeUrl)}/mqdefault.jpg`}
                                      alt={`${exercise.name} video thumbnail`}
                                      style={{
                                        width: '100%',
                                        display: 'block',
                                        borderRadius: 4,
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 48,
                                        height: 48,
                                        bgcolor: 'rgba(0,0,0,0.7)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                      }}
                                    >
                                      ▶
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>

                      {/* Summary */}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Total: {(block.exercises?.length || block.items?.length || 0)} exercises
                      </Typography>
                    </Paper>
                    ))}
                  </Box>
                ))}

                {/* Overall Summary */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'success.main', color: 'success.contrastText', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Total Training: {viewingTemplate.blocks.length} block(s) | {
                      viewingTemplate.blocks.reduce((total: number, block: any) => {
                        return total + ((block.exercises?.length || block.items?.length || 0));
                      }, 0)
                    } exercise(s)
                  </Typography>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewTrainingDialogOpen(false);
            setSelectedDayFilter('all');
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog
        open={videoPlayerOpen}
        onClose={() => {
          setVideoPlayerOpen(false);
          setCurrentVideoUrl('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Exercise Video
        </DialogTitle>
        <DialogContent>
          {currentVideoUrl && (
            <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeVideoId(currentVideoUrl)}?autoplay=1`}
                title="Exercise Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setVideoPlayerOpen(false);
            setCurrentVideoUrl('');
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
        </Grid>
      </Grid>
    </Box>
  );
};
