import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box 
          sx={{ 
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--surface-base)',
            p: 3
          }}
        >
          <Card 
            sx={{ 
              maxWidth: 600,
              width: '100%',
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <ErrorIcon 
                  sx={{ 
                    fontSize: 64, 
                    color: 'var(--error-main)',
                    mb: 2 
                  }} 
                />
                <Typography 
                  variant="h5" 
                  component="h1" 
                  gutterBottom
                  sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                >
                  Something went wrong
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  We're sorry, but something unexpected happened. Our team has been notified.
                </Typography>
              </Box>

              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  backgroundColor: 'var(--surface-error)',
                  border: '1px solid var(--border-error)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                <Typography variant="body2" component="div">
                  <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
                </Typography>
                {this.state.errorInfo && (
                  <Typography 
                    variant="caption" 
                    component="div" 
                    sx={{ mt: 1, fontFamily: 'monospace' }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                  sx={{ 
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--primary-main)',
                    '&:hover': {
                      backgroundColor: 'var(--primary-dark)'
                    }
                  }}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  sx={{ 
                    borderRadius: 'var(--border-radius-md)',
                    borderColor: 'var(--primary-main)',
                    color: 'var(--primary-main)',
                    '&:hover': {
                      borderColor: 'var(--primary-dark)',
                      backgroundColor: 'var(--primary-light)'
                    }
                  }}
                >
                  Go Home
                </Button>
                <Button
                  variant="text"
                  onClick={this.handleReset}
                  sx={{ 
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Try Again
                </Button>
              </Box>

              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  mt: 3,
                  fontStyle: 'italic'
                }}
              >
                If the problem persists, please contact support with the error details above.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;