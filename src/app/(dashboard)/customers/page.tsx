'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers.api';
import { useAuth } from '@/lib/auth/auth-context';
import { CustomerDeskActions } from '@/components/customers/customer-desk';
import { RegisterGuestModal } from '@/components/customers/register-guest-modal';
import { Users, UserPlus, Phone, Mail, ArrowUpRight } from 'lucide-react';

export default function CustomersPage() {
  const { activeBranchId, hasPermission } = useAuth();
  const canAddGuest = hasPermission('customer.create');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['customers-list', activeBranchId, search, statusFilter, page],
    queryFn: () =>
      customersApi.getAll({
        branchId: activeBranchId || undefined,
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15,
      }),
  });

  const customers = response?.data || [];
  const meta = response?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Directory"
        description="Comprehensive guest profiles, active membership plans, and treatment allocations."
      >
        {canAddGuest && (
          <Button variant="gold" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            Register New Guest
          </Button>
        )}
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by name, phone (e.g. 9876543210), code..."
        />

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Guests</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers Table / Cards */}
      {isLoading ? (
        <LoadingState message="Fetching guest profiles..." />
      ) : customers.length === 0 ? (
        <Card className="bg-white border-slate-200/90 shadow-xs">
          <CardContent className="p-12">
            <EmptyState
              title="No Guests Found"
              description="Register new guests or modify your search criteria."
              icon={<Users className="w-10 h-10 text-slate-400" />}
              action={
                canAddGuest ? (
                  <Button variant="gold" onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus className="w-4 h-4" />
                    Add First Guest
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-slate-200/90 shadow-xs">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold bg-slate-50/80">
                  <th className="py-3.5 pl-6">Guest ID & Name</th>
                  <th className="py-3.5">Contact</th>
                  <th className="py-3.5">Spa Branch</th>
                  <th className="py-3.5 text-center">Active Plan</th>
                  <th className="py-3.5 text-center">Remaining Balance</th>
                  <th className="py-3.5 text-center">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-700 text-xs shrink-0">
                          {c.firstName.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={`/customers/${c.id}`}
                            className="font-bold text-slate-900 hover:text-amber-700 transition-colors block text-sm"
                          >
                            {c.displayName}
                          </Link>
                          <span className="font-mono text-[10px] text-slate-500">{c.customerCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-slate-700">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {c.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-slate-700">
                      <span className="font-semibold block">{c.branch?.name}</span>
                      <span className="text-[10px] text-slate-400">{c.branch?.currency}</span>
                    </td>
                    <td className="py-4 text-center">
                      {c.activeMembership ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold">
                          {c.activeMembership.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No active package</span>
                      )}
                    </td>
                    <td className="py-4 text-center font-bold">
                      {(c.totalServicesRemaining ?? 0) > 0 ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          {c.totalServicesRemaining} sessions
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CustomerDeskActions customer={c} compact />
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="outline" size="sm">
                            Profile <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {meta && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <RegisterGuestModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
