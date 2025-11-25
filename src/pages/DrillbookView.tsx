import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardMedia,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import {
  SportsFootball as SportsIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useI18n } from '../i18n/I18nProvider';
import { drillService, syncDrillsFromBackend } from '../services/drillService';
import { equipmentService, syncEquipmentFromBackend } from '../services/equipmentService';
import { drillCategoryService, syncDrillCategoriesFromBackend, DrillCategory as ManagedCategory } from '../services/drillCategoryService';
import { Drill, DrillDifficulty, Equipment } from '../types/drill';

const DIFFICULTY_COLORS: Record<DrillDifficulty, string> = {
  basic: '#4CAF50',
  advanced: '#FFC107',
  complex: '#F44336',
};

export const DrillbookView: React.FC = () => {
  const { t } = useI18n();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Sync from backend first
    await Promise.all([
      syncDrillsFromBackend(),
      syncEquipmentFromBackend(),
      syncDrillCategoriesFromBackend(),
    ]);

    // Load from cache
    setDrills(drillService.getAllDrills());
    setEquipment(equipmentService.getAllEquipment());
    setCategories(drillCategoryService.getAllCategories());
  };

  const handleViewDrill = (drill: Drill) => {
    setSelectedDrill(drill);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedDrill(null);
  };

  const filteredDrills = filterCategory === 'all'
    ? drills
    : drills.filter(d => d.category === filterCategory);

  const getEquipmentName = (equipmentId: string): string => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : equipmentId;
  };

  const getCategoryName = (categoryKey: string): string => {
    const cat = categories.find(c => c.key === categoryKey);
    return cat ? (cat.nameEN || categoryKey) : categoryKey;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SportsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          {t('drillbook.title')}
        </Typography>
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('drillbook.filterByCategory')}</InputLabel>
          <Select
            value={filterCategory}
            label={t('drillbook.filterByCategory')}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <MenuItem value="all">{t('drillbook.allCategories')}</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.key} value={cat.key}>
                {cat.nameEN}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* No drills message */}
      {drills.length === 0 && (
        <Alert severity="info">
          {t('drillbook.noDrillsAvailable')}
        </Alert>
      )}

      {/* Drills Grid */}
      <Grid container spacing={3}>
        {filteredDrills.map((drill) => (
          <Grid item xs={12} sm={6} md={4} key={drill.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => handleViewDrill(drill)}
            >
              {/* Image/Sketch */}
              {drill.imageUrl || drill.sketchUrl ? (
                <CardMedia
                  component="img"
                  height="180"
                  image={drill.imageUrl || drill.sketchUrl}
                  alt={drill.name}
                  sx={{ objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 180,
                    background: `linear-gradient(135deg, ${DIFFICULTY_COLORS[drill.difficulty]} 0%, ${DIFFICULTY_COLORS[drill.difficulty]}aa 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SportsIcon sx={{ fontSize: 80, color: 'white', opacity: 0.8 }} />
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                {/* Category */}
                <Chip
                  label={getCategoryName(drill.category)}
                  size="small"
                  color="primary"
                  sx={{ mb: 1.5 }}
                />

                {/* Name */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {drill.name}
                </Typography>

                {/* Difficulty */}
                <Chip
                  label={drill.difficulty.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: DIFFICULTY_COLORS[drill.difficulty],
                    color: 'white',
                    fontWeight: 600,
                  }}
                />

                {/* Description preview */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {drill.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        {selectedDrill && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {selectedDrill.name}
                </Typography>
                <Chip
                  label={selectedDrill.difficulty.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: DIFFICULTY_COLORS[selectedDrill.difficulty],
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <IconButton onClick={handleCloseDetail}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={3}>
                {/* Category */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('drillbook.category')}
                  </Typography>
                  <Chip
                    label={getCategoryName(selectedDrill.category)}
                    color="primary"
                  />
                </Box>

                <Divider />

                {/* Image/Sketch */}
                {(selectedDrill.imageUrl || selectedDrill.sketchUrl) && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('drillbook.drillDiagram')}
                    </Typography>
                    <Box
                      component="img"
                      src={selectedDrill.imageUrl || selectedDrill.sketchUrl}
                      alt={selectedDrill.name}
                      sx={{
                        width: '100%',
                        maxHeight: 400,
                        objectFit: 'contain',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </Box>
                )}

                {/* Video */}
                {selectedDrill.videoUrl && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('drillbook.videoTutorial')}
                    </Typography>
                    <Box
                      sx={{
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden',
                        borderRadius: 2,
                      }}
                    >
                      <iframe
                        src={selectedDrill.videoUrl.replace('watch?v=', 'embed/')}
                        title={selectedDrill.name}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 0,
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                  </Box>
                )}

                {/* Description */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('drillbook.description')}
                  </Typography>
                  <Typography variant="body1">{selectedDrill.description}</Typography>
                </Box>

                {/* Coaching Points */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('drillbook.coachingPoints')}
                  </Typography>
                  <Typography variant="body1">{selectedDrill.coachingPoints}</Typography>
                </Box>

                {/* Training Context */}
                {selectedDrill.trainingContext && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('drillbook.trainingContext')}
                    </Typography>
                    <Typography variant="body1">{selectedDrill.trainingContext}</Typography>
                  </Box>
                )}

                <Divider />

                {/* Resources */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('drillbook.resourcesNeeded')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('drillbook.players')}
                      </Typography>
                      <Typography variant="h6">{selectedDrill.players}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('drillbook.coaches')}
                      </Typography>
                      <Typography variant="h6">{selectedDrill.coaches}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('drillbook.dummies')}
                      </Typography>
                      <Typography variant="h6">{selectedDrill.dummies}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Equipment */}
                {selectedDrill.equipment.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('drillbook.equipment')}
                    </Typography>
                    <Stack spacing={1}>
                      {selectedDrill.equipment.map((eq, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">{getEquipmentName(eq.equipmentId)}</Typography>
                          <Chip label={`x${eq.quantity}`} size="small" />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseDetail} variant="contained">
                {t('common.close')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
