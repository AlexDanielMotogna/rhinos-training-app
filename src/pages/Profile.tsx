import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import InstagramIcon from '@mui/icons-material/Instagram';
import VideocamIcon from '@mui/icons-material/Videocam';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { getUser, getMockKPIs, getMockProjection, getAllUsers, type MockUser } from '../services/mock';
import { StrengthProfileCard } from '../components/profile/StrengthProfileCard';
import { StrengthBars } from '../components/profile/StrengthBars';
import { SpeedProfileCard } from '../components/profile/SpeedProfileCard';
import { PowerProfileCard } from '../components/profile/PowerProfileCard';
import { AgilityProfileCard } from '../components/profile/AgilityProfileCard';
import { EditProfileDialog } from '../components/profile/EditProfileDialog';
import type { KPISnapshot, ProjectionRow } from '../types/kpi';
import type { StrengthSummary, SpeedSummary, PowerSummary, AgilitySummary } from '../types/testing';

export const Profile: React.FC = () => {
  const { t } = useI18n();
  const { playerId } = useParams<{ playerId?: string }>();
  const navigate = useNavigate();
  const currentUser = getUser();

  // If playerId is provided, show that player's profile, otherwise show current user
  const [user, setUser] = useState<MockUser | null>(() => {
    if (playerId) {
      const allUsers = getAllUsers();
      return allUsers.find(u => u.id === playerId) || null;
    }
    return currentUser;
  });

  const isViewingOtherPlayer = playerId && playerId !== currentUser?.id;
  const [kpis, setKpis] = useState<KPISnapshot | null>(null);
  const [projection, setProjection] = useState<ProjectionRow[]>([]);
  const [strengthSummary, setStrengthSummary] = useState<StrengthSummary | null>(null);
  const [speedSummary, setSpeedSummary] = useState<SpeedSummary | null>(null);
  const [powerSummary, setPowerSummary] = useState<PowerSummary | null>(null);
  const [agilitySummary, setAgilitySummary] = useState<AgilitySummary | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    setKpis(getMockKPIs());
    setProjection(getMockProjection());

    // Load last strength test from localStorage
    const lastStrengthTest = localStorage.getItem('lastStrengthTest');
    if (lastStrengthTest) {
      try {
        setStrengthSummary(JSON.parse(lastStrengthTest));
      } catch (e) {
        console.error('Failed to parse strength test data', e);
      }
    }

    // Load last speed test from localStorage
    const lastSpeedTest = localStorage.getItem('lastSpeedTest');
    if (lastSpeedTest) {
      try {
        setSpeedSummary(JSON.parse(lastSpeedTest));
      } catch (e) {
        console.error('Failed to parse speed test data', e);
      }
    }

    // Load last power test from localStorage
    const lastPowerTest = localStorage.getItem('lastPowerTest');
    if (lastPowerTest) {
      try {
        setPowerSummary(JSON.parse(lastPowerTest));
      } catch (e) {
        console.error('Failed to parse power test data', e);
      }
    }

    // Load last agility test from localStorage
    const lastAgilityTest = localStorage.getItem('lastAgilityTest');
    if (lastAgilityTest) {
      try {
        setAgilitySummary(JSON.parse(lastAgilityTest));
      } catch (e) {
        console.error('Failed to parse agility test data', e);
      }
    }
  }, []);

  if (!user || !kpis) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  const metricCards = [
    { label: t('profile.level'), value: kpis.levelScore, color: 'primary.main' },
    { label: t('profile.weeklyScore'), value: kpis.weeklyScore, color: 'secondary.main' },
    { label: t('profile.weeklyMinutes'), value: kpis.weeklyMinutes, color: 'success.main' },
  ];

  const detailMetrics = [
    { label: t('profile.planMinutes'), value: `${kpis.planMinutes} min` },
    { label: t('profile.freeMinutes'), value: `${kpis.freeMinutes} min` },
    { label: t('profile.freeShare'), value: `${kpis.freeSharePct}%` },
  ];

  return (
    <Box>
      {isViewingOtherPlayer && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/team')}
          sx={{ mb: 2 }}
        >
          {t('common.back')}
        </Button>
      )}

      <Typography variant="h4" sx={{ mb: 3 }}>
        {isViewingOtherPlayer ? user.name : t('nav.profile')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {user.jerseyNumber ? `#${user.jerseyNumber}` : '?'}
                </Box>
                <Box>
                  <Typography variant="h6">{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`position.${user.position}` as any)}
                  </Typography>
                </Box>
              </Box>
              {!isViewingOtherPlayer && (
                <IconButton onClick={() => setEditDialogOpen(true)} color="primary">
                  <EditIcon />
                </IconButton>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Chip label={`${user.age} years`} size="small" />
              <Chip label={`${user.weightKg} kg`} size="small" />
              <Chip label={`${user.heightCm} cm`} size="small" />
            </Box>
            {(user.phone || user.instagram || user.snapchat || user.tiktok || user.hudl) && (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
                {user.phone && (
                  <Box
                    onClick={() => window.open(`tel:${user.phone}`, '_self')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' },
                      borderRadius: '8px',
                      backgroundColor: 'background.paper',
                      boxShadow: 1,
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PhoneIcon sx={{ fontSize: 24, color: 'secondary.main' }} />
                  </Box>
                )}
                {user.instagram && (
                  <Box
                    onClick={() => window.open(`https://instagram.com/${user.instagram.replace('@', '')}`, '_blank')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' },
                      borderRadius: '8px',
                      backgroundColor: 'background.paper',
                      boxShadow: 1,
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      component="img"
                      src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                      alt="Instagram"
                      sx={{ width: 24, height: 24, objectFit: 'contain' }}
                    />
                  </Box>
                )}
                {user.snapchat && (
                  <Box
                    onClick={() => window.open(`https://snapchat.com/add/${user.snapchat}`, '_blank')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' },
                      borderRadius: '8px',
                      backgroundColor: 'background.paper',
                      boxShadow: 1,
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      component="img"
                      src="https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg"
                      alt="Snapchat"
                      sx={{ width: 24, height: 24, objectFit: 'contain' }}
                    />
                  </Box>
                )}
                {user.tiktok && (
                  <Box
                    onClick={() => window.open(`https://tiktok.com/@${user.tiktok.replace('@', '')}`, '_blank')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' },
                      borderRadius: '8px',
                      backgroundColor: 'background.paper',
                      boxShadow: 1,
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      component="img"
                      src="https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png"
                      alt="TikTok"
                      sx={{ width: 24, height: 24, objectFit: 'contain' }}
                    />
                  </Box>
                )}
                {user.hudl && (
                  <Box
                    onClick={() => window.open(user.hudl, '_blank')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' },
                      borderRadius: '8px',
                      backgroundColor: 'background.paper',
                      boxShadow: 1,
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      component="img"
                      src="https://www.freelogovectors.net/wp-content/uploads/2018/10/Hudl_logo.png"
                      alt="Hudl"
                      sx={{ width: 24, height: 24, objectFit: 'contain' }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Edit Profile Dialog */}
      {user && (
        <EditProfileDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          user={user}
          onSave={(updatedUser) => setUser(updatedUser)}
        />
      )}

      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('profile.metrics')}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metricCards.map((metric) => (
          <Grid item xs={12} sm={4} key={metric.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: metric.color, fontWeight: 700 }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {detailMetrics.map((metric) => (
          <Grid item xs={12} sm={4} key={metric.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h6">{metric.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('profile.labels')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {kpis.labels.map((label) => (
              <Chip
                key={label}
                label={t(`label.${label}` as any)}
                color="secondary"
                size="medium"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Performance Testing Results */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('profile.performanceTests')}
      </Typography>

      {/* Strength */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <StrengthProfileCard summary={strengthSummary} />
        </Grid>
        <Grid item xs={12} md={6}>
          {strengthSummary && (
            <StrengthBars
              segments={{
                legs: strengthSummary.bySegment.legs.score,
                arms: strengthSummary.bySegment.arms.score,
                back: strengthSummary.bySegment.back.score,
                shoulders: strengthSummary.bySegment.shoulders.score,
                core: strengthSummary.bySegment.core.score,
              }}
              meta={{
                legs: strengthSummary.bySegment.legs.detail,
                arms: strengthSummary.bySegment.arms.detail,
                back: strengthSummary.bySegment.back.detail,
                shoulders: strengthSummary.bySegment.shoulders.detail,
                core: strengthSummary.bySegment.core.detail,
              }}
            />
          )}
        </Grid>
      </Grid>

      {/* Speed, Power, Agility */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <SpeedProfileCard summary={speedSummary} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <PowerProfileCard summary={powerSummary} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <AgilityProfileCard summary={agilitySummary} />
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('profile.projection')}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Week</TableCell>
              <TableCell align="right">{t('profile.level')}</TableCell>
              <TableCell align="right">{t('profile.compliance')} %</TableCell>
              <TableCell align="right">{t('profile.totalMinutes')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projection.map((row) => (
              <TableRow key={row.week}>
                <TableCell>{row.week}</TableCell>
                <TableCell align="right">{row.score}</TableCell>
                <TableCell align="right">{row.compliance.toFixed(1)}</TableCell>
                <TableCell align="right">{row.totalMin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
