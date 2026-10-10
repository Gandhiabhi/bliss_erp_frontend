import { apiClient } from './client';
import { PaginatedResponse } from './customers.api';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceSnapshot: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  branchId: string;
  customerId: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'REFUNDED';
  issueDate: string;
  dueDate?: string;
  notes?: string;
  customer?: { id: string; displayName: string; phone: string; customerCode: string };
  branch?: { id: string; name: string; currency: string };
  items: InvoiceItem[];
}

export interface Payment {
  id: string;
  paymentCode: string;
  branchId: string;
  customerId: string;
  invoiceId?: string;
  membershipId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'UPI' | 'ONLINE' | 'OTHER';
  transactionReference?: string;
  paymentDate: string;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'FAILED' | 'REFUNDED';
  notes?: string;
  customer?: { id: string; displayName: string; phone: string };
  branch?: { id: string; name: string; currency: string };
  invoice?: { id: string; invoiceNumber: string; total: number; balanceAmount: number };
}

export const paymentsApi = {
  getPayments: (params?: {
    branchId?: string;
    customerId?: string;
    status?: string;
    method?: string;
    date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient<PaginatedResponse<Payment>>('/payments', { params }),

  getPaymentById: (id: string) =>
    apiClient<{ data: Payment; success: boolean }>(`/payments/${id}`),

  createPayment: (data: Partial<Payment>) =>
    apiClient<{ data: Payment; success: boolean }>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refundPayment: (id: string, data: { amount: number; reason: string }) =>
    apiClient<{ data: Payment; success: boolean }>(`/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInvoices: (params?: {
    branchId?: string;
    customerId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient<PaginatedResponse<Invoice>>('/invoices', { params }),

  getInvoiceById: (id: string) =>
    apiClient<{ data: Invoice; success: boolean }>(`/invoices/${id}`),

  createInvoice: (data: any) =>
    apiClient<{ data: Invoice; success: boolean }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
