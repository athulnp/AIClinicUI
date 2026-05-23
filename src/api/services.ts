import { apiRequest } from './client';
import type {
  ApiResponse,
  Appointment,
  Billing,
  Clinic,
  Doctor,
  LoginResponse,
  PagedResponse,
  Patient,
  PaginationParams,
  User,
  UserRole,
} from '../types';

export const authApi = {
  login: (body: {
    username: string;
    password: string;
    clinicCode?: string;
    clinicId?: number;
  }) => apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => apiRequest<User>('/api/auth/me'),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
};

export const clinicsApi = {
  list: (params: PaginationParams & { isActive?: boolean }) => {
    const q = new URLSearchParams();
    q.set('pageNumber', String(params.pageNumber ?? 1));
    q.set('pageSize', String(params.pageSize ?? 20));
    if (params.isActive != null) q.set('isActive', String(params.isActive));
    return apiRequest<PagedResponse<Clinic>>(`/api/clinics?${q}`);
  },
  getByCode: (code: string) => apiRequest<Clinic>(`/api/clinics/code/${code}`),
  get: (id: number) => apiRequest<Clinic>(`/api/clinics/${id}`),
  create: (data: Partial<Clinic>) =>
    apiRequest<Clinic>('/api/clinics', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Clinic>) =>
    apiRequest<Clinic>(`/api/clinics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/api/clinics/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  list: (params: PaginationParams & { role?: UserRole; isActive?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    q.set('pageNumber', String(params.pageNumber ?? 1));
    q.set('pageSize', String(params.pageSize ?? 10));
    if (params.role != null) q.set('role', String(params.role));
    if (params.isActive != null) q.set('isActive', String(params.isActive));
    if (params.search) q.set('search', params.search);
    return apiRequest<PagedResponse<User>>(`/api/users?${q}`);
  },
  create: (data: Record<string, unknown>) =>
    apiRequest<User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiRequest<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: (id: number) => apiRequest(`/api/users/${id}`, { method: 'DELETE' }),
  updateProfile: (data: Record<string, unknown>) =>
    apiRequest<User>('/api/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest('/api/users/me/password', { method: 'PUT', body: JSON.stringify(data) }),
};

export const patientsApi = {
  list: (params: PaginationParams) => {
    const q = new URLSearchParams();
    q.set('pageNumber', String(params.pageNumber ?? 1));
    q.set('pageSize', String(params.pageSize ?? 10));
    return apiRequest<PagedResponse<Patient>>(`/api/patients?${q}`);
  },
  search: (searchTerm: string, params: PaginationParams) => {
    const q = new URLSearchParams();
    q.set('searchTerm', searchTerm);
    q.set('pageNumber', String(params.pageNumber ?? 1));
    q.set('pageSize', String(params.pageSize ?? 10));
    return apiRequest<PagedResponse<Patient>>(`/api/patients/search?${q}`);
  },
  get: (id: number) => apiRequest<Patient>(`/api/patients/${id}`),
  create: (data: Record<string, unknown>) =>
    apiRequest<Patient>('/api/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiRequest<Patient>(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/api/patients/${id}`, { method: 'DELETE' }),
};

export const appointmentsApi = {
  list: (params: PaginationParams) => {
    const q = new URLSearchParams();
    q.set('pageNumber', String(params.pageNumber ?? 1));
    q.set('pageSize', String(params.pageSize ?? 10));
    return apiRequest<PagedResponse<Appointment>>(`/api/appointments?${q}`);
  },
  get: (id: number) => apiRequest<Appointment>(`/api/appointments/${id}`),
  create: (data: Record<string, unknown>) =>
    apiRequest<ApiResponse<Appointment>>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reschedule: (id: number, data: Record<string, unknown>) =>
    apiRequest<ApiResponse<Appointment>>(`/api/appointments/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: number, data: { status: number; notes?: string }) =>
    apiRequest<ApiResponse<Appointment>>(`/api/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancel: (id: number) =>
    apiRequest<ApiResponse<Appointment>>(`/api/appointments/${id}/cancel`, { method: 'PUT' }),
};

export const doctorsApi = {
  list: () => apiRequest<Doctor[]>('/api/doctors'),
  get: (id: number) => apiRequest<Doctor>(`/api/doctors/${id}`),
  create: (data: Record<string, unknown>) =>
    apiRequest<Doctor>('/api/doctors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiRequest<Doctor>(`/api/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/api/doctors/${id}`, { method: 'DELETE' }),
};

export const billingApi = {
  list: (params: PaginationParams) => {
    const q = new URLSearchParams();
    q.set('pageNumber', String(params.pageNumber ?? 1));
    q.set('pageSize', String(params.pageSize ?? 10));
    return apiRequest<PagedResponse<Billing>>(`/api/billing?${q}`);
  },
  get: (id: number) => apiRequest<Billing>(`/api/billing/${id}`),
  outstanding: (params: PaginationParams) => {
    const q = new URLSearchParams();
    q.set('pageNumber', String(params.pageNumber ?? 1));
    q.set('pageSize', String(params.pageSize ?? 10));
    return apiRequest<PagedResponse<unknown>>(`/api/billing/outstanding?${q}`);
  },
  create: (data: Record<string, unknown>) =>
    apiRequest<ApiResponse<Billing>>('/api/billing', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiRequest<ApiResponse<Billing>>(`/api/billing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/api/billing/${id}`, { method: 'DELETE' }),
  recordPayment: (id: number, data: Record<string, unknown>) =>
    apiRequest<ApiResponse<Billing>>(`/api/billing/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
