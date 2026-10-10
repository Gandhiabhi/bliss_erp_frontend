import { apiClient } from './client';
import { PaginatedResponse } from './customers.api';

export interface MembershipServiceItem {
  id: string;
  membershipId: string;
  serviceId: string;
  serviceVariantId?: string | null;
  allocatedQuantity: number;
  consumedQuantity: number;
  notes?: string;
  service: { id: string; name: string; code: string };
  serviceVariant?: { id: string; name: string; duration: number };
}

export interface Membership {
  id: string;
  membershipCode: string;
  customerId: string;
  branchId: string;
  planTemplateId?: string | null;
  isCustomPlan: boolean;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  discount: number;
  tax: number;
  finalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  customer?: { id: string; displayName: string; phone: string; customerCode: string };
  branch?: { id: string; name: string; branchCode: string; currency: string };
  services: MembershipServiceItem[];
  totalAllocated?: number;
  totalConsumed?: number;
  totalRemaining?: number;
}

export const membershipsApi = {
  getAll: (params?: {
    branchId?: string;
    customerId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient<PaginatedResponse<Membership>>('/memberships', { params }),

  getExpiringSoon: (days = 7) =>
    apiClient<{ data: Membership[]; success: boolean }>('/memberships/expiring-soon', {
      params: { days },
    }),

  getById: (id: string) =>
    apiClient<{ data: Membership; success: boolean }>(`/memberships/${id}`),

  create: (data: any) =>
    apiClient<{ data: Membership; success: boolean }>('/memberships', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    apiClient<{ data: Membership; success: boolean }>(`/memberships/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
