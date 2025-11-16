import { create } from 'zustand';
import { User } from './authStore';


export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'zone' | 'branch' | 'farmer' | 'equipment' | 'complaint' | 'user' | 'report';
}

export interface UserPermission {
  permissionId: string;
  granted: boolean;
  grantedAt?: string;
  grantedBy?: string;
}

export interface UserWithPermissions {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'executive';
  phone: string;
  zoneId?: number;
  branchId?: number;
  zone?: Zone;
  branch?: Branch;
  permissions: UserPermission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Zone {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  managerName: string;
  managerPhone: string;
  accountantName: string;
  accountantPhone: string;
  zoneId: number;
  zone?: Zone;
}

interface UserManagementState {
  users: UserWithPermissions[];
  availablePermissions: Permission[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: () => Promise<void>;
  fetchAvailablePermissions: () => Promise<void>;
  createUser: (userData: Partial<UserWithPermissions>) => Promise<void>;
  updateUser: (id: number, userData: Partial<UserWithPermissions>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  updateUserPermissions: (userId: number, permissions: UserPermission[]) => Promise<void>;
  resetUserPassword: (userId: number) => Promise<void>;
  changeUserPassword: (userId: number, currentPassword: string, newPassword: string) => Promise<void>;
  toggleUserStatus: (userId: number, isActive: boolean) => Promise<void>;
  clearError: () => void;
}

// Available permissions for the system
const SYSTEM_PERMISSIONS: Permission[] = [
  // Zone Permissions
  { id: 'zone.view', name: 'View Zones', description: 'Can view zone information', category: 'zone' },
  { id: 'zone.create', name: 'Create Zones', description: 'Can create new zones', category: 'zone' },
  { id: 'zone.edit', name: 'Edit Zones', description: 'Can edit zone information', category: 'zone' },
  { id: 'zone.delete', name: 'Delete Zones', description: 'Can delete zones', category: 'zone' },
  
  // Branch Permissions
  { id: 'branch.view', name: 'View Branches', description: 'Can view branch information', category: 'branch' },
  { id: 'branch.create', name: 'Create Branches', description: 'Can create new branches', category: 'branch' },
  { id: 'branch.edit', name: 'Edit Branches', description: 'Can edit branch information', category: 'branch' },
  { id: 'branch.delete', name: 'Delete Branches', description: 'Can delete branches', category: 'branch' },
  
  // Farmer Permissions
  { id: 'farmer.view', name: 'View Farmers', description: 'Can view farmer information', category: 'farmer' },
  { id: 'farmer.create', name: 'Create Farmers', description: 'Can create new farmers', category: 'farmer' },
  { id: 'farmer.edit', name: 'Edit Farmers', description: 'Can edit farmer information', category: 'farmer' },
  { id: 'farmer.delete', name: 'Delete Farmers', description: 'Can delete farmers', category: 'farmer' },
  { id: 'farmer.import', name: 'Import Farmers', description: 'Can import farmers from Excel/CSV', category: 'farmer' },
  
  // Equipment Permissions
  { id: 'equipment.view', name: 'View Equipment', description: 'Can view equipment information', category: 'equipment' },
  { id: 'equipment.create', name: 'Create Equipment', description: 'Can create new equipment records', category: 'equipment' },
  { id: 'equipment.edit', name: 'Edit Equipment', description: 'Can edit equipment information', category: 'equipment' },
  { id: 'equipment.delete', name: 'Delete Equipment', description: 'Can delete equipment records', category: 'equipment' },
  
  // Complaint Permissions
  { id: 'complaint.view', name: 'View Complaints', description: 'Can view complaints', category: 'complaint' },
  { id: 'complaint.create', name: 'Create Complaints', description: 'Can create new complaints', category: 'complaint' },
  { id: 'complaint.edit', name: 'Edit Complaints', description: 'Can edit complaint information', category: 'complaint' },
  { id: 'complaint.delete', name: 'Delete Complaints', description: 'Can delete complaints', category: 'complaint' },
  { id: 'complaint.updateStatus', name: 'Update Complaint Status', description: 'Can update complaint status', category: 'complaint' },
  { id: 'complaint.assign', name: 'Assign Complaints', description: 'Can assign complaints to executives', category: 'complaint' },
  { id: 'complaint.viewAll', name: 'View All Complaints', description: 'Can view complaints across all zones/branches', category: 'complaint' },
  
  // User Management Permissions
  { id: 'user.view', name: 'View Users', description: 'Can view user information', category: 'user' },
  { id: 'user.create', name: 'Create Users', description: 'Can create new users', category: 'user' },
  { id: 'user.edit', name: 'Edit Users', description: 'Can edit user information', category: 'user' },
  { id: 'user.delete', name: 'Delete Users', description: 'Can delete users', category: 'user' },
  { id: 'user.resetPassword', name: 'Reset Passwords', description: 'Can reset user passwords', category: 'user' },
  { id: 'user.managePermissions', name: 'Manage Permissions', description: 'Can manage user permissions', category: 'user' },
  
  // Report Permissions
  { id: 'report.view', name: 'View Reports', description: 'Can view reports', category: 'report' },
  { id: 'report.export', name: 'Export Reports', description: 'Can export reports to Excel/PDF', category: 'report' },
  { id: 'report.viewAll', name: 'View All Reports', description: 'Can view reports across all zones/branches', category: 'report' },
];

export const useUserManagementStore = create<UserManagementState>((set) => ({
  users: [],
  availablePermissions: SYSTEM_PERMISSIONS,
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to fetch users');
      set({ users: Array.isArray(data.users) ? data.users : [], loading: false });
    } catch {
      set({ error: 'Failed to fetch users', loading: false });
    }
  },

  fetchAvailablePermissions: async () => {
    // In a real app, this would fetch from API
    // For now, we use the static SYSTEM_PERMISSIONS
    set({ availablePermissions: SYSTEM_PERMISSIONS });
  },

  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error('Failed to create user');

      set(state => ({ 
        users: result.user ? [...state.users, result.user] : state.users, 
        loading: false 
      }));
    } catch {
      set({ error: 'Failed to create user', loading: false });
      throw new Error('Failed to create user');
    }
  },

