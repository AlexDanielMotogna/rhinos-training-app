import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ForgotPasswordDialog } from '../components/ForgotPasswordDialog';
import { calculateAge } from '../services/mock';
import { authService } from '../services/api';
import type { Position } from '../types/exercise';
import RhinosLogo from '../assets/imgs/USR_Allgemein_Quard_Transparent.png';

const positions: Position[] = ['RB', 'WR', 'LB', 'OL', 'DB', 'QB', 'DL', 'TE', 'K/P'];

export const Auth: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [position, setPosition] = useState<Position>('RB');
  const [role, setRole] = useState<'player' | 'coach'>('player');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [coachCode, setCoachCode] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        // Validate password confirmation
        if (password !== confirmPassword) {
          setError(t('auth.passwordMismatch'));
          setLoading(false);
          return;
        }

        // Calculate age from birth date
        const calculatedAge = birthDate ? calculateAge(birthDate) : 0;

        // SIGNUP via backend API
        await authService.signup({
          email,
          password,
          name,
          role,
          coachCode: role === 'coach' ? coachCode : undefined,
          jerseyNumber: role === 'player' && jerseyNumber && jerseyNumber !== '--'
            ? Number(jerseyNumber)
            : undefined,
          birthDate: birthDate || undefined,
          age: calculatedAge || undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
          position: role === 'player' ? position : undefined,
          sex,
        });
      } else {
        // LOGIN via backend API
        await authService.login({ email, password });
      }

      // Navigate to training page
      navigate('/training');
      // Force reload to update app state
      window.location.reload();
    } catch (err: any) {
      setError(err.message || (isSignup ? 'Failed to create account' : 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  const isValid = isSignup
    ? role === 'coach'
      ? name && email && password.length >= 6 && confirmPassword && password === confirmPassword && coachCode && birthDate && weightKg && heightCm
      : name && email && password.length >= 6 && confirmPassword && password === confirmPassword && birthDate && weightKg && heightCm
    : email && password;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'primary.main',
        p: 2,
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16, color: 'white' }}>
        <LanguageSwitcher />
      </Box>

      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              component="img"
              src={RhinosLogo}
              alt="Rhinos Logo"
              sx={{
                width: 120,
                height: 120,
                objectFit: 'contain',
              }}
            />
          </Box>

          <Typography variant="h4" align="center" sx={{ mb: 1, color: 'primary.main' }}>
            {t('app.title')}
          </Typography>

          <Typography variant="h6" align="center" sx={{ mb: 3 }}>
            {isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isSignup && (
              <>
                <TextField
                  label={t('auth.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                />

                <FormControl required fullWidth>
                  <InputLabel>{t('auth.role')}</InputLabel>
                  <Select
                    value={role}
                    label={t('auth.role')}
                    onChange={(e) => setRole(e.target.value as 'player' | 'coach')}
                  >
                    <MenuItem value="player">{t('auth.rolePlayer')}</MenuItem>
                    <MenuItem value="coach">{t('auth.roleCoach')}</MenuItem>
                  </Select>
                </FormControl>

                {role === 'coach' && (
                  <TextField
                    label="Coach Code"
                    value={coachCode}
                    onChange={(e) => setCoachCode(e.target.value)}
                    required
                    fullWidth
                    placeholder="Enter the code provided by administrator"
                    helperText="Contact administrator if you don't have the coach code"
                  />
                )}

                {/* Player-specific fields */}
                {role === 'player' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                      label={t('auth.jerseyNumber')}
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      placeholder="--"
                      helperText={t('auth.jerseyNumberOptional')}
                    />

                    <FormControl required fullWidth>
                      <InputLabel>{t('auth.position')}</InputLabel>
                      <Select
                        value={position}
                        label={t('auth.position')}
                        onChange={(e) => setPosition(e.target.value as Position)}
                      >
                        {positions.map((pos) => (
                          <MenuItem key={pos} value={pos}>
                            {t(`position.${pos}` as any)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Common fields for both players and coaches */}
                <TextField
                  label={t('auth.birthDate')}
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: new Date().toISOString().split('T')[0],
                    min: new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]
                  }}
                />

                <FormControl required fullWidth>
                  <InputLabel>{t('auth.gender')}</InputLabel>
                  <Select
                    value={sex}
                    label={t('auth.gender')}
                    onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                  >
                    <MenuItem value="male">{t('auth.male')}</MenuItem>
                    <MenuItem value="female">{t('auth.female')}</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label={t('auth.weightKg')}
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                    required
                    inputProps={{ min: 50, max: 200 }}
                  />

                  <TextField
                    label={t('auth.heightCm')}
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                    required
                    inputProps={{ min: 150, max: 220 }}
                  />
                </Box>
              </>
            )}

            <TextField
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 6 }}
              error={isSignup && password.length > 0 && password.length < 6}
              helperText={
                isSignup
                  ? password.length > 0 && password.length < 6
                    ? "Password must be at least 6 characters"
                    : "Minimum 6 characters"
                  : ""
              }
            />

            {isSignup && (
              <TextField
                label={t('auth.confirmPassword')}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                error={confirmPassword !== '' && password !== confirmPassword}
                helperText={confirmPassword !== '' && password !== confirmPassword ? t('auth.passwordMismatch') : ''}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!isValid || loading}
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
              {loading ? (isSignup ? 'Creating account...' : 'Logging in...') : (isSignup ? t('auth.signup') : t('auth.login'))}
            </Button>

            {!isSignup && (
              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </Box>
            )}

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {isSignup ? t('auth.haveAccount') : t('auth.noAccount')}
                {' '}
                <Link
                  component="button"
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  sx={{ cursor: 'pointer' }}
                >
                  {isSignup ? t('auth.loginLink') : t('auth.signupLink')}
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </Box>
  );
};
