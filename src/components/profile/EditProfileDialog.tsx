import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import { saveUser, calculateAge, type MockUser } from '../../services/mock';

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
  const [name, setName] = useState(user.name);
  const [jerseyNumber, setJerseyNumber] = useState(user.jerseyNumber?.toString() || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [weightKg, setWeightKg] = useState(user.weightKg);
  const [heightCm, setHeightCm] = useState(user.heightCm);
  const [phone, setPhone] = useState(user.phone || '');
  const [instagram, setInstagram] = useState(user.instagram || '');

  const handleSave = () => {
    const updatedUser: MockUser = {
      ...user,
      name,
      jerseyNumber: jerseyNumber && jerseyNumber !== '--' ? Number(jerseyNumber) : undefined,
      birthDate,
      age: birthDate ? calculateAge(birthDate) : user.age,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      phone: phone || undefined,
      instagram: instagram || undefined,
    };

    saveUser(updatedUser);
    onSave(updatedUser);
    onClose();
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
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            placeholder="+49 123 456789"
          />

          <TextField
            label={t('auth.instagram')}
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            fullWidth
            placeholder="@username"
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
