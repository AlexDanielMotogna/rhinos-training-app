import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import {
  getUser,
  getAllUsers,
  saveUser,
  updateUserProfile,
  getCurrentUser,
  syncUserProfileFromBackend,
  syncAllUsersFromBackend,
  type MockUser
} from '../services/userProfile';
import { calculateKPIs } from '../services/kpi';
import { StrengthProfileCard } from '../components/profile/StrengthProfileCard';
import { StrengthBars } from '../components/profile/StrengthBars';
import { SpeedProfileCard } from '../components/profile/SpeedProfileCard';
import { PowerProfileCard } from '../components/profile/PowerProfileCard';
import { AgilityProfileCard } from '../components/profile/AgilityProfileCard';
import { EditProfileDialog } from '../components/profile/EditProfileDialog';
import { AISettings } from '../components/profile/AISettings';
import { getTeamSettings } from '../services/teamSettings';
import { testResultService } from '../services/api';
import type { KPISnapshot } from '../types/kpi';
import type { StrengthSummary, SpeedSummary, PowerSummary, AgilitySummary } from '../types/testing';

export const Profile: React.FC = () => {
  const { t } = useI18n();
  const { playerId } = useParams<{ playerId?: string }>();
  const navigate = useNavigate();
  const currentUser = getUser();

  // If playerId is provided, show that player's profile, otherwise show current user
  const [user, setUser] = useState<MockUser | null>(() => {
    if (playerId) {
      console.log('[PROFILE] Looking for player:', playerId);
      const allUsers = getAllUsers();
      console.log('[PROFILE] getAllUsers() returned:', allUsers, 'Type:', typeof allUsers, 'Is Array:', Array.isArray(allUsers));

      // Ensure allUsers is an array
      if (!Array.isArray(allUsers)) {
        console.error('[PROFILE] getAllUsers() did not return an array!', allUsers);
        return null;
      }

      const foundUser = allUsers.find(u => u.id === playerId);
      console.log('[PROFILE] Found user:', foundUser);
      return foundUser || null;
    }
    return currentUser;
  });

  const isViewingOtherPlayer = playerId && playerId !== currentUser?.id;
  const [kpis, setKpis] = useState<KPISnapshot | null>(null);
  const [strengthSummary, setStrengthSummary] = useState<StrengthSummary | null>(null);
  const [speedSummary, setSpeedSummary] = useState<SpeedSummary | null>(null);
  const [powerSummary, setPowerSummary] = useState<PowerSummary | null>(null);
  const [agilitySummary, setAgilitySummary] = useState<AgilitySummary | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [teamSettings] = useState(() => getTeamSettings());

  // Sync user profile from backend on mount
  useEffect(() => {
    const syncProfile = async () => {
      if (!isViewingOtherPlayer) {
        // Only sync current user's profile
        await syncUserProfileFromBackend();
        // Refresh user data after sync
        const updatedUser = getCurrentUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
      } else if (playerId) {
        // Sync all users to get latest data for other players
        await syncAllUsersFromBackend();
        const allUsers = getAllUsers();
        const updatedPlayer = allUsers.find(u => u.id === playerId);
        if (updatedPlayer) {
          setUser(updatedPlayer);
        }
      }
    };

    syncProfile();
  }, [playerId, isViewingOtherPlayer]);

  useEffect(() => {
    const loadKPIs = async () => {
      if (user) {
        const kpisData = await calculateKPIs(user.id);
        setKpis(kpisData);
      }
    };

    const loadTestResults = async () => {
      if (!user) return;

      console.log('[PROFILE] Loading test results for user:', user.id);

      // Load test results from backend first, fallback to localStorage
      await loadTestResult('strength', setStrengthSummary, 'lastStrengthTest');
      await loadTestResult('speed', setSpeedSummary, 'lastSpeedTest');
      await loadTestResult('power', setPowerSummary, 'lastPowerTest');
      await loadTestResult('agility', setAgilitySummary, 'lastAgilityTest');
    };

    loadKPIs();
    loadTestResults();
  }, [user]);

  // Helper function to load test result from backend or localStorage
  const loadTestResult = async (
    testType: string,
    setSummary: (summary: any) => void,
    localStorageKey: string
  ) => {
    try {
      // Try to load from backend first
      console.log(`[PROFILE] Loading ${testType} test from backend...`);
      
      let backendResult;
      if (isViewingOtherPlayer && user) {
        // Loading for another user - use the new endpoint
        console.log(`[PROFILE] Loading ${testType} test for user ${user.id}...`);
        backendResult = await testResultService.getLatestForUser(testType, user.id);
      } else {
        // Loading for current user - use existing endpoint
        backendResult = await testResultService.getLatest(testType);
      }
      
      if (backendResult && typeof backendResult === 'object' && 'testData' in backendResult) {
        const testData = (backendResult as any).testData;
        console.log(`[PROFILE] ✅ Loaded ${testType} test from backend:`, testData);
        setSummary(testData);
        
        // Only update localStorage cache for current user's own data
        if (!isViewingOtherPlayer) {
          localStorage.setItem(localStorageKey, JSON.stringify(testData));
        }
        return;
      }
    } catch (error) {
      console.warn(`[PROFILE] ⚠️ Failed to load ${testType} test from backend:`, error);
    }

    // Fallback to localStorage (only for current user's own profile)
    if (!isViewingOtherPlayer) {
      const localData = localStorage.getItem(localStorageKey);
      if (localData) {
        try {
          console.log(`[PROFILE] 📦 Loading ${testType} test from localStorage`);
          setSummary(JSON.parse(localData));
        } catch (e) {
          console.error(`[PROFILE] ❌ Failed to parse ${testType} test data from localStorage:`, e);
        }
      } else {
        console.log(`[PROFILE] 📭 No ${testType} test data found in backend or localStorage`);
      }
    } else {
      console.log(`[PROFILE] 📭 No ${testType} test data found in backend for visited user`);
    }
  };

  if (!user || !kpis) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  const getComplianceColor = (percent: number) => {
    if (percent >= 80) return 'success.main';
    if (percent >= 60) return 'warning.main';
    return 'error.main';
  };

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
              {user.sex && <Chip label={t(`auth.${user.sex}`)} size="small" />}
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
                    onClick={() => window.open(`https://instagram.com/${user.instagram?.replace('@', '')}`, '_blank')}
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
                    onClick={() => window.open(`https://tiktok.com/@${user.tiktok?.replace('@', '')}`, '_blank')}
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

      {/* Team Settings Card */}
      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('teamSettings.title')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarMonthIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('teamSettings.seasonPhase')}
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {t(`teamSettings.phase.${teamSettings.seasonPhase}`)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'warning.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <WorkspacePremiumIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('teamSettings.teamLevel')}
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {t(`teamSettings.level.${teamSettings.teamLevel}`)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
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

      {/* Privacy Settings - Only show for own profile */}
      {!isViewingOtherPlayer && (
        <Box sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('profile.privacySettings')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={user.metricsPublic ?? true}
                    onChange={async (e) => {
                      const newValue = e.target.checked;
                      // Update local state immediately for responsiveness
                      const updatedUser = { ...user, metricsPublic: newValue };
                      setUser(updatedUser);

                      // Sync with backend
                      try {
                        await updateUserProfile({ metricsPublic: newValue });
                      } catch (error) {
                        console.error('Failed to update privacy settings:', error);
                        // Revert on error
                        setUser(user);
                      }
                    }}
                  />
                }
                label={t('profile.makeMetricsPublic')}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {t('profile.metricsPublicHelp')}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Check if metrics should be shown */}
      {(currentUser?.role === 'coach' || !isViewingOtherPlayer || user.metricsPublic !== false) ? (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {t('profile.metrics')}
          </Typography>

          {/* This Week Section */}
          <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('profile.thisWeek')} (Week {kpis.currentWeek}/{kpis.totalWeeks})
          </Typography>

          {/* Training Compliance */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('profile.trainingCompliance')}
              </Typography>
              <Typography variant="h6" sx={{ color: getComplianceColor(kpis.trainingCompliance) }}>
                {kpis.trainingCompliance}%
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 8, backgroundColor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${kpis.trainingCompliance}%`,
                  height: '100%',
                  backgroundColor: getComplianceColor(kpis.trainingCompliance),
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>

          {/* Breakdown */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1.5, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('profile.coachPlans')}
                </Typography>
                <Typography variant="h6">
                  {kpis.coachPlansCompleted}/{kpis.coachPlansAssigned}
                  {kpis.coachPlansAssigned > 0 && (
                    <Typography component="span" variant="body2" color={kpis.coachPlansCompleted === kpis.coachPlansAssigned ? 'success.main' : 'text.secondary'} sx={{ ml: 1 }}>
                      {kpis.coachPlansCompleted === kpis.coachPlansAssigned ? '✓ 100%' : `${Math.round((kpis.coachPlansCompleted / kpis.coachPlansAssigned) * 100)}%`}
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1.5, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('profile.teamSessions')}
                </Typography>
                <Typography variant="h6">
                  {kpis.teamSessionsAttended}/{kpis.teamSessionsTotal}
                  {kpis.teamSessionsTotal > 0 && (
                    <Typography component="span" variant="body2" color={kpis.teamSessionsAttended === kpis.teamSessionsTotal ? 'success.main' : 'text.secondary'} sx={{ ml: 1 }}>
                      {kpis.teamSessionsAttended === kpis.teamSessionsTotal ? '✓ 100%' : `${Math.round((kpis.teamSessionsAttended / kpis.teamSessionsTotal) * 100)}%`}
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1.5, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('profile.freeWorkouts')}
                </Typography>
                <Typography variant="h6">
                  {kpis.freeWorkouts}
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    +{kpis.freeWorkoutsMinutes} min
                  </Typography>
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Total Volume */}
          <Box sx={{ textAlign: 'center', pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="caption" color="text.secondary">
              {t('profile.totalVolume')}
            </Typography>
            <Typography variant="h5" color="primary.main">
              {kpis.totalVolume} {t('profile.minutes')}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('profile.attendance')}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('profile.teamSessionsAttended')}
              </Typography>
              <Typography variant="h6">
                {kpis.totalTeamSessionsAttended}/{kpis.totalTeamSessionsScheduled} ({kpis.attendanceRate}%)
              </Typography>
            </Box>
            <Chip
              label={t(`profile.attendanceStatus.${kpis.attendanceStatus}`)}
              color={
                kpis.attendanceStatus === 'on_time' ? 'success' :
                kpis.attendanceStatus === 'late' ? 'warning' :
                kpis.attendanceStatus === 'absent' ? 'error' : 'default'
              }
            />
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
          <StrengthProfileCard summary={strengthSummary} change={kpis.strengthScore.change} isViewingOtherPlayer={!!isViewingOtherPlayer} />
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
          <SpeedProfileCard summary={speedSummary} change={kpis.speedScore.change} isViewingOtherPlayer={!!isViewingOtherPlayer} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <PowerProfileCard summary={powerSummary} change={kpis.powerScore.change} isViewingOtherPlayer={!!isViewingOtherPlayer} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <AgilityProfileCard summary={agilitySummary} change={kpis.agilityScore.change} isViewingOtherPlayer={!!isViewingOtherPlayer} />
        </Grid>
      </Grid>
        </>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('profile.metricsPrivate')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('profile.metricsPrivateMessage')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* AI Settings - Only show for own profile */}
      {!isViewingOtherPlayer && (
        <Box sx={{ mb: 3 }}>
          <AISettings />
        </Box>
      )}
    </Box>
  );
};
