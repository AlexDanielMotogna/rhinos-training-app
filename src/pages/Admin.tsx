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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useI18n } from '../i18n/I18nProvider';
import { globalCatalog } from '../services/catalog';
import type { Exercise, ExerciseCategory, Position } from '../types/exercise';
import type { TrainingTemplate, TrainingAssignment } from '../types/trainingBuilder';
import {
  getTrainingTemplates,
  getTrainingTypes as getTrainingTypesFromService,
  createTrainingTemplate,
  updateTrainingTemplate,
  deleteTrainingTemplate,
  saveTrainingTypes,
  getTrainingAssignments,
  createTrainingAssignment,
  deleteAssignment,
  getMockPlayers,
} from '../services/trainingBuilder';
import { getUser } from '../services/mock';
import { BlockInfoManager } from '../components/admin/BlockInfoManager';

interface TeamSession {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string;
  endTime: string;
  type: string;
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

  // Exercise Management State
  const [exercises, setExercises] = useState<Exercise[]>(globalCatalog);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [newExercise, setNewExercise] = useState<Partial<Exercise & { trainingTypes?: string[] }>>({
    name: '',
    category: 'Strength',
    intensity: 'mod',
    isGlobal: true,
    youtubeUrl: '',
    trainingTypes: [],
  });

  // Sessions Management State
  const [sessions, setSessions] = useState<TeamSession[]>([
    { id: '1', date: '2025-01-21', startTime: '19:00', endTime: '21:00', type: 'Team Training' },
    { id: '2', date: '2025-01-23', startTime: '19:00', endTime: '21:00', type: 'Team Training' },
  ]);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState<Partial<TeamSession>>({
    date: new Date().toISOString().split('T')[0], // Today's date
    startTime: '19:00',
    endTime: '21:00',
    type: 'Team Training',
  });

  // Policies Management State
  const [policies, setPolicies] = useState<Policy>({
    maxFreeSessionsPerDay: 2,
    maxFreeSharePctPerWeek: 40,
    allowedCategories: ['Strength', 'Speed', 'Conditioning', 'Mobility', 'Recovery'],
  });
  const [policiesModified, setPoliciesModified] = useState(false);

  // Training Types Management State
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>(() => getTrainingTypesFromService());
  const [trainingTypeDialogOpen, setTrainingTypeDialogOpen] = useState(false);
  const [newTrainingType, setNewTrainingType] = useState<Partial<TrainingType>>({
    key: '',
    nameEN: '',
    nameDE: '',
    season: 'off-season',
    active: true,
  });

