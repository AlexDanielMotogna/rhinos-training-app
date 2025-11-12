import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches React errors and prevents the entire app from crashing with a blank screen
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // e.g., Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
            p: 3,
            bgcolor: 'background.default',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />
          <Typography variant="h5" color="error" fontWeight={600}>
            Something went wrong
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: 'center', maxWidth: 600 }}
          >
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                maxWidth: 800,
                maxHeight: 300,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              <Typography variant="caption" fontWeight={600}>
                Component Stack:
              </Typography>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              onClick={this.handleReset}
            >
              Return to Home
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
