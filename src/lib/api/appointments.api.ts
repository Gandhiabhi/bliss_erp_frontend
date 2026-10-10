import { apiClient } from './client';

export interface Appointment {
  id: string;
  appointmentCode: string;
  branchId: string;
  customerId: string;
  serviceId: string;
  serviceVariantId?: string | null;
  staffId?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  customer: { id: string; displayName: string; phone: string; customerCode: string };
  service: { id: string; name: string; code: string; defaultDuration: number };
  serviceVariant?: { id: string; name: string; duration: number };
  staff?: { id: string; name: string; position: string };
  branch: { id: string; name: string; branchCode: string; timezone: string };
}

export const appointmentsApi = {
  getAll: (params?: {
    branchId?: string;
    customerId?: string;
    staffId?: string;
    date?: string;
    status?: string;
    search?: string;
  }) =>
    apiClient<{ data: Appointment[]; success: boolean }>('/appointments', { params }),

  getById: (id: string) =>
    apiClient<{ data: Appointment; success: boolean }>(`/appointments/${id}`),

  create: (data: Partial<Appointment>) =>
    apiClient<{ data: Appointment; success: boolean }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Appointment>) =>
    apiClient<{ data: Appointment; success: boolean }>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiClient(`/appointments/${id}`, {
      method: 'DELETE',
    }),
};
