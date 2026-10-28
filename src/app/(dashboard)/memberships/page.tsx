'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipsApi, Membership } from '@/lib/api/memberships.api';
import { plansApi, PlanTemplate } from '@/lib/api/plans.api';
import { customersApi, Customer } from '@/lib/api/customers.api';
import { servicesApi, SpaService } from '@/lib/api/services.api';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { paymentFields, PAYMENT_CHOICES } from '@/lib/payment-methods';
import {
  CreditCard,
  Plus,
  Eye,
  Calendar,
  Sparkles,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Trash2,
} from 'lucide-react';

interface CustomServiceRow {
  serviceId: string;
  serviceVariantId?: string;
  allocatedQuantity: number;
}

export default function MembershipsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState(false);

  // Enrol form state
  const [customerId, setCustomerId] = useState('');
  const [planType, setPlanType] = useState<'TEMPLATE' | 'CUSTOM'>('TEMPLATE');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING' | 'PARTIAL'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [customServices, setCustomServices] = useState<CustomServiceRow[]>([]);
  const [formError, setFormError] = useState('');

  // Fetch memberships
  const { data, isLoading, error } = useQuery({
    queryKey: ['memberships', currentBranch?.id, search, statusFilter, page],
    queryFn: () =>
      membershipsApi.getAll({
        branchId: currentBranch?.id,
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      }),
  });

  // Fetch plan templates for enrolment
  const { data: plansData } = useQuery({
    queryKey: ['plan-templates', currentBranch?.id],
    queryFn: () => plansApi.getAll({ branchId: currentBranch?.id, status: 'ACTIVE' }),
    enabled: isEnrolModalOpen,
  });

  // Fetch customers for selector
  const { data: customersData } = useQuery({
    queryKey: ['customers-selector', currentBranch?.id],
    queryFn: () => customersApi.getAll({ branchId: currentBranch?.id, limit: 100 }),
    enabled: isEnrolModalOpen,
  });

  // Fetch spa services for custom plan builder
  const { data: servicesData } = useQuery({
    queryKey: ['services-selector', currentBranch?.id],
    queryFn: () => servicesApi.getAll({ branchId: currentBranch?.id }),
    enabled: isEnrolModalOpen && planType === 'CUSTOM',
  });

  // Handle plan template selection
  useEffect(() => {
    if (planType === 'TEMPLATE' && selectedPlanId && plansData?.data) {
      const template = plansData.data.find((p) => p.id === selectedPlanId);
      if (template) {
        setPlanName(template.name);
        setDurationDays(template.durationDays || 30);
        setPrice(Number(template.price));
      }
    }
  }, [selectedPlanId, planType, plansData]);

  // Calculate end date based on start date and duration
  const calculateEndDate = (start: string, days: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().split('T')[0];
  };

  const finalAmount = Math.max(0, Number(price) - Number(discount) + Number(tax));

  // Add custom service row
  const addServiceRow = () => {
    if (servicesData?.data && servicesData.data.length > 0) {
      setCustomServices([
        ...customServices,
        {
          serviceId: servicesData.data[0].id,
          allocatedQuantity: 1,
        },
      ]);
    }
  };

  const updateServiceRow = (index: number, field: keyof CustomServiceRow, value: any) => {
    const updated = [...customServices];
    updated[index] = { ...updated[index], [field]: value };
    setCustomServices(updated);
  };

  const removeServiceRow = (index: number) => {
    setCustomServices(customServices.filter((_, i) => i !== index));
  };

  // Enrol Membership Mutation
  const enrolMutation = useMutation({
    mutationFn: (payload: any) => membershipsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setIsEnrolModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to enrol membership. Please verify input.');
    },
  });

  const resetForm = () => {
    setCustomerId('');
    setPlanType('TEMPLATE');
    setSelectedPlanId('');
    setPlanName('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDurationDays(30);
    setPrice(0);
    setDiscount(0);
    setTax(0);
    setPaymentStatus('PAID');
    setCustomServices([]);
    setFormError('');
  };

  const handleEnrolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerId) {
      setFormError('Please select a customer.');
      return;
    }

    if (planType === 'TEMPLATE' && !selectedPlanId) {
      setFormError('Please select a plan package.');
      return;
    }

    if (planType === 'CUSTOM') {
      if (!planName) {
        setFormError('Please enter a name for this custom plan.');
        return;
      }
      if (customServices.length === 0) {
        setFormError('Please add at least one treatment service entitlement.');
        return;
      }
    }

    const payload: any = {
      customerId,
      branchId: currentBranch?.id,
      name: planName,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(calculateEndDate(startDate, durationDays)).toISOString(),
      price: Number(price),
      discount: Number(discount),
      tax: Number(tax),
      recordPayment: paymentStatus === 'PAID',
      paymentMethod: paymentFields(paymentMethod).paymentMethod,
      notes: paymentFields(paymentMethod, 'Membership').notes,
      currency: 'INR',
    };

    if (planType === 'TEMPLATE') {
      payload.planTemplateId = selectedPlanId;
      payload.isCustomPlan = false;
    } else {
      payload.isCustomPlan = true;
      payload.services = customServices.map((cs) => ({
        serviceId: cs.serviceId,
        serviceVariantId: cs.serviceVariantId || undefined,
        allocatedQuantity: Number(cs.allocatedQuantity),
      }));
    }

    enrolMutation.mutate(payload);
  };

  const memberships = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Memberships & Plans"
        description="Manage guest memberships, package allotments, and service entitlements"
      >
        <Button
          onClick={() => {
            resetForm();
            setIsEnrolModalOpen(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Enrol Membership
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search member, code, phone..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="COMPLETED">Completed</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Listing Content */}
      {isLoading ? (
        <LoadingState message="Loading memberships and entitlements..." />
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>Error loading memberships. Please check your connection or permissions.</span>
        </div>
      ) : memberships.length === 0 ? (
        <EmptyState
          title="No memberships found"
          description={
            search || statusFilter
              ? 'No memberships match the selected filters.'
              : 'Enrol guests into wellness packages or custom spa plans to start tracking entitlements.'
          }
          action={
            <Button
              variant="gold"
              onClick={() => setIsEnrolModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Enrol First Membership
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-6 py-4">Membership</th>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4">Services Remaining</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberships.map((membership) => {
                  const totalAlloc = membership.services.reduce(
                    (sum, s) => sum + s.allocatedQuantity,
                    0
                  );
                  const totalUsed = membership.services.reduce(
                    (sum, s) => sum + s.consumedQuantity,
                    0
                  );
                  const remaining = Math.max(0, totalAlloc - totalUsed);
                  const percentUsed = totalAlloc > 0 ? (totalUsed / totalAlloc) * 100 : 0;

                  return (
                    <tr
                      key={membership.id}
                      className="hover:bg-amber-50/20 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {membership.name}
                          {membership.isCustomPlan && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900 border border-amber-200">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {membership.membershipCode}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {membership.customer?.displayName || 'Unknown Guest'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {membership.customer?.phone}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(membership.startDate).toLocaleDateString()} &rarr;{' '}
                            {new Date(membership.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-48">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-amber-800">
                              {remaining} remaining
                            </span>
                            <span className="text-slate-500">
                              {totalUsed} / {totalAlloc} used
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-[#2d231c]">
                          {formatCurrency(membership.finalAmount, 'INR')}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {membership.paymentStatus}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={membership.status} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMembership(membership)}
                          className="text-slate-600 hover:text-amber-800 hover:bg-amber-50"
                        >
                          <Eye className="w-4 h-4 mr-1.5 text-amber-600" />
                          Entitlements
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* View Entitlement Details Modal */}
      {selectedMembership && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMembership(null)}
          title={`Membership: ${selectedMembership.name}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Code</p>
                <p className="font-mono font-medium text-slate-900">
                  {selectedMembership.membershipCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Guest</p>
                <p className="font-semibold text-slate-900">
                  {selectedMembership.customer?.displayName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Start Date</p>
                <p className="font-medium text-slate-800">
                  {new Date(selectedMembership.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Expiry Date</p>
                <p className="font-bold text-amber-800">
                  {new Date(selectedMembership.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Service Entitlement Balances
              </h4>

              <div className="space-y-3">
                {selectedMembership.services.map((item) => {
                  const rem = item.allocatedQuantity - item.consumedQuantity;
                  const pct = (item.consumedQuantity / item.allocatedQuantity) * 100;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900">{item.service?.name}</p>
                          {item.serviceVariant && (
                            <p className="text-xs text-slate-500">
                              {item.serviceVariant.name} ({item.serviceVariant.duration} mins)
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            rem > 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {rem > 0 ? `${rem} Sessions Left` : 'Fully Consumed'}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Used: <strong className="text-slate-800">{item.consumedQuantity}</strong></span>
                        <span>Total Allocated: {item.allocatedQuantity}</span>
                      </div>

                      <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedMembership(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Enrol Membership Modal */}
      {isEnrolModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEnrolModalOpen(false)}
          title="Enrol Guest in Membership"
          size="lg"
        >
          <form onSubmit={handleEnrolSubmit} className="space-y-5">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Select Customer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Guest / Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="">-- Choose a customer --</option>
                {customersData?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} ({c.phone || c.customerCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Type Selector */}
            <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setPlanType('TEMPLATE')}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${
                  planType === 'TEMPLATE'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard Package Template
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanType('CUSTOM');
                  if (customServices.length === 0) addServiceRow();
                }}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${
                  planType === 'CUSTOM'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Tailored Plan
              </button>
            </div>

            {/* Template Selector vs Custom Plan Name */}
            {planType === 'TEMPLATE' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Package Template *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
                >
                  <option value="">-- Choose a package template --</option>
                  {plansData?.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatCurrency(p.price, 'INR')} ({p.durationDays} Days,{' '}
                      {p.services.length} services)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Custom Plan Name *
                </label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. VIP Executive Retreat"
                  required
                />
              </div>
            )}

            {/* Custom Plan Entitlements Builder */}
            {planType === 'CUSTOM' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Service Entitlements *
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addServiceRow}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Treatment
                  </Button>
                </div>

                {customServices.map((row, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <select
                      value={row.serviceId}
                      onChange={(e) => updateServiceRow(idx, 'serviceId', e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
                    >
                      {servicesData?.data.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>

                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        value={row.allocatedQuantity}
                        onChange={(e) =>
                          updateServiceRow(idx, 'allocatedQuantity', parseInt(e.target.value) || 1)
                        }
                        placeholder="Qty"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeServiceRow(idx)}
                      disabled={customServices.length === 1}
                      className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Validity Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Duration (Days) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Expires on: {calculateEndDate(startDate, durationDays)}
                </span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Base Price (₹ INR)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Discount (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tax / GST (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="col-span-3 pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Net Total Amount:</span>
                <span className="text-lg font-bold text-[#3e2c1e]">
                  {formatCurrency(finalAmount, 'INR')}
                </span>
              </div>
            </div>

            {/* Payment Status & Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
                >
                  <option value="PAID">Paid in Full</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PENDING">Pending Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
                >
                  {PAYMENT_CHOICES.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEnrolModalOpen(false)}
                disabled={enrolMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={enrolMutation.isPending}
              >
                {enrolMutation.isPending ? 'Enrolling...' : 'Confirm & Activate Membership'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
