import { createTheme } from '@mui/material/styles';
import type { TeamBranding } from './types/teamSettings';

// Green Bay Packers Color Palette
export const packersColors = {
  gold: {
    main: '#FFB612',      // Packers Gold
    light: '#FFC72C',     // Light Gold
    bright: '#FFD54F',    // Bright Gold
    dark: '#F2A900',      // Dark Gold
    darker: '#D49000',    // Darker Gold
    bronze: '#B87900',    // Bronze Gold
  },
  green: {
    main: '#203731',      // Packers Green
    light: '#2d4f47',     // Light Green
    dark: '#152722',      // Dark Green
    medium: '#1e5b3d',    // Medium Green
    forest: '#024930',    // Forest Green
  },
};

// Points System Category Colors
export const pointsCategoryColors = {
  light: '#90caf9',      // Light Blue
  moderate: '#ffa726',   // Orange
  team: '#ab47bc',       // Purple
  intensive: '#ef5350',  // Red
};

// Workout/Session Type Colors
export const workoutTypeColors = {
  coach: '#4caf50',      // Green for coach/team workouts
  player: '#ffc107',     // Yellow for player/free sessions
  team: '#ff9800',       // Orange for team sessions
  personal: '#9c27b0',   // Purple for personal sessions
};

/**
 * Create dynamic theme based on branding configuration
 */
export function createDynamicTheme(branding?: TeamBranding) {
  const primaryColor = branding?.primaryColor || packersColors.green.main;
  const secondaryColor = branding?.secondaryColor || packersColors.gold.main;

  return createTheme({
    palette: {
      primary: {
        main: primaryColor,
        light: packersColors.green.light,
        dark: packersColors.green.dark,
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryColor,
        light: packersColors.gold.light,
        dark: packersColors.gold.dark,
        contrastText: primaryColor,
      },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#666666',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      '@media (min-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      '@media (min-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      '@media (min-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          overflowX: 'hidden',
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
    shape: {
      borderRadius: 8,
    },
  });
}

// Default theme (for backwards compatibility)
export const theme = createDynamicTheme();
