'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi, PlanTemplate } from '@/lib/api/plans.api';
import { servicesApi, SpaService } from '@/lib/api/services.api';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import {
  Package,
  Plus,
  Clock,
  Sparkles,
  Layers,
  AlertCircle,
  Trash2,
  Calendar,
  CheckCircle,
} from 'lucide-react';

interface ServiceItemInput {
  serviceId: string;
  serviceVariantId: string;
  quantity: number;
}

export default function PlansPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(60);
  const [price, setPrice] = useState(350);
  const [services, setServices] = useState<ServiceItemInput[]>([]);

  // Fetch Plans
  const { data: plansData, isLoading, error } = useQuery({
    queryKey: ['plans', currentBranch?.id, search],
    queryFn: () =>
      plansApi.getAll({
        branchId: currentBranch?.id,
        search: search || undefined,
      }),
  });

  // Fetch Services for bundled service selection
  const { data: servicesData } = useQuery({
    queryKey: ['services-for-plans', currentBranch?.id],
    queryFn: () => servicesApi.getAll({ branchId: currentBranch?.id }),
    enabled: isCreateModalOpen,
  });

  // Create Plan Mutation
  const createPlanMutation = useMutation({
    mutationFn: (payload: any) => plansApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create plan package.');
    },
  });

  // Deactivate Mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => plansApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setDurationDays(60);
    setPrice(350);
    setServices([]);
    setFormError('');
  };

  useEffect(() => {
    if (!isCreateModalOpen || services.length > 0 || !servicesData?.data?.length) return;
    setServices([
      {
        serviceId: servicesData.data[0].id,
        serviceVariantId: '',
        quantity: 1,
      },
    ]);
  }, [isCreateModalOpen, services.length, servicesData]);

  const addServiceRow = () => {
    if (servicesData?.data && servicesData.data.length > 0) {
      setServices([
        ...services,
        {
          serviceId: servicesData.data[0].id,
          serviceVariantId: '',
          quantity: 1,
        },
      ]);
    }
  };

  const updateServiceRow = (index: number, field: keyof ServiceItemInput, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'serviceId') updated[index].serviceVariantId = '';
    setServices(updated);
  };

  const removeServiceRow = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name || !code) {
      setFormError('Please enter package name and code.');
      return;
    }

    if (services.length === 0) {
      setFormError('Please add at least one treatment service to the package.');
      return;
    }

    createPlanMutation.mutate({
      name,
      code: code.toUpperCase().trim(),
      branchId: currentBranch?.id,
      description: description || undefined,
      durationDays: Number(durationDays),
      price: Number(price),
      currency: 'INR',
      services: services.map((s) => ({
        serviceId: s.serviceId,
        serviceVariantId: s.serviceVariantId || undefined,
        quantity: Number(s.quantity),
      })),
    });
  };

  const plans = plansData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Package Templates & Bundles"
        description="Configure standardized spa wellness packages, multi-session passes, and entitlements"
      >
        <Button
          variant="gold"
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </PageHeader>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search packages by name or code..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* Package Templates List */}
      {isLoading ? (
        <LoadingState message="Loading package templates..." />
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>Error loading packages.</span>
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          title="No package templates found"
          description="Create structured spa wellness packages to streamline memberships and sales."
          action={
            <Button
              variant="gold"
              onClick={() => {
                setIsCreateModalOpen(true);
                addServiceRow();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Package
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                      {plan.code}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-1.5">{plan.name}</h4>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Valid for {plan.durationDays} days
                    </span>
                  </div>
                  <StatusBadge status={plan.status} />
                </div>

                {plan.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{plan.description}</p>
                )}

                {/* Price */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Package Retail Price:</span>
                  <span className="text-base font-extrabold text-[#3e2c1e]">
                    {formatCurrency(plan.price, 'INR')}
                  </span>
                </div>

                {/* Bundled Services */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Included Treatments ({plan.services?.length || 0})
                  </p>
                  <div className="space-y-1">
                    {plan.services?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                      >
                        <span className="font-medium">
                          {item.service?.name}
                          {item.serviceVariant
                            ? ` · ${item.serviceVariant.name} (${item.serviceVariant.duration} min)`
                            : ''}
                        </span>
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          {item.quantity} sessions
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>{plan._count?.memberships || 0} active subscriptions</span>
                {plan.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deactivateMutation.mutate(plan.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Archive
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Package Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Package Template"
          size="2xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Package Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ultimate Wellness Pass"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Code *
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. UWP-60"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Validity Duration (Days) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Package Price (₹ INR) *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive rejuvenation package including massage and facial..."
              />
            </div>

            {/* Bundled Services Builder */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Bundled Treatments & Quantities *
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addServiceRow}
                  className="text-amber-800 hover:text-amber-900 hover:bg-amber-50 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Treatment
                </Button>
              </div>

              {services.map((row, idx) => {
                const selected = servicesData?.data?.find((service) => service.id === row.serviceId);
                const variants = (selected?.variants || []).filter((variant) => variant.status !== 'INACTIVE');
                return (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_88px_auto] gap-2 items-end rounded-xl bg-white border border-slate-200 p-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Service</label>
                      <select
                        value={row.serviceId}
                        onChange={(e) => updateServiceRow(idx, 'serviceId', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                      >
                        {servicesData?.data?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Duration</label>
                      <select
                        value={row.serviceVariantId}
                        onChange={(e) => updateServiceRow(idx, 'serviceVariantId', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-500"
                        disabled={!selected}
                      >
                        <option value="">
                          {selected
                            ? `${selected.defaultDuration} min · ${formatCurrency(selected.defaultPrice, 'INR')}`
                            : 'Standard'}
                        </option>
                        {variants.map((variant) => {
                          const minutes = `${variant.duration} min`;
                          const named =
                            variant.name && variant.name.trim().toLowerCase() !== minutes.toLowerCase();
                          return (
                            <option key={variant.id} value={variant.id}>
                              {named ? `${variant.name} · ` : ''}
                              {minutes} · {formatCurrency(variant.price, 'INR')}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Sessions</label>
                      <Input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          updateServiceRow(idx, 'quantity', parseInt(e.target.value) || 1)
                        }
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeServiceRow(idx)}
                      disabled={services.length === 1}
                      className="h-10 px-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                      aria-label="Remove treatment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createPlanMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={createPlanMutation.isPending}
              >
                {createPlanMutation.isPending ? 'Saving...' : 'Save Package Template'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
