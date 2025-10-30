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
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useI18n } from '../i18n/I18nProvider';
import { equipmentService } from '../services/equipmentService';
import { optimizeEquipmentImage, validateImage } from '../services/imageOptimizer';
import { Equipment } from '../types/drill';

export const EquipmentManager: React.FC = () => {
  const { t } = useI18n();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({ name: '', quantity: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
    setImageError('');
    setIsOptimizing(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset errors
    setImageError('');

    // Validate image
    const validation = validateImage(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image');
      return;
    }

    // Optimize image
    setIsOptimizing(true);
    try {
      const optimizedBase64 = await optimizeEquipmentImage(file);
      setImageFile(file);
      setImagePreview(optimizedBase64);
      console.log(`Equipment image optimized: ${(file.size / 1024).toFixed(0)}KB → ${((optimizedBase64.length * 3) / 4 / 1024).toFixed(0)}KB`);
    } catch (error) {
      setImageError((error as Error).message);
      console.error('Image optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async () => {
    const quantity = formData.quantity ? parseInt(formData.quantity) : undefined;

    setIsSaving(true);
    try {
      let equipmentId: string;

      // Create or update equipment first (without image)
      if (editingEquipment) {
        await equipmentService.updateEquipment(editingEquipment.id, formData.name, quantity);
        equipmentId = editingEquipment.id;
      } else {
        const newEquipment = await equipmentService.createEquipment(formData.name, quantity);
        equipmentId = newEquipment.id;
      }

      // Upload image to Cloudinary if a new file was selected
      if (imageFile) {
        try {
          await equipmentService.uploadImage(equipmentId, imageFile);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          alert(t('equipment.uploadImageError'));
        }
      }

      loadEquipment();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save equipment:', error);
      alert(t('equipment.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('equipment.confirmDelete'))) {
      setIsDeleting(id);
      try {
        await equipmentService.deleteEquipment(id);
        loadEquipment();
      } catch (error) {
        console.error('Failed to delete equipment:', error);
        alert(t('equipment.deleteError'));
      } finally {
        setIsDeleting(null);
      }
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
                    <IconButton size="small" onClick={() => handleOpenDialog(eq)} disabled={isDeleting === eq.id}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(eq.id)} color="error" disabled={isDeleting === eq.id}>
                      {isDeleting === eq.id ? <CircularProgress size={20} /> : <DeleteIcon />}
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
                startIcon={isOptimizing ? <CircularProgress size={20} /> : <UploadIcon />}
                fullWidth
                disabled={isOptimizing}
              >
                {isOptimizing ? t('equipment.optimizingImage') : t('equipment.uploadImage')}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                />
              </Button>
              <FormHelperText>
                JPEG or PNG, max 5MB. Image will be optimized to 1200x1200px for best quality.
              </FormHelperText>

              {imageError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {imageError}
                </Alert>
              )}

              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <img
                    src={imagePreview}
                    alt="Equipment preview"
                    style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                  />
                  <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                    ✓ Image optimized and ready
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving || !formData.name.trim()}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
