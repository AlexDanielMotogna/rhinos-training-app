import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
} from '@mui/material';
import { useI18n } from '../i18n/I18nProvider';
import { globalCatalog } from '../services/catalog';

export const Coach: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('nav.coach')}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label={t('coach.trainingBuilder')} />
        <Tab label={t('coach.catalogManager')} />
        <Tab label={t('coach.freeReview')} />
        <Tab label={t('coach.freePolicies')} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Training Builder - Create and manage training templates (Read-only UI)
          </Alert>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Active Training Types
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip label="Strength & Conditioning" color="primary" />
                <Chip label="Sprints / Speed" color="primary" />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Use this section to create new training types, define templates per position, and configure exercises with targets.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('coach.globalCatalog')}
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Intensity</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Positions</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Video</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {globalCatalog.slice(0, 20).map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell>{exercise.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(`category.${exercise.category}` as any)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {exercise.intensity && (
                        <Chip
                          label={exercise.intensity}
                          size="small"
                          color={
                            exercise.intensity === 'high'
                              ? 'error'
                              : exercise.intensity === 'mod'
                              ? 'warning'
                              : 'success'
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {exercise.positionTags?.join(', ') || 'All'}
                    </TableCell>
                    <TableCell>
                      {exercise.youtubeUrl ? 'Yes' : 'No'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Showing 20 of {globalCatalog.length} exercises
          </Typography>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('coach.customExercises')}
          </Typography>

          <Alert severity="info">
            {t('coach.noCustomPending')}
          </Alert>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              When players create custom exercises, they will appear here for review. You can:
              <ul>
                <li>Mark as Specific (counts towards compliance scoring)</li>
                <li>Mark as Non-Specific (lower caps in scoring)</li>
                <li>Promote to global catalog</li>
              </ul>
            </Typography>
          </Paper>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('coach.freePolicies')}
          </Typography>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('coach.maxFreeSessionsPerDay')}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    2
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('coach.maxFreeSharePctPerWeek')}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    40%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('coach.allowedCategories')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Strength" />
                    <Chip label="Speed" />
                    <Chip label="Conditioning" />
                    <Chip label="Mobility" />
                    <Chip label="Recovery" />
                  </Box>
                </Box>

                <Alert severity="warning">
                  These policies control how free work is treated in scoring and compliance calculations.
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};
