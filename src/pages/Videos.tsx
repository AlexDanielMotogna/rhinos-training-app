import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getPublishedVideos, getPlayerProgressForAllVideos, isYouTubeShort, getYouTubeVideoId } from '../services/videos';
import { getUser } from '../services/mock';
import type { Video, VideoType, PositionTag, RouteTag, CoverageTag, VideoLevel, WatchStatus } from '../types/video';

export const Videos: React.FC = () => {
  const user = getUser();
  const [activeTab, setActiveTab] = useState<VideoType>('position');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<PositionTag | 'all'>('all');
  const [selectedRoute, setSelectedRoute] = useState<RouteTag | 'all'>('all');
  const [selectedCoverage, setSelectedCoverage] = useState<CoverageTag | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<VideoLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<WatchStatus | 'all'>('all');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videosToShow, setVideosToShow] = useState(30); // Start with 30 videos

  const VIDEOS_PER_PAGE = 30;

  const videos = useMemo(() => getPublishedVideos(), []);
  const progress = useMemo(
    () => (user ? getPlayerProgressForAllVideos(user.id) : {}),
    [user]
  );

  const getVideoStatus = (videoId: string): WatchStatus => {
    const prog = progress[videoId];
    if (!prog) return 'new';
    if (prog.completed) return 'completed';
    return 'in-progress';
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      // Filter by type (tab)
      if (video.type !== activeTab) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = video.title.toLowerCase().includes(query);
        const matchesDescription = video.description.toLowerCase().includes(query);
        const matchesTags =
          video.positions?.some(p => p.toLowerCase().includes(query)) ||
          video.routes?.some(r => r.toLowerCase().includes(query)) ||
          video.coverages?.some(c => c.toLowerCase().includes(query));

        if (!matchesTitle && !matchesDescription && !matchesTags) return false;
      }

      // Position filter
      if (selectedPosition !== 'all' && activeTab === 'position') {
        if (!video.positions?.includes(selectedPosition)) return false;
      }

      // Route filter
      if (selectedRoute !== 'all' && activeTab === 'route') {
        if (!video.routes?.includes(selectedRoute)) return false;
      }

      // Coverage filter
      if (selectedCoverage !== 'all' && activeTab === 'coverage') {
        if (!video.coverages?.includes(selectedCoverage)) return false;
      }

      // Level filter
      if (selectedLevel !== 'all') {
        if (video.level !== selectedLevel) return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (getVideoStatus(video.id) !== selectedStatus) return false;
      }

      return true;
    });
  }, [videos, activeTab, searchQuery, selectedPosition, selectedRoute, selectedCoverage, selectedLevel, selectedStatus]);

  // Reset videosToShow when filters change
  React.useEffect(() => {
    setVideosToShow(VIDEOS_PER_PAGE);
  }, [activeTab, searchQuery, selectedPosition, selectedRoute, selectedCoverage, selectedLevel, selectedStatus]);

  // Visible videos (paginated)
  const visibleVideos = useMemo(() => {
    return filteredVideos.slice(0, videosToShow);
  }, [filteredVideos, videosToShow]);

  const hasMore = filteredVideos.length > videosToShow;

  const handleLoadMore = () => {
    setVideosToShow(prev => prev + VIDEOS_PER_PAGE);
  };

  const selectedVideo = selectedVideoId ? videos.find(v => v.id === selectedVideoId) : null;

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  const renderVideoCard = (video: Video) => {
    const status = getVideoStatus(video.id);
    const prog = progress[video.id];
    const videoId = getYouTubeVideoId(video.youtubeUrl);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';

    return (
      <Grid item xs={12} sm={6} md={4} key={video.id}>
        <Card
          sx={{
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              boxShadow: 4,
            },
          }}
          onClick={() => setSelectedVideoId(video.id)}
        >
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="180"
              image={thumbnailUrl}
              alt={video.title}
              sx={{ backgroundColor: 'grey.300' }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {isYouTubeShort(video.youtubeUrl) && (
                <Chip label="Short" size="small" sx={{ backgroundColor: '#FF0000', color: 'white', fontWeight: 600 }} />
              )}
              {video.isPinned && (
                <Chip label="Featured" size="small" color="primary" sx={{ fontWeight: 600 }} />
              )}
              {status === 'completed' && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Completed"
                  size="small"
                  color="success"
                />
              )}
              {status === 'in-progress' && (
                <Chip
                  label={`${prog?.percentWatched || 0}%`}
                  size="small"
                  color="warning"
                />
              )}
            </Box>
            <PlayCircleOutlineIcon
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 60,
                color: 'white',
                opacity: 0.9,
              }}
            />
          </Box>

          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 1 }}>
              {video.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {video.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
              {video.level && (
                <Chip label={video.level} size="small" variant="outlined" />
              )}
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
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Training Videos
      </Typography>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Positions" value="position" />
        <Tab label="Routes" value="route" />
        <Tab label="Coverages" value="coverage" />
      </Tabs>

      {/* Search and Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {activeTab === 'position' && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Position</InputLabel>
              <Select
                value={selectedPosition}
                label="Position"
                onChange={(e) => setSelectedPosition(e.target.value as PositionTag | 'all')}
              >
                <MenuItem value="all">All Positions</MenuItem>
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
          </Grid>
        )}

        {activeTab === 'route' && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Route</InputLabel>
              <Select
                value={selectedRoute}
                label="Route"
                onChange={(e) => setSelectedRoute(e.target.value as RouteTag | 'all')}
              >
                <MenuItem value="all">All Routes</MenuItem>
                <MenuItem value="Slant">Slant</MenuItem>
                <MenuItem value="Out">Out</MenuItem>
                <MenuItem value="Curl">Curl</MenuItem>
                <MenuItem value="Post">Post</MenuItem>
                <MenuItem value="Wheel">Wheel</MenuItem>
                <MenuItem value="Dig">Dig</MenuItem>
                <MenuItem value="Corner">Corner</MenuItem>
                <MenuItem value="Comeback">Comeback</MenuItem>
                <MenuItem value="Screen">Screen</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {activeTab === 'coverage' && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Coverage</InputLabel>
              <Select
                value={selectedCoverage}
                label="Coverage"
                onChange={(e) => setSelectedCoverage(e.target.value as CoverageTag | 'all')}
              >
                <MenuItem value="all">All Coverages</MenuItem>
                <MenuItem value="Cover 1">Cover 1</MenuItem>
                <MenuItem value="Cover 2">Cover 2</MenuItem>
                <MenuItem value="Cover 3">Cover 3</MenuItem>
                <MenuItem value="Cover 4">Cover 4</MenuItem>
                <MenuItem value="Cover 6">Cover 6</MenuItem>
                <MenuItem value="Quarters">Quarters</MenuItem>
                <MenuItem value="Tampa 2">Tampa 2</MenuItem>
                <MenuItem value="Man">Man</MenuItem>
                <MenuItem value="Zone">Zone</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Level</InputLabel>
            <Select
              value={selectedLevel}
              label="Level"
              onChange={(e) => setSelectedLevel(e.target.value as VideoLevel | 'all')}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="intro">Intro</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value as WatchStatus | 'all')}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Video Grid */}
      <Grid container spacing={2}>
        {visibleVideos.map(renderVideoCard)}
      </Grid>

      {filteredVideos.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No videos found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or search query
          </Typography>
        </Box>
      )}

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={handleLoadMore}
            sx={{ minWidth: 200 }}
          >
            Load More ({filteredVideos.length - videosToShow} remaining)
          </Button>
        </Box>
      )}

      {/* Showing count */}
      {filteredVideos.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 2, mb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {visibleVideos.length} of {filteredVideos.length} videos
          </Typography>
        </Box>
      )}

      {/* Video Detail Dialog */}
      {selectedVideo && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
          onClick={() => setSelectedVideoId(null)}
        >
          <Box
            sx={{
              maxWidth: isYouTubeShort(selectedVideo.youtubeUrl) ? 500 : 1000,
              width: '100%',
              backgroundColor: 'background.paper',
              borderRadius: 1,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                position: 'relative',
                paddingTop: isYouTubeShort(selectedVideo.youtubeUrl) ? '177.78%' : '56.25%' // 9:16 for Shorts, 16:9 for regular
              }}
            >
              <iframe
                src={getYouTubeEmbedUrl(selectedVideo.youtubeUrl)}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              />
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {selectedVideo.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {selectedVideo.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {selectedVideo.level && (
                  <Chip label={selectedVideo.level} size="small" color="primary" />
                )}
                {selectedVideo.positions?.map(pos => (
                  <Chip key={pos} label={pos} size="small" variant="outlined" />
                ))}
                {selectedVideo.routes?.map(route => (
                  <Chip key={route} label={route} size="small" variant="outlined" />
                ))}
                {selectedVideo.coverages?.map(coverage => (
                  <Chip key={coverage} label={coverage} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
