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
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers.api';
import { servicesApi } from '@/lib/api/services.api';
import { plansApi } from '@/lib/api/plans.api';
import { visitsApi } from '@/lib/api/visits.api';
import { membershipsApi } from '@/lib/api/memberships.api';
import { paymentsApi } from '@/lib/api/payments.api';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency } from '@/lib/utils';
import { Users, UserPlus, Phone, Mail, ArrowUpRight } from 'lucide-react';

export default function CustomersPage() {
  const { activeBranchId, currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');
  const [offerType, setOfferType] = useState<'none' | 'service' | 'membership'>('none');
  const [serviceId, setServiceId] = useState('');
  const [serviceVariantId, setServiceVariantId] = useState('');
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [formError, setFormError] = useState<string | null>(null);

  const branchId = currentBranch?.id || activeBranchId || undefined;

  const { data: servicesRes } = useQuery({
    queryKey: ['customer-offer-services', branchId],
    queryFn: () => servicesApi.getAll({ branchId }),
    enabled: isAddModalOpen,
  });
  const { data: plansRes } = useQuery({
    queryKey: ['customer-offer-plans', branchId],
    queryFn: () => plansApi.getAll({ branchId, status: 'ACTIVE' }),
    enabled: isAddModalOpen && offerType === 'membership',
  });
  const selectedService = servicesRes?.data?.find((s) => s.id === serviceId);
  const selectedPlan = plansRes?.data?.find((p) => p.id === planId);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!branchId) {
        throw new Error('Select a branch from the header before adding a customer.');
      }
      const created = await customersApi.create({
        branchId,
        firstName,
        lastName,
        phone: phone.trim(),
        email: email || undefined,
        gender: gender || undefined,
        notes: notes || undefined,
      });
      const customerId = created.data.id;

      if (offerType === 'service') {
        if (!serviceId) throw new Error('Choose the massage or service.');
        const paid = Number(amount);
        if (!paid || paid <= 0) throw new Error('Enter the amount the customer paid.');
        await visitsApi.create({
          customerId,
          branchId,
          notes: 'Single service at registration',
          services: [
            {
              serviceId,
              serviceVariantId: serviceVariantId || undefined,
              quantity: 1,
            },
          ],
        });
        await paymentsApi.createPayment({
          customerId,
          branchId,
          amount: paid,
          currency: 'INR',
          paymentMethod: paymentMethod as any,
          notes: `Single service payment (${paymentMethod})`,
        });
      }

      if (offerType === 'membership') {
        if (!selectedPlan) throw new Error('Choose a membership plan.');
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + (selectedPlan.durationDays || 30));
        await membershipsApi.create({
          customerId,
          branchId,
          planTemplateId: selectedPlan.id,
          isCustomPlan: false,
          name: selectedPlan.name,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          price: Number(selectedPlan.price),
          currency: 'INR',
          recordPayment: true,
          paymentMethod,
        });
      }

      return created;
    },
    onSuccess: () => {
      setIsAddModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to create customer');
    },
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setGender('');
    setNotes('');
    setOfferType('none');
    setServiceId('');
    setServiceVariantId('');
    setPlanId('');
    setAmount('');
    setPaymentMethod('CASH');
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) {
      setFormError('First name and phone number are required.');
      return;
    }
    if (!branchId) {
      setFormError('Select a branch from the header before adding a customer.');
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Directory"
        description="Comprehensive guest profiles, active membership plans, and treatment allocations."
      >
        <Button variant="gold" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Register New Guest
        </Button>
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
                <Button variant="gold" onClick={() => setIsAddModalOpen(true)}>
                  <UserPlus className="w-4 h-4" />
                  Add First Guest
                </Button>
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

      {/* Add Guest Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Spa Guest"
        description="Save the guest, then give a single service with payment or a membership."
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. John"
              required
            />
            <Input
              label="Last Name (Optional)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Smith"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Phone Number * (Indian Mobile)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210 or 9876543210"
                required
              />
              <p className="text-[10px] text-[#705f52] mt-1 font-medium">
                Enter 10-digit Indian phone (e.g. 9876543210 or +91 98765 43210)
              </p>
            </div>
            <Input
              label="Email Address (Optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. guest@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
            >
              <option value="">Select Gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            label="Client Preferences & Allergy Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Prefers light pressure, allergic to lavender..."
          />

          {!branchId && (
            <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Select a branch in the header so this customer is saved to that location.
            </p>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">What is this visit for?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  ['none', 'Profile only'],
                  ['service', 'Single service'],
                  ['membership', 'Membership'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOfferType(value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                    offerType === value
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {offerType === 'service' && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-3">
              <label className="block text-xs font-semibold text-slate-700">Massage / service *</label>
              <select
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setServiceVariantId('');
                  const service = servicesRes?.data?.find((s) => s.id === e.target.value);
                  if (service) setAmount(String(service.defaultPrice));
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="">Choose a service</option>
                {servicesRes?.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.defaultDuration} min · {formatCurrency(s.defaultPrice, 'INR')}
                  </option>
                ))}
              </select>
              {selectedService && selectedService.variants.length > 0 && (
                <select
                  value={serviceVariantId}
                  onChange={(e) => {
                    setServiceVariantId(e.target.value);
                    const variant = selectedService.variants.find((v) => v.id === e.target.value);
                    if (variant) setAmount(String(variant.price));
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="">Standard duration</option>
                  {selectedService.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.duration} min · {formatCurrency(v.price, 'INR')}
                    </option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount paid (₹) *"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Payment method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="ONLINE">Online</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {offerType === 'membership' && (
            <div className="space-y-3 rounded-xl border border-slate-200 p-3">
              <label className="block text-xs font-semibold text-slate-700">Membership plan *</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="">Choose a plan</option>
                {plansRes?.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.durationDays} days · {formatCurrency(p.price, 'INR')}
                  </option>
                ))}
              </select>
              {selectedPlan && (
                <p className="text-xs text-slate-600">
                  Includes{' '}
                  {selectedPlan.services
                    .map((s) => `${s.quantity} × ${s.service?.name || 'service'}`)
                    .join(', ') || 'the services on this plan'}
                  . Payment is recorded as paid.
                </p>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Payment method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="ONLINE">Online</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" isLoading={createMutation.isPending}>
              Save & Register
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
