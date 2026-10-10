import { apiClient } from './client';

export interface ServiceEntitlement {
  membershipId: string;
  membershipName: string;
  membershipServiceId: string;
  serviceId: string;
  serviceName: string;
  variantName: string | null;
  allocated: number;
  used: number;
  remaining: number;
  percentageUsed: number;
  isExpired: boolean;
  expiresAt: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  branchId: string;
  firstName: string;
  lastName?: string;
  displayName: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  country?: string;
  emergencyContact?: string;
  notes?: string;
  preferredLanguage?: string;
  status: string;
  createdAt: string;
  branch?: {
    id: string;
    name: string;
    branchCode: string;
    currency: string;
    timezone: string;
  };
  memberships?: any[];
  visits?: any[];
  appointments?: any[];
  invoices?: any[];
  payments?: any[];
  customerNotes?: any[];
  serviceEntitlements?: ServiceEntitlement[];
  totalServicesRemaining?: number;
  totalAllocatedServices?: number;
  totalConsumedServices?: number;
  activeMembership?: any;
  _count?: {
    memberships: number;
    visits: number;
    appointments: number;
    invoices: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
}

export const customersApi = {
  getAll: (params?: {
    branchId?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient<PaginatedResponse<Customer>>('/customers', { params }),

  getById: (id: string) =>
    apiClient<{ data: Customer; success: boolean }>(`/customers/${id}`),

  create: (data: Partial<Customer>) =>
    apiClient<{ data: Customer; success: boolean }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Customer>) =>
    apiClient<{ data: Customer; success: boolean }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addNote: (id: string, note: string) =>
    apiClient(`/customers/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  deactivate: (id: string) =>
    apiClient(`/customers/${id}`, {
      method: 'DELETE',
    }),
};
