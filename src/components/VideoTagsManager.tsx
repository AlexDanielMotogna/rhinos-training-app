import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { videoTagsService } from '../services/api';

interface VideoTag {
  id: string;
  type: 'position' | 'route' | 'coverage';
  name: string;
  order: number;
  isDefault: boolean;
}

export const VideoTagsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'position' | 'route' | 'coverage'>('position');
  const [tags, setTags] = useState<VideoTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<VideoTag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    loadTags(activeTab);
  }, [activeTab]);

  const loadTags = async (type: 'position' | 'route' | 'coverage') => {
    setLoading(true);
    setError(null);
    try {
      const data = await videoTagsService.getAll(type);
      setTags(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    if (!confirm('Initialize default tags? This will add all standard positions, routes, and coverages.')) {
      return;
    }

    setInitializing(true);
    setError(null);
    try {
      await videoTagsService.initialize();
      setSuccess('Default tags initialized successfully!');
      loadTags(activeTab);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize tags');
    } finally {
      setInitializing(false);
    }
  };

  const handleOpenDialog = (tag?: VideoTag) => {
    if (tag) {
      setEditingTag(tag);
      setNewTagName(tag.name);
    } else {
      setEditingTag(null);
      setNewTagName('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setNewTagName('');
  };

  const handleSave = async () => {
    if (!newTagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingTag) {
        // Update existing
        await videoTagsService.update(editingTag.id, { name: newTagName });
        setSuccess('Tag updated successfully!');
      } else {
        // Create new
        await videoTagsService.create({
          type: activeTab,
          name: newTagName,
          order: tags.length,
        });
        setSuccess('Tag created successfully!');
      }
      loadTags(activeTab);
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tag: VideoTag) => {
    if (tag.isDefault) {
      setError('Cannot delete default tags');
      return;
    }

    if (!confirm(`Delete tag "${tag.name}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await videoTagsService.delete(tag.id);
      setSuccess('Tag deleted successfully!');
      loadTags(activeTab);
    } catch (err: any) {
      setError(err.message || 'Failed to delete tag');
    } finally {
      setLoading(false);
    }
  };

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'position': return 'Positions';
      case 'route': return 'Routes';
      case 'coverage': return 'Coverages';
      default: return type;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Manage Video Tags</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {tags.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleInitialize}
              disabled={initializing}
            >
              {initializing ? 'Initializing...' : 'Initialize Default Tags'}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
          >
            Add {getTabLabel(activeTab).slice(0, -1)}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Positions" value="position" />
          <Tab label="Routes" value="route" />
          <Tab label="Coverages" value="coverage" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading && !dialogOpen ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : tags.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No {getTabLabel(activeTab).toLowerCase()} yet. Click "Initialize Default Tags" to add standard tags,
                or "Add {getTabLabel(activeTab).slice(0, -1)}" to create custom ones.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  color={tag.isDefault ? 'primary' : 'default'}
                  variant={tag.isDefault ? 'filled' : 'outlined'}
                  onDelete={tag.isDefault ? undefined : () => handleDelete(tag)}
                  deleteIcon={<DeleteIcon />}
                  onClick={() => handleOpenDialog(tag)}
                  icon={tag.isDefault ? undefined : <EditIcon fontSize="small" />}
                  sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
                />
              ))}
            </Box>
          )}

          {tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Blue tags are defaults (cannot be deleted). Click any tag to edit its name.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          {editingTag ? `Edit ${getTabLabel(activeTab).slice(0, -1)}` : `Add ${getTabLabel(activeTab).slice(0, -1)}`}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={`e.g., ${activeTab === 'position' ? 'QB' : activeTab === 'route' ? 'Slant' : 'Cover 2'}`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : editingTag ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
