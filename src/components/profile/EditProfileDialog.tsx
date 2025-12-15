import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import { saveUser, calculateAge, type MockUser } from '../../services/userProfile';
import { updateUserProfile } from '../../services/userProfile';
import { toastService } from '../../services/toast';

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: MockUser;
  onSave: (user: MockUser) => void;
}

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onClose,
  user,
  onSave,
}) => {
  const { t } = useI18n();
  // Hardcoded categories for USR Rhinos - backend handles validation
  const allowedCategories = ['Kampfmannschaft', 'Jugend'];

  const [name, setName] = useState(user.name);
  const [jerseyNumber, setJerseyNumber] = useState(user.jerseyNumber?.toString() || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [weightKg, setWeightKg] = useState(user.weightKg);
  const [heightCm, setHeightCm] = useState(user.heightCm);
  const [sex, setSex] = useState<'male' | 'female'>(user.sex || 'male');
  const [ageCategory, setAgeCategory] = useState(user.ageCategory || '');
  const [phone, setPhone] = useState(user.phone || '+43');
  const [instagram, setInstagram] = useState(user.instagram || '');
  const [snapchat, setSnapchat] = useState(user.snapchat || '');
  const [tiktok, setTiktok] = useState(user.tiktok || '');
  const [hudl, setHudl] = useState(user.hudl || '');
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (value: string) => {
    if (!value || value === '+43') {
      setPhoneError('');
      return true;
    }

    // Must start with +43 and have at least 10 digits after
    const phoneRegex = /^\+43\d{10,}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      setPhoneError(t('auth.phoneError'));
      return false;
    }

    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (value: string) => {
    // Ensure it always starts with +43
    if (!value.startsWith('+43')) {
      value = '+43' + value.replace(/^\+43/, '');
    }
    setPhone(value);
    validatePhone(value);
  };

  const handleSave = async () => {
    // Validate phone before saving
    if (!validatePhone(phone)) {
      toastService.validationError('Please enter a valid phone number');
      return;
    }

    try {
      const updates: Partial<MockUser> = {
        name,
        jerseyNumber: jerseyNumber && jerseyNumber !== '--' ? Number(jerseyNumber) : undefined,
        birthDate,
        age: birthDate ? calculateAge(birthDate) : user.age,
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        sex,
        ageCategory: ageCategory || undefined,
        phone: phone && phone !== '+43' ? phone : null,
        instagram: instagram || null,
        snapchat: snapchat || null,
        tiktok: tiktok || null,
        hudl: hudl || null,
      };

      // Use the new sync service that handles backend sync
      const updatedUser = await updateUserProfile(updates);

      if (updatedUser) {
        // Also save to mock service for backward compatibility
        saveUser(updatedUser);
        onSave(updatedUser);
        toastService.updated('Profile');
      }

      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toastService.updateError('profile', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('profile.editProfile')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={t('auth.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label={t('auth.jerseyNumber')}
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            fullWidth
            placeholder="--"
            helperText={t('auth.jerseyNumberOptional')}
          />

          <TextField
            label={t('auth.birthDate')}
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: new Date().toISOString().split('T')[0],
              min: new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]
            }}
          />

          <FormControl fullWidth required>
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

          {/* Age Category - only show if team has configured categories */}
          {allowedCategories.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Age Category</InputLabel>
              <Select
                value={ageCategory}
                label="Age Category"
                onChange={(e) => setAgeCategory(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {allowedCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label={t('auth.weightKg')}
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              inputProps={{ min: 50, max: 200 }}
            />

            <TextField
              label={t('auth.heightCm')}
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              inputProps={{ min: 150, max: 220 }}
            />
          </Box>

          <TextField
            label={t('auth.phone')}
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            fullWidth
            placeholder="+43 123 456789"
            error={!!phoneError}
            helperText={phoneError || t('auth.phoneHelper')}
          />

          <TextField
            label={t('auth.instagram')}
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            fullWidth
            placeholder="@username"
            helperText={t('auth.instagramHelper')}
          />

          <TextField
            label={t('auth.snapchat')}
            value={snapchat}
            onChange={(e) => setSnapchat(e.target.value)}
            fullWidth
            placeholder="username"
            helperText={t('auth.snapchatHelper')}
          />

          <TextField
            label={t('auth.tiktok')}
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            fullWidth
            placeholder="@username"
            helperText={t('auth.tiktokHelper')}
          />

          <TextField
            label={t('auth.hudl')}
            value={hudl}
            onChange={(e) => setHudl(e.target.value)}
            fullWidth
            placeholder="https://hudl.com/profile/..."
            helperText={t('auth.hudlHelper')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
