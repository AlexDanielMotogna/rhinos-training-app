import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useI18n } from '../i18n/I18nProvider';
import { authService } from '../services/api';

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onClose }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError('');
    setLoading(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError(t('auth.invalidEmail'));
      setLoading(false);
      return;
    }

    try {
      // Call backend API to send password reset email
      await authService.forgotPassword(email);
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || t('auth.resetEmailFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          {t('auth.forgotPassword')}
        </Box>
      </DialogTitle>
      <DialogContent>
        {!emailSent ? (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('auth.forgotPasswordDescription')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              autoFocus
              placeholder="example@email.com"
            />
          </Box>
        ) : (
          <Box sx={{ pt: 1, textAlign: 'center' }}>
            <CheckCircleIcon
              sx={{
                fontSize: 64,
                color: 'success.main',
                mb: 2
              }}
            />
            <Typography variant="h6" gutterBottom>
              {t('auth.resetEmailSent')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.resetEmailSentDescription', { email })}
            </Typography>
            <Alert severity="info" sx={{ mt: 3 }}>
              {t('auth.checkSpamFolder')}
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!emailSent ? (
          <>
            <Button onClick={handleClose} color="inherit">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleReset}
              variant="contained"
              disabled={!email || loading}
            >
              {loading ? t('common.loading') : t('auth.sendResetLink')}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained" fullWidth>
            {t('common.close')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
