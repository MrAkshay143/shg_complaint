import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Badge, Chip, Divider } from '@mui/material';
import { 
  Menu as MenuIcon, 
  Assignment, 
  Business, 
  Assessment, 
  ExitToApp,
  DarkMode,
  LightMode,
  Notifications,
  AccountCircle,
  People
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useCustomTheme } from '../../hooks/useCustomTheme';
import './layout.css';

interface AppHeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick, title = 'Shalimar Poultry' }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationEl, setNotificationEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Assessment />, path: '/' },
    { text: 'Complaints', icon: <Assignment />, path: '/complaints' },
    ...(user?.role === 'admin' ? [
      { text: 'Masters', icon: <Business />, path: '/masters' },
      { text: 'Reports', icon: <Assessment />, path: '/reports' },
      { text: 'Users', icon: <People />, path: '/users' },
    ] : []),
  ];

  const getRoleBadge = () => {
    if (!user) return null;
    return user.role === 'admin' ? 'Admin' : user.zone?.name || 'User';
  };

  return (
    <AppBar 
      position="sticky" 
      className="app-header"
      sx={{
        background: theme === 'dark' 
          ? 'rgba(23, 23, 23, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: theme === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: theme === 'dark'
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        '& .MuiToolbar-root': {
          background: 'transparent',
        },
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        {onMenuClick && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ 
              mr: 2, 
              color: theme === 'dark' ? '#e4e4e7' : '#18181b',
              backgroundColor: theme === 'dark' 
                ? 'rgba(228, 228, 231, 0.1)' 
                : 'rgba(24, 24, 27, 0.05)',
              '&:hover': {
                backgroundColor: theme === 'dark'
                  ? 'rgba(228, 228, 231, 0.2)'
                  : 'rgba(24, 24, 27, 0.1)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: theme === 'dark' ? '#e4e4e7' : '#18181b',
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            textShadow: theme === 'dark' 
              ? '0 1px 2px rgba(0, 0, 0, 0.3)'
              : '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {title}
        </Typography>

        <Chip
          label={getRoleBadge()}
          size="small"
          sx={{
            mr: 2,
            backgroundColor: theme === 'dark' 
              ? 'rgba(59, 130, 246, 0.2)'
              : 'rgba(59, 130, 246, 0.1)',
            color: theme === 'dark' ? '#60a5fa' : '#1e40af',
            fontWeight: 600,
            display: { xs: 'none', sm: 'flex' },
            border: theme === 'dark'
              ? '1px solid rgba(96, 165, 250, 0.3)'
              : '1px solid rgba(59, 130, 246, 0.2)',
            '&:hover': {
              backgroundColor: theme === 'dark'
                ? 'rgba(59, 130, 246, 0.25)'
                : 'rgba(59, 130, 246, 0.15)',
            }
          }}
        />

        <IconButton
          color="inherit"
          onClick={toggleTheme}
          sx={{ 
            color: theme === 'dark' ? '#a1a1aa' : '#52525b', 
            mr: 1,
            backgroundColor: theme === 'dark'
              ? 'rgba(161, 161, 170, 0.1)'
              : 'rgba(82, 82, 91, 0.05)',
            '&:hover': {
              backgroundColor: theme === 'dark'
                ? 'rgba(161, 161, 170, 0.2)'
                : 'rgba(82, 82, 91, 0.1)',
              color: theme === 'dark' ? '#e4e4e7' : '#18181b'
            }
          }}
        >
          {theme === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>

        <IconButton
          color="inherit"
          onClick={handleNotificationMenu}
          sx={{ 
            color: theme === 'dark' ? '#a1a1aa' : '#52525b', 
            mr: 1,
            backgroundColor: theme === 'dark'
              ? 'rgba(161, 161, 170, 0.1)'
              : 'rgba(82, 82, 91, 0.05)',
            '&:hover': {
              backgroundColor: theme === 'dark'
                ? 'rgba(161, 161, 170, 0.2)'
                : 'rgba(82, 82, 91, 0.1)',
              color: theme === 'dark' ? '#e4e4e7' : '#18181b'
            }
          }}
        >
          <Badge badgeContent={0} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        <IconButton
          size="large"
          edge="end"
          color="inherit"
          onClick={handleMenu}
          sx={{ 
            color: theme === 'dark' ? '#a1a1aa' : '#52525b',
            backgroundColor: theme === 'dark'
              ? 'rgba(161, 161, 170, 0.1)'
              : 'rgba(82, 82, 91, 0.05)',
            '&:hover': {
              backgroundColor: theme === 'dark'
                ? 'rgba(161, 161, 170, 0.2)'
                : 'rgba(82, 82, 91, 0.1)',
              color: theme === 'dark' ? '#e4e4e7' : '#18181b'
            }
          }}
        >
          <AccountCircle />
        </IconButton>

        {/* User Menu */}
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              backgroundColor: theme === 'dark' ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: theme === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              boxShadow: theme === 'dark'
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              minWidth: 200,
              padding: '4px',
            }
          }}
        >
          <MenuItem disabled sx={{ opacity: 0.7, padding: '8px 12px' }}>
            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#a1a1aa' : '#52525b' }}>
              {user?.name}
            </Typography>
          </MenuItem>
          <Divider sx={{ borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', margin: '4px 0' }} />
          
          {menuItems.map((item) => (
            <MenuItem
              key={item.text}
              onClick={() => {
                navigate(item.path);
                handleClose();
              }}
              sx={{
                color: theme === 'dark' ? '#e4e4e7' : '#18181b',
                padding: '8px 12px',
                borderRadius: '8px',
                margin: '2px 0',
                '&:hover': {
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                }
              }}
            >
              {item.icon}
              <Typography sx={{ ml: 1, fontSize: '14px', fontWeight: 500 }}>{item.text}</Typography>
            </MenuItem>
          ))}
          
          <Divider sx={{ borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', margin: '4px 0' }} />
          
          <MenuItem
            onClick={handleLogout}
            sx={{
              color: theme === 'dark' ? '#ef4444' : '#dc2626',
              padding: '8px 12px',
              borderRadius: '8px',
              margin: '2px 0',
              '&:hover': {
                backgroundColor: theme === 'dark'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(220, 38, 38, 0.05)',
              }
            }}
          >
            <ExitToApp />
            <Typography sx={{ ml: 1, fontSize: '14px', fontWeight: 500 }}>Logout</Typography>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          id="notification-menu"
          anchorEl={notificationEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(notificationEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              backgroundColor: theme === 'dark' ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: theme === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              boxShadow: theme === 'dark'
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              minWidth: 300,
              maxWidth: 400,
              padding: '4px',
            }
          }}
        >
          <MenuItem sx={{ borderBottom: '1px solid', borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme === 'dark' ? '#e4e4e7' : '#18181b', fontSize: '16px' }}>
              Notifications
            </Typography>
          </MenuItem>
          <MenuItem disabled sx={{ padding: '12px 16px' }}>
            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#a1a1aa' : '#52525b', fontSize: '14px' }}>
              No new notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;