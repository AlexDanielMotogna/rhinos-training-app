import React, { useState, useEffect } from 'react';
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
  CircularProgress,
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
  syncVideosFromBackend,
} from '../services/videos';
import { getUser } from '../services/userProfile';
import { videoTagsService } from '../services/api';
import { extractYouTubeVideoId } from '../services/yt';
import { toastService } from '../services/toast';
import type {
  Video,
  VideoType,
  VideoStatus,
  VideoLevel,
  Unit,
  PositionTag,
  RouteTag,
  CoverageTag,
  RunConceptTag,
} from '../types/video';

interface VideoTag {
  id: string;
  type: 'position' | 'route' | 'coverage' | 'run';
  name: string;
  order: number;
}

export const VideosAdmin: React.FC = () => {
  const user = getUser();
  const [videos, setVideos] = useState<Video[]>(getAllVideos());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic tags from backend
  const [positionTags, setPositionTags] = useState<string[]>([]);
  const [routeTags, setRouteTags] = useState<string[]>([]);
  const [coverageTags, setCoverageTags] = useState<string[]>([]);
  const [runTags, setRunTags] = useState<string[]>([]);

  // Sync videos on mount
  useEffect(() => {
    if (user) {
      syncVideosFromBackend().then(() => {
        setVideos(getAllVideos());
      });
    }
  }, [user]);

  // Load tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const [positions, routes, coverages, runs] = await Promise.all([
          videoTagsService.getAll('position'),
          videoTagsService.getAll('route'),
          videoTagsService.getAll('coverage'),
          videoTagsService.getAll('run'),
        ]);
        setPositionTags(positions.map((t: VideoTag) => t.name));
        setRouteTags(routes.map((t: VideoTag) => t.name));
        setCoverageTags(coverages.map((t: VideoTag) => t.name));
        setRunTags(runs.map((t: VideoTag) => t.name));
      } catch (err) {
        console.error('Failed to load tags:', err);
        // Fallback to empty arrays - coach can initialize tags from Admin > Video Tags
      }
    };
    loadTags();
  }, []);

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
    runs: RunConceptTag[];
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
    runs: [],
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
        runs: video.runs || [],
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
        runs: [],
        isPinned: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVideo(null);
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    // Use the robust extractYouTubeVideoId function from yt.ts
    // which handles URLs with extra query parameters correctly
    return extractYouTubeVideoId(url) !== undefined;
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.youtubeUrl.trim()) {
      setError('Please fill in title and YouTube URL');
      return;
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(formData.youtubeUrl)) {
      setError('Invalid YouTube URL. Please use a valid format like: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingVideo) {
        // Update existing
        await updateVideo(editingVideo.id, formData);
        toastService.updated('Video');
      } else {
        // Create new
        if (!user) return;
        await createVideo({
          ...formData,
          createdBy: user.id,
        });
        toastService.created('Video');
      }

      setVideos(getAllVideos());
      handleCloseDialog();
    } catch (err: any) {
      console.error('Failed to save video:', err);
      if (editingVideo) {
        toastService.updateError('video', err.message);
      } else {
        toastService.createError('video', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteVideo(id);
      setVideos(getAllVideos());
      toastService.deleted('Video');
    } catch (err: any) {
      console.error('Failed to delete video:', err);
      toastService.deleteError('video', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (video: Video) => {
    const newStatus: VideoStatus = video.status === 'draft' ? 'published' : 'draft';

    setLoading(true);
    setError(null);

    try {
      await updateVideo(video.id, { status: newStatus });
      setVideos(getAllVideos());
      toastService.updated('Video status');
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      toastService.updateError('video status', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (field: string) => (event: SelectChangeEvent<any>) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleMultiSelectChange = (field: 'positions' | 'routes' | 'coverages' | 'runs') => (event: SelectChangeEvent<string[]>) => {
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
          disabled={loading}
        >
          Add New Video
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage training videos for positions, routes, coverages, and run concepts. Add YouTube URLs and categorize with tags.
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
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
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
                <MenuItem value="run">Run Concept</MenuItem>
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
              helperText="Paste a valid YouTube video URL (regular video or Short)"
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
                  {positionTags.length === 0 ? (
                    <MenuItem disabled>
                      No positions available. Go to Admin {'>'} Video Tags to add them.
                    </MenuItem>
                  ) : (
                    positionTags.map((position) => (
                      <MenuItem key={position} value={position}>
                        {position}
                      </MenuItem>
                    ))
                  )}
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
                  {routeTags.length === 0 ? (
                    <MenuItem disabled>
                      No routes available. Go to Admin {'>'} Video Tags to add them.
                    </MenuItem>
                  ) : (
                    routeTags.map((route) => (
                      <MenuItem key={route} value={route}>
                        {route}
                      </MenuItem>
                    ))
                  )}
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
                  {coverageTags.length === 0 ? (
                    <MenuItem disabled>
                      No coverages available. Go to Admin {'>'} Video Tags to add them.
                    </MenuItem>
                  ) : (
                    coverageTags.map((coverage) => (
                      <MenuItem key={coverage} value={coverage}>
                        {coverage}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}

            {/* Run Concepts (for run type) */}
            {formData.type === 'run' && (
              <FormControl fullWidth>
                <InputLabel>Run Concepts</InputLabel>
                <Select
                  multiple
                  value={formData.runs}
                  label="Run Concepts"
                  onChange={handleMultiSelectChange('runs')}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {runTags.length === 0 ? (
                    <MenuItem disabled>
                      No run concepts available. Go to Admin {'>'} Video Tags to add them.
                    </MenuItem>
                  ) : (
                    runTags.map((run) => (
                      <MenuItem key={run} value={run}>
                        {run}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (editingVideo ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