  updateUser: async (id, userData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error('Failed to update user');

      set(state => ({ 
        users: result.user 
          ? state.users.map(user => (user.id === id ? result.user : user))
          : state.users, 
        loading: false 
      }));
    } catch {
      set({ error: 'Failed to update user', loading: false });
      throw new Error('Failed to update user');
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to delete user');
      set(state => ({ 
        users: state.users.filter(user => user.id !== id), 
        loading: false 
      }));
    } catch {
      set({ error: 'Failed to delete user', loading: false });
      throw new Error('Failed to delete user');
    }
  },

  updateUserPermissions: async (userId, permissions) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error('Failed to update permissions');

      set(state => ({ 
        users: result.user 
          ? state.users.map(user => (user.id === userId ? { ...result.user } : user))
          : state.users, 
        loading: false 
      }));
    } catch {
      set({ error: 'Failed to update permissions', loading: false });
      throw new Error('Failed to update permissions');
    }
  },

  resetUserPassword: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        // Provide a placeholder new password; replace with proper flow later
        body: JSON.stringify({ newPassword: 'Temp@1234' }),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      set({ loading: false });
    } catch {
      set({ error: 'Failed to reset password', loading: false });
      throw new Error('Failed to reset password');
    }
  },

  toggleUserStatus: async (userId, isActive) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error('Failed to update user status');

      set(state => ({ 
        users: result.user 
          ? state.users.map(user => (user.id === userId ? result.user : user))
          : state.users, 
        loading: false 
      }));
    } catch {
      set({ error: 'Failed to update user status', loading: false });
      throw new Error('Failed to update user status');
    }
  },

  changeUserPassword: async (userId, currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper function to check if user has specific permission
export const hasPermission = (user: UserWithPermissions | User | null, permissionId: string): boolean => {
  if (!user) return false;
  
  // Admins have all permissions by default
  if (user.role === 'admin') return true;
  
  // Check specific permission
  // Check specific permission (only for UserWithPermissions type)
  if ('permissions' in user) {
    const permission = user.permissions.find(p => p.permissionId === permissionId);
    return permission ? permission.granted : false;
  
  }
  
  return false;

};

// Helper function to check if user has permission for specific zone/branch
export const hasZonePermission = (user: UserWithPermissions | null, zoneId?: number): boolean => {
  if (!user) return false;
  
  // Admins can access all zones
  if (user.role === 'admin') return true;
  
  // Executives can only access their assigned zone
  return user.zoneId === zoneId;
};

export const hasBranchPermission = (user: UserWithPermissions | null, branchId?: number): boolean => {
  if (!user) return false;
  
  // Admins can access all branches
  if (user.role === 'admin') return true;
  
  // Executives can only access branches in their assigned zone
  if (user.zoneId && user.branchId === branchId) return true;
  
  return false;
};
