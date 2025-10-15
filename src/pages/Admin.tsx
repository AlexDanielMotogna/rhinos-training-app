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
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([
    { id: '1', key: 'strength_conditioning', nameEN: 'Strength & Conditioning', nameDE: 'Kraft & Kondition', season: 'off-season', active: true },
    { id: '2', key: 'sprints_speed', nameEN: 'Sprints / Speed', nameDE: 'Sprints / Geschwindigkeit', season: 'off-season', active: true },
    { id: '3', key: 'cb_drills', nameEN: 'CB Drills', nameDE: 'CB-Übungen', season: 'in-season', active: true },
  ]);
  const [trainingTypeDialogOpen, setTrainingTypeDialogOpen] = useState(false);
  const [newTrainingType, setNewTrainingType] = useState<Partial<TrainingType>>({
    key: '',
    nameEN: '',
    nameDE: '',
    season: 'off-season',
    active: true,
  });

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
      setTrainingTypes(trainingTypes.filter(tt => tt.id !== id));
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
        <Tab label={t('admin.exercisesTab')} />
        <Tab label={t('admin.sessionsTab')} />
        <Tab label={t('admin.trainingTypesTab')} />
        <Tab label={t('admin.policiesTab')} />
      </Tabs>

      {/* Exercises Management Tab */}
      {activeTab === 0 && (
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
      {activeTab === 1 && (
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
      {activeTab === 2 && (
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
      {activeTab === 3 && (
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
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
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
              >
                {positions.map((pos) => (
                  <MenuItem key={pos} value={pos}>{pos}</MenuItem>
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
    </Box>
  );
};
