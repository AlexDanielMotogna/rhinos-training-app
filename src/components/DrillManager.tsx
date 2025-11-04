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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CardMedia,
  Stack,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  SportsFootball as SportsIcon,
  Remove as RemoveIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useI18n } from '../i18n/I18nProvider';
import { drillService, syncDrillsFromBackend } from '../services/drillService';
import { equipmentService, syncEquipmentFromBackend } from '../services/equipmentService';
import { drillCategoryService, syncDrillCategoriesFromBackend, DrillCategory as ManagedCategory } from '../services/drillCategoryService';
import { exportDrillToPDF } from '../services/drillPdfExport';
import { optimizeDrillSketch, validateImage } from '../services/imageOptimizer';
import { Drill, DrillDifficulty, Equipment, DrillEquipment, CreateDrillData } from '../types/drill';
import { getUser } from '../services/userProfile';

const DIFFICULTY_COLORS: Record<DrillDifficulty, string> = {
  basic: '#4CAF50',
  advanced: '#FFC107',
  complex: '#F44336',
};

export const DrillManager: React.FC = () => {
  const { t } = useI18n();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '', // Will be set to first available category
    equipment: [] as DrillEquipment[],
    coaches: '1',
    dummies: '0',
    players: '1',
    difficulty: 'basic' as DrillDifficulty,
    description: '',
    coachingPoints: '',
    trainingContext: '',
  });

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

  const handleOpenDialog = (drill?: Drill) => {
    if (drill) {
      setEditingDrill(drill);
      setFormData({
        name: drill.name,
        category: drill.category,
        equipment: drill.equipment,
        coaches: drill.coaches.toString(),
        dummies: drill.dummies.toString(),
        players: drill.players.toString(),
        difficulty: drill.difficulty,
        description: drill.description,
        coachingPoints: drill.coachingPoints,
        trainingContext: drill.trainingContext || '',
      });
      setSketchPreview(drill.sketchUrl || '');
    } else {
      setEditingDrill(null);
      const defaultCategory = categories.length > 0 ? categories[0].key || '' : '';
      setFormData({
        name: '',
        category: defaultCategory,
        equipment: [],
        coaches: '1',
        dummies: '0',
        players: '1',
        difficulty: 'basic',
        description: '',
        coachingPoints: '',
        trainingContext: '',
      });
      setSketchPreview('');
    }
    setSketchFile(null);
    setSelectedEquipment('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDrill(null);
    setSketchFile(null);
    setSketchPreview('');
    setSelectedEquipment('');
    setImageError('');
    setIsOptimizing(false);
  };

  const handleSketchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const optimizedBase64 = await optimizeDrillSketch(file);
      setSketchFile(file);
      setSketchPreview(optimizedBase64);
      console.log(`Image optimized: ${(file.size / 1024).toFixed(0)}KB → ${((optimizedBase64.length * 3) / 4 / 1024).toFixed(0)}KB`);
    } catch (error) {
      setImageError((error as Error).message);
      console.error('Image optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAddEquipment = () => {
    if (!selectedEquipment) return;

    // Check if equipment already exists
    const exists = formData.equipment.find(e => e.equipmentId === selectedEquipment);
    if (exists) {
      // Increment quantity
      setFormData({
        ...formData,
        equipment: formData.equipment.map(e =>
          e.equipmentId === selectedEquipment
            ? { ...e, quantity: e.quantity + 1 }
            : e
        ),
      });
    } else {
      // Add new equipment with quantity 1
      setFormData({
        ...formData,
        equipment: [...formData.equipment, { equipmentId: selectedEquipment, quantity: 1 }],
      });
    }
    setSelectedEquipment('');
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter(e => e.equipmentId !== equipmentId),
    });
  };

  const handleUpdateEquipmentQuantity = (equipmentId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveEquipment(equipmentId);
    } else {
      setFormData({
        ...formData,
        equipment: formData.equipment.map(e =>
          e.equipmentId === equipmentId ? { ...e, quantity } : e
        ),
      });
    }
  };

  const handleSave = async () => {
    const currentUser = getUser();
    if (!currentUser) return;

    setIsSaving(true);
    const drillData: CreateDrillData = {
      name: formData.name,
      category: formData.category,
      equipment: formData.equipment,
      coaches: parseInt(formData.coaches),
      dummies: parseInt(formData.dummies),
      players: parseInt(formData.players),
      difficulty: formData.difficulty,
      description: formData.description,
      coachingPoints: formData.coachingPoints,
      trainingContext: formData.trainingContext || undefined,
    };

    console.log('[DrillManager] Sending drill data:', JSON.stringify(drillData, null, 2));

    try {
      let drillId: string;

      // Create or update drill first (without image)
      if (editingDrill) {
        await drillService.updateDrill(editingDrill.id, drillData);
        drillId = editingDrill.id;
      } else {
        const newDrill = await drillService.createDrill(drillData);
        drillId = newDrill.id;
      }

      // Upload image to Cloudinary if a new file was selected
      if (sketchFile) {
        try {
          await drillService.uploadSketch(drillId, sketchFile);
        } catch (uploadError) {
          console.error('Failed to upload sketch:', uploadError);
          alert(t('drills.uploadSketchError'));
        }
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save drill:', error);
      alert(t('drills.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('drills.confirmDelete'))) {
      setIsDeleting(id);
      try {
        await drillService.deleteDrill(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete drill:', error);
        alert(t('drills.deleteError'));
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const filteredDrills = filterCategory === 'all'
    ? drills
    : drills.filter(d => d.category === filterCategory);

  const getEquipmentName = (equipmentId: string): string => {
    return equipment.find(e => e.id === equipmentId)?.name || 'Unknown';
  };

  const getCategoryDisplayName = (categoryKey: string): string => {
    return categories.find(c => (c.key || c.name) === categoryKey)?.name || categoryKey;
  };

  const getCategoryColor = (categoryKey: string): string => {
    return categories.find(c => (c.key || c.name) === categoryKey)?.color || '#1976d2';
  };

  const formatEquipmentList = (drillEquipment: DrillEquipment[]): string => {
    if (drillEquipment.length === 0) return t('drills.noEquipment');
    return drillEquipment
      .map(({ equipmentId, quantity }) => `${getEquipmentName(equipmentId)} x${quantity}`)
      .join(', ');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{t('drills.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('drills.addDrill')}
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>{t('drills.filterCategory')}</InputLabel>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            label={t('drills.filterCategory')}
          >
            <MenuItem value="all">{t('drills.allCategories')}</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.key || category.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '3px',
                      backgroundColor: category.color,
                      border: '1px solid rgba(0,0,0,0.12)',
                    }}
                  />
                  {category.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {filteredDrills.map((drill) => (
          <Grid item xs={12} md={6} lg={4} key={drill.id}>
            <Card>
              {drill.sketchUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={drill.sketchUrl}
                  alt={drill.name}
                  sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ flex: 1 }}>
                    {drill.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => exportDrillToPDF(drill, t)}
                      color="primary"
                      title={t('drills.downloadPDF')}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(drill)} disabled={isDeleting === drill.id}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(drill.id)} color="error" disabled={isDeleting === drill.id}>
                      {isDeleting === drill.id ? <CircularProgress size={20} /> : <DeleteIcon />}
                    </IconButton>
                  </Box>
                </Box>

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={getCategoryDisplayName(drill.category)}
                      size="small"
                      sx={{ bgcolor: getCategoryColor(drill.category), color: 'white' }}
                    />
                    <Chip
                      label={t(`drills.difficulty.${drill.difficulty}`)}
                      size="small"
                      sx={{ bgcolor: DIFFICULTY_COLORS[drill.difficulty], color: 'white' }}
                    />
                  </Box>

                  <Divider />

                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('drills.description')}:</strong> {drill.description}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('drills.coachingPoints')}:</strong> {drill.coachingPoints}
                  </Typography>

                  {drill.trainingContext && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('drills.trainingContext')}:</strong> {drill.trainingContext}
                    </Typography>
                  )}

                  <Divider />

                  <Typography variant="body2">
                    <strong>{t('drills.equipment')}:</strong> {formatEquipmentList(drill.equipment)}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2">
                      <strong>{t('drills.coaches')}:</strong> {drill.coaches}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('drills.dummies')}:</strong> {drill.dummies}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('drills.players')}:</strong> {drill.players}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredDrills.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SportsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {t('drills.noDrills')}
          </Typography>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDrill ? t('drills.editDrill') : t('drills.addDrill')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('drills.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>{t('drills.category.label')}</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label={t('drills.category.label')}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.key || category.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '3px',
                          backgroundColor: category.color,
                          border: '1px solid rgba(0,0,0,0.12)',
                        }}
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Equipment Selection with Quantities */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('drills.equipment')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>{t('drills.selectEquipment')}</InputLabel>
                  <Select
                    value={selectedEquipment}
                    onChange={(e) => setSelectedEquipment(e.target.value)}
                    label={t('drills.selectEquipment')}
                  >
                    {equipment.map((eq) => (
                      <MenuItem key={eq.id} value={eq.id}>
                        {eq.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={handleAddEquipment}
                  disabled={!selectedEquipment}
                  startIcon={<AddIcon />}
                >
                  {t('common.add')}
                </Button>
              </Box>

              {/* Selected Equipment List */}
              {formData.equipment.length > 0 && (
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <List dense>
                    {formData.equipment.map(({ equipmentId, quantity }) => (
                      <ListItem
                        key={equipmentId}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveEquipment(equipmentId)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={getEquipmentName(equipmentId)}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateEquipmentQuantity(equipmentId, quantity - 1)}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <TextField
                                value={quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  handleUpdateEquipmentQuantity(equipmentId, val);
                                }}
                                type="number"
                                size="small"
                                sx={{ width: 70 }}
                                inputProps={{ min: 1 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateEquipmentQuantity(equipmentId, quantity + 1)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                              <Typography variant="caption" color="text.secondary">
                                {t('drills.quantityLabel')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
              <FormHelperText>{t('drills.equipmentHelp')}</FormHelperText>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  label={t('drills.coaches')}
                  value={formData.coaches}
                  onChange={(e) => setFormData({ ...formData, coaches: e.target.value })}
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label={t('drills.dummies')}
                  value={formData.dummies}
                  onChange={(e) => setFormData({ ...formData, dummies: e.target.value })}
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label={t('drills.players')}
                  value={formData.players}
                  onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth required>
              <InputLabel>{t('drills.difficulty.label')}</InputLabel>
              <Select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DrillDifficulty })}
                label={t('drills.difficulty.label')}
              >
                <MenuItem value="basic">{t('drills.difficulty.basic')}</MenuItem>
                <MenuItem value="advanced">{t('drills.difficulty.advanced')}</MenuItem>
                <MenuItem value="complex">{t('drills.difficulty.complex')}</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={isOptimizing ? <CircularProgress size={20} /> : <UploadIcon />}
                fullWidth
                disabled={isOptimizing}
              >
                {isOptimizing ? t('drills.optimizingImage') : t('drills.uploadSketch')}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleSketchUpload}
                />
              </Button>
              <FormHelperText>
                JPEG or PNG, max 5MB. Image will be optimized to 1600x1200px for best quality.
              </FormHelperText>

              {imageError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {imageError}
                </Alert>
              )}

              {sketchPreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={sketchPreview}
                    alt="Sketch preview"
                    style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                  />
                  <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                    ✓ Image optimized and ready
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField
              label={t('drills.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
              required
            />

            <TextField
              label={t('drills.coachingPoints')}
              value={formData.coachingPoints}
              onChange={(e) => setFormData({ ...formData, coachingPoints: e.target.value })}
              multiline
              rows={3}
              fullWidth
              required
            />

            <TextField
              label={t('drills.trainingContext')}
              value={formData.trainingContext}
              onChange={(e) => setFormData({ ...formData, trainingContext: e.target.value })}
              fullWidth
              helperText={t('drills.trainingContextHelp')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              isSaving ||
              !formData.name.trim() ||
              !formData.description.trim() ||
              !formData.coachingPoints.trim()
            }
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
