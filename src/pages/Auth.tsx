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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { saveUser } from '../services/mock';
import type { Position } from '../types/exercise';

const positions: Position[] = ['RB', 'WR', 'LB', 'OL', 'DB', 'QB', 'DL', 'TE', 'K/P'];

export const Auth: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('');
  const [age, setAge] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [position, setPosition] = useState<Position>('RB');
  const [role, setRole] = useState<'player' | 'coach'>('player');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const user = {
      id: Date.now().toString(),
      name: name || 'John Doe',
      email: email || 'john@example.com',
      jerseyNumber: jerseyNumber || 99,
      age: age || 25,
      weightKg: weightKg || 100,
      heightCm: heightCm || 186,
      position,
      role,
    };

    saveUser(user);

    // Force reload to update app state
    window.location.href = '/training';
  };

  const isValid = isSignup
    ? name && email && password && jerseyNumber && age && weightKg && heightCm
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
              src="/src/assets/imgs/USR_Allgemein_Quard_Transparent.png"
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

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label={t('auth.jerseyNumber')}
                    type="number"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value ? Number(e.target.value) : '')}
                    required
                    inputProps={{ min: 0, max: 99 }}
                  />

                  <TextField
                    label={t('auth.age')}
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    required
                    inputProps={{ min: 10, max: 100 }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <FormControl required>
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

                  <FormControl required>
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

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  <TextField
                    label={t('auth.weightKg')}
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                    required
                    inputProps={{ min: 50, max: 200 }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
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
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!isValid}
              fullWidth
            >
              {isSignup ? t('auth.signup') : t('auth.login')}
            </Button>

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
    </Box>
  );
};
