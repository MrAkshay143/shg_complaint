const API_BASE_URL = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(response.status, errorData.error || 'Request failed');
    }

    return response.json();
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post<T = Record<string, unknown>>(endpoint: string, data?: T) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T = Record<string, unknown>>(endpoint: string, data?: T) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  upload<T = Record<string, unknown>>(endpoint: string, file: File, data?: T) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (data) {
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
    }

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    });
  },
};

// API endpoints
export const api = {
  auth: {
    login: (email: string, password: string) => 
      apiClient.post('/auth/login', { email, password }),
    
    logout: () => 
      apiClient.post('/auth/logout'),
    
    me: () => 
      apiClient.get('/auth/me'),
  },

  complaints: {
    list: (params?: Record<string, string | number>) => 
      apiClient.get(`/complaints?${new URLSearchParams(params as Record<string, string>).toString()}`),
    
    get: (id: number) => 
      apiClient.get(`/complaints/${id}`),
    
    create: <T = Record<string, unknown>>(data: T) => 
      apiClient.post('/complaints', data),
    
    update: <T = Record<string, unknown>>(id: number, data: T) => 
      apiClient.put(`/complaints/${id}`, data),
    
    updateStatus: (id: number, status: string, remarks?: string) => 
      apiClient.put(`/complaints/${id}/status`, { status, remarks }),
    
    assign: (id: number, assignedTo: number) => 
      apiClient.put(`/complaints/${id}/assign`, { assignedTo }),
    
    addCallLog: <T = Record<string, unknown>>(id: number, data: T) => 
      apiClient.post(`/complaints/${id}/call-logs`, data),
  },

  callLogs: {
    create: <T = Record<string, unknown>>(data: T) => 
      apiClient.post('/call-logs', data),
    
    list: (complaintId: number) => 
      apiClient.get(`/call-logs/complaint/${complaintId}`),
    
    recent: (limit = 10) => 
      apiClient.get(`/call-logs/recent?limit=${limit}`),
  },

  masters: {
    zones: {
      list: () => apiClient.get('/masters/zones'),
      create: <T = Record<string, unknown>>(data: T) => apiClient.post('/masters/zones', data),
      update: <T = Record<string, unknown>>(id: number, data: T) => apiClient.put(`/masters/zones/${id}`, data),
    },
    
    branches: {
      list: (zoneId?: number) => 
        apiClient.get(`/masters/branches${zoneId ? `?zoneId=${zoneId}` : ''}`),
      create: <T = Record<string, unknown>>(data: T) => apiClient.post('/masters/branches', data),
      update: <T = Record<string, unknown>>(id: number, data: T) => apiClient.put(`/masters/branches/${id}`, data),
    },
    
    lines: {
      list: (branchId?: number) => 
        apiClient.get(`/masters/lines${branchId ? `?branchId=${branchId}` : ''}`),
      create: <T = Record<string, unknown>>(data: T) => apiClient.post('/masters/lines', data),
      update: <T = Record<string, unknown>>(id: number, data: T) => apiClient.put(`/masters/lines/${id}`, data),
    },
    
    farmers: {
      list: (params?: Record<string, string | number>) => 
        apiClient.get(`/masters/farmers?${new URLSearchParams(params as Record<string, string>).toString()}`),
      create: <T = Record<string, unknown>>(data: T) => apiClient.post('/masters/farmers', data),
      update: <T = Record<string, unknown>>(id: number, data: T) => apiClient.put(`/masters/farmers/${id}`, data),
    },
    
    equipment: {
      list: (params?: Record<string, string | number>) => 
        apiClient.get(`/masters/equipment?${new URLSearchParams(params as Record<string, string>).toString()}`),
      create: <T = Record<string, unknown>>(data: T) => apiClient.post('/masters/equipment', data),
      update: <T = Record<string, unknown>>(id: number, data: T) => apiClient.put(`/masters/equipment/${id}`, data),
    },
  },

  dashboard: {
    stats: () => apiClient.get('/dashboard/stats'),
    charts: () => apiClient.get('/dashboard/charts'),
    sla: () => apiClient.get('/dashboard/sla'),
    contacts: (params?: Record<string, string | number>) => 
      apiClient.get(`/dashboard/contacts?${new URLSearchParams(params as Record<string, string>).toString()}`),
  },

  reports: {
    performance: (params?: Record<string, string | number>) => 
      apiClient.get(`/reports/performance?${new URLSearchParams(params as Record<string, string>).toString()}`),
    
    slaBreaches: (params?: Record<string, string | number>) => 
      apiClient.get(`/reports/sla-breaches?${new URLSearchParams(params as Record<string, string>).toString()}`),
    
    equipmentMttr: (params?: Record<string, string | number>) => 
      apiClient.get(`/reports/equipment-mttr?${new URLSearchParams(params as Record<string, string>).toString()}`),
    
    missingContacts: () => apiClient.get('/reports/missing-contacts'),
  },

  import: {
    farmers: {
      preview: (file: File) => apiClient.upload('/import/farmers/preview', file),
      import: <T = Record<string, unknown>>(data: T[]) => apiClient.post('/import/farmers/import', { data }),
      template: () => apiClient.get('/import/farmers/template'),
    },
  },
};