import { apiClient } from './client';

export const reportsApi = {
  getDaily: (date?: string, branchId?: string) =>
    apiClient<{ data: any; success: boolean }>('/reports/daily', {
      params: { date, branchId },
    }),

  getMonthly: (year?: number, month?: number, branchId?: string) =>
    apiClient<{ data: any; success: boolean }>('/reports/monthly', {
      params: { year, month, branchId },
    }),

  getYearly: (year?: number, branchId?: string) =>
    apiClient<{ data: any; success: boolean }>('/reports/yearly', {
      params: { year, branchId },
    }),

  getBranchComparison: () =>
    apiClient<{ data: any[]; success: boolean }>('/reports/branch-comparison'),

  getServiceUsage: (branchId?: string) =>
    apiClient<{ data: any; success: boolean }>('/reports/services', {
      params: { branchId },
    }),

  getMemberships: (branchId?: string) =>
    apiClient<{ data: any; success: boolean }>('/reports/memberships', {
      params: { branchId },
    }),
};
