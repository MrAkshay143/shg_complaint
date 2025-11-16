import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Button, Typography, CircularProgress } from '@mui/material';
import { Assignment, People, Business, Assessment } from '@mui/icons-material';
import { useAuthStore } from './stores/authStore';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { NavRailCompact } from './components/Layout/AppShell';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Complaints from './components/Complaints/Complaints';
import Masters from './components/Masters/Masters';
import Reports from './components/Reports/Reports';
import UserManagement from './components/Users/UserManagement';

// Get current theme colors based on CSS custom properties (kept for future use)
// const getThemeColors = () => {
//   const root = document.documentElement;
//   const computedStyle = getComputedStyle(root);
//   
//   return {
//     primary: {
//       main: computedStyle.getPropertyValue('--primary-main').trim() || '#1976d2',
//       light: computedStyle.getPropertyValue('--primary-light').trim() || '#42a5f5',
//       dark: computedStyle.getPropertyValue('--primary-dark').trim() || '#1565c0',
//     },
//     secondary: {
//       main: computedStyle.getPropertyValue('--secondary-main').trim() || '#dc004e',
//       light: computedStyle.getPropertyValue('--secondary-light').trim() || '#ff5983',
//       dark: computedStyle.getPropertyValue('--secondary-dark').trim() || '#9a0036',
//     },
//     background: {
//       default: computedStyle.getPropertyValue('--surface-base').trim() || '#ffffff',
//       paper: computedStyle.getPropertyValue('--surface-elevated').trim() || '#f5f5f5',
//     },
//     text: {
//       primary: computedStyle.getPropertyValue('--text-primary').trim() || '#000000',
//       secondary: computedStyle.getPropertyValue('--text-secondary').trim() || '#666666',
//     },
//   };
// };

// Create MUI theme with proper CSS custom property support
const createMuiTheme = () => {
  // Ensure CSS custom properties are available
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  return createTheme({
    palette: {
      primary: {
        main: computedStyle.getPropertyValue('--primary-main')?.trim() || '#1976d2',
        light: computedStyle.getPropertyValue('--primary-light')?.trim() || '#42a5f5',
        dark: computedStyle.getPropertyValue('--primary-dark')?.trim() || '#1565c0',
      },
      secondary: {
        main: computedStyle.getPropertyValue('--secondary-main')?.trim() || '#dc004e',
        light: computedStyle.getPropertyValue('--secondary-light')?.trim() || '#ff5983',
        dark: computedStyle.getPropertyValue('--secondary-dark')?.trim() || '#9a0036',
      },
      background: {
        default: computedStyle.getPropertyValue('--surface-base')?.trim() || '#ffffff',
        paper: computedStyle.getPropertyValue('--surface-elevated')?.trim() || '#f5f5f5',
      },
      text: {
        primary: computedStyle.getPropertyValue('--text-primary')?.trim() || '#000000',
        secondary: computedStyle.getPropertyValue('--text-secondary')?.trim() || '#666666',
      },
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};

import AppHeader from './components/Layout/AppHeader';

function ModernLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  const navigationItems = [
    { text: 'Dashboard', icon: <Assessment />, path: '/', roles: ['admin', 'executive'] },
    { text: 'Complaints', icon: <Assignment />, path: '/complaints', roles: ['admin', 'executive'] },
    { text: 'Masters', icon: <Business />, path: '/masters', roles: ['admin'] },
    { text: 'Reports', icon: <Assessment />, path: '/reports', roles: ['admin'] },
    { text: 'Users', icon: <People />, path: '/users', roles: ['admin'] },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <NavRailCompact isCollapsed={isNavCollapsed}>
        {/* Logo/Header Section */}
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isNavCollapsed ? 'center' : 'flex-start',
          gap: 2
        }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
            flexShrink: 0
          }}>
            SP
          </Box>
          {!isNavCollapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#18181b',
                  fontSize: '16px',
                  lineHeight: 1.2,
                  mb: 0.5
                }}
              >
                Shalimar
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#52525b',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                Poultry Farms
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Navigation Items */}
        <Box sx={{ p: 2, flexGrow: 1 }}>
          {navigationItems.map((item) => (
            <Button
              key={item.text}
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                justifyContent: isNavCollapsed ? 'center' : 'flex-start',
                width: '100%',
                mb: 1,
                color: '#52525b',
                backgroundColor: 'transparent',
                borderRadius: '12px',
                py: 1.5,
                px: 2,
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  color: '#18181b',
                  backgroundColor: 'rgba(24, 24, 27, 0.05)',
                  transform: 'translateX(4px)',
                },
                '& .MuiButton-startIcon': {
                  marginRight: isNavCollapsed ? 0 : 1,
                  transition: 'all 0.2s ease',
                },
                '&:hover .MuiButton-startIcon': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              {!isNavCollapsed && (
                <span style={{ transition: 'all 0.2s ease' }}>
                  {item.text}
                </span>
              )}
            </Button>
          ))}
        </Box>
        
        {/* User Section */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          mt: 'auto'
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderRadius: '12px',
            backgroundColor: 'rgba(24, 24, 27, 0.03)',
            justifyContent: isNavCollapsed ? 'center' : 'flex-start'
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              flexShrink: 0
            }}>
              {user?.name?.charAt(0) || 'U'}
            </Box>
            {!isNavCollapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#18181b',
                    fontSize: '13px',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {user?.name || 'User'}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#52525b',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}
                >
                  {user?.role || 'User'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </NavRailCompact>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppHeader
          title="Shalimar Poultry - Complaint Management"
          onMenuClick={() => setIsNavCollapsed(!isNavCollapsed)}
        />
        <Box sx={{ 
          p: { xs: 2, md: 3 },
          flexGrow: 1,
          backgroundColor: 'var(--surface-base)',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

function LoginRedirect() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      const intendedPath = localStorage.getItem('intendedPath') || '/';
      localStorage.removeItem('intendedPath');
      navigate(intendedPath, { replace: true });
    }
  }, [user, navigate]);
  
  return user ? null : <Login />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuthStore();
  const location = useLocation();
  
  // Store the intended location in localStorage when not authenticated
  useEffect(() => {
    if (!user && !isLoading && location.pathname !== '/login') {
      localStorage.setItem('intendedPath', location.pathname + location.search);
    }
  }, [user, isLoading, location]);
  
  // If we're still loading the user data, don't redirect yet
  if (isLoading && token) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--surface-base)'
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Only redirect to login if we're not loading and there's no user
  if (!user && !isLoading) {
    return <Navigate to="/login" replace />;
  }
  
  // If we have a user, show the layout
  if (user) {
    return <ModernLayout>{children}</ModernLayout>;
  }
  
  // Fallback - show loading while we wait
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: 'var(--surface-base)'
    }}>
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  const { user, token, loadUser } = useAuthStore();
  const [muiTheme, setMuiTheme] = useState(() => createMuiTheme());

  useEffect(() => {
    if (token && !user) {
      loadUser();
    }
  }, [token, user, loadUser]);

  // Update MUI theme when custom theme changes
  useEffect(() => {
    const updateTheme = () => {
      setMuiTheme(createMuiTheme());
    };

    // Update theme after a short delay to ensure CSS custom properties are loaded
    const timeoutId = setTimeout(updateTheme, 100);
    
    // Also update on theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => {
      clearTimeout(timeoutId);
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  return (
    <CustomThemeProvider>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <ErrorBoundary>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginRedirect />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints"
                element={
                  <ProtectedRoute>
                    <Complaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/masters"
                element={
                  <ProtectedRoute>
                    <Masters />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </CustomThemeProvider>
  );
}
