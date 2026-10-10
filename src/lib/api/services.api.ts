import { apiClient } from './client';

export interface ServiceVariant {
  id: string;
  serviceId: string;
  name: string;
  duration: number;
  price: number;
  currency: string;
  status: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  _count?: { services: number };
}

export interface SpaService {
  id: string;
  code: string;
  name: string;
  categoryId?: string;
  category?: ServiceCategory;
  description?: string;
  defaultDuration: number;
  defaultPrice: number;
  currency: string;
  effectivePrice?: number;
  effectiveCurrency?: string;
  status: string;
  image?: string;
  notes?: string;
  variants: ServiceVariant[];
}

export const servicesApi = {
  getAll: (params?: { search?: string; categoryId?: string; branchId?: string }) =>
    apiClient<{ data: SpaService[]; success: boolean }>('/services', { params }),

  getCategories: () =>
    apiClient<{ data: ServiceCategory[]; success: boolean }>('/services/categories'),

  createCategory: (data: { name: string; description?: string; displayOrder?: number }) =>
    apiClient<{ data: ServiceCategory; success: boolean }>('/services/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string, branchId?: string) =>
    apiClient<{ data: SpaService; success: boolean }>(`/services/${id}`, {
      params: { branchId },
    }),

  create: (data: any) =>
    apiClient<{ data: SpaService; success: boolean }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiClient<{ data: SpaService; success: boolean }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addVariant: (serviceId: string, data: any) =>
    apiClient<{ data: ServiceVariant; success: boolean }>(`/services/${serviceId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  setBranchPrice: (serviceId: string, data: { branchId: string; customPrice: number; currency: string }) =>
    apiClient(`/services/${serviceId}/branch-price`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
