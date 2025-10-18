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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { saveAPIKey, getAPIKey, removeAPIKey, hasAPIKey } from '../../services/aiInsights';

export const AISettings: React.FC = () => {
  const [apiKey, setApiKey] = useState(getAPIKey() || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      setError('Invalid API key. It should start with "sk-"');
      return;
    }

    const success = saveAPIKey(apiKey);
    if (success) {
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError('Failed to save API key');
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove your API key?')) {
      removeAPIKey();
      setApiKey('');
      setSaved(false);
    }
  };

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
            Your key is stored locally and only used when you click "Get AI Insight" in workout reports.
          </Typography>
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          OpenAI API Key:
        </Typography>

        <TextField
          fullWidth
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-proj-..."
          size="small"
          sx={{ mb: 2 }}
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

        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            API key saved successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!apiKey}
          >
            Save API Key
          </Button>
          {hasAPIKey() && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleRemove}
            >
              Remove Key
            </Button>
          )}
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
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
