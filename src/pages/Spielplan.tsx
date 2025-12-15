import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  TextField,
  IconButton,
  useTheme,
} from '@mui/material';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StadiumIcon from '@mui/icons-material/Stadium';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import type { Match, Conference } from '../types/match';
import { getAllMatches, updateMatch } from '../services/matches';
import { useI18n } from '../i18n/I18nProvider';
import { getTeamBrandingAsync } from '../services/teamSettings';
import { getUser } from '../services/userProfile';
import { toastService } from '../services/toast';

type ViewMode = 'all' | 'team';

export const Spielplan: React.FC = () => {
  const { t } = useI18n();
  const theme = useTheme();
  const user = getUser();
  const isCoach = user?.role === 'coach';
  const [teamName, setTeamName] = useState<string>('Rhinos'); // Default fallback
  const [viewMode, setViewMode] = useState<ViewMode>('team');
  const [selectedConference, setSelectedConference] = useState<Conference | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [displayedMatches, setDisplayedMatches] = useState<Match[]>([]);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState<{ homeScore: number | null; awayScore: number | null }>({ homeScore: null, awayScore: null });

  // Load team branding from database
  useEffect(() => {
    const loadBranding = async () => {
      const branding = await getTeamBrandingAsync();
      // Use appName (full name) for matching team names in matches
      setTeamName(branding.appName || branding.teamName || 'Rhinos');
    };
    loadBranding();
  }, []);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [allMatches, viewMode, selectedConference, selectedWeek, teamName]);

  const loadMatches = async () => {
    const matches = await getAllMatches();
    // Sort by week and date
    matches.sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    setAllMatches(matches);
  };

  // Extract key words from team name for matching (e.g., "Rhinos" from "Rhinos Training")
  const getTeamKeyWords = (name: string): string[] => {
    const commonWords = ['training', 'team', 'club', 'fc', 'sc', 'sv', 'upper', 'lower', 'north', 'south', 'east', 'west'];
    return name.toLowerCase().split(/\s+/).filter(word =>
      word.length > 2 && !commonWords.includes(word)
    );
  };

  // Helper function to check if a match involves our team
  const matchInvolvesOurTeam = (match: Match): boolean => {
    const ourKeyWords = getTeamKeyWords(teamName);
    const homeWords = match.homeTeam.toLowerCase();
    const awayWords = match.awayTeam.toLowerCase();
    return ourKeyWords.some(keyword =>
      homeWords.includes(keyword) || awayWords.includes(keyword)
    );
  };

  const filterMatches = () => {
    let filtered = [...allMatches];

    // Filter by view mode (show only matches involving our team)
    if (viewMode === 'team') {
      filtered = filtered.filter(matchInvolvesOurTeam);
    }

    // Filter by conference
    if (selectedConference !== 'all') {
      filtered = filtered.filter(m => m.conference === selectedConference);
    }

    // Filter by week
    if (selectedWeek !== 'all') {
      filtered = filtered.filter(m => m.week === selectedWeek);
    }

    setDisplayedMatches(filtered);
  };

  const getMatchTypeLabel = (match: Match) => {
    if (match.isIronBowl) return { label: t('spielplan.ironBowl'), color: 'error' as const };
    if (match.isSemifinal) return { label: t('spielplan.semifinal'), color: 'warning' as const };
    if (match.isRelegation) return { label: t('spielplan.relegation'), color: 'info' as const };
    return null;
  };

  // Reuse the matchInvolvesOurTeam function defined above
  const isTeamMatch = matchInvolvesOurTeam;

  const isMatchPast = (match: Match): boolean => {
    // A match is considered "past" if it has scores recorded OR if the date/time has passed
    const hasScores = match.homeScore !== null && match.awayScore !== null;
    if (hasScores) return true;

    const matchDateTime = new Date(`${match.date}T${match.kickoff}`);
    return matchDateTime < new Date();
  };

  const getOpponent = (match: Match): string => {
    const ourKeyWords = getTeamKeyWords(teamName);
    const isHome = ourKeyWords.some(keyword =>
      match.homeTeam.toLowerCase().includes(keyword)
    );
    return isHome ? match.awayTeam : match.homeTeam;
  };

  const isHomeGame = (match: Match): boolean => {
    const ourKeyWords = getTeamKeyWords(teamName);
    return ourKeyWords.some(keyword =>
      match.homeTeam.toLowerCase().includes(keyword)
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleStartEditScore = (match: Match) => {
    setEditingMatchId(match.id);
    setEditScores({
      homeScore: match.homeScore ?? null,
      awayScore: match.awayScore ?? null,
    });
  };

  const handleCancelEditScore = () => {
    setEditingMatchId(null);
    setEditScores({ homeScore: null, awayScore: null });
  };

  const handleSaveScore = async (matchId: string) => {
    try {
      await updateMatch(matchId, {
        homeScore: editScores.homeScore,
        awayScore: editScores.awayScore,
      });

      toastService.success(t('spielplan.scoreUpdated'));
      setEditingMatchId(null);
      setEditScores({ homeScore: null, awayScore: null });
      await loadMatches(); // Reload matches to reflect changes
    } catch (error) {
      console.error('Failed to update match score:', error);
      toastService.error(t('spielplan.scoreUpdateFailed'));
    }
  };

  // Group matches by week
  const matchesByWeek = displayedMatches.reduce((acc, match) => {
    const week = match.week;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const weeks = Object.keys(matchesByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  const availableConferences = Array.from(new Set(allMatches.map(m => m.conference))).sort() as Conference[];
  const availableWeeks = Array.from(new Set(allMatches.map(m => m.week))).sort((a, b) => a - b);

  const teamMatches = allMatches.filter(isTeamMatch);
  const pastTeamMatches = teamMatches.filter(m => isMatchPast(m));

  // Helper to check if our team is home
  const isOurTeamHome = (match: Match): boolean => {
    const ourKeyWords = getTeamKeyWords(teamName);
    return ourKeyWords.some(keyword =>
      match.homeTeam.toLowerCase().includes(keyword)
    );
  };

  // Calculate games won and lost
  const gamesWon = pastTeamMatches.filter(match => {
    if (match.homeScore == null || match.awayScore == null) return false;
    const isHome = isOurTeamHome(match);
    return isHome ? match.homeScore > match.awayScore : match.awayScore > match.homeScore;
  }).length;

  const gamesLost = pastTeamMatches.filter(match => {
    if (match.homeScore == null || match.awayScore == null) return false;
    const isHome = isOurTeamHome(match);
    return isHome ? match.homeScore < match.awayScore : match.awayScore < match.homeScore;
  }).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SportsFootballIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          {t('spielplan.title')}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {gamesLost}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('spielplan.gamesLost')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="text.secondary">
                {pastTeamMatches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('spielplan.gamesPlayed')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {allMatches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('spielplan.totalMatches')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {gamesWon}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('spielplan.gamesWon')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Mode Tabs */}
      <Tabs
        value={viewMode}
        onChange={(_, value) => setViewMode(value as ViewMode)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          value="team"
          label={`${t('spielplan.teamMatches', { teamName })} (${teamMatches.length})`}
          icon={<SportsFootballIcon />}
          iconPosition="start"
        />
        <Tab
          value="all"
          label={`${t('spielplan.allMatches')} (${allMatches.length})`}
          icon={<CalendarMonthIcon />}
          iconPosition="start"
        />
      </Tabs>

      {/* Filters */}
      {viewMode === 'all' && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('spielplan.conference')}</InputLabel>
            <Select
              value={selectedConference}
              label={t('spielplan.conference')}
              onChange={(e) => setSelectedConference(e.target.value as Conference | 'all')}
            >
              <MenuItem value="all">{t('spielplan.all')} {t('spielplan.conference')}</MenuItem>
              {availableConferences.map((conf) => (
                <MenuItem key={conf} value={conf}>
                  {t('spielplan.conference')} {conf}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('spielplan.week')}</InputLabel>
            <Select
              value={selectedWeek}
              label={t('spielplan.week')}
              onChange={(e) => setSelectedWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <MenuItem value="all">{t('spielplan.all')} {t('spielplan.week')}</MenuItem>
              {availableWeeks.map((week) => (
                <MenuItem key={week} value={week}>
                  {t('spielplan.week')} {week}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* No matches message */}
      {displayedMatches.length === 0 && (
        <Alert severity="info">
          {viewMode === 'team'
            ? t('spielplan.noMatches', { teamName })
            : t('spielplan.noMatchesAll')}
        </Alert>
      )}

      {/* Team Matches - Card View */}
      {viewMode === 'team' && displayedMatches.length > 0 && (
        <Box>
          {weeks.map((week) => {
            const weekMatches = matchesByWeek[week];
            const weekLabel = weekMatches[0]?.weekLabel || `Week ${week}`;

            return (
              <Box key={week} sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                  }}
                >
                  {weekLabel}
                </Typography>

                <Grid container spacing={2}>
                  {weekMatches.map((match) => {
                    const isPast = isMatchPast(match);
                    const opponent = getOpponent(match);
                    const atHome = isHomeGame(match);
                    const typeInfo = getMatchTypeLabel(match);

                    return (
                      <Grid item xs={12} key={match.id}>
                        <Card
                          sx={{
                            position: 'relative',
                            overflow: 'visible',
                            background: isPast
                              ? 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
                              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                            border: 'none',
                            boxShadow: isPast ? 2 : 4,
                            borderRadius: 3,
                            '&:hover': {
                              boxShadow: 8,
                              transform: 'translateY(-4px)',
                              transition: 'all 0.3s ease-in-out',
                            },
                            '&::before': !isPast ? {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '6px',
                              background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)',
                              borderRadius: '12px 12px 0 0',
                            } : {},
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3} alignItems="center">
                              {/* Status Badge */}
                              <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                  {isPast ? (
                                    <Chip
                                      icon={<CheckCircleIcon />}
                                      label={t('spielplan.completed')}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'grey.300',
                                        color: 'grey.700',
                                        fontWeight: 600,
                                      }}
                                    />
                                  ) : (
                                    <Chip
                                      icon={<ScheduleIcon />}
                                      label={t('spielplan.upcoming')}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'success.main',
                                        color: 'white',
                                        fontWeight: 600,
                                      }}
                                    />
                                  )}
                                  <Chip
                                    label={`Conference ${match.conference}`}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'primary.main',
                                      color: 'white',
                                      fontWeight: 600,
                                    }}
                                  />
                                  {typeInfo && (
                                    <Chip
                                      label={typeInfo.label}
                                      size="small"
                                      color={typeInfo.color}
                                      sx={{ fontWeight: 600 }}
                                    />
                                  )}
                                  <Chip
                                    label={`#${match.spielnummer}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderColor: 'primary.main',
                                      color: 'primary.main',
                                      fontWeight: 600,
                                    }}
                                  />
                                </Box>
                              </Grid>

                              {/* Teams */}
                              <Grid item xs={12} md={5}>
                                <Box
                                  sx={{
                                    textAlign: 'center',
                                    p: 2,
                                    borderRadius: 2,
                                    background: atHome
                                      ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.05) 100%)'
                                      : 'transparent',
                                    border: atHome ? '2px solid' : 'none',
                                    borderColor: atHome ? 'success.main' : 'transparent',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  <Typography
                                    variant="h4"
                                    sx={{
                                      fontWeight: 700,
                                      color: isPast ? 'text.secondary' : 'success.main',
                                      mb: 0.5,
                                      letterSpacing: '-0.5px',
                                    }}
                                  >
                                    {atHome ? teamName : opponent}
                                  </Typography>
                                  <Chip
                                    label={atHome ? t('spielplan.home') : t('spielplan.away')}
                                    size="small"
                                    sx={{
                                      backgroundColor: atHome ? 'success.main' : 'grey.300',
                                      color: atHome ? 'white' : 'grey.700',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                    }}
                                  />
                                </Box>
                              </Grid>

                              {/* Score / VS */}
                              <Grid item xs={12} md={2}>
                                <Box
                                  sx={{
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    gap: 1,
                                  }}
                                >
                                  {/* Score Display/Edit */}
                                  {editingMatchId === match.id ? (
                                    // Edit Mode
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={editScores.homeScore ?? ''}
                                          onChange={(e) => setEditScores({
                                            ...editScores,
                                            homeScore: e.target.value === '' ? null : parseInt(e.target.value)
                                          })}
                                          sx={{ width: 60 }}
                                          inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                        />
                                        <Typography variant="h6">-</Typography>
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={editScores.awayScore ?? ''}
                                          onChange={(e) => setEditScores({
                                            ...editScores,
                                            awayScore: e.target.value === '' ? null : parseInt(e.target.value)
                                          })}
                                          sx={{ width: 60 }}
                                          inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                        />
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleSaveScore(match.id)}
                                          sx={{ backgroundColor: 'success.main', color: 'white', '&:hover': { backgroundColor: 'success.dark' } }}
                                        >
                                          <SaveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={handleCancelEditScore}
                                          sx={{ backgroundColor: 'grey.300', '&:hover': { backgroundColor: 'grey.400' } }}
                                        >
                                          <CloseIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  ) : (
                                    // Display Mode
                                    <Box sx={{ position: 'relative' }}>
                                      {match.homeScore !== null && match.awayScore !== null ? (
                                        // Show score
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                          <Typography
                                            variant="h3"
                                            sx={{
                                              fontWeight: 700,
                                              color: 'primary.main',
                                              lineHeight: 1,
                                            }}
                                          >
                                            {match.homeScore} - {match.awayScore}
                                          </Typography>
                                          {isCoach && (
                                            <IconButton
                                              size="small"
                                              onClick={() => handleStartEditScore(match)}
                                              sx={{
                                                mt: 0.5,
                                                '&:hover': { backgroundColor: 'primary.light' },
                                              }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          )}
                                        </Box>
                                      ) : (
                                        // Show VS with edit button for coaches
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                          <Box
                                            sx={{
                                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                              borderRadius: '50%',
                                              width: 56,
                                              height: 56,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              boxShadow: 3,
                                            }}
                                          >
                                            <Typography
                                              variant="h6"
                                              sx={{
                                                fontWeight: 700,
                                                color: 'white',
                                                letterSpacing: '1px',
                                              }}
                                            >
                                              VS
                                            </Typography>
                                          </Box>
                                          {isCoach && (
                                            <IconButton
                                              size="small"
                                              onClick={() => handleStartEditScore(match)}
                                              sx={{
                                                mt: 0.5,
                                                '&:hover': { backgroundColor: 'primary.light' },
                                              }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          )}
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              </Grid>

                              {/* Opponent */}
                              <Grid item xs={12} md={5}>
                                <Box
                                  sx={{
                                    textAlign: 'center',
                                    p: 2,
                                    borderRadius: 2,
                                    background: !atHome
                                      ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.05) 100%)'
                                      : 'transparent',
                                    border: !atHome ? '2px solid' : 'none',
                                    borderColor: !atHome ? 'success.main' : 'transparent',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  <Typography
                                    variant="h4"
                                    sx={{
                                      fontWeight: 700,
                                      color: isPast ? 'text.secondary' : 'text.primary',
                                      mb: 0.5,
                                      letterSpacing: '-0.5px',
                                    }}
                                  >
                                    {atHome ? opponent : teamName}
                                  </Typography>
                                  <Chip
                                    label={atHome ? t('spielplan.away') : t('spielplan.home')}
                                    size="small"
                                    sx={{
                                      backgroundColor: !atHome ? 'success.main' : 'grey.300',
                                      color: !atHome ? 'white' : 'grey.700',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                    }}
                                  />
                                </Box>
                              </Grid>

                              {/* Divider */}
                              <Grid item xs={12}>
                                <Divider
                                  sx={{
                                    borderColor: isPast ? 'grey.300' : 'primary.light',
                                    opacity: 0.5,
                                  }}
                                />
                              </Grid>

                              {/* Match Details */}
                              <Grid item xs={12} sm={6} md={4}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'primary.light',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                      transform: 'scale(1.02)',
                                    },
                                  }}
                                >
                                  <CalendarMonthIcon
                                    sx={{
                                      color: 'primary.main',
                                      fontSize: 28,
                                    }}
                                  />
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                      }}
                                    >
                                      {t('spielplan.date')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                      {formatFullDate(match.date)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={12} sm={6} md={4}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(76, 175, 80, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'success.light',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                      transform: 'scale(1.02)',
                                    },
                                  }}
                                >
                                  <AccessTimeIcon
                                    sx={{
                                      color: 'success.main',
                                      fontSize: 28,
                                    }}
                                  />
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'success.main',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                      }}
                                    >
                                      {t('spielplan.kickoff')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                      {match.kickoff}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={12} md={4}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255, 152, 0, 0.04)',
                                    border: '1px solid',
                                    borderColor: 'warning.light',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 152, 0, 0.08)',
                                      transform: 'scale(1.02)',
                                    },
                                  }}
                                >
                                  <StadiumIcon
                                    sx={{
                                      color: 'warning.main',
                                      fontSize: 28,
                                    }}
                                  />
                                  <Box sx={{ overflow: 'hidden' }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'warning.main',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                      }}
                                    >
                                      {t('spielplan.location')}
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontWeight: 700,
                                        color: 'text.primary',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {match.spielort}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            );
          })}
        </Box>
      )}

      {/* All Matches - Table View */}
      {viewMode === 'all' && displayedMatches.length > 0 && (
        <Box>
          {weeks.map((week) => {
            const weekMatches = matchesByWeek[week];
            const weekLabel = weekMatches[0]?.weekLabel || `Week ${week}`;

            return (
              <Box key={week} sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                  }}
                >
                  {weekLabel}
                </Typography>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('spielplan.gameNumber')}</TableCell>
                        <TableCell>{t('spielplan.home')}</TableCell>
                        <TableCell>{t('spielplan.score')}</TableCell>
                        <TableCell>{t('spielplan.away')}</TableCell>
                        <TableCell>{t('spielplan.date')}</TableCell>
                        <TableCell>{t('spielplan.kickoff')}</TableCell>
                        <TableCell>{t('spielplan.location')}</TableCell>
                        <TableCell>{t('spielplan.conference')}</TableCell>
                        <TableCell>{t('spielplan.type')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {weekMatches.map((match) => {
                        const typeInfo = getMatchTypeLabel(match);
                        const isTeam = isTeamMatch(match);

                        return (
                          <TableRow
                            key={match.id}
                            sx={{
                              backgroundColor: isTeam ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                              '&:hover': {
                                backgroundColor: isTeam ? 'rgba(76, 175, 80, 0.15)' : undefined,
                              },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {match.spielnummer}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: match.homeTeam.includes(teamName) ? 700 : 400,
                                  color: match.homeTeam.includes(teamName) ? 'success.main' : 'inherit',
                                }}
                              >
                                {match.homeTeam}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {editingMatchId === match.id ? (
                                // Edit Mode
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={editScores.homeScore ?? ''}
                                    onChange={(e) => setEditScores({
                                      ...editScores,
                                      homeScore: e.target.value === '' ? null : parseInt(e.target.value)
                                    })}
                                    sx={{ width: 50 }}
                                    inputProps={{ min: 0, style: { textAlign: 'center', padding: '4px' } }}
                                  />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>-</Typography>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={editScores.awayScore ?? ''}
                                    onChange={(e) => setEditScores({
                                      ...editScores,
                                      awayScore: e.target.value === '' ? null : parseInt(e.target.value)
                                    })}
                                    sx={{ width: 50 }}
                                    inputProps={{ min: 0, style: { textAlign: 'center', padding: '4px' } }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSaveScore(match.id)}
                                    sx={{ ml: 0.5 }}
                                  >
                                    <SaveIcon fontSize="small" color="success" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={handleCancelEditScore}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ) : (
                                // Display Mode
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                  {match.homeScore !== null && match.awayScore !== null ? (
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 700, color: 'primary.main' }}
                                    >
                                      {match.homeScore} - {match.awayScore}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                  )}
                                  {isCoach && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleStartEditScore(match)}
                                      sx={{ ml: 0.5 }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: match.awayTeam.includes(teamName) ? 700 : 400,
                                  color: match.awayTeam.includes(teamName) ? 'success.main' : 'inherit',
                                }}
                              >
                                {match.awayTeam}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarMonthIcon fontSize="small" color="action" />
                                <Typography variant="body2">{formatDate(match.date)}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {match.kickoff}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnIcon fontSize="small" color="action" />
                                <Typography variant="body2">{match.spielort}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={match.conference} size="small" color="primary" />
                            </TableCell>
                            <TableCell>
                              {typeInfo && (
                                <Chip label={typeInfo.label} size="small" color={typeInfo.color} />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
