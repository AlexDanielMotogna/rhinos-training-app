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
  IconButton,
  TextField,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getTeamSettings, updateAgeCategories } from '../../services/teamSettings';
import { toastService } from '../../services/toast';

export const AgeCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const settings = getTeamSettings();
      const cats = settings.allowedCategories || [];
      setCategories(cats);
      setError(null);
    } catch (err: any) {
      console.error('[AGE CATEGORIES] Load error:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      toastService.error('Category name cannot be empty');
      return;
    }

    if (categories.includes(trimmed)) {
      toastService.error('Category already exists');
      return;
    }

    try {
      const updated = [...categories, trimmed];
      await updateAgeCategories(updated);
      setCategories(updated);
      setNewCategory('');
      setDialogOpen(false);
      toastService.created('Category');
    } catch (err: any) {
      console.error('[AGE CATEGORIES] Add error:', err);
      toastService.createError('category', err.message);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`Delete category "${category}"?\n\nNote: This will not affect existing users with this category assigned.`)) {
      return;
    }

    try {
      const updated = categories.filter(c => c !== category);
      await updateAgeCategories(updated);
      setCategories(updated);
      toastService.deleted('Category');
    } catch (err: any) {
      console.error('[AGE CATEGORIES] Delete error:', err);
      toastService.deleteError('category', err.message);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const updated = [...categories];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];

    try {
      await updateAgeCategories(updated);
      setCategories(updated);
    } catch (err: any) {
      console.error('[AGE CATEGORIES] Reorder error:', err);
      toastService.error('Failed to reorder categories');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const updated = [...categories];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];

    try {
      await updateAgeCategories(updated);
      setCategories(updated);
    } catch (err: any) {
      console.error('[AGE CATEGORIES] Reorder error:', err);
      toastService.error('Failed to reorder categories');
    }
  };

  const handleInitializeDefault = async () => {
    if (!confirm('Initialize default American Football age categories?\n\nThis will add: U8, U10, U13, U15, U17, U19, Seniors')) {
      return;
    }

    const defaultCategories = ['U8', 'U10', 'U13', 'U15', 'U17', 'U19', 'Seniors'];

    try {
      await updateAgeCategories(defaultCategories);
      setCategories(defaultCategories);
      toastService.success('Default categories initialized');
    } catch (err: any) {
      console.error('[AGE CATEGORIES] Initialize error:', err);
      toastService.error('Failed to initialize categories');
    }
  };

  if (loading) {
    return <Typography>Loading categories...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Age Categories ({categories.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure age/skill categories for your team. Players and coaches can be assigned to these categories.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {categories.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleInitializeDefault}
            >
              Initialize Defaults
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
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

      {categories.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No categories configured yet. Click "Initialize Defaults" for American Football categories,
              or "Add Category" to create your own (e.g., Basketball: U12, U14, U16, U18, Senior).
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List>
            {categories.map((category, index) => (
              <ListItem
                key={category}
                divider={index < categories.length - 1}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={category}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === categories.length - 1}
                    title="Move down"
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteCategory(category)}
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          <Typography variant="body2" gutterBottom>
            <strong>Multi-Sport Support:</strong> This system works for any sport.
          </Typography>
          <Typography variant="body2">
            • <strong>Football:</strong> U8, U10, U13, U15, U17, U19, Seniors<br />
            • <strong>Basketball:</strong> U12, U14, U16, U18, Senior<br />
            • <strong>Handball:</strong> Minis, Cadets, Juniors, Seniors<br />
            • <strong>Custom:</strong> Create any categories that fit your team structure
          </Typography>
        </Alert>
      </Box>

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              fullWidth
              autoFocus
              placeholder="e.g., U13, Seniors, Minis, etc."
              helperText="Enter the category name exactly as you want it to appear (case-sensitive)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCategory();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddCategory}
            variant="contained"
            disabled={!newCategory.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
