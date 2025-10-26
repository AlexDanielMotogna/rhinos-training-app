import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, LockReset } from '@mui/icons-material';
import { useI18n } from '../i18n/I18nProvider';
import { authService } from '../services/api';
import RhinosLogo from '../assets/imgs/USR_Allgemein_Quard_Transparent.png';

export default function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token!, password);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'primary.main',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Box
              component="img"
              src={RhinosLogo}
              alt="Rhinos Logo"
              sx={{
                width: 120,
                height: 120,
                objectFit: 'contain',
                mb: 1,
                display: 'block',
                mx: 'auto',
              }}
            />
            <LockReset sx={{ fontSize: 48, color: 'success.main', mb: 2, display: 'block', mx: 'auto' }} />
            <Typography variant="h5" gutterBottom>
              {t('auth.passwordResetSuccess')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('auth.redirectingToLogin')}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'primary.main',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src={RhinosLogo}
              alt="Rhinos Logo"
              sx={{
                width: 120,
                height: 120,
                objectFit: 'contain',
                mb: 1,
                display: 'block',
                mx: 'auto',
              }}
            />
            <LockReset sx={{ fontSize: 48, color: 'primary.main', mb: 2, display: 'block', mx: 'auto' }} />
            <Typography variant="h4" gutterBottom>
              {t('auth.resetPassword')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.enterNewPassword')}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('auth.newPassword')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              inputProps={{ minLength: 6 }}
              error={password.length > 0 && password.length < 6}
              helperText={
                password.length > 0 && password.length < 6
                  ? t('auth.passwordTooShort')
                  : t('auth.passwordMinLength')
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label={t('auth.confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              error={
                confirmPassword.length > 0 && password !== confirmPassword
              }
              helperText={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? t('auth.passwordMismatch')
                  : ''
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={
                loading ||
                password.length < 6 ||
                password !== confirmPassword
              }
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? t('common.loading') : t('auth.resetPasswordButton')}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              {t('auth.backToLogin')}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
