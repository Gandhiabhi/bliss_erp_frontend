import { apiClient } from './client';

export interface BranchUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  branchId?: string | null;
  isActive: boolean;
}

export const usersApi = {
  create: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    branchId: string;
    roleNames: string[];
  }) =>
    apiClient<{ data: BranchUser; success: boolean }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
