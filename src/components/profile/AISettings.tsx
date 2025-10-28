import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { validateAPIKey } from '../../services/aiInsights';
import { getUser } from '../../services/userProfile';
import { getTeamSettings } from '../../services/teamSettings';
import { updateUserProfile } from '../../services/userProfile';
import type { MockUser } from '../../services/userProfile';

export const AISettings: React.FC = () => {
  const [user, setUser] = useState<MockUser | null>(getUser());
  const [teamSettings] = useState(() => getTeamSettings());
  const [aiCoachEnabled, setAiCoachEnabled] = useState(user?.aiCoachEnabled || false);
  const [apiKey, setApiKey] = useState(user?.aiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);

  // Check if team API is configured
  const teamApiConfigured = !!teamSettings.aiApiKey;

  const handleTestAPIKey = async () => {
    if (!apiKey.trim()) {
      setValidationResult({ valid: false, error: 'Please enter an API key' });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    const result = await validateAPIKey(apiKey.trim());
    setValidationResult(result);
    setValidating(false);
  };

  const handleToggleAICoach = async (enabled: boolean) => {
    if (!user) return;

    // If enabling, validate API key first
    if (enabled && !apiKey.trim()) {
      setError('Please enter an API key before enabling AI Coach');
      return;
    }

    if (enabled && apiKey.trim()) {
      // Validate the API key
      setValidating(true);
      const result = await validateAPIKey(apiKey.trim());
      setValidating(false);

      if (!result.valid) {
        setError(`Cannot enable AI Coach: ${result.error}`);
        setValidationResult(result);
        return;
      }
    }

    // Update user settings with backend sync
    const updates = {
      aiCoachEnabled: enabled,
      aiApiKey: enabled ? apiKey.trim() : user.aiApiKey, // Keep API key even when disabled
    };

    const updatedUser = await updateUserProfile(updates);

    if (updatedUser) {
      setUser(updatedUser);
      setAiCoachEnabled(enabled);
      setError('');
      setSaved(true);

      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!apiKey.trim() || !apiKey.startsWith('sk-')) {
      setError('Invalid API key. It should start with "sk-"');
      return;
    }

    // Validate API key before saving
    setValidating(true);
    const result = await validateAPIKey(apiKey.trim());
    setValidating(false);
    setValidationResult(result);

    if (!result.valid) {
      setError(`Invalid API key: ${result.error}`);
      return;
    }

    // Update user settings with backend sync
    const updates = {
      aiApiKey: apiKey.trim(),
      aiCoachEnabled: aiCoachEnabled, // Preserve enabled state
    };

    const updatedUser = await updateUserProfile(updates);

    if (updatedUser) {
      setUser(updatedUser);
      setSaved(true);
      setError('');

      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleRemove = async () => {
    if (!user) return;

    if (window.confirm('Are you sure you want to remove your API key? AI Coach will be disabled.')) {
      // Update user settings with backend sync
      const updates = {
        aiApiKey: undefined,
        aiCoachEnabled: false,
      };

      const updatedUser = await updateUserProfile(updates);

      if (updatedUser) {
        setUser(updatedUser);
        setApiKey('');
        setAiCoachEnabled(false);
        setSaved(false);
        setValidationResult(null);
      }
    }
  };

  // If team API is configured, show message and hide personal settings
  if (teamApiConfigured) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">AI Coach</Typography>
          </Box>

          <Alert severity="success">
            <Typography variant="body2" gutterBottom>
              <strong>AI Coach is configured by your team</strong>
            </Typography>
            <Typography variant="caption">
              Your coaches have configured a team-wide AI Coach. All players automatically receive AI-powered workout analysis and insights.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Personal AI Coach configuration
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6">AI Coach Settings</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Get AI-powered workout insights!</strong>
          </Typography>
          <Typography variant="caption">
            Configure your OpenAI API key to unlock personalized coaching feedback powered by GPT-4.
            Your key is stored locally and only used for workout report analysis.
          </Typography>
        </Alert>

        {/* Enable/Disable Toggle */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={aiCoachEnabled}
                onChange={(e) => handleToggleAICoach(e.target.checked)}
                disabled={validating}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Enable AI Coach</Typography>
                <Typography variant="caption" color="text.secondary">
                  {aiCoachEnabled ? 'AI-powered reports are active' : 'AI Coach is disabled'}
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* API Key Configuration */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          OpenAI API Key:
        </Typography>

        <TextField
          fullWidth
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setValidationResult(null);
            setError('');
          }}
          placeholder="sk-proj-..."
          size="small"
          sx={{ mb: 2 }}
          disabled={validating}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowKey(!showKey)}
                  edge="end"
                  size="small"
                >
                  {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Validation Result */}
        {validationResult && (
          <Alert severity={validationResult.valid ? 'success' : 'error'} sx={{ mb: 2 }}>
            <Typography variant="body2">
              {validationResult.valid
                ? 'API key is valid and working!'
                : `Invalid API key: ${validationResult.error}`}
            </Typography>
          </Alert>
        )}

        {/* Save Success */}
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Settings saved successfully!
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleTestAPIKey}
            disabled={!apiKey.trim() || validating}
            startIcon={validating ? <CircularProgress size={16} /> : undefined}
          >
            {validating ? 'Testing...' : 'Test API Key'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!apiKey.trim() || validating}
          >
            Save API Key
          </Button>
          {user?.aiApiKey && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleRemove}
            >
              Remove Key
            </Button>
          )}
        </Box>

        {/* Instructions */}
        <Alert severity="warning">
          <Typography variant="caption">
            <strong>How to get an API key:</strong><br />
            1. Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a><br />
            2. Click "Create new secret key"<br />
            3. Copy the key and paste it here<br />
            <br />
            <strong>IMPORTANT:</strong> Add credits to your OpenAI account at{' '}
            <a href="https://platform.openai.com/settings/organization/billing" target="_blank" rel="noopener">billing settings</a>{' '}
            to avoid rate limits (minimum $5-10 recommended)<br />
            <br />
            <strong>Cost:</strong> ~€0.0003 per AI insight (less than 1 cent)<br />
            <strong>Security:</strong> Your key is stored locally in your browser only
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};
