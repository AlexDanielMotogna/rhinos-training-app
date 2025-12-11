import { createTheme } from '@mui/material/styles';
import type { TeamBranding } from './types/teamSettings';

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Check if a color is dark (for determining hover behavior)
 */
function isColorDark(hex: string): boolean {
  const num = parseInt(hex.replace('#', ''), 16);
  const R = (num >> 16);
  const G = ((num >> 8) & 0x00FF);
  const B = (num & 0x0000FF);
  // Calculate luminance - if below threshold, color is dark
  const luminance = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
  return luminance < 0.4;
}

/**
 * Get a suitable dark variant for a color
 * For already dark colors, lighten slightly instead of darkening to black
 */
function getColorDark(hex: string, percent: number): string {
  if (isColorDark(hex)) {
    // For dark colors, lighten slightly for hover effect
    return lightenColor(hex, percent * 0.5);
  }
  return darkenColor(hex, percent);
}

// Default Color Palette (kept for backwards compatibility)
export const packersColors = {
  gold: {
    main: '#FFB612',
    light: '#FFC72C',
    bright: '#FFD54F',
    dark: '#F2A900',
    darker: '#D49000',
    bronze: '#B87900',
  },
  green: {
    main: '#203731',
    light: '#2d4f47',
    dark: '#152722',
    medium: '#1e5b3d',
    forest: '#024930',
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
 * Colors are calculated dynamically from the primary and secondary colors
 */
export function createDynamicTheme(branding?: TeamBranding) {
  const primaryColor = branding?.primaryColor || '#203731';
  const secondaryColor = branding?.secondaryColor || '#FFB612';

  // Calculate light and dark variants dynamically
  // Use getColorDark for dark colors to avoid turning them black on hover
  const primaryLight = lightenColor(primaryColor, 20);
  const primaryDark = getColorDark(primaryColor, 15);
  const secondaryLight = lightenColor(secondaryColor, 20);
  const secondaryDark = getColorDark(secondaryColor, 15);

  return createTheme({
    palette: {
      primary: {
        main: primaryColor,
        light: primaryLight,
        dark: primaryDark,
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryColor,
        light: secondaryLight,
        dark: secondaryDark,
        contrastText: '#000000',
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
        html: {
          // Inherit background from index.html to prevent flash
          backgroundColor: 'inherit',
        },
        body: {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          // Don't set background here - let pages control it
          // This prevents the white/gray flash on page load
          backgroundColor: 'inherit',
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
          // Fix for browser autofill not triggering label shrink
          '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px white inset',
            WebkitTextFillColor: 'inherit',
          },
          '& input:-webkit-autofill + fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.23)',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          // Shrink label when input has autofill
          '&.MuiInputLabel-outlined': {
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          // Detect autofill and notify MUI
          '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px white inset',
            WebkitTextFillColor: 'inherit',
            caretColor: 'inherit',
            borderRadius: 'inherit',
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
