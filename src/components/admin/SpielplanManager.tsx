import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import type { Match, MatchFormData, Conference } from '../../types/match';
import {
  getAllMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  bulkCreateMatches,
} from '../../services/matches';
import { getUser } from '../../services/userProfile';

export const SpielplanManager: React.FC = () => {
  const user = getUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState<MatchFormData>({
    spielnummer: '',
    homeTeam: '',
    awayTeam: '',
    date: '',
    kickoff: '',
    spielort: '',
    week: 1,
    weekLabel: '',
    conference: 'A',
    isRelegation: false,
    isSemifinal: false,
    isIronBowl: false,
  });

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const data = await getAllMatches();
    // Sort by week and date
    data.sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    setMatches(data);
  };

  const handleOpenDialog = (match?: Match) => {
    if (match) {
      setEditingMatch(match);
      setFormData({
        spielnummer: match.spielnummer,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        date: match.date,
        kickoff: match.kickoff,
        spielort: match.spielort,
        week: match.week,
        weekLabel: match.weekLabel,
        conference: match.conference,
        isRelegation: match.isRelegation,
        isSemifinal: match.isSemifinal,
        isIronBowl: match.isIronBowl,
      });
    } else {
      setEditingMatch(null);
      setFormData({
        spielnummer: '',
        homeTeam: '',
        awayTeam: '',
        date: '',
        kickoff: '',
        spielort: '',
        week: 1,
        weekLabel: '',
        conference: 'A',
        isRelegation: false,
        isSemifinal: false,
        isIronBowl: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMatch(null);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      if (editingMatch) {
        await updateMatch(editingMatch.id, formData);
      } else {
        await createMatch(formData, user.id);
      }
      await loadMatches();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save match:', error);
      alert('Failed to save match');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await deleteMatch(id);
      await loadMatches();
    } catch (error) {
      console.error('Failed to delete match:', error);
      alert('Failed to delete match');
    }
  };

  const getMatchTypeLabel = (match: Match) => {
    if (match.isIronBowl) return { label: 'Iron Bowl', color: 'error' as const };
    if (match.isSemifinal) return { label: 'Semifinal', color: 'warning' as const };
    if (match.isRelegation) return { label: 'Relegation', color: 'info' as const };
    return null;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Spielplan Manager</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Match
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage the season schedule (Spielplan). All matches will be visible to players.
        Rhinos matches will be highlighted automatically.
      </Alert>

      {/* Statistics Card */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {matches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Matches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {matches.filter(m => m.homeTeam === 'Rhinos' || m.awayTeam === 'Rhinos').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rhinos Matches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {new Set(matches.map(m => m.week)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Weeks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {new Set(matches.map(m => m.conference)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conferences
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Matches Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Spielnr.</TableCell>
              <TableCell>Home</TableCell>
              <TableCell>Away</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Kickoff</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Week</TableCell>
              <TableCell>Conf.</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((match) => {
              const typeInfo = getMatchTypeLabel(match);
              const isRhinosMatch = match.homeTeam === 'Rhinos' || match.awayTeam === 'Rhinos';

              return (
                <TableRow
                  key={match.id}
                  sx={{
                    backgroundColor: isRhinosMatch ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                    '&:hover': {
                      backgroundColor: isRhinosMatch ? 'rgba(76, 175, 80, 0.15)' : undefined,
                    },
                  }}
                >
                  <TableCell>{match.spielnummer}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: match.homeTeam === 'Rhinos' ? 700 : 400 }}
                    >
                      {match.homeTeam}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: match.awayTeam === 'Rhinos' ? 700 : 400 }}
                    >
                      {match.awayTeam}
                    </Typography>
                  </TableCell>
                  <TableCell>{match.date}</TableCell>
                  <TableCell>{match.kickoff}</TableCell>
                  <TableCell>{match.spielort}</TableCell>
                  <TableCell>
                    <Chip label={`W${match.week}`} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={match.conference} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    {typeInfo && (
                      <Chip label={typeInfo.label} size="small" color={typeInfo.color} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(match)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(match.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {matches.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No matches yet. Click "Add Match" to create the schedule.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingMatch ? 'Edit Match' : 'Add Match'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Spielnummer"
                value={formData.spielnummer}
                onChange={(e) => setFormData({ ...formData, spielnummer: e.target.value })}
                placeholder="25201"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Conference</InputLabel>
                <Select
                  value={formData.conference}
                  label="Conference"
                  onChange={(e) => setFormData({ ...formData, conference: e.target.value as Conference })}
                >
                  <MenuItem value="A">Conference A</MenuItem>
                  <MenuItem value="B">Conference B</MenuItem>
                  <MenuItem value="C">Conference C</MenuItem>
                  <MenuItem value="D">Conference D</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Home Team"
                value={formData.homeTeam}
                onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                placeholder="Gladiators"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Away Team"
                value={formData.awayTeam}
                onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                placeholder="Rhinos"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kickoff"
                type="time"
                value={formData.kickoff}
                onChange={(e) => setFormData({ ...formData, kickoff: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Spielort (Location)"
                value={formData.spielort}
                onChange={(e) => setFormData({ ...formData, spielort: e.target.value })}
                placeholder="Colosseum Noricum"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Week Number"
                type="number"
                value={formData.week}
                onChange={(e) => setFormData({ ...formData, week: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Week Label"
                value={formData.weekLabel}
                onChange={(e) => setFormData({ ...formData, weekLabel: e.target.value })}
                placeholder="Woche 1 - 29./30.März"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Match Type (Optional)
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isRelegation || false}
                    onChange={(e) => setFormData({ ...formData, isRelegation: e.target.checked })}
                  />
                }
                label="Relegation"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isSemifinal || false}
                    onChange={(e) => setFormData({ ...formData, isSemifinal: e.target.checked })}
                  />
                }
                label="Semifinal"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isIronBowl || false}
                    onChange={(e) => setFormData({ ...formData, isIronBowl: e.target.checked })}
                  />
                }
                label="Iron Bowl"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.spielnummer ||
              !formData.homeTeam ||
              !formData.awayTeam ||
              !formData.date ||
              !formData.kickoff ||
              !formData.spielort
            }
          >
            {editingMatch ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
