import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Box,
  Chip,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { globalCatalog } from '../../services/catalog';
import type { Exercise, ExerciseCategory } from '../../types/exercise';

interface ExerciseSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');

  const categories: Array<ExerciseCategory | 'All'> = [
    'All',
    'Strength',
    'Speed',
    'COD',
    'Mobility',
    'Technique',
    'Conditioning',
  ];

  // Filter exercises
  const filteredExercises = globalCatalog.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setSearchTerm('');
    setSelectedCategory('All');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Exercise</DialogTitle>
      <DialogContent>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          autoFocus
        />

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onChange={(_, value) => setSelectedCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {categories.map(cat => (
            <Tab key={cat} label={cat} value={cat} />
          ))}
        </Tabs>

        {/* Exercise List */}
        {filteredExercises.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No exercises found. Try a different search term or category.
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredExercises.map((exercise) => (
              <ListItem key={exercise.id} disablePadding>
                <ListItemButton onClick={() => handleSelect(exercise)}>
                  <ListItemText
                    primary={exercise.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Chip label={exercise.category} size="small" />
                        <Chip label={exercise.intensity} size="small" color="secondary" />
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
