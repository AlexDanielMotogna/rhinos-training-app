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
  Typography,
  Chip,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Grid,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import type { Exercise, ExerciseCategory } from '../../types/exercise';
import { searchCatalog } from '../../services/catalog';
import { getYouTubeThumbnail } from '../../services/yt';
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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

          <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
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
              <Grid container spacing={2}>
                {results.map((exercise) => {
                  const thumbnailUrl = exercise.youtubeUrl
                    ? getYouTubeThumbnail(exercise.youtubeUrl)
                    : undefined;

                  return (
                    <Grid item xs={12} sm={6} key={exercise.id}>
                      <Card
                        sx={{
                          position: 'relative',
                          '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s ease-in-out',
                          },
                        }}
                      >
                        <CardActionArea onClick={() => handleSelect(exercise)}>
                          {thumbnailUrl ? (
                            <Box sx={{ position: 'relative' }}>
                              <CardMedia
                                component="img"
                                height="140"
                                image={thumbnailUrl}
                                alt={exercise.name}
                                sx={{
                                  objectFit: 'cover',
                                  backgroundColor: 'grey.900',
                                }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  color: 'white',
                                  opacity: 0.9,
                                }}
                              >
                                <PlayCircleOutlineIcon sx={{ fontSize: 56 }} />
                              </Box>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                height: 140,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'grey.200',
                              }}
                            >
                              <Typography variant="h4" color="text.disabled">
                                {exercise.name.charAt(0).toUpperCase()}
                              </Typography>
                            </Box>
                          )}

                          <CardContent>
                            <Typography
                              variant="subtitle1"
                              fontWeight={600}
                              sx={{
                                mb: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {exercise.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={t(`category.${exercise.category}` as any)}
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                              {exercise.intensity && (
                                <Chip
                                  label={exercise.intensity}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
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
