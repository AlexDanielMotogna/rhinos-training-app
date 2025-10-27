import React, { useState } from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useI18n } from '../i18n/I18nProvider';
import type { Exercise, ExerciseCategory, Position } from '../types/exercise';
import type { TrainingTemplate, TrainingAssignment } from '../types/trainingBuilder';
// Note: TrainingTypes now loaded from backend via trainingTypeService
import { getUser } from '../services/mock';
import { exerciseService, templateService, assignmentService, userService, trainingTypeService } from '../services/api';
import { BlockInfoManager } from '../components/admin/BlockInfoManager';
import { PointsSystemManager } from '../components/admin/PointsSystemManager';
import { getAllBlockInfo } from '../services/blockInfo';
import { DrillManager } from '../components/DrillManager';
import { EquipmentManager } from '../components/EquipmentManager';
import { getTeamSettings, updateTeamSettings } from '../services/teamSettings';
import type { SeasonPhase, TeamLevel } from '../types/teamSettings';
import { validateAPIKey } from '../services/aiInsights';
import RhinosLogo from '../assets/imgs/USR_Allgemein_Quard_Transparent.png';
import { NotificationTemplates, getNotificationStatus, requestNotificationPermission } from '../services/notifications';
import { createSession, getTeamSessions, deleteSession } from '../services/trainingSessions';
import NotificationsIcon from '@mui/icons-material/Notifications';

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
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const user = getUser();

  // Exercise Management State
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exercisePage, setExercisePage] = useState(0);
  const [exercisesPerPage] = useState(20);
  const [newExercise, setNewExercise] = useState<Partial<Exercise & { trainingTypes?: string[] }>>({
    name: '',
    category: 'Strength',
    intensity: 'mod',
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
        intensity: 'mod',
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
      } else {
        // Create new
        const created = await exerciseService.create({
          name: newExercise.name!,
          category: newExercise.category!,
          intensity: newExercise.intensity,
          isGlobal: true,
          positionTags: [], // Empty array - exercises are universal
          youtubeUrl: newExercise.youtubeUrl,
          descriptionEN: newExercise.descriptionEN,
          descriptionDE: newExercise.descriptionDE,
        }) as Exercise;
        setExercises([...exercises, created]);
      }
      setExerciseDialogOpen(false);
      setEditingExercise(null);
      setNewExercise({
        name: '',
        category: 'Strength',
        intensity: 'mod',
        isGlobal: true,
        youtubeUrl: '',
        trainingTypes: [],
      });
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Failed to save exercise. Please try again.');
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        await exerciseService.delete(id);
        setExercises(exercises.filter(ex => ex.id !== id));
      } catch (error) {
        console.error('Error deleting exercise:', error);
        alert('Failed to delete exercise. Please try again.');
      }
    }
  };

  // Sessions Management Handlers
  const handleSaveSession = async () => {
    const currentUser = getUser();
    if (!currentUser) return;

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
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    await NotificationTemplates.newTeamSession(
      formattedDate,
      session.startTime,
      session.location
    );

    setSessionDialogOpen(false);
    setNewSession({
      date: new Date().toISOString().split('T')[0],
      startTime: '19:00',
      endTime: '21:00',
      type: 'Team Training',
      location: '',
      address: '',
    });
  };

  const handleDeleteSession = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      // Delete from unified service
      await deleteSession(id);
      // Update local admin state
      setSessions(sessions.filter(s => s.id !== id));
    }
  };

  // Team Settings Handlers
  const handleSaveTeamSettings = () => {
    if (!user) return;

    const updated = updateTeamSettings(seasonPhase, teamLevel, user.name);
    setTeamSettings(updated);
    setSettingsSaved(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setSettingsSaved(false);
    }, 3000);
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

    // Clear validation result and show success
    setApiKeyValidationResult(null);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setAiCoachSaved(false);
    }, 3000);
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
    // In real app, would save to backend
    setPoliciesModified(false);
    alert('Policies saved successfully!');
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
      } else {
        const created = await trainingTypeService.create(data) as TrainingType;
        setTrainingTypes([...trainingTypes, created]);
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
      alert('Failed to save training type. Please try again.');
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
    } catch (error) {
      console.error('Error toggling training type:', error);
      alert('Failed to update training type. Please try again.');
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
      } catch (error) {
        console.error('Error deleting training type:', error);
        alert('Failed to delete training type. Please try again.');
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
      } else {
        const created = await templateService.create(templateData) as TrainingTemplate;
        setTemplates([...templates, created]);
      }
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templateService.delete(id);
        setTemplates(templates.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template. Please try again.');
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
      } else {
        await assignmentService.create(assignmentData);
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
      alert('Failed to save assignment. Please try again.');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await assignmentService.delete(id);
        setAssignments(assignments.filter(a => a.id !== id));
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment. Please try again.');
      }
    }
  };

  const categories: ExerciseCategory[] = [
    'Strength', 'Speed', 'COD', 'Plyometrics',
    'Mobility', 'Technique', 'Conditioning', 'Recovery'
  ];

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
      return exercises.filter(ex =>
        ['Strength', 'Plyometrics', 'Conditioning', 'Mobility', 'Recovery'].includes(ex.category)
      );
    }

    // Sprints / Speed: Speed, COD, Technique, Conditioning, Mobility, Recovery
    if (key.includes('sprint') || key.includes('speed')) {
      return exercises.filter(ex =>
        ['Speed', 'COD', 'Technique', 'Conditioning', 'Mobility', 'Recovery'].includes(ex.category)
      );
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

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label={t('admin.trainingBuilderTab')} />
        <Tab label="Assign Programs" />
        <Tab label={t('admin.exercisesTab')} />
        <Tab label={t('admin.sessionsTab')} />
        <Tab label={t('admin.trainingTypesTab')} />
        <Tab label={t('admin.policiesTab')} />
        <Tab label={t('admin.blockInfoTab')} />
        <Tab label={t('admin.teamSettingsTab')} />
        <Tab label={t('admin.aiCoachTab')} />
        <Tab label={t('admin.pointsSystemTab')} />
        <Tab label={t('admin.drillbookTab')} />
        <Tab label={t('admin.equipmentTab')} />
      </Tabs>

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

                        {template.blocks.map((block, idx) => (
                          <Box key={block.id} sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {idx + 1}. {block.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {((block as any).exercises?.length || (block as any).items?.length || 0)} exercise(s)
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      <Box>
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
              {t('admin.exerciseCatalog')} ({exercises.length} {t('admin.exercises')})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenExerciseDialog()}
            >
              {t('admin.addExercise')}
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Intensity</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Video</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exercises
                  .slice(exercisePage * exercisesPerPage, (exercisePage + 1) * exercisesPerPage)
                  .map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell>{exercise.name}</TableCell>
                      <TableCell>
                        <Chip label={exercise.category} size="small" />
                      </TableCell>
                      <TableCell>
                        {exercise.intensity && (
                          <Chip
                            label={exercise.intensity}
                            size="small"
                            color={
                              exercise.intensity === 'high'
                                ? 'error'
                                : exercise.intensity === 'mod'
                                ? 'warning'
                                : 'success'
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {exercise.youtubeUrl ? (
                          <Chip label="Yes" size="small" color="success" />
                        ) : (
                          <Chip label="No" size="small" color="default" />
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
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {exercisePage * exercisesPerPage + 1}-
              {Math.min((exercisePage + 1) * exercisesPerPage, exercises.length)} of {exercises.length} exercises
            </Typography>
            <Pagination
              count={Math.ceil(exercises.length / exercisesPerPage)}
              page={exercisePage + 1}
              onChange={(_, page) => setExercisePage(page - 1)}
              color="primary"
            />
          </Box>
        </Box>
      )}

      {/* Sessions Management Tab */}
      {activeTab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
            <Typography variant="h6">
              {t('admin.teamSessions')} ({sessions.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={async () => {
                  console.log('=== NOTIFICATION TEST START ===');

                  const status = getNotificationStatus();
                  console.log('Notification status:', status);

                  if (!status.supported) {
                    alert('❌ Tu navegador no soporta notificaciones');
                    return;
                  }
                  if (status.permission === 'denied') {
                    alert('❌ Notificaciones bloqueadas. Habilítalas en la configuración del navegador.');
                    return;
                  }

                  console.log('Requesting permission...');
                  const granted = await requestNotificationPermission();
                  console.log('Permission granted:', granted);

                  if (granted) {
                    console.log('Sending test notification...');
                    const sent = await NotificationTemplates.testNotification();
                    console.log('Notification sent:', sent);

                    if (sent) {
                      alert('✅ Notificación enviada! Revisa la barra de notificaciones');
                    } else {
                      alert('❌ Error al enviar notificación. Revisa la consola.');
                    }
                  } else {
                    alert('❌ Permiso de notificaciones denegado');
                  }

                  console.log('=== NOTIFICATION TEST END ===');
                }}
              >
                Test Notification
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setSessionDialogOpen(true)}
              >
                {t('admin.addSession')}
              </Button>
            </Box>
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
      {activeTab === 4 && (
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
      {activeTab === 5 && (
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
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
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
      {activeTab === 6 && <BlockInfoManager />}

      {/* Team Settings Tab */}
      {activeTab === 7 && (
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
                    
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handlePopulateUsers}
                      disabled={isPopulatingUsers}
                    >
                      {isPopulatingUsers ? 'Populating Users...' : 'Populate Database Users'}
                    </Button>
                  </Box>
                  
                  {populationResult && (
                    <Alert severity={populationResult.includes('Error') ? 'error' : 'success'} sx={{ mt: 2 }}>
                      {populationResult}
                    </Alert>
                  )}
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
                onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value as ExerciseCategory })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('admin.intensity')}</InputLabel>
              <Select
                value={newExercise.intensity || 'mod'}
                label={t('admin.intensity')}
                onChange={(e) => setNewExercise({ ...newExercise, intensity: e.target.value as 'low' | 'mod' | 'high' })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="mod">Moderate</MenuItem>
                <MenuItem value="high">High</MenuItem>
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
        <DialogTitle>{editingTrainingType ? 'Edit Training Type' : t('admin.addTrainingType')}</DialogTitle>
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
          {editingBlockIndex !== null ? 'Edit Block' : t('admin.addBlock')}
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

            <FormControl fullWidth>
              <InputLabel>{t('admin.selectExercises')}</InputLabel>
              <Select
                multiple
                value={currentBlock.exerciseIds}
                label={t('admin.selectExercises')}
                onChange={(e) => {
                  const newExerciseIds = e.target.value as string[];
                  setCurrentBlock({ ...currentBlock, exerciseIds: newExerciseIds });

                  // Initialize exerciseConfigs for new exercises
                  const newConfigs = newExerciseIds.map(exId => {
                    const existing = currentBlock.exerciseConfigs?.find(c => c.exerciseId === exId);
                    return existing || { exerciseId: exId, sets: undefined };
                  });
                  setCurrentBlock({ ...currentBlock, exerciseIds: newExerciseIds, exerciseConfigs: newConfigs });
                }}
                renderValue={(selected) => `${selected.length} selected`}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {getFilteredExercises(newTemplateData.trainingTypeId).map((exercise) => (
                  <MenuItem key={exercise.id} value={exercise.id}>
                    {exercise.name} ({exercise.category})
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Click outside or press ESC to close
              </Typography>
            </FormControl>

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

                      return (
                        <Box key={exerciseId} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ flex: 1, fontSize: '0.875rem' }}>
                            {exercise?.name}
                          </Typography>
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
                                newConfigs.push({ exerciseId, sets: newSets });
                              }

                              setCurrentBlock({ ...currentBlock, exerciseConfigs: newConfigs });
                            }}
                            size="small"
                            inputProps={{ min: 1, max: 10 }}
                            sx={{ width: 100 }}
                          />
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
      {activeTab === 8 && (
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
      {activeTab === 9 && <PointsSystemManager />}

      {/* Drillbook Tab */}
      {activeTab === 10 && <DrillManager />}

      {/* Equipment Tab */}
      {activeTab === 11 && <EquipmentManager />}
    </Box>
  );
};
