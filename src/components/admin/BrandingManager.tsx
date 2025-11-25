import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getUser } from '../../services/userProfile';
import {
  getTeamBrandingAsync,
  updateTeamBranding,
  getTeamSettings,
  updateTeamSettings,
  getTeamLevelLabel,
  getTeamCategoryLabel
} from '../../services/teamSettings';
import type { TeamBranding, TeamLevel, TeamCategory, SeasonPhase } from '../../types/teamSettings';
import { DEFAULT_TEAM_BRANDING } from '../../types/teamSettings';
import { toastService } from '../../services/toast';

export const BrandingManager: React.FC = () => {
  const user = getUser();
  const teamSettings = getTeamSettings();
  const [branding, setBranding] = useState<TeamBranding>(DEFAULT_TEAM_BRANDING);
  const [teamLevel, setTeamLevel] = useState<TeamLevel>(teamSettings.teamLevel);
  const [teamCategory, setTeamCategory] = useState<TeamCategory>(teamSettings.teamCategory);
  const [seasonPhase, setSeasonPhase] = useState<SeasonPhase>(teamSettings.seasonPhase);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewLogo, setPreviewLogo] = useState('');

  // Load branding from database on mount
  useEffect(() => {
    const loadBranding = async () => {
      const brandingData = await getTeamBrandingAsync();
      setBranding(brandingData);
      setPreviewLogo(brandingData.logoUrl || '');
    };
    loadBranding();
  }, []);

  useEffect(() => {
    setPreviewLogo(branding.logoUrl || '');
  }, [branding.logoUrl]);

  const handleSave = async () => {
    if (!user) return;

    try {
      // Update team settings (season phase, level, category)
      await updateTeamSettings(seasonPhase, teamLevel, teamCategory, user.name);

      // Update branding
      await updateTeamBranding(branding, user.name);

      toastService.success('Settings saved successfully! Page will reload to apply changes.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      toastService.error(`Error: ${errorMessage}`);
    }
  };

  const handleReset = () => {
    setBranding(DEFAULT_TEAM_BRANDING);
    setPreviewLogo(DEFAULT_TEAM_BRANDING.logoUrl || '');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        App Configuration & Branding
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Without a backend server, images must be placed in the <code>public/</code> folder
          or use external URLs. Changes will apply after saving and refreshing the page.
        </Typography>
      </Alert>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Branding updated successfully! Refreshing page...
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Application Name */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Application Name
              </Typography>
              <TextField
                fullWidth
                label="App Name"
                value={branding.appName}
                onChange={(e) => setBranding({ ...branding, appName: e.target.value })}
                helperText="This will appear in the browser tab title and navigation"
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Team Classification */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Team Classification
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Team Level</InputLabel>
                <Select
                  value={teamLevel}
                  label="Team Level"
                  onChange={(e) => setTeamLevel(e.target.value as TeamLevel)}
                >
                  <MenuItem value="amateur">Amateur</MenuItem>
                  <MenuItem value="semi-pro">Semi-Pro</MenuItem>
                  <MenuItem value="pro">Professional</MenuItem>
                  <MenuItem value="youth">Youth</MenuItem>
                  <MenuItem value="recreational">Recreational</MenuItem>
                </Select>
                <FormHelperText>Competitive level of the team</FormHelperText>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Team Category</InputLabel>
                <Select
                  value={teamCategory}
                  label="Team Category"
                  onChange={(e) => setTeamCategory(e.target.value as TeamCategory)}
                >
                  <MenuItem value="juvenil">Juvenil (Youth/Junior)</MenuItem>
                  <MenuItem value="principal">Principal (First Team)</MenuItem>
                  <MenuItem value="reserves">Reserves (Second Team)</MenuItem>
                  <MenuItem value="academy">Academy (Development)</MenuItem>
                </Select>
                <FormHelperText>Age/organizational classification</FormHelperText>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Logo Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Logo
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>How to add your logo:</strong>
                  <br />
                  1. Place your logo in the <code>public/</code> folder (e.g., <code>public/my-logo.png</code>)
                  <br />
                  2. Enter the path here: <code>/my-logo.png</code>
                  <br />
                  OR use an external URL (e.g., <code>https://yoursite.com/logo.png</code>)
                </Typography>
              </Alert>
              <TextField
                fullWidth
                label="Logo URL"
                value={branding.logoUrl || ''}
                onChange={(e) => {
                  setBranding({ ...branding, logoUrl: e.target.value });
                  setPreviewLogo(e.target.value);
                }}
                placeholder="/my-logo.png or https://example.com/logo.png"
                helperText="Path to logo in public folder or external URL"
                sx={{ mb: 2 }}
              />

              {previewLogo && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Logo Preview:
                  </Typography>
                  <Avatar
                    src={previewLogo}
                    alt="Logo Preview"
                    sx={{ width: 80, height: 80, mx: 'auto' }}
                    variant="square"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Favicon Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Favicon
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Place your favicon.ico or favicon.png in <code>public/</code> folder
                </Typography>
              </Alert>
              <TextField
                fullWidth
                label="Favicon URL"
                value={branding.faviconUrl || ''}
                onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
                placeholder="/favicon.ico or /favicon.png"
                helperText="Icon shown in browser tab (16x16 or 32x32)"
                sx={{ mb: 2 }}
              />
              <Alert severity="warning" sx={{ mt: 1 }}>
                The favicon will update when you save and refresh the page.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Color Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Theme Colors
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    value={branding.primaryColor || '#203731'}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    helperText="Main theme color"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Secondary Color"
                    type="color"
                    value={branding.secondaryColor || '#FFB612'}
                    onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                    helperText="Accent color"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Note: Color changes require a page refresh to fully apply.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Configuration Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Current Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    App Name:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {branding.appName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Primary Color:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: branding.primaryColor,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                      }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {branding.primaryColor}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Secondary Color:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: branding.secondaryColor,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                      }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {branding.secondaryColor}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Logo Status:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {branding.logoUrl ? 'Configured' : 'Not Set'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              color="primary"
            >
              Save Branding
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
