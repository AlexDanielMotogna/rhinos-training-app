import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { getUser } from '../../services/userProfile';
import {
  getTeamBrandingAsync,
  updateTeamBranding,
  getTeamSettings,
  updateTeamSettings,
  uploadTeamLogo,
  uploadFavicon,
} from '../../services/teamSettings';
import type { TeamBranding, TeamLevel, TeamCategory, SeasonPhase } from '../../types/teamSettings';
import { DEFAULT_TEAM_BRANDING } from '../../types/teamSettings';
import { toastService } from '../../services/toast';

interface BrandingManagerProps {
  showBranding?: boolean;
  showTeamSettings?: boolean;
}

export const BrandingManager: React.FC<BrandingManagerProps> = ({
  showBranding = true,
  showTeamSettings = true,
}) => {
  const user = getUser();
  const teamSettings = getTeamSettings();
  const [branding, setBranding] = useState<TeamBranding>(DEFAULT_TEAM_BRANDING);
  const [teamLevel, setTeamLevel] = useState<TeamLevel>(teamSettings.teamLevel);
  const [teamCategory, setTeamCategory] = useState<TeamCategory>(teamSettings.teamCategory);
  const [seasonPhase, setSeasonPhase] = useState<SeasonPhase>(teamSettings.seasonPhase);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewLogo, setPreviewLogo] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastService.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastService.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const logoUrl = await uploadTeamLogo(file);
      setBranding({ ...branding, logoUrl });
      setPreviewLogo(logoUrl);
      toastService.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Logo upload failed:', error);
      toastService.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      // Reset input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastService.error('Please select an image file');
      return;
    }

    // Validate file size (max 1MB for favicon)
    if (file.size > 1 * 1024 * 1024) {
      toastService.error('Favicon must be less than 1MB');
      return;
    }

    try {
      setUploadingFavicon(true);
      const faviconUrl = await uploadFavicon(file);
      setBranding({ ...branding, faviconUrl });
      toastService.success('Favicon uploaded successfully!');
    } catch (error) {
      console.error('Favicon upload failed:', error);
      toastService.error('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
      // Reset input
      if (faviconInputRef.current) {
        faviconInputRef.current.value = '';
      }
    }
  };

  return (
    <Box>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings updated successfully! Refreshing page...
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Branding Section */}
        {showBranding && (
          <>
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

            {/* Logo Configuration */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Logo
                  </Typography>

                  {/* Upload Button */}
                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      ref={logoInputRef}
                      style={{ display: 'none' }}
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={uploadingLogo ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        disabled={uploadingLogo}
                        fullWidth
                      >
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                    </label>
                  </Box>

                  <Divider sx={{ my: 2 }}>or enter URL</Divider>

                  <TextField
                    fullWidth
                    label="Logo URL"
                    value={branding.logoUrl || ''}
                    onChange={(e) => {
                      setBranding({ ...branding, logoUrl: e.target.value });
                      setPreviewLogo(e.target.value);
                    }}
                    placeholder="/USR_Allgemein_Quard_Transparent.png or https://..."
                    helperText="Path to logo in public folder or external URL"
                    size="small"
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

                  {/* Upload Button */}
                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      accept="image/*,.ico"
                      onChange={handleFaviconUpload}
                      ref={faviconInputRef}
                      style={{ display: 'none' }}
                      id="favicon-upload"
                    />
                    <label htmlFor="favicon-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={uploadingFavicon ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        disabled={uploadingFavicon}
                        fullWidth
                      >
                        {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                      </Button>
                    </label>
                  </Box>

                  <Divider sx={{ my: 2 }}>or enter URL</Divider>

                  <TextField
                    fullWidth
                    label="Favicon URL"
                    value={branding.faviconUrl || ''}
                    onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
                    placeholder="/favicon.png or https://..."
                    helperText="Icon shown in browser tab (16x16 or 32x32)"
                    size="small"
                  />

                  {branding.faviconUrl && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Favicon Preview:
                      </Typography>
                      <Avatar
                        src={branding.faviconUrl}
                        alt="Favicon Preview"
                        sx={{ width: 32, height: 32, mx: 'auto' }}
                        variant="square"
                      />
                    </Box>
                  )}

                  <Alert severity="info" sx={{ mt: 2 }}>
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
                        value={branding.primaryColor || '#1976d2'}
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
                        value={branding.secondaryColor || '#ff9800'}
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

            {/* Current Branding Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Current Branding
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
          </>
        )}

        {/* Team Settings Section */}
        {showTeamSettings && (
          <>
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

            {/* Season Phase */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Season Phase
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Current Phase</InputLabel>
                    <Select
                      value={seasonPhase}
                      label="Current Phase"
                      onChange={(e) => setSeasonPhase(e.target.value as SeasonPhase)}
                    >
                      <MenuItem value="off-season">Off-Season</MenuItem>
                      <MenuItem value="pre-season">Pre-Season</MenuItem>
                      <MenuItem value="in-season">In-Season</MenuItem>
                    </Select>
                    <FormHelperText>Current training phase affects AI recommendations</FormHelperText>
                  </FormControl>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    The season phase affects how the AI Coach evaluates workouts and provides recommendations.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            {/* Current Team Settings Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Current Team Settings
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Team Level:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {teamLevel.replace('-', ' ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Team Category:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {teamCategory}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Season Phase:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {seasonPhase.replace('-', ' ')}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

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
              Save Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
