import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SpeedIcon from '@mui/icons-material/Speed';
import BoltIcon from '@mui/icons-material/Bolt';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { useI18n } from '../i18n/I18nProvider';

export const Tests: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const testCategories = [
    {
      key: 'strength',
      title: t('tests.strength.title'),
      description: t('tests.strength.description'),
      icon: <FitnessCenterIcon sx={{ fontSize: 60 }} />,
      path: '/tests/strength',
      color: '#1976d2', // Blue color for strength
    },
    {
      key: 'speed',
      title: t('tests.speed.title'),
      description: t('tests.speed.description'),
      icon: <SpeedIcon sx={{ fontSize: 60 }} />,
      path: '/tests/speed',
      color: '#ed6c02',
    },
    {
      key: 'power',
      title: t('tests.power.title'),
      description: t('tests.power.description'),
      icon: <BoltIcon sx={{ fontSize: 60 }} />,
      path: '/tests/power',
      color: '#9c27b0',
    },
    {
      key: 'agility',
      title: t('tests.agility.title'),
      description: t('tests.agility.description'),
      icon: <DirectionsRunIcon sx={{ fontSize: 60 }} />,
      path: '/tests/agility',
      color: '#2e7d32',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant="h4" gutterBottom>
        {t('tests.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('tests.subtitle')}
      </Typography>

      <Grid container spacing={3}>
        {testCategories.map(category => (
          <Grid item xs={12} sm={6} md={6} key={category.key}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: category.color, mb: 2 }}>
                  {category.icon}
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {category.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(category.path)}
                  sx={{ backgroundColor: category.color }}
                >
                  {t('tests.start')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
