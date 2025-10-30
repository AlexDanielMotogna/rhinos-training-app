import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Grid,
  Chip,
  Stack,
  Divider,
  List,
  ListItemText,
  Paper,
  Alert,
  Checkbox,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  FitnessCenter as EquipmentIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useI18n } from '../i18n/I18nProvider';
import { drillService, syncDrillsFromBackend } from '../services/drillService';
import { equipmentService, syncEquipmentFromBackend } from '../services/equipmentService';
import { drillTrainingSessionService, syncDrillTrainingSessionsFromBackend } from '../services/drillTrainingSessionService';
import { exportSessionToPDF } from '../services/drillSessionPdfExport';
import { Drill, Equipment } from '../types/drill';
import { DrillTrainingSession } from '../services/drillTrainingSessionService';
import { getUser } from '../services/userProfile';

export const DrillTrainingPlan: React.FC = () => {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<DrillTrainingSession[]>([]);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<DrillTrainingSession | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    drills: [] as string[],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Sync from backend first
    await Promise.all([
      syncDrillsFromBackend(),
      syncEquipmentFromBackend(),
      syncDrillTrainingSessionsFromBackend(),
    ]);

    // Then load from cache
    const loadedDrills = drillService.getAllDrills();
    const loadedEquipment = equipmentService.getAllEquipment();
    const loadedSessions = drillTrainingSessionService.getAllSessions();

    console.log('[DrillTrainingPlan] Loaded drills:', loadedDrills);
    console.log('[DrillTrainingPlan] Drills is array:', Array.isArray(loadedDrills));
    console.log('[DrillTrainingPlan] Loaded equipment:', loadedEquipment);
    console.log('[DrillTrainingPlan] Equipment is array:', Array.isArray(loadedEquipment));

    setDrills(Array.isArray(loadedDrills) ? loadedDrills : []);
    setEquipment(Array.isArray(loadedEquipment) ? loadedEquipment : []);
    setSessions(loadedSessions);
  };

  const handleOpenDialog = (session?: DrillTrainingSession) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        name: session.name,
        date: session.date,
        drills: session.drills,
        notes: session.notes || '',
      });
    } else {
      setEditingSession(null);
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        drills: [],
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSession(null);
  };

  const handleSave = async () => {
    const currentUser = getUser();
    if (!currentUser) return;

    try {
      if (editingSession) {
        // Update existing session
        await drillTrainingSessionService.updateSession(editingSession.id, {
          name: formData.name,
          date: formData.date,
          drills: formData.drills,
          notes: formData.notes || undefined,
        });
      } else {
        // Create new session
        await drillTrainingSessionService.createSession({
          name: formData.name,
          date: formData.date,
          drills: formData.drills,
          notes: formData.notes || undefined,
        });
      }

      // Reload data from backend
      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save session:', error);
      alert(t('drills.saveSessionError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('drills.confirmDeleteSession'))) {
      try {
        await drillTrainingSessionService.deleteSession(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete session:', error);
        alert(t('drills.deleteSessionError'));
      }
    }
  };

  const toggleDrill = (drillId: string) => {
    setFormData(prev => ({
      ...prev,
      drills: prev.drills.includes(drillId)
        ? prev.drills.filter(id => id !== drillId)
        : [...prev.drills, drillId],
    }));
  };

  const getResourceSummary = (drillIds: string[]) => {
    return drillService.calculateResourceSummary(drillIds);
  };

  const getEquipmentName = (equipmentId: string): string => {
    if (!Array.isArray(equipment)) {
      console.error('[DrillTrainingPlan] equipment is not an array:', equipment);
      return 'Unknown';
    }
    return equipment.find(e => e.id === equipmentId)?.name || 'Unknown';
  };

  const getDrillName = (drillId: string): string => {
    if (!Array.isArray(drills)) {
      console.error('[DrillTrainingPlan] drills is not an array:', drills);
      return 'Unknown';
    }
    return drills.find(d => d.id === drillId)?.name || 'Unknown';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{t('drills.trainingSessions')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('drills.createSession')}
        </Button>
      </Box>

      <Grid container spacing={2}>
        {sessions.map((session) => {
          const summary = getResourceSummary(session.drills);
          const sessionDate = new Date(session.date);
          const formattedDate = sessionDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return (
            <Grid item xs={12} md={6} lg={4} key={session.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {session.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formattedDate}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSessionToPDF(session, t);
                        }}
                        color="primary"
                        title={t('drills.downloadSessionPDF')}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog(session)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(session.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('drills.drillsIncluded')} ({session.drills.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {session.drills.slice(0, 3).map((drillId: string) => (
                          <Chip
                            key={drillId}
                            label={getDrillName(drillId)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {session.drills.length > 3 && (
                          <Chip
                            label={`+${session.drills.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <InfoIcon fontSize="small" />
                        {t('drills.resourcesNeeded')}
                      </Typography>

                      <Stack spacing={0.5} sx={{ ml: 3 }}>
                        <Typography variant="body2">
                          <PeopleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                          <strong>{t('drills.coaches')}:</strong> {summary.totalCoaches}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('drills.dummies')}:</strong> {summary.totalDummies}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('drills.players')}:</strong> {summary.totalPlayers}
                        </Typography>

                        {summary.totalEquipment.size > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <EquipmentIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                              <strong>{t('drills.equipment')}:</strong>
                            </Typography>
                            <Box sx={{ ml: 2 }}>
                              {Array.from(summary.totalEquipment.entries()).map(([eqId, count]) => (
                                <Typography key={eqId} variant="caption" display="block">
                                  • {getEquipmentName(eqId)} x {count}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </Box>

                    {session.notes && (
                      <>
                        <Divider />
                        <Typography variant="body2" color="text.secondary">
                          <strong>{t('drills.notes')}:</strong> {session.notes}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {sessions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t('drills.noSessions')}
          </Typography>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSession ? t('drills.editSession') : t('drills.createSession')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('drills.sessionName')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="CB Drills Training, Team Practice, etc."
            />

            <TextField
              label={t('drills.date')}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('drills.selectDrills')} ({formData.drills.length} {t('drills.selected')})
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {drills.map((drill) => (
                    <ListItemButton
                      key={drill.id}
                      onClick={() => toggleDrill(drill.id)}
                      dense
                    >
                      <Checkbox
                        edge="start"
                        checked={formData.drills.includes(drill.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        primary={drill.name}
                        secondary={`${t(`drills.category.${drill.category}`)} • ${t(`drills.difficulty.${drill.difficulty}`)}`}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            </Box>

            {formData.drills.length > 0 && (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  {t('drills.resourceSummary')}:
                </Typography>
                {(() => {
                  const summary = getResourceSummary(formData.drills);
                  return (
                    <Box>
                      <Typography variant="body2">
                        • {t('drills.coaches')}: {summary.totalCoaches}
                      </Typography>
                      <Typography variant="body2">
                        • {t('drills.dummies')}: {summary.totalDummies}
                      </Typography>
                      <Typography variant="body2">
                        • {t('drills.players')}: {summary.totalPlayers}
                      </Typography>
                      {summary.totalEquipment.size > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {t('drills.equipment')}:
                          </Typography>
                          {Array.from(summary.totalEquipment.entries()).map(([eqId, count]) => (
                            <Typography key={eqId} variant="body2" sx={{ ml: 2 }}>
                              • {getEquipmentName(eqId)} x {count}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })()}
              </Alert>
            )}

            <TextField
              label={t('drills.notes')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder={t('drills.notesPlaceholder')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim() || formData.drills.length === 0}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
