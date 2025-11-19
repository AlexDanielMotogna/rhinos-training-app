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
} from '@mui/material';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { Match, Conference } from '../types/match';
import { getAllMatches, getMatchesByTeam } from '../services/matches';
import { useI18n } from '../i18n/I18nProvider';

type ViewMode = 'all' | 'rhinos';

export const Spielplan: React.FC = () => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('rhinos');
  const [selectedConference, setSelectedConference] = useState<Conference | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [displayedMatches, setDisplayedMatches] = useState<Match[]>([]);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [allMatches, viewMode, selectedConference, selectedWeek]);

  const loadMatches = async () => {
    const matches = await getAllMatches();
    // Sort by week and date
    matches.sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    setAllMatches(matches);
  };

  const filterMatches = () => {
    let filtered = [...allMatches];

    // Filter by view mode
    if (viewMode === 'rhinos') {
      filtered = filtered.filter(
        m => m.homeTeam === 'Rhinos' || m.awayTeam === 'Rhinos'
      );
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
    if (match.isIronBowl) return { label: 'Iron Bowl', color: 'error' as const };
    if (match.isSemifinal) return { label: 'Semifinal', color: 'warning' as const };
    if (match.isRelegation) return { label: 'Relegation', color: 'info' as const };
    return null;
  };

  const isRhinosMatch = (match: Match) => {
    return match.homeTeam === 'Rhinos' || match.awayTeam === 'Rhinos';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
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

  const rhinosMatches = allMatches.filter(isRhinosMatch);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SportsFootballIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Spielplan 2025
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {rhinosMatches.length}
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
                {allMatches.length}
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
                {availableConferences.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conferences
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {availableWeeks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Weeks
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
          value="rhinos"
          label={`Rhinos Matches (${rhinosMatches.length})`}
          icon={<SportsFootballIcon />}
          iconPosition="start"
        />
        <Tab
          value="all"
          label={`All Matches (${allMatches.length})`}
          icon={<CalendarMonthIcon />}
          iconPosition="start"
        />
      </Tabs>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Conference</InputLabel>
          <Select
            value={selectedConference}
            label="Conference"
            onChange={(e) => setSelectedConference(e.target.value as Conference | 'all')}
          >
            <MenuItem value="all">All Conferences</MenuItem>
            {availableConferences.map((conf) => (
              <MenuItem key={conf} value={conf}>
                Conference {conf}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Week</InputLabel>
          <Select
            value={selectedWeek}
            label="Week"
            onChange={(e) => setSelectedWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <MenuItem value="all">All Weeks</MenuItem>
            {availableWeeks.map((week) => (
              <MenuItem key={week} value={week}>
                Week {week}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* No matches message */}
      {displayedMatches.length === 0 && (
        <Alert severity="info">
          {viewMode === 'rhinos'
            ? 'No Rhinos matches scheduled yet. Check back later or view all matches.'
            : 'No matches scheduled yet. Contact your coach to set up the season schedule.'}
        </Alert>
      )}

      {/* Matches by Week */}
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
                    <TableCell>Spielnr.</TableCell>
                    <TableCell>Home</TableCell>
                    <TableCell>Away</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Kickoff</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Conf.</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weekMatches.map((match) => {
                    const typeInfo = getMatchTypeLabel(match);
                    const isRhinos = isRhinosMatch(match);

                    return (
                      <TableRow
                        key={match.id}
                        sx={{
                          backgroundColor: isRhinos ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                          '&:hover': {
                            backgroundColor: isRhinos ? 'rgba(76, 175, 80, 0.15)' : undefined,
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
                              fontWeight: match.homeTeam === 'Rhinos' ? 700 : 400,
                              color: match.homeTeam === 'Rhinos' ? 'success.main' : 'inherit',
                            }}
                          >
                            {match.homeTeam}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: match.awayTeam === 'Rhinos' ? 700 : 400,
                              color: match.awayTeam === 'Rhinos' ? 'success.main' : 'inherit',
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
  );
};
