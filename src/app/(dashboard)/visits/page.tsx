'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitsApi, Visit } from '@/lib/api/visits.api';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  Clock,
  Sparkles,
  Calendar,
  User,
  Eye,
  CheckCircle,
  AlertCircle,
  Scissors,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function VisitsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Fetch visits
  const { data, isLoading, error } = useQuery({
    queryKey: ['visits', currentBranch?.id, search, statusFilter, dateFilter, page],
    queryFn: () =>
      visitsApi.getAll({
        branchId: currentBranch?.id,
        search: search || undefined,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
        page,
        limit,
      }),
  });

  // Complete visit mutation
  const completeMutation = useMutation({
    mutationFn: (visitId: string) =>
      visitsApi.updateStatus(visitId, { status: 'COMPLETED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      if (selectedVisit) {
        setSelectedVisit((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
      }
    },
  });

  const visits = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visits & Entitlement Usage"
        description="Audit all customer check-ins, therapist assignments, and consumed service history"
      >
        <Link href="/check-in">
          <Button variant="gold" className="shadow-xs">
            <Sparkles className="w-4 h-4 mr-2" />
            Reception Fast Check-in
          </Button>
        </Link>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search code, guest name, phone..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="IN_SERVICE">In Service</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <LoadingState message="Loading visit logs and consumption history..." />
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>Error loading visits. Please check backend connection.</span>
        </div>
      ) : visits.length === 0 ? (
        <EmptyState
          title="No visits recorded"
          description={
            search || statusFilter || dateFilter
              ? 'No visit records match the selected search criteria.'
              : 'Start checking guests in using the reception workflow.'
          }
          action={
            <Link href="/check-in">
              <Button variant="gold">
                <Sparkles className="w-4 h-4 mr-2" />
                Check In a Guest
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-6 py-4">Visit Code</th>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Date & Check-in</th>
                  <th className="px-6 py-4">Treatments Consumed</th>
                  <th className="px-6 py-4">Membership Linked</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((visit) => (
                  <tr
                    key={visit.id}
                    className="hover:bg-amber-50/20 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-amber-800">
                      {visit.visitCode}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {visit.customer?.displayName}
                      </div>
                      <div className="text-xs text-slate-500">{visit.customer?.phone}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(visit.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {visit.visitServices?.map((vs) => (
                          <div
                            key={vs.id}
                            className="text-xs flex items-center gap-1.5 text-slate-700"
                          >
                            <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                              {vs.quantity}x
                            </span>
                            <span className="font-medium text-slate-800">{vs.serviceNameSnapshot}</span>
                            {vs.staff && (
                              <span className="text-[11px] text-slate-500">
                                (Therapist: {vs.staff.name})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {visit.membership ? (
                        <div className="text-xs">
                          <span className="font-semibold text-amber-800">
                            {visit.membership.name}
                          </span>
                          <span className="block text-[11px] text-slate-500 font-mono">
                            {visit.membership.membershipCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Direct / Walk-in</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={visit.status} />
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      {visit.status !== 'COMPLETED' && visit.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={completeMutation.isPending}
                          onClick={() => completeMutation.mutate(visit.id)}
                          className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        >
                          <Check className="w-4 h-4 mr-1 text-emerald-600" />
                          Complete
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVisit(visit)}
                        className="text-slate-600 hover:text-amber-800 hover:bg-amber-50"
                      >
                        <Eye className="w-4 h-4 mr-1 text-amber-600" />
                        Details
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

      {/* Visit Details Modal */}
      {selectedVisit && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedVisit(null)}
          title={`Visit Summary: ${selectedVisit.visitCode}`}
          size="md"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Guest</p>
                <p className="font-bold text-slate-900">
                  {selectedVisit.customer?.displayName}
                </p>
                <p className="text-xs text-slate-500">{selectedVisit.customer?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Branch</p>
                <p className="font-bold text-slate-900">{selectedVisit.branch?.name}</p>
                <p className="text-xs text-slate-500">{selectedVisit.branch?.timezone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Check-in Time</p>
                <p className="font-medium text-slate-800">
                  {new Date(selectedVisit.checkInTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Status</p>
                <StatusBadge status={selectedVisit.status} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Consumed Treatments (Historical Snapshots)
              </h4>
              <div className="space-y-2">
                {selectedVisit.visitServices?.map((vs) => (
                  <div
                    key={vs.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{vs.serviceNameSnapshot}</p>
                      {vs.variantNameSnapshot && (
                        <p className="text-xs text-slate-500">{vs.variantNameSnapshot}</p>
                      )}
                      {vs.staff && (
                        <p className="text-xs text-amber-800 font-medium mt-0.5">
                          Therapist: {vs.staff.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{vs.quantity} Session(s)</p>
                      <p className="text-xs text-slate-500 font-mono">
                        Snapshot: {formatCurrency(vs.unitPriceSnapshot, 'INR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedVisit.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs text-slate-800">
                <span className="font-bold text-amber-900 block mb-1">Visit Notes:</span>
                {selectedVisit.notes}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              {selectedVisit.status !== 'COMPLETED' && selectedVisit.status !== 'CANCELLED' && (
                <Button
                  variant="gold"
                  onClick={() => completeMutation.mutate(selectedVisit.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Mark Completed
                </Button>
              )}
              <Button variant="secondary" onClick={() => setSelectedVisit(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
