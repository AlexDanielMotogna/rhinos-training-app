import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
} from '@mui/material';
import type { Exercise, ExerciseCategory } from '../../types/exercise';
import { searchCatalog } from '../../services/catalog';
import { useI18n } from '../../i18n/I18nProvider';

interface CatalogSearchProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  onCreateCustom: () => void;
}

const categories: ExerciseCategory[] = [
  'Strength',
  'Speed',
  'COD',
  'Mobility',
  'Technique',
  'Conditioning',
  'Recovery',
  'Plyometrics',
];

export const CatalogSearch: React.FC<CatalogSearchProps> = ({
  open,
  onClose,
  onSelect,
  onCreateCustom,
}) => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');

  const results = useMemo(() => {
    return searchCatalog(query, category || undefined);
  }, [query, category]);

  const handleReset = () => {
    setQuery('');
    setCategory('');
  };

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    handleReset();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('workout.searchCatalog')}</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={t('common.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            autoFocus
          />

          <FormControl fullWidth>
            <InputLabel>{t('workout.category')}</InputLabel>
            <Select
              value={category}
              label={t('workout.category')}
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="">
                <em>{t('workout.selectCategory')}</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {t(`category.${cat}` as any)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {results.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {t('workout.noExercisesFound')}
                </Typography>
                <Button variant="outlined" onClick={onCreateCustom}>
                  {t('workout.createCustom')}
                </Button>
              </Box>
            ) : (
              <List>
                {results.map((exercise) => (
                  <ListItem key={exercise.id} disablePadding>
                    <ListItemButton onClick={() => handleSelect(exercise)}>
                      <ListItemText
                        primary={exercise.name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip
                              label={t(`category.${exercise.category}` as any)}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            {exercise.intensity && (
                              <Chip
                                label={exercise.intensity}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCreateCustom}>{t('workout.createCustom')}</Button>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};
