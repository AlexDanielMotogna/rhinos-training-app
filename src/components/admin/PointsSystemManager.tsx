import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { pointsConfigService } from '../../services/api';
import { getUser } from '../../services/userProfile';
import type { PointsConfig, PointCategory, PointCategoryType } from '../../types/pointsSystem';
import { pointsCategoryColors } from '../../theme';

export const PointsSystemManager: React.FC = () => {
  const user = getUser();
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<PointCategory | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    type: 'light' as PointCategoryType,
    nameEN: '',
    nameDE: '',
    descriptionEN: '',
    descriptionDE: '',
    points: 1,
    examplesEN: '',
    examplesDE: '',
    color: '#90caf9',
    minDuration: 0,
    active: true,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await pointsConfigService.get() as PointsConfig;
      setConfig(data);
    } catch (error) {
      console.error('Error loading points config:', error);
      alert('Failed to load points configuration. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!user || !config) return;

    try {
      const data = {
        ...config,
        updatedBy: user.name,
      };

      const updated = await pointsConfigService.update(data) as PointsConfig;
      setConfig(updated);
      setSuccessMessage('Points configuration saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving points config:', error);
      alert('Failed to save points configuration. Please try again.');
    }
  };

  const handleResetConfig = async () => {
    if (!window.confirm('Are you sure you want to reset to default configuration? This cannot be undone.')) {
      return;
    }

    try {
      await pointsConfigService.reset();
      await loadConfig();
      setSuccessMessage('Configuration reset to defaults!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error resetting points config:', error);
      alert('Failed to reset points configuration. Please try again.');
    }
  };

  const handleAddCategory = () => {
    setCategoryForm({
      type: 'light',
      nameEN: '',
      nameDE: '',
      descriptionEN: '',
      descriptionDE: '',
      points: 1,
      examplesEN: '',
      examplesDE: '',
      color: '#90caf9',
      minDuration: 0,
      active: true,
    });
    setEditingCategory(null);
    setShowCategoryDialog(true);
  };

  const handleEditCategory = (category: PointCategory) => {
    setCategoryForm({
      type: category.type,
      nameEN: category.nameEN,
      nameDE: category.nameDE,
      descriptionEN: category.descriptionEN,
      descriptionDE: category.descriptionDE,
      points: category.points,
      examplesEN: category.examplesEN.join(', '),
      examplesDE: category.examplesDE.join(', '),
      color: category.color,
      minDuration: category.minDuration || 0,
      active: category.active,
    });
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!config) return;
    if (window.confirm('Are you sure you want to delete this category?')) {
      setConfig({
        ...config,
        categories: config.categories.filter(c => c.id !== categoryId),
      });
    }
  };

  const handleSaveCategory = () => {
    if (!config) return;

    const newCategory: PointCategory = {
      id: editingCategory?.id || crypto.randomUUID(),
      type: categoryForm.type,
      nameEN: categoryForm.nameEN,
      nameDE: categoryForm.nameDE,
      descriptionEN: categoryForm.descriptionEN,
      descriptionDE: categoryForm.descriptionDE,
      points: categoryForm.points,
      examplesEN: categoryForm.examplesEN.split(',').map(s => s.trim()).filter(s => s),
      examplesDE: categoryForm.examplesDE.split(',').map(s => s.trim()).filter(s => s),
      color: categoryForm.color,
      active: categoryForm.active,
      minDuration: categoryForm.minDuration || undefined,
    };

    if (editingCategory) {
      // Update existing
      setConfig({
        ...config,
        categories: config.categories.map(c => c.id === editingCategory.id ? newCategory : c),
      });
    } else {
      // Add new
      setConfig({
        ...config,
        categories: [...config.categories, newCategory],
      });
    }

    setShowCategoryDialog(false);
  };

  const getCategoryTypeColor = (type: PointCategoryType) => {
    return pointsCategoryColors[type] || pointsCategoryColors.light;
  };

  if (loading || !config) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading points configuration...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Points System Configuration
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* General Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            General Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Weekly Target (points)"
                value={config.weeklyTarget}
                onChange={(e) => setConfig({ ...config, weeklyTarget: parseInt(e.target.value) || 20 })}
                helperText="Target points players should achieve per week"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Daily Points"
                value={config.maxDailyPoints || 3}
                onChange={(e) => setConfig({ ...config, maxDailyPoints: parseInt(e.target.value) || 3 })}
                helperText="Maximum points a player can earn per day"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Color Scale (Progress Indicators)
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  type="color"
                  label="Low (< 50%)"
                  value={config.colorScale.low}
                  onChange={(e) => setConfig({
                    ...config,
                    colorScale: { ...config.colorScale, low: e.target.value }
                  })}
                  sx={{ width: 100 }}
                />
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: config.colorScale.low,
                    borderRadius: 1,
                    border: '1px solid #ccc',
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  type="color"
                  label="Medium (50-80%)"
                  value={config.colorScale.medium}
                  onChange={(e) => setConfig({
                    ...config,
                    colorScale: { ...config.colorScale, medium: e.target.value }
                  })}
                  sx={{ width: 100 }}
                />
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: config.colorScale.medium,
                    borderRadius: 1,
                    border: '1px solid #ccc',
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  type="color"
                  label="High (> 80%)"
                  value={config.colorScale.high}
                  onChange={(e) => setConfig({
                    ...config,
                    colorScale: { ...config.colorScale, high: e.target.value }
                  })}
                  sx={{ width: 100 }}
                />
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: config.colorScale.high,
                    borderRadius: 1,
                    border: '1px solid #ccc',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Point Categories */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Point Categories
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCategory}
            >
              Add Category
            </Button>
          </Box>

          <Grid container spacing={2}>
            {config.categories.map((category) => (
              <Grid item xs={12} md={6} key={category.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                          <Chip
                            label={category.type.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getCategoryTypeColor(category.type),
                              color: 'white',
                            }}
                          />
                          <Typography variant="h6">
                            {category.points} {category.points === 1 ? 'point' : 'points'}
                          </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>EN:</strong> {category.nameEN}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>DE:</strong> {category.nameDE}
                        </Typography>

                        {category.minDuration && (
                          <Typography variant="caption" color="text.secondary">
                            Min duration: {category.minDuration} minutes
                          </Typography>
                        )}

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Examples (EN):
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 1 }}>
                          {category.examplesEN.join(', ')}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Examples (DE):
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {category.examplesDE.join(', ')}
                        </Typography>
                      </Box>

                      <Box>
                        <IconButton size="small" onClick={() => handleEditCategory(category)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteCategory(category.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleResetConfig}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveConfig}
        >
          Save Configuration
        </Button>
      </Box>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onClose={() => setShowCategoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Category Type"
                value={categoryForm.type}
                onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as PointCategoryType })}
                SelectProps={{ native: true }}
              >
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="team">Team</option>
                <option value="intensive">Intensive</option>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Points"
                value={categoryForm.points}
                onChange={(e) => setCategoryForm({ ...categoryForm, points: parseFloat(e.target.value) || 1 })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name (English)"
                value={categoryForm.nameEN}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameEN: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name (German)"
                value={categoryForm.nameDE}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameDE: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description (English)"
                value={categoryForm.descriptionEN}
                onChange={(e) => setCategoryForm({ ...categoryForm, descriptionEN: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description (German)"
                value={categoryForm.descriptionDE}
                onChange={(e) => setCategoryForm({ ...categoryForm, descriptionDE: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Examples (English, comma-separated)"
                value={categoryForm.examplesEN}
                onChange={(e) => setCategoryForm({ ...categoryForm, examplesEN: e.target.value })}
                multiline
                rows={2}
                helperText="e.g., Walking, Yoga, Light stretching"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Examples (German, comma-separated)"
                value={categoryForm.examplesDE}
                onChange={(e) => setCategoryForm({ ...categoryForm, examplesDE: e.target.value })}
                multiline
                rows={2}
                helperText="e.g., Spaziergang, Yoga, Leichtes Dehnen"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Duration (minutes, optional)"
                value={categoryForm.minDuration}
                onChange={(e) => setCategoryForm({ ...categoryForm, minDuration: parseInt(e.target.value) || 0 })}
                helperText="Leave 0 for no minimum"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  type="color"
                  label="Color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  sx={{ width: 150 }}
                />
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    backgroundColor: categoryForm.color,
                    borderRadius: 1,
                    border: '1px solid #ccc',
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={categoryForm.active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCategoryDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCategory}
            disabled={!categoryForm.nameEN || !categoryForm.nameDE}
          >
            {editingCategory ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
