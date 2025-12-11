import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useI18n } from '../../i18n/I18nProvider';
import type { Division, DivisionFormData, Team, TeamFormData } from '../../types/division';
import {
  getAllDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamsByDivision,
} from '../../services/divisions';
import { getTeamBranding } from '../../services/teamSettings';
import { toast } from 'react-toastify';

export const DivisionManager: React.FC = () => {
  const { t } = useI18n();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionDialogOpen, setDivisionDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedDivisionForTeam, setSelectedDivisionForTeam] = useState<string>('');
  const [defaultTeamName, setDefaultTeamName] = useState<string>('');

  const [divisionForm, setDivisionForm] = useState<DivisionFormData>({
    name: '',
    conference: 'A',
    season: new Date().getFullYear().toString(),
  });

  const [teamForm, setTeamForm] = useState<TeamFormData>({
    name: '',
    divisionId: '',
    logoUrl: '',
  });

  useEffect(() => {
    loadDivisions();
    loadTeamName();
  }, []);

  const loadTeamName = async () => {
    try {
      const branding = await getTeamBranding();
      // Use appName (full name) if available, otherwise fall back to teamName
      setDefaultTeamName(branding.appName || branding.teamName || '');
    } catch (error) {
      console.error('Failed to load team name:', error);
    }
  };

  const loadDivisions = async () => {
    try {
      setLoading(true);
      const data = await getAllDivisions();
      // Load teams for each division
      const divisionsWithTeams = await Promise.all(
        data.map(async (division) => {
          const teams = await getTeamsByDivision(division.id);
          return { ...division, teams };
        })
      );
      setDivisions(divisionsWithTeams);
    } catch (error) {
      console.error('Failed to load divisions:', error);
      toast.error('Failed to load divisions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDivision = () => {
    setEditingDivision(null);
    setDivisionForm({
      name: '',
      conference: 'A',
      season: new Date().getFullYear().toString(),
    });
    setDivisionDialogOpen(true);
  };

  const handleEditDivision = (division: Division) => {
    setEditingDivision(division);
    setDivisionForm({
      name: division.name,
      conference: division.conference,
      season: division.season,
    });
    setDivisionDialogOpen(true);
  };

  const handleSaveDivision = async () => {
    try {
      if (editingDivision) {
        await updateDivision(editingDivision.id, divisionForm);
        toast.success('Division updated successfully');
      } else {
        await createDivision(divisionForm);
        toast.success('Division created successfully');
      }
      setDivisionDialogOpen(false);
      loadDivisions();
    } catch (error) {
      console.error('Failed to save division:', error);
      toast.error('Failed to save division');
    }
  };

  const handleDeleteDivision = async (divisionId: string) => {
    if (!confirm('Are you sure you want to delete this division? All teams in this division will also be deleted.')) {
      return;
    }

    try {
      await deleteDivision(divisionId);
      toast.success('Division deleted successfully');
      loadDivisions();
    } catch (error) {
      console.error('Failed to delete division:', error);
      toast.error('Failed to delete division');
    }
  };

  const handleCreateTeam = (divisionId: string) => {
    setEditingTeam(null);
    setSelectedDivisionForTeam(divisionId);
    setTeamForm({
      name: defaultTeamName,
      divisionId: divisionId,
      logoUrl: '',
    });
    setTeamDialogOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setSelectedDivisionForTeam(team.divisionId);
    setTeamForm({
      name: team.name,
      divisionId: team.divisionId,
      logoUrl: team.logoUrl || '',
    });
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, teamForm);
        toast.success('Team updated successfully');
      } else {
        await createTeam(teamForm);
        toast.success('Team created successfully');
      }
      setTeamDialogOpen(false);
      loadDivisions();
    } catch (error) {
      console.error('Failed to save team:', error);
      toast.error('Failed to save team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      await deleteTeam(teamId);
      toast.success('Team deleted successfully');
      loadDivisions();
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error('Failed to delete team');
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Division & Team Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateDivision}>
          Add Division
        </Button>
      </Box>

      {divisions.length === 0 ? (
        <Alert severity="info">No divisions created yet. Create your first division to get started.</Alert>
      ) : (
        <Grid container spacing={3}>
          {divisions.map((division) => (
            <Grid item xs={12} key={division.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6">{division.name}</Typography>
                      <Chip label={`Conference ${division.conference}`} size="small" color="primary" />
                      <Chip label={`Season ${division.season}`} size="small" variant="outlined" />
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleEditDivision(division)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteDivision(division.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Teams ({division.teams?.length || 0})
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleCreateTeam(division.id)}
                      >
                        Add Team
                      </Button>
                    </Box>

                    {division.teams && division.teams.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {division.teams.map((team) => (
                          <Chip
                            key={team.id}
                            label={team.name}
                            onDelete={() => handleDeleteTeam(team.id)}
                            onClick={() => handleEditTeam(team)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No teams yet. Add your first team to this division.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Division Dialog */}
      <Dialog open={divisionDialogOpen} onClose={() => setDivisionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDivision ? 'Edit Division' : 'Create Division'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Division Name"
              value={divisionForm.name}
              onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Conference</InputLabel>
              <Select
                value={divisionForm.conference}
                onChange={(e) => setDivisionForm({ ...divisionForm, conference: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                label="Conference"
              >
                <MenuItem value="A">Conference A</MenuItem>
                <MenuItem value="B">Conference B</MenuItem>
                <MenuItem value="C">Conference C</MenuItem>
                <MenuItem value="D">Conference D</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Season"
              value={divisionForm.season}
              onChange={(e) => setDivisionForm({ ...divisionForm, season: e.target.value })}
              fullWidth
              required
              placeholder="e.g., 2025"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDivisionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDivision} variant="contained" disabled={!divisionForm.name || !divisionForm.season}>
            {editingDivision ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Team Name"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Division</InputLabel>
              <Select
                value={teamForm.divisionId}
                onChange={(e) => setTeamForm({ ...teamForm, divisionId: e.target.value })}
                label="Division"
              >
                {divisions.map((division) => (
                  <MenuItem key={division.id} value={division.id}>
                    {division.name} (Conference {division.conference})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Logo URL (Optional)"
              value={teamForm.logoUrl}
              onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
              fullWidth
              placeholder="https://example.com/logo.png"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTeam} variant="contained" disabled={!teamForm.name || !teamForm.divisionId}>
            {editingTeam ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
