import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import DraftIcon from '@mui/icons-material/Drafts';
import {
  getAllVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from '../services/videos';
import { getUser } from '../services/mock';
import type {
  Video,
  VideoType,
  VideoStatus,
  VideoLevel,
  Unit,
  PositionTag,
  RouteTag,
  CoverageTag,
} from '../types/video';

export const VideosAdmin: React.FC = () => {
  const user = getUser();
  const [videos, setVideos] = useState<Video[]>(getAllVideos());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    type: VideoType;
    title: string;
    description: string;
    youtubeUrl: string;
    status: VideoStatus;
    level?: VideoLevel;
    unit?: Unit;
    positions: PositionTag[];
    routes: RouteTag[];
    coverages: CoverageTag[];
    isPinned: boolean;
  }>({
    type: 'position',
    title: '',
    description: '',
    youtubeUrl: '',
    status: 'draft',
    level: undefined,
    unit: undefined,
    positions: [],
    routes: [],
    coverages: [],
    isPinned: false,
  });

  const handleOpenDialog = (video?: Video) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        type: video.type,
        title: video.title,
        description: video.description,
        youtubeUrl: video.youtubeUrl,
        status: video.status,
        level: video.level,
        unit: video.unit,
        positions: video.positions || [],
        routes: video.routes || [],
        coverages: video.coverages || [],
        isPinned: video.isPinned || false,
      });
    } else {
      setEditingVideo(null);
      setFormData({
        type: 'position',
        title: '',
        description: '',
        youtubeUrl: '',
        status: 'draft',
        level: undefined,
        unit: undefined,
        positions: [],
        routes: [],
        coverages: [],
        isPinned: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVideo(null);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.youtubeUrl.trim()) {
      alert('Please fill in title and YouTube URL');
      return;
    }

    if (editingVideo) {
      // Update existing
      updateVideo(editingVideo.id, formData);
    } else {
      // Create new
      if (!user) return;
      createVideo({
        ...formData,
        createdBy: user.id,
      });
    }

    setVideos(getAllVideos());
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      deleteVideo(id);
      setVideos(getAllVideos());
    }
  };

  const handleToggleStatus = (video: Video) => {
    const newStatus: VideoStatus = video.status === 'draft' ? 'published' : 'draft';
    updateVideo(video.id, { status: newStatus });
    setVideos(getAllVideos());
  };

  const handleSelectChange = (field: string) => (event: SelectChangeEvent<any>) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleMultiSelectChange = (field: 'positions' | 'routes' | 'coverages') => (event: SelectChangeEvent<string[]>) => {
    setFormData({ ...formData, [field]: event.target.value as any[] });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Videos Admin</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Video
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage training videos for positions, routes, and coverages. Add YouTube URLs and categorize with tags.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Level</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tags</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {video.title}
                    </Typography>
                    {video.isPinned && (
                      <Chip label="Pinned" size="small" color="primary" sx={{ mt: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={video.type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={video.status}
                    size="small"
                    color={video.status === 'published' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {video.level && <Chip label={video.level} size="small" variant="outlined" />}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {video.positions?.slice(0, 2).map(pos => (
                      <Chip key={pos} label={pos} size="small" variant="outlined" />
                    ))}
                    {video.routes?.slice(0, 2).map(route => (
                      <Chip key={route} label={route} size="small" variant="outlined" />
                    ))}
                    {video.coverages?.slice(0, 2).map(coverage => (
                      <Chip key={coverage} label={coverage} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleStatus(video)}
                      color={video.status === 'published' ? 'warning' : 'success'}
                    >
                      {video.status === 'published' ? <DraftIcon /> : <PublishIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(video)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(video.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {videos.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No videos yet. Click "Add New Video" to get started.
          </Typography>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingVideo ? 'Edit Video' : 'Add New Video'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Type */}
            <FormControl fullWidth>
              <InputLabel>Type *</InputLabel>
              <Select
                value={formData.type}
                label="Type *"
                onChange={handleSelectChange('type')}
              >
                <MenuItem value="position">Position</MenuItem>
                <MenuItem value="route">Route</MenuItem>
                <MenuItem value="coverage">Coverage</MenuItem>
              </Select>
            </FormControl>

            {/* Title */}
            <TextField
              label="Title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Can use markdown for formatting"
            />

            {/* YouTube URL */}
            <TextField
              label="YouTube URL *"
              value={formData.youtubeUrl}
              onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
              fullWidth
              placeholder="https://www.youtube.com/watch?v=..."
            />

            {/* Status */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={handleSelectChange('status')}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </Select>
            </FormControl>

            {/* Level */}
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={formData.level || ''}
                label="Level"
                onChange={handleSelectChange('level')}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="intro">Intro</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>

            {/* Unit */}
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                value={formData.unit || ''}
                label="Unit"
                onChange={handleSelectChange('unit')}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Offense">Offense</MenuItem>
                <MenuItem value="Defense">Defense</MenuItem>
                <MenuItem value="Special Teams">Special Teams</MenuItem>
              </Select>
            </FormControl>

            {/* Positions (for position type) */}
            {formData.type === 'position' && (
              <FormControl fullWidth>
                <InputLabel>Positions</InputLabel>
                <Select
                  multiple
                  value={formData.positions}
                  label="Positions"
                  onChange={handleMultiSelectChange('positions')}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="QB">QB</MenuItem>
                  <MenuItem value="RB">RB</MenuItem>
                  <MenuItem value="WR">WR</MenuItem>
                  <MenuItem value="TE">TE</MenuItem>
                  <MenuItem value="OL">OL</MenuItem>
                  <MenuItem value="DL">DL</MenuItem>
                  <MenuItem value="LB">LB</MenuItem>
                  <MenuItem value="DB">DB</MenuItem>
                  <MenuItem value="K/P">K/P</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Routes (for route type) */}
            {formData.type === 'route' && (
              <FormControl fullWidth>
                <InputLabel>Routes</InputLabel>
                <Select
                  multiple
                  value={formData.routes}
                  label="Routes"
                  onChange={handleMultiSelectChange('routes')}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="Slant">Slant</MenuItem>
                  <MenuItem value="Out">Out</MenuItem>
                  <MenuItem value="Curl">Curl</MenuItem>
                  <MenuItem value="Post">Post</MenuItem>
                  <MenuItem value="Wheel">Wheel</MenuItem>
                  <MenuItem value="Dig">Dig</MenuItem>
                  <MenuItem value="Corner">Corner</MenuItem>
                  <MenuItem value="Comeback">Comeback</MenuItem>
                  <MenuItem value="Screen">Screen</MenuItem>
                  <MenuItem value="Go/Fade">Go/Fade</MenuItem>
                  <MenuItem value="Hitch">Hitch</MenuItem>
                  <MenuItem value="Cross">Cross</MenuItem>
                  <MenuItem value="Drag">Drag</MenuItem>
                  <MenuItem value="Seam">Seam</MenuItem>
                  <MenuItem value="Flag">Flag</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Coverages (for coverage type) */}
            {formData.type === 'coverage' && (
              <FormControl fullWidth>
                <InputLabel>Coverages</InputLabel>
                <Select
                  multiple
                  value={formData.coverages}
                  label="Coverages"
                  onChange={handleMultiSelectChange('coverages')}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="Cover 0">Cover 0</MenuItem>
                  <MenuItem value="Cover 1">Cover 1</MenuItem>
                  <MenuItem value="Cover 2">Cover 2</MenuItem>
                  <MenuItem value="Cover 3">Cover 3</MenuItem>
                  <MenuItem value="Cover 4">Cover 4</MenuItem>
                  <MenuItem value="Cover 6">Cover 6</MenuItem>
                  <MenuItem value="Quarters">Quarters</MenuItem>
                  <MenuItem value="Palms">Palms</MenuItem>
                  <MenuItem value="Tampa 2">Tampa 2</MenuItem>
                  <MenuItem value="Man">Man</MenuItem>
                  <MenuItem value="Zone">Zone</MenuItem>
                  <MenuItem value="Match">Match</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingVideo ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
