import { apiClient } from './client';

export const dashboardApi = {
  getStats: (branchId?: string) =>
    apiClient<{ data: any; success: boolean }>('/dashboard/stats', {
      params: { branchId },
    }),
};
