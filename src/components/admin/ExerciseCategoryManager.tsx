import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { exerciseCategoryService } from '../../services/api';
import type { ExerciseCategoryData } from '../../types/exercise';

export const ExerciseCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<ExerciseCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExerciseCategoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    key: '',
    nameEN: '',
    nameDE: '',
    color: '#1976d2',
    icon: '',
    active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await exerciseCategoryService.getAll();
      setCategories(data);
      setError(null);
    } catch (err: any) {
      console.error('[EXERCISE CATEGORIES] Load error:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: ExerciseCategoryData) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        key: category.key,
        nameEN: category.nameEN,
        nameDE: category.nameDE,
        color: category.color,
        icon: category.icon || '',
        active: category.active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        key: '',
        nameEN: '',
        nameDE: '',
        color: '#1976d2',
        icon: '',
        active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setError(null);
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await exerciseCategoryService.update(editingCategory.id, formData);
      } else {
        await exerciseCategoryService.create(formData);
      }
      await loadCategories();
      handleCloseDialog();
    } catch (err: any) {
      console.error('[EXERCISE CATEGORIES] Save error:', err);
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await exerciseCategoryService.delete(id);
      await loadCategories();
    } catch (err: any) {
      console.error('[EXERCISE CATEGORIES] Delete error:', err);
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleInitialize = async () => {
    if (!confirm('Initialize default exercise categories? This will add 8 standard categories.')) {
      return;
    }

    try {
      await exerciseCategoryService.initialize();
      await loadCategories();
    } catch (err: any) {
      console.error('[EXERCISE CATEGORIES] Initialize error:', err);
      alert(err.message || 'Failed to initialize categories');
    }
  };

  if (loading) {
    return <Typography>Loading categories...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Exercise Categories ({categories.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {categories.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleInitialize}
            >
              Initialize Defaults
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid item xs={12} md={6} key={category.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                        }}
                      />
                      <Typography variant="h6">
                        {category.nameEN}
                      </Typography>
                      <Chip
                        label={category.active ? 'Active' : 'Inactive'}
                        size="small"
                        color={category.active ? 'success' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      DE: {category.nameDE}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Key: {category.key}
                    </Typography>
                    {category.icon && (
                      <Typography variant="body2" color="text.secondary">
                        Icon: {category.icon}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(category)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(category.id)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Key (lowercase, no spaces)"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              disabled={!!editingCategory}
              fullWidth
              required
              helperText="Unique identifier (e.g., strength, speed, cod)"
            />
            <TextField
              label="English Name"
              value={formData.nameEN}
              onChange={(e) => setFormData({ ...formData, nameEN: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="German Name"
              value={formData.nameDE}
              onChange={(e) => setFormData({ ...formData, nameDE: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              fullWidth
            />
            <TextField
              label="Icon (optional)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              fullWidth
              helperText="Material-UI icon name"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.key || !formData.nameEN || !formData.nameDE}
          >
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
