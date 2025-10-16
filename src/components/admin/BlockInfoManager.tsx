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
  Card,
  CardContent,
  IconButton,
  Grid,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useI18n } from '../../i18n/I18nProvider';
import {
  getAllBlockInfo,
  saveBlockInfo,
  deleteBlockInfo,
  initializeDefaultBlockInfo,
  type BlockInfo,
  type BlockInfoPayload,
} from '../../services/blockInfo';

export const BlockInfoManager: React.FC = () => {
  const { t } = useI18n();
  const [blockInfoList, setBlockInfoList] = useState<BlockInfo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState<BlockInfo | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<BlockInfoPayload>({
    blockName: '',
    infoText_en: '',
    infoText_de: '',
    trainingType: 'strength_conditioning',
  });

  useEffect(() => {
    initializeDefaultBlockInfo();
    loadBlockInfo();
  }, []);

  const loadBlockInfo = () => {
    setBlockInfoList(getAllBlockInfo());
  };

  const handleOpenDialog = (info?: BlockInfo) => {
    if (info) {
      setEditingInfo(info);
      setFormData({
        blockName: info.blockName,
        infoText_en: info.infoText_en,
        infoText_de: info.infoText_de,
        trainingType: info.trainingType,
      });
    } else {
      setEditingInfo(null);
      setFormData({
        blockName: '',
        infoText_en: '',
        infoText_de: '',
        trainingType: 'strength_conditioning',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    saveBlockInfo(formData);
    loadBlockInfo();
    setDialogOpen(false);
    setSuccessMessage(t('admin.blockInfoSaved'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('workout.confirmDelete'))) {
      deleteBlockInfo(id);
      loadBlockInfo();
      setSuccessMessage(t('admin.blockInfoDeleted'));
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6">{t('admin.blockInfoTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.blockInfoSubtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('admin.addBlockInfo')}
        </Button>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {blockInfoList.length === 0 ? (
        <Alert severity="info">{t('admin.noBlockInfoYet')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {blockInfoList.map((info) => (
            <Grid item xs={12} md={6} key={info.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <Typography variant="h6" sx={{ mb: 0.5 }}>
                        {info.blockName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: info.trainingType === 'strength_conditioning' ? 'primary.light' : 'secondary.light',
                          color: 'white',
                          display: 'inline-block',
                          mb: 1,
                        }}
                      >
                        {info.trainingType === 'strength_conditioning'
                          ? t('training.strength')
                          : t('training.sprints')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>EN:</strong> {info.infoText_en.substring(0, 80)}...
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        <strong>DE:</strong> {info.infoText_de.substring(0, 80)}...
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(info)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(info.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInfo ? t('admin.editBlockInfo') : t('admin.addBlockInfo')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('admin.blockName')}
              value={formData.blockName}
              onChange={(e) => setFormData({ ...formData, blockName: e.target.value })}
              fullWidth
              required
              placeholder="Compound Lifts, Accessory Work, Speed Work..."
              helperText="Must match exactly the block title in your training templates"
            />

            <FormControl fullWidth required>
              <InputLabel>{t('admin.trainingType')}</InputLabel>
              <Select
                value={formData.trainingType}
                label={t('admin.trainingType')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trainingType: e.target.value as 'strength_conditioning' | 'sprints_speed',
                  })
                }
              >
                <MenuItem value="strength_conditioning">{t('training.strength')}</MenuItem>
                <MenuItem value="sprints_speed">{t('training.sprints')}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={`${t('admin.infoText')} (English)`}
              value={formData.infoText_en}
              onChange={(e) => setFormData({ ...formData, infoText_en: e.target.value })}
              fullWidth
              required
              multiline
              rows={4}
              placeholder="Enter information in English..."
              helperText="This text will appear in the info tooltip (ⓘ) for English users"
            />

            <TextField
              label={`${t('admin.infoText')} (Deutsch)`}
              value={formData.infoText_de}
              onChange={(e) => setFormData({ ...formData, infoText_de: e.target.value })}
              fullWidth
              required
              multiline
              rows={4}
              placeholder="Informationen auf Deutsch eingeben..."
              helperText="This text will appear in the info tooltip (ⓘ) for German users"
            />

            <Alert severity="info">
              <strong>Multi-language ready:</strong> When integrated with a database, these fields will be stored as separate columns (infoText_en, infoText_de), making it easy to add more languages later.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.blockName || !formData.infoText_en || !formData.infoText_de}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
