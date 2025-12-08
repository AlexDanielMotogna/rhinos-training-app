import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PaletteIcon from '@mui/icons-material/Palette';
import SettingsIcon from '@mui/icons-material/Settings';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { BrandingManager } from '../components/admin/BrandingManager';
import { getTeamBranding } from '../services/teamSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`org-tabpanel-${index}`}
      aria-labelledby={`org-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `org-tab-${index}`,
    'aria-controls': `org-tabpanel-${index}`,
  };
}

export const Organization: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const branding = getTeamBranding();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {branding.logoUrl ? (
            <Box
              component="img"
              src={branding.logoUrl}
              alt="Logo"
              sx={{ width: 40, height: 40, objectFit: 'contain' }}
            />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FitnessCenterIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
          )}
          Organization Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Configure your team's branding, appearance, and organizational settings
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="organization settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<PaletteIcon />}
              iconPosition="start"
              label="Branding"
              {...a11yProps(0)}
            />
            <Tab
              icon={<SettingsIcon />}
              iconPosition="start"
              label="Team Settings"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <BrandingManager showTeamSettings={false} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <BrandingManager showBranding={false} />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};
