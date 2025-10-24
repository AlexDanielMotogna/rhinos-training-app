import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Grid,
  Chip,
  CardMedia,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useI18n } from '../i18n/I18nProvider';
import { equipmentService } from '../services/equipmentService';
import { Equipment } from '../types/drill';

export const EquipmentManager: React.FC = () => {
  const { t } = useI18n();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({ name: '', quantity: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = () => {
    setEquipment(equipmentService.getAllEquipment());
  };

  const handleOpenDialog = (eq?: Equipment) => {
    if (eq) {
      setEditingEquipment(eq);
      setFormData({ name: eq.name, quantity: eq.quantity?.toString() || '' });
      setImagePreview(eq.imageUrl || '');
    } else {
      setEditingEquipment(null);
      setFormData({ name: '', quantity: '' });
      setImagePreview('');
    }
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEquipment(null);
    setFormData({ name: '', quantity: '' });
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const quantity = formData.quantity ? parseInt(formData.quantity) : undefined;
    let imageUrl = editingEquipment?.imageUrl;

    // Upload new image if selected
    if (imageFile) {
      imageUrl = await equipmentService.uploadImage(imageFile);
    }

    if (editingEquipment) {
      equipmentService.updateEquipment(editingEquipment.id, formData.name, quantity, imageUrl);
    } else {
      equipmentService.createEquipment(formData.name, quantity, imageUrl);
    }

    loadEquipment();
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('equipment.confirmDelete'))) {
      equipmentService.deleteEquipment(id);
      loadEquipment();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{t('equipment.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('equipment.addEquipment')}
        </Button>
      </Box>

      <Grid container spacing={2}>
        {equipment.map((eq) => (
          <Grid item xs={12} sm={6} md={4} key={eq.id}>
            <Card>
              {eq.imageUrl && (
                <CardMedia
                  component="img"
                  height="160"
                  image={eq.imageUrl}
                  alt={eq.name}
                  sx={{ objectFit: 'contain', bgcolor: '#f5f5f5', p: 2 }}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {eq.name}
                    </Typography>
                    {eq.quantity && (
                      <Chip
                        label={`${t('equipment.quantity')}: ${eq.quantity}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(eq)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(eq.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {equipment.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t('equipment.noEquipment')}
          </Typography>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEquipment ? t('equipment.editEquipment') : t('equipment.addEquipment')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('equipment.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={t('equipment.quantity')}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              type="number"
              fullWidth
              helperText={t('equipment.quantityHelp')}
            />

            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
              >
                {t('equipment.uploadImage')}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('equipment.uploadImageHelp')}
              </Typography>
              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <img
                    src={imagePreview}
                    alt="Equipment preview"
                    style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
