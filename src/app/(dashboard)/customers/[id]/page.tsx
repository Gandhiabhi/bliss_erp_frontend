'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, ServiceEntitlement } from '@/lib/api/customers.api';
import { visitsApi } from '@/lib/api/visits.api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Clock,
  Sparkles,
  Receipt,
  FileText,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'memberships' | 'entitlements' | 'visits' | 'appointments' | 'billing' | 'notes'
  >('overview');

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(null);

  const { data: customerRes, isLoading } = useQuery({
    queryKey: ['customer-profile', customerId],
    queryFn: () => customersApi.getById(customerId),
    enabled: Boolean(customerId),
  });

  const customer = customerRes?.data;
  const currency = 'INR';

  const useSessionMutation = useMutation({
    mutationFn: (entitlement: ServiceEntitlement) =>
      visitsApi.create({
        customerId,
        membershipId: entitlement.membershipId,
        notes: 'Session used from customer profile',
        services: [
          {
            serviceId: entitlement.serviceId,
            membershipServiceId: entitlement.membershipServiceId,
            quantity: 1,
          },
        ],
      }),
    onSuccess: () => {
      setSessionError(null);
      queryClient.invalidateQueries({ queryKey: ['customer-profile', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
    onError: (err: any) => {
      setSessionError(err?.message || 'Could not record this session.');
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) => customersApi.addNote(customerId, note),
    onSuccess: () => {
      setIsNoteModalOpen(false);
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['customer-profile', customerId] });
    },
  });

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading guest profile and spa history..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Guest not found.
      </div>
    );
  }

  const activeMemberships = customer.memberships?.filter((m: any) => m.status === 'ACTIVE') || [];
  const entitlements = customer.serviceEntitlements || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.displayName}
        description={`Customer Code: ${customer.customerCode} • Registered at ${customer.branch?.name}`}
        badge={<StatusBadge status={customer.status} />}
      >
        <Link href="/check-in">
          <Button variant="gold" size="md">
            <Sparkles className="w-4 h-4" />
            Check-in & Redeem
          </Button>
        </Link>
        <Button variant="secondary" size="md" onClick={() => setIsNoteModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </PageHeader>

      {/* Profile Overview Header Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/90 shadow-xs p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Contact Information</p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="flex items-center gap-1.5 text-slate-800 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {customer.phone}
            </p>
            {customer.email && (
              <p className="flex items-center gap-1.5 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {customer.email}
              </p>
            )}
          </div>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-xs p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Membership</p>
          <div className="mt-2">
            {activeMemberships.length > 0 ? (
              <div>
                <p className="text-sm font-bold text-amber-800">{activeMemberships[0].name}</p>
                <p className="text-[11px] text-slate-500">
                  Valid until {formatDate(activeMemberships[0].endDate)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic mt-1">No active membership plan</p>
            )}
          </div>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-xs p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sessions Remaining</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {entitlements.reduce((sum, e) => sum + e.remaining, 0)}
            </span>
            <span className="text-xs text-slate-500">
              of {entitlements.reduce((sum, e) => sum + e.allocated, 0)} allocated
            </span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-xs p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Visits</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{customer.visits?.length || 0}</span>
            <span className="text-xs text-slate-500">completed sessions</span>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview & Entitlements', icon: ShieldCheck },
          { id: 'memberships', label: 'Memberships & Plans', icon: CreditCard },
          { id: 'visits', label: 'Visit History', icon: Clock },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'billing', label: 'Invoices & Payments', icon: Receipt },
          { id: 'notes', label: 'Staff Notes', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-amber-600 text-amber-800 font-bold bg-amber-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Entitlements */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="bg-white border-slate-200/90 shadow-xs">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                Service Entitlement Balances (Allocated vs Used vs Remaining)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {sessionError && (
                <p className="mb-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  {sessionError}
                </p>
              )}
              {entitlements.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No active service entitlements available.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entitlements.map((e) => (
                    <div
                      key={e.membershipServiceId}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{e.serviceName}</p>
                          <p className="text-xs text-slate-500">{e.variantName || 'Standard'}</p>
                        </div>
                        <span
                          className={`text-sm font-extrabold px-2.5 py-1 rounded-full ${
                            e.remaining > 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {e.remaining} Remaining
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>
                            Consumed: <strong className="text-slate-800">{e.used}</strong> / {e.allocated}
                          </span>
                          <span>{e.percentageUsed}% used</span>
                        </div>
                        <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, e.percentageUsed)}%` }}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="gold"
                        disabled={e.remaining < 1 || e.isExpired || useSessionMutation.isPending}
                        onClick={() => useSessionMutation.mutate(e)}
                      >
                        {e.remaining < 1 ? 'No sessions left' : 'Use 1 session today'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Memberships */}
      {activeTab === 'memberships' && (
        <Card className="bg-white border-slate-200/90 shadow-xs">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Purchased & Assigned Membership Plans</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {customer.memberships?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No membership packages enrolled yet.</p>
            ) : (
              <div className="space-y-4">
                {customer.memberships?.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-slate-900">{m.name}</p>
                          {m.isCustomPlan && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Custom Package
                            </span>
                          )}
                          <StatusBadge status={m.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Code: <span className="font-mono text-amber-800 font-semibold">{m.membershipCode}</span> • Valid: {formatDate(m.startDate)} - {formatDate(m.endDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-amber-800">
                          {formatCurrency(m.finalAmount, m.currency)}
                        </p>
                        <StatusBadge status={m.paymentStatus} size="sm" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Included Treatment Allocations:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {m.services?.map((ms: any) => (
                          <div
                            key={ms.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center text-xs shadow-2xs"
                          >
                            <span className="text-slate-800 font-medium">{ms.service?.name}</span>
                            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                              {ms.allocatedQuantity - ms.consumedQuantity} / {ms.allocatedQuantity} left
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Visits */}
      {activeTab === 'visits' && (
        <Card className="bg-white border-slate-200/90 shadow-xs">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Historical Visits & Entitlement Consumptions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {customer.visits?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No visits recorded yet.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase bg-slate-50/80">
                    <th className="py-3.5 pl-6">Visit Code</th>
                    <th className="py-3.5">Date & Time</th>
                    <th className="py-3.5">Treatments Received</th>
                    <th className="py-3.5">Therapist</th>
                    <th className="py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.visits?.map((v: any) => (
                    <tr key={v.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 pl-6 font-mono font-semibold text-amber-800">
                        {v.visitCode}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {formatDateTime(v.visitDate)}
                      </td>
                      <td className="py-3.5 text-slate-800">
                        {v.visitServices?.map((vs: any) => (
                          <div key={vs.id} className="font-medium">
                            {vs.serviceNameSnapshot || vs.service?.name}
                            {vs.variantNameSnapshot && (
                              <span className="text-slate-500 text-[11px]"> ({vs.variantNameSnapshot})</span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {v.visitServices?.[0]?.staff?.name || '—'}
                      </td>
                      <td className="py-3.5 text-center">
                        <StatusBadge status={v.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Appointments */}
      {activeTab === 'appointments' && (
        <Card className="bg-white border-slate-200/90 shadow-xs">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Scheduled Appointments</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {customer.appointments?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No appointments scheduled.</p>
            ) : (
              <div className="space-y-3">
                {customer.appointments?.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{apt.service?.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        Therapist: {apt.staff?.name || 'Unassigned'} • Code: {apt.appointmentCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-amber-800 font-semibold block">
                        {formatDate(apt.scheduledDate)} at {apt.startTime} - {apt.endTime}
                      </span>
                      <StatusBadge status={apt.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Billing & Invoices */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card className="bg-white border-slate-200/90 shadow-xs">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {customer.invoices?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No invoices issued.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase bg-slate-50/80">
                      <th className="py-3.5 pl-6">Invoice #</th>
                      <th className="py-3.5">Date</th>
                      <th className="py-3.5 text-right">Subtotal</th>
                      <th className="py-3.5 text-right">Total</th>
                      <th className="py-3.5 text-right">Balance</th>
                      <th className="py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.invoices?.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3.5 pl-6 font-mono font-bold text-amber-800">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 text-slate-500">{formatDate(inv.issueDate)}</td>
                        <td className="py-3.5 text-right text-slate-600">
                          {formatCurrency(inv.subtotal, inv.currency)}
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-900">
                          {formatCurrency(inv.total, inv.currency)}
                        </td>
                        <td className="py-3.5 text-right font-bold text-rose-600">
                          {formatCurrency(inv.balanceAmount, inv.currency)}
                        </td>
                        <td className="py-3.5 text-center">
                          <StatusBadge status={inv.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 6: Notes */}
      {activeTab === 'notes' && (
        <Card className="bg-white border-slate-200/90 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Therapist & Reception Notes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Note
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {customer.customerNotes?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No notes recorded.</p>
            ) : (
              <div className="space-y-3">
                {customer.customerNotes?.map((n: any) => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-amber-800">{n.authorName}</span>
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-800">{n.note}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Guest Note"
        description="Record guest treatment preferences, health alerts or feedback."
      >
        <div className="space-y-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
            placeholder="e.g. Guest prefers deep pressure on shoulders..."
            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              onClick={() => newNote.trim() && addNoteMutation.mutate(newNote)}
              isLoading={addNoteMutation.isPending}
            >
              Save Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
