import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { getAllUsers } from '../services/mock';

export const Team: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const allUsers = getAllUsers();
  const players = allUsers.filter(user => user.role === 'player');

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.jerseyNumber && player.jerseyNumber.toString().includes(searchQuery))
  );

  const handlePlayerClick = (playerId: string) => {
    navigate(`/profile/${playerId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('team.title')}
      </Typography>

      <TextField
        fullWidth
        placeholder={t('team.search')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={2}>
        {filteredPlayers.map((player) => (
          <Grid item xs={12} sm={6} md={4} key={player.id}>
            <Card>
              <CardActionArea onClick={() => handlePlayerClick(player.id)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}>
                      {player.jerseyNumber || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{player.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {player.position}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${player.age} years`} size="small" />
                    <Chip label={`${player.weightKg} kg`} size="small" />
                    <Chip label={`${player.heightCm} cm`} size="small" />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
