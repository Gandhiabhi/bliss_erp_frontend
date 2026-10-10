'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi, AuditLog } from '@/lib/api/audit-logs.api';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  Clock,
  User,
  Eye,
  Activity,
  AlertCircle,
  FileCode,
  Globe,
} from 'lucide-react';

export default function AuditLogsPage() {
  const { currentBranch } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch Audit Logs
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', currentBranch?.id, search, page],
    queryFn: () =>
      auditLogsApi.getAll({
        branchId: currentBranch?.id,
        search: search || undefined,
        page,
        limit,
      }),
  });

  const logs = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regulatory Audit Trail"
        description="Immutable system logs, security events, entitlement transactions, and financial modifications"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search action, actor, entity..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <LoadingState message="Loading immutable audit logs..." />
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>Error loading audit logs. Super Admin or Branch Manager access required.</span>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit logs found"
          description="System events and transactions are automatically logged as operations take place."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {log.actor?.email}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      <span className="font-bold text-slate-700">{log.entityType}</span> #
                      {log.entityId.slice(0, 8)}...
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-700">
                      {log.branch ? (
                        <span>{log.branch.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Global</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            pageSize={meta.limit}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Inspect Log Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500">Actor</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedLog.actorName}</p>
              </div>
              <div>
                <p className="text-slate-500">Timestamp</p>
                <p className="font-mono text-slate-800 mt-0.5">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Target Entity</p>
                <p className="font-mono text-slate-800 mt-0.5">
                  {selectedLog.entityType} ({selectedLog.entityId})
                </p>
              </div>
              <div>
                <p className="text-slate-500">IP Address</p>
                <p className="font-mono text-slate-800 mt-0.5">
                  {selectedLog.ipAddress || '127.0.0.1'}
                </p>
              </div>
            </div>

            {/* Before vs After Snapshots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-rose-500" />
                  State Before Event
                </p>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 h-64 overflow-y-auto">
                  {selectedLog.beforeData ? (
                    <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.beforeData, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No prior state recorded.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                  State After Event
                </p>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 h-64 overflow-y-auto">
                  {selectedLog.afterData ? (
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.afterData, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No after-state recorded.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
