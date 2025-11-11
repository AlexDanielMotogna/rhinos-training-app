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
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Palette as PaletteIcon } from '@mui/icons-material';
import { useI18n } from '../i18n/I18nProvider';
import { drillCategoryService, syncDrillCategoriesFromBackend, DrillCategory } from '../services/drillCategoryService';
import { toastService } from '../services/toast';

export const DrillCategoryManager: React.FC = () => {
  const { t } = useI18n();
  const [categories, setCategories] = useState<DrillCategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DrillCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', nameDE: '', color: '#1976d2', key: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    await syncDrillCategoriesFromBackend();
    setCategories(drillCategoryService.getAllCategories());
  };

  const handleOpenDialog = (category?: DrillCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        nameDE: category.nameDE || '',
        color: category.color,
        key: category.key || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', nameDE: '', color: '#1976d2', key: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', nameDE: '', color: '#1976d2', key: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingCategory) {
        await drillCategoryService.updateCategory(editingCategory.id, formData);
        toastService.updated('Category');
      } else {
        await drillCategoryService.createCategory(formData);
        toastService.created('Category');
      }
      await loadCategories();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      if (editingCategory) {
        toastService.updateError('category', error.message);
      } else {
        toastService.createError('category', error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('drillCategories.confirmDelete'))) {
      setIsDeleting(id);
      try {
        await drillCategoryService.deleteCategory(id);
        await loadCategories();
        toastService.deleted('Category');
      } catch (error: any) {
        console.error('Failed to delete category:', error);
        toastService.deleteError('category', error.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await drillCategoryService.seedCategories();
      await loadCategories();
      toastService.success(`${t('drillCategories.seedSuccess')} - ${t('drillCategories.created')}: ${result.created.join(', ')}`);
    } catch (error: any) {
      console.error('Failed to seed categories:', error);
      toastService.error(error.message || t('drillCategories.seedError'));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{t('drillCategories.title')}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSeed}
            disabled={isSeeding}
            startIcon={isSeeding ? <CircularProgress size={20} /> : null}
          >
            {isSeeding ? t('common.loading') : t('drillCategories.seedDefaults')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('drillCategories.addCategory')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '4px',
                          backgroundColor: category.color,
                          border: '1px solid rgba(0,0,0,0.12)',
                        }}
                      />
                      <Typography variant="h6">{category.name}</Typography>
                    </Box>
                    {category.nameDE && (
                      <Typography variant="body2" color="text.secondary">
                        DE: {category.nameDE}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(category)} disabled={isDeleting === category.id}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(category.id)} color="error" disabled={isDeleting === category.id}>
                      {isDeleting === category.id ? <CircularProgress size={20} /> : <DeleteIcon />}
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {categories.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t('drillCategories.noCategories')}
          </Typography>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? t('drillCategories.editCategory') : t('drillCategories.addCategory')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('drillCategories.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Category Key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              fullWidth
              required
              helperText="Unique identifier (e.g., 'offense', 'defense', 'fundamentals')"
              disabled={!!editingCategory}
            />

            <TextField
              label={t('drillCategories.nameDE')}
              value={formData.nameDE}
              onChange={(e) => setFormData({ ...formData, nameDE: e.target.value })}
              fullWidth
              helperText={t('drillCategories.nameDEHelp')}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaletteIcon fontSize="small" />
                {t('drillCategories.color')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ width: 60, height: 40, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {formData.color}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving || !formData.name.trim() || !formData.key.trim()}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
