import { create } from 'zustand';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'executive';
  zoneId?: number;
  branchId?: number;
  phone: string;
  zone?: Zone;
  branch?: Branch;
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

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      set({ 
        user: data.user, 
        token: data.token, 
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load user');
      set({ user: data.user, token, isLoading: false, error: null });
    } catch {
      set({ isLoading: false });
    }
  },
}));
