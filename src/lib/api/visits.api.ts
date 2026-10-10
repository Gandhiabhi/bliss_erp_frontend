import { apiClient } from './client';
import { PaginatedResponse } from './customers.api';

export interface VisitServiceItem {
  id: string;
  visitId: string;
  membershipServiceId?: string | null;
  serviceId: string;
  serviceVariantId?: string | null;
  staffId?: string | null;
  quantity: number;
  serviceNameSnapshot: string;
  variantNameSnapshot?: string | null;
  unitPriceSnapshot: number;
  currencySnapshot: string;
  status: string;
  notes?: string;
  service?: { id: string; name: string; code: string };
  serviceVariant?: { id: string; name: string; duration: number };
  staff?: { id: string; name: string; position: string };
}

export interface Visit {
  id: string;
  visitCode: string;
  branchId: string;
  customerId: string;
  membershipId?: string | null;
  visitDate: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: 'CHECKED_IN' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  customer: { id: string; displayName: string; phone: string; customerCode: string };
  branch: { id: string; name: string; branchCode: string; currency: string; timezone: string };
  membership?: { id: string; membershipCode: string; name: string };
  visitServices: VisitServiceItem[];
}

export const visitsApi = {
  getAll: (params?: {
    branchId?: string;
    customerId?: string;
    date?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient<PaginatedResponse<Visit>>('/visits', { params }),

  getById: (id: string) =>
    apiClient<{ data: Visit; success: boolean }>(`/visits/${id}`),

  create: (data: {
    customerId: string;
    branchId?: string;
    membershipId?: string;
    visitDate?: string;
    notes?: string;
    services: Array<{
      serviceId: string;
      serviceVariantId?: string;
      membershipServiceId?: string;
      staffId?: string;
      quantity: number;
      notes?: string;
    }>;
  }) =>
    apiClient<{ data: Visit; success: boolean }>('/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    apiClient<{ data: Visit; success: boolean }>(`/visits/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
