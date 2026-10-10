import { apiClient } from './client';
import { PaginatedResponse } from './customers.api';

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName: string;
  branchId?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  branch?: { id: string; name: string; branchCode: string };
  actor?: { id: string; email: string };
}

export const auditLogsApi = {
  getAll: (params?: {
    branchId?: string;
    action?: string;
    entityType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient<PaginatedResponse<AuditLog>>('/audit-logs', { params }),
};
