import React, { useState, useEffect } from 'react';
import ChangePasswordDialog from './ChangePasswordDialog';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Checkbox,
  OutlinedInput,
  ListItemText,
} from '@mui/material';
import { useCustomTheme } from '../../hooks/useCustomTheme';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useUserManagementStore, UserWithPermissions, Zone, Branch } from '../../stores/userManagementStore';
import { useAuthStore } from '../../stores/authStore';
import { hasPermission } from '../../stores/userManagementStore';
import { ExportActions } from '../Common/ExportActions';
import { api } from '../../utils/api';
import './users.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  className?: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const {
    users,
    availablePermissions,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    toggleUserStatus,
    clearError,
  } = useUserManagementStore();

  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'executive' as 'admin' | 'executive',
    zoneIds: [] as number[], // Changed from zoneId to zoneIds for multiple selection
    branchIds: [] as number[], // Changed from branchId to branchIds for multiple selection
    isActive: true,
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const { theme } = useCustomTheme();

  useEffect(() => {
    fetchUsers();
    fetchZones();
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only on mount

  const fetchZones = async () => {
    try {
      const response = await api.masters.zones.list();
      setZones(response.zones);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  };

  const fetchBranches = async (zoneIds?: number[]) => {
    try {
      let allBranches: Branch[] = [];
      
      if (zoneIds && zoneIds.length > 0) {
        // Fetch branches for selected zones
        for (const zoneId of zoneIds) {
          const response = await api.masters.branches.list(zoneId);
          allBranches = [...allBranches, ...response.branches];
        }
      } else {
        // Fetch all branches if no zones selected
        const response = await api.masters.branches.list();
        allBranches = response.branches;
      }
      
      // Remove duplicates
      const uniqueBranches = allBranches.filter((branch, index, self) => 
        index === self.findIndex(b => b.id === branch.id)
      );
      
      setAvailableBranches(uniqueBranches);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'executive',
      zoneIds: [],
      branchIds: [],
      isActive: true,
    });
    setSelectedPermissions([]);
    setDialogOpen(true);
  };

  const handleEditUser = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '', // Don't populate password for security
      role: user.role,
      zoneIds: user.zoneId ? [user.zoneId] : [], // Convert single zone to array for consistency
      branchIds: user.branchId ? [user.branchId] : [], // Convert single branch to array for consistency
      isActive: user.isActive,
    });
    setSelectedPermissions(user.permissions ? user.permissions.filter(p => p.granted).map(p => p.permissionId) : []);
    setDialogOpen(true);
    
    // Fetch branches for the user's zone
    if (user.zoneId) {
      fetchBranches([user.zoneId]);
    }
  };

  const handleSaveUser = async () => {
    try {
      // For now, use the first selected zone and branch to maintain compatibility
      // In a full implementation, you would need to update the backend to support multiple zones/branches
      const userData: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        zoneId: formData.zoneIds.length > 0 ? formData.zoneIds[0] : undefined,
        branchId: formData.branchIds.length > 0 ? formData.branchIds[0] : undefined,
        isActive: formData.isActive,
        permissions: selectedPermissions.map(permissionId => ({
          permissionId,
          granted: true,
        })),
      };

      // Only include password for new users or if password is provided for existing users
      if (!selectedUser && formData.password) {
        userData.password = formData.password;
      } else if (selectedUser && formData.password) {
        userData.password = formData.password;
      }

      if (selectedUser) {
        await updateUser(selectedUser.id, userData);
      } else {
        await createUser(userData);
      }
      
      setDialogOpen(false);
    } catch {
      // Error is handled in the store
    }
  };

  const handleZoneChange = (zoneId: number) => {
    const newZoneIds = formData.zoneIds.includes(zoneId)
      ? formData.zoneIds.filter(id => id !== zoneId)
      : [...formData.zoneIds, zoneId];
    
    setFormData({ ...formData, zoneIds: newZoneIds, branchIds: [] });
    fetchBranches(newZoneIds);
  };

  const handleBranchChange = (branchId: number) => {
    const newBranchIds = formData.branchIds.includes(branchId)
      ? formData.branchIds.filter(id => id !== branchId)
      : [...formData.branchIds, branchId];
    
    setFormData({ ...formData, branchIds: newBranchIds });
  };

  const handleSelectAllZones = () => {
    if (formData.zoneIds.length === zones.length) {
      // Deselect all
      setFormData(prev => ({ ...prev, zoneIds: [], branchIds: [] }));
      setAvailableBranches([]);
    } else {
      // Select all
      const allZoneIds = zones.map(zone => zone.id);
      setFormData(prev => ({ ...prev, zoneIds: allZoneIds, branchIds: [] }));
      fetchBranches(allZoneIds);
    }
  };

  const handleSelectAllBranches = () => {
    if (formData.branchIds.length === availableBranches.length) {
      // Deselect all
      setFormData(prev => ({ ...prev, branchIds: [] }));
    } else {
      // Select all
      const allBranchIds = availableBranches.map(branch => branch.id);
      setFormData(prev => ({ ...prev, branchIds: allBranchIds }));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
      } catch {
        // Error is handled in the store
      }
    }
  };

  const handleChangePassword = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setChangePasswordDialogOpen(true);
  };

  const handleChangePasswordSubmit = async (currentPassword: string, newPassword: string) => {
    if (!selectedUser) return;
    
    try {
      await changeUserPassword(selectedUser.id, currentPassword, newPassword);
      alert('Password changed successfully!');
      setChangePasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      alert(message);
    }
  };

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    try {
      await toggleUserStatus(userId, !isActive);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('master admin')) {
        alert('Cannot deactivate master admin account');
      }
      // Error is handled in the store
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) : [];

  const getPermissionCategories = () => {
    const categories = ['zone', 'branch', 'farmer', 'equipment', 'complaint', 'user', 'report'];
    return categories.map(category => ({
      category,
      permissions: availablePermissions.filter(p => p.category === category)
    }));
  };

  const canManageUsers = currentUser && hasPermission(currentUser, 'user.view');

  if (!canManageUsers) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to access user management.
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="page-container">
      <Card className="card-base">
        <CardContent>
          <div className={`dashboard-header mb-6 p-4 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="dashboard-header-content flex justify-between items-center mb-3">
              <div className="dashboard-header-info">
                <h1 className={`dashboard-header-title text-2xl font-semibold mb-1 ${
                  theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                }`}>
                  User Management
                </h1>
                <p className={`dashboard-header-subtitle text-base ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Manage system users and permissions
                </p>
              </div>
              <div className="dashboard-header-actions flex items-center justify-end">
            <Button
              variant="contained"
              className="btn-primary"
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          </div>
            </div>
          </div>

          {/* Filters */}
          <Box className="user-management-search" sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
              }}
              size="small"
              sx={{ width: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="executive">Executive</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={() => fetchUsers()} title="Refresh" size="small">
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {/* Users Table */}
          <TableContainer component={Paper} className="user-management-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Zone/Branch</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" fontWeight="500" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MailIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                          <Typography variant="body2" fontSize="0.875rem">{user.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                          <Typography variant="body2" fontSize="0.875rem">{user.phone}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                          label={user.role === 'admin' ? 'Admin' : 'Executive'}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          {user.zone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              <LocationIcon sx={{ color: 'text.secondary', fontSize: 12 }} />
                              <Typography variant="caption" fontSize="0.75rem">{user.zone.name}</Typography>
                            </Box>
                          )}
                          {user.branch && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              <BusinessIcon sx={{ color: 'text.secondary', fontSize: 12 }} />
                              <Typography variant="caption" fontSize="0.75rem">{user.branch.name}</Typography>
                            </Box>
                          )}
                          {!user.zone && !user.branch && (
                            <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                              All Zones
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ fontSize: '0.75rem', height: '20px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Never'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(user)}
                              color="primary"
                              sx={{ p: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Password">
                            <IconButton
                              size="small"
                              onClick={() => handleChangePassword(user)}
                              color="warning"
                              sx={{ p: 0.5 }}
                            >
                              <LockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.email === 'admin@shalimarcorp.in' ? 'Cannot deactivate master admin' : (user.isActive ? 'Deactivate' : 'Activate')}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleStatus(user.id, user.isActive)}
                                color={user.isActive ? 'error' : 'success'}
                                disabled={user.email === 'admin@shalimarcorp.in'}
                                sx={{ p: 0.5 }}
                              >
                                {user.isActive ? <CancelIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={user.email === 'admin@shalimarcorp.in' ? 'Cannot delete master admin' : 'Delete'}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteUser(user.id)}
                                color="error"
                                disabled={user.email === 'admin@shalimarcorp.in'}
                                sx={{ p: 0.5 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className="user-dialog"
      >
        <DialogTitle className="user-dialog-title">
          {selectedUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent className="user-dialog-content">
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ minHeight: '36px' }}>
            <Tab label="Basic Info" sx={{ py: 1, minHeight: '36px' }} />
            <Tab label="Permissions" sx={{ py: 1, minHeight: '36px' }} />
          </Tabs>

          <TabPanel value={tabValue} index={0} className="user-tab-panel">
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }} className="user-form-field">
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} className="user-form-field">
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  helperText="Must be @shalimarcorp.in domain"
                  disabled={selectedUser?.email === 'admin@shalimarcorp.in'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} className="user-form-field">
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} className="user-form-field">
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!selectedUser} // Only required for new users
                  helperText={selectedUser ? "Leave empty to keep current password" : "Minimum 6 characters"}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} className="user-form-field">
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'executive' })}
                    label="Role"
                    disabled={selectedUser?.email === 'admin@shalimarcorp.in'}
                  >
                    <MenuItem value="executive">Executive</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.role === 'executive' && (
                <>
                  <Grid size={{ xs: 12 }} className="user-form-field">
                    <FormControl fullWidth>
                      <InputLabel id="zones-select-label">Zones</InputLabel>
                      <Select
                        labelId="zones-select-label"
                        id="zones-select"
                        multiple
                        value={formData.zoneIds}
                        input={<OutlinedInput label="Zones" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((zoneId) => {
                              const zone = zones.find(z => z.id === zoneId);
                              return zone ? <Chip key={zoneId} label={zone.name} size="small" /> : null;
                            })}
                          </Box>
                        )}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 48 * 4.5 + 8,
                              width: 250,
                            },
                          },
                        }}
                      >
                        <MenuItem onClick={handleSelectAllZones}>
                          <Checkbox checked={formData.zoneIds.length === zones.length && zones.length > 0} />
                          <ListItemText primary="All Zones" />
                        </MenuItem>
                        {zones.map((zone) => (
                          <MenuItem key={zone.id} value={zone.id} onClick={() => handleZoneChange(zone.id)}>
                            <Checkbox checked={formData.zoneIds.includes(zone.id)} />
                            <ListItemText primary={zone.name} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {availableBranches.length > 0 && (
                    <Grid size={{ xs: 12 }} className="user-form-field">
                      <FormControl fullWidth>
                        <InputLabel id="branches-select-label">Branches</InputLabel>
                        <Select
                          labelId="branches-select-label"
                          id="branches-select"
                          multiple
                          value={formData.branchIds}
                          input={<OutlinedInput label="Branches" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((branchId) => {
                                const branch = availableBranches.find(b => b.id === branchId);
                                return branch ? <Chip key={branchId} label={branch.name} size="small" /> : null;
                              })}
                            </Box>
                          )}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 48 * 4.5 + 8,
                                width: 250,
                              },
                            },
                          }}
                        >
                          <MenuItem onClick={handleSelectAllBranches}>
                            <Checkbox checked={formData.branchIds.length === availableBranches.length && availableBranches.length > 0} />
                            <ListItemText primary="All Branches" />
                          </MenuItem>
                          {availableBranches.map((branch) => (
                            <MenuItem key={branch.id} value={branch.id} onClick={() => handleBranchChange(branch.id)}>
                              <Checkbox checked={formData.branchIds.includes(branch.id)} />
                              <ListItemText primary={`${branch.name} (${branch.zone?.name || 'Unknown Zone'})`} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </>
              )}
              <Grid size={{ xs: 12 }} className="user-form-field">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      disabled={selectedUser?.email === 'admin@shalimarcorp.in'}
                    />
                  }
                  label="Active User"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1} className="user-tab-panel">
            <div className="user-form-section">
              <Typography variant="h6" sx={{ fontSize: '1rem', mb: 1 }}>
                Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                Select permissions. Admins have all permissions by default.
              </Typography>
            </div>
            
            {getPermissionCategories().map(({ category, permissions }) => (
              <Card key={category} className="user-permission-group" sx={{ mb: 1 }}>
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize', mb: 1, fontSize: '0.875rem' }}>
                    {category} Permissions
                  </Typography>
                  <Grid container spacing={0.5}>
                    {permissions.map((permission) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={permission.id}>
                        <div className="user-permission-item">
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedPermissions.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                disabled={formData.role === 'admin'}
                                sx={{ p: 0.5 }}
                              />
                            }
                            label={<span className="user-permission-label">{permission.name}</span>}
                            sx={{ m: 0 }}
                          />
                          <Typography variant="caption" color="text.secondary" className="user-permission-description" display="block">
                            {permission.description}
                          </Typography>
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </TabPanel>
        </DialogContent>
        <DialogActions className="user-action-buttons">
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => {
          setChangePasswordDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleChangePasswordSubmit}
        userName={selectedUser?.name}
      />
    </Box>
  );
};

export default UserManagement;