  // Training Builder State
  const [templates, setTemplates] = useState<TrainingTemplate[]>(() => getTrainingTemplates());
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);
  const [newTemplateData, setNewTemplateData] = useState<{
    trainingTypeId: string;
    positions: Position[];
    durationWeeks: number;
    frequencyPerWeek: string;
    blocks: { title: string; order: number; exerciseIds: string[] }[];
  }>({
    trainingTypeId: '',
    positions: ['RB'],
    durationWeeks: 8,
    frequencyPerWeek: '2-3',
    blocks: [],
  });
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [currentBlock, setCurrentBlock] = useState<{ title: string; exerciseIds: string[] }>({
    title: '',
    exerciseIds: [],
  });

  // Assignment State
  const [assignments, setAssignments] = useState<TrainingAssignment[]>(() => getTrainingAssignments());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState<{
    templateId: string;
    playerIds: string[];
    startDate: string;
  }>({
    templateId: '',
    playerIds: [],
    startDate: new Date().toISOString().split('T')[0],
  });
  const mockPlayers = getMockPlayers();

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

  const handleSaveExercise = () => {
    if (editingExercise) {
      // Update existing
      setExercises(exercises.map(ex =>
        ex.id === editingExercise.id ? { ...ex, ...newExercise } as Exercise : ex
      ));
    } else {
      // Create new
      const exercise: Exercise = {
        id: `ex-${Date.now()}`,
        name: newExercise.name!,
        category: newExercise.category!,
        intensity: newExercise.intensity,
        isGlobal: true,
        positionTags: newExercise.positionTags,
        youtubeUrl: newExercise.youtubeUrl,
      };
      setExercises([...exercises, exercise]);
    }
    setExerciseDialogOpen(false);
  };

  const handleDeleteExercise = (id: string) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      setExercises(exercises.filter(ex => ex.id !== id));
    }
  };

  // Sessions Management Handlers
  const handleSaveSession = () => {
    const session: TeamSession = {
      id: Date.now().toString(),
      date: newSession.date!,
      startTime: newSession.startTime!,
      endTime: newSession.endTime!,
      type: newSession.type!,
    };
    setSessions([...sessions, session].sort((a, b) => a.date.localeCompare(b.date)));
    setSessionDialogOpen(false);
    setNewSession({
      date: new Date().toISOString().split('T')[0],
      startTime: '19:00',
      endTime: '21:00',
      type: 'Team Training',
    });
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setSessions(sessions.filter(s => s.id !== id));
    }
  };

  // Policies Management Handlers
  const handleSavePolicies = () => {
    // In real app, would save to backend
    setPoliciesModified(false);
    alert('Policies saved successfully!');
  };

  // Training Types Management Handlers
  const handleSaveTrainingType = () => {
    const trainingType: TrainingType = {
      id: Date.now().toString(),
      key: newTrainingType.key!.toLowerCase().replace(/\s+/g, '_'),
      nameEN: newTrainingType.nameEN!,
      nameDE: newTrainingType.nameDE!,
      season: newTrainingType.season!,
      active: newTrainingType.active!,
    };
    setTrainingTypes([...trainingTypes, trainingType]);
    setTrainingTypeDialogOpen(false);
    setNewTrainingType({
      key: '',
      nameEN: '',
      nameDE: '',
      season: 'off-season',
      active: true,
    });
  };

  const handleToggleTrainingType = (id: string) => {
    setTrainingTypes(trainingTypes.map(tt =>
      tt.id === id ? { ...tt, active: !tt.active } : tt
    ));
  };

  const handleDeleteTrainingType = (id: string) => {
    if (window.confirm('Are you sure you want to delete this training type?')) {
      const updated = trainingTypes.filter(tt => tt.id !== id);
      setTrainingTypes(updated);
      saveTrainingTypes(updated);
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
        blocks: template.blocks?.map(b => ({
          title: b.title,
          order: b.order,
          exerciseIds: b.exercises.map(ex => ex.id),
        })) || [],
      });
    } else {
      setEditingTemplate(null);
      setNewTemplateData({
        trainingTypeId: trainingTypes[0]?.id || '',
        positions: ['RB'],
        durationWeeks: 8,
        frequencyPerWeek: '2-3',
        blocks: [],
      });
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTrainingTemplate(editingTemplate.id, newTemplateData);
      setTemplates(getTrainingTemplates());
    } else {
      createTrainingTemplate(newTemplateData);
      setTemplates(getTrainingTemplates());
    }
    setTemplateDialogOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTrainingTemplate(id);
      setTemplates(getTrainingTemplates());
    }
  };

  const handleAddBlock = () => {
    setEditingBlockIndex(null);
    setCurrentBlock({ title: '', exerciseIds: [] });
    setBlockDialogOpen(true);
  };

  const handleEditBlock = (index: number) => {
    setEditingBlockIndex(index);
    const block = newTemplateData.blocks[index];
    setCurrentBlock({ title: block.title, exerciseIds: block.exerciseIds });
    setBlockDialogOpen(true);
  };

  const handleSaveBlock = () => {
    if (editingBlockIndex !== null) {
      // Update existing block
      const updatedBlocks = [...newTemplateData.blocks];
      updatedBlocks[editingBlockIndex] = {
        ...updatedBlocks[editingBlockIndex],
        title: currentBlock.title,
        exerciseIds: currentBlock.exerciseIds,
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
        exerciseIds: currentBlock.exerciseIds,
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
  const handleSaveAssignment = () => {
    const currentUser = getUser();
    if (currentUser) {
      createTrainingAssignment(newAssignment, currentUser.id);
      setAssignments(getTrainingAssignments());
      setAssignDialogOpen(false);
      setNewAssignment({
        templateId: '',
        playerIds: [],
        startDate: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleDeleteAssignment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      deleteAssignment(id);
      setAssignments(getTrainingAssignments());
    }
  };

  const categories: ExerciseCategory[] = [
    'Strength', 'Speed', 'COD', 'Plyometrics',
    'Mobility', 'Technique', 'Conditioning', 'Recovery'
  ];

  const positions: Position[] = ['RB', 'WR', 'LB', 'OL', 'DB', 'QB', 'DL', 'TE', 'K/P'];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('admin.title')}
      </Typography>

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
                              {block.exercises.length} exercise(s)
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
              onClick={() => setAssignDialogOpen(true)}
            >
              Assign Program
            </Button>
          </Box>

          <Grid container spacing={2}>
            {assignments.map((assignment) => {
              const template = templates.find(t => t.id === assignment.templateId);
              const assignedPlayers = mockPlayers.filter(p => assignment.playerIds.includes(p.id));

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
                              {assignedPlayers.map((player) => (
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
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteAssignment(assignment.id)}
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
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Positions</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Video</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exercises.slice(0, 20).map((exercise) => (
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
                      {exercise.positionTags?.join(', ') || 'All'}
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

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Showing 20 of {exercises.length} exercises
          </Typography>
        </Box>
      )}

      {/* Sessions Management Tab */}
      {activeTab === 3 && (
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
                        <Box>
                          <Typography variant="h6">
                            {dayName}
                          </Typography>
                          <Typography variant="body2" color="primary" sx={{ mb: 0.5 }}>
                            {formattedDate}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {session.startTime} - {session.endTime}
                          </Typography>
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
                          color={trainingType.active ? 'warning' : 'success'}
                          onClick={() => handleToggleTrainingType(trainingType.id)}
                          title={trainingType.active ? 'Deactivate' : 'Activate'}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTrainingType(trainingType.id)}
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

            <FormControl fullWidth>
              <InputLabel>{t('admin.positions')}</InputLabel>
              <Select
                multiple
                value={newExercise.positionTags || []}
                label={t('admin.positions')}
                onChange={(e) => setNewExercise({ ...newExercise, positionTags: e.target.value as Position[] })}
                renderValue={(selected) => (selected as string[]).join(', ')}
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
        <DialogTitle>{t('admin.addTrainingType')}</DialogTitle>
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
              The training type key will be auto-generated from the English name (e.g., "Strength & Conditioning" → "strength_conditioning")
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

              {newTemplateData.blocks.map((block, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {index + 1}. {block.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {block.exerciseIds.length} exercise(s)
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditBlock(index)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveBlock(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
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
            <TextField
              label={t('admin.blockTitle')}
              value={currentBlock.title}
              onChange={(e) => setCurrentBlock({ ...currentBlock, title: e.target.value })}
              fullWidth
              required
              placeholder="Compound Lifts, Accessory Work, Speed Drills, etc."
            />

            <FormControl fullWidth>
              <InputLabel>{t('admin.selectExercises')}</InputLabel>
              <Select
                multiple
                value={currentBlock.exerciseIds}
                label={t('admin.selectExercises')}
                onChange={(e) => setCurrentBlock({ ...currentBlock, exerciseIds: e.target.value as string[] })}
                renderValue={(selected) => `${selected.length} selected`}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {globalCatalog.map((exercise) => (
                  <MenuItem key={exercise.id} value={exercise.id}>
                    {exercise.name} ({exercise.category})
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Click outside or press ESC to close
              </Typography>
            </FormControl>

            <Alert severity="info">
              Select exercises that belong to this block. You can select multiple exercises.
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
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Program to Players</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Select Template</InputLabel>
              <Select
                value={newAssignment.templateId}
                label="Select Template"
                onChange={(e) => setNewAssignment({ ...newAssignment, templateId: e.target.value })}
              >
                {templates.filter(t => t.active).map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.trainingTypeName} ({template.positions?.join(', ')}) - {template.durationWeeks}w
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Select Players</InputLabel>
              <Select
                multiple
                value={newAssignment.playerIds}
                label="Select Players"
                onChange={(e) => setNewAssignment({ ...newAssignment, playerIds: e.target.value as string[] })}
                renderValue={(selected) => `${selected.length} player(s) selected`}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {mockPlayers.map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    #{player.jerseyNumber} {player.name} ({player.position})
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Click outside or press ESC to close
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
          <Button onClick={() => setAssignDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSaveAssignment}
            variant="contained"
            disabled={!newAssignment.templateId || newAssignment.playerIds.length === 0}
          >
            Assign Program
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
