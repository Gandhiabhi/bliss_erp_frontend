import { apiClient } from './client';

export const settingsApi = {
  getSettings: (branchId?: string) =>
    apiClient<{ data: { branch: any; settings: Record<string, any> }; success: boolean }>(
      '/settings',
      { params: { branchId } }
    ),

  updateSetting: (key: string, value: any, branchId?: string) =>
    apiClient<{ data: any; success: boolean }>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, branchId }),
    }),
};
