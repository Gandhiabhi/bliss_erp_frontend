'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi, SpaService, ServiceCategory, ServiceVariant } from '@/lib/api/services.api';
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
  Scissors,
  Plus,
  Clock,
  DollarSign,
  Tag,
  Sparkles,
  Layers,
  Edit2,
  AlertCircle,
  Building,
} from 'lucide-react';

export default function ServicesPage() {
  const { currentBranch, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedServiceForVariant, setSelectedServiceForVariant] = useState<SpaService | null>(null);
  const [selectedServiceForBranchPrice, setSelectedServiceForBranchPrice] = useState<SpaService | null>(null);

  // Create Service Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [defaultPrice, setDefaultPrice] = useState(100);
  const [processNotes, setProcessNotes] = useState('');
  const [draftVariants, setDraftVariants] = useState<
    { name: string; duration: number; price: number }[]
  >([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Add Variant Form State
  const [variantName, setVariantName] = useState('');
  const [variantDuration, setVariantDuration] = useState(90);
  const [variantPrice, setVariantPrice] = useState(150);

  // Branch Custom Price Form State
  const [customBranchPrice, setCustomBranchPrice] = useState(120);

  // Fetch Services
  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ['services', currentBranch?.id, search, selectedCategory],
    queryFn: () =>
      servicesApi.getAll({
        branchId: currentBranch?.id,
        search: search || undefined,
        categoryId: selectedCategory || undefined,
      }),
  });

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => servicesApi.getCategories(),
  });

  // Create Service Mutation
  const createCategoryMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      servicesApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      setIsCategoryModalOpen(false);
      setCategoryName('');
      setCategoryDescription('');
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create category.');
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: (payload: any) => servicesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create service.');
    },
  });

  // Add Variant Mutation
  const addVariantMutation = useMutation({
    mutationFn: ({ serviceId, payload }: { serviceId: string; payload: any }) =>
      servicesApi.addVariant(serviceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setSelectedServiceForVariant(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to add variant.');
    },
  });

  // Set Branch Custom Price Mutation
  const setBranchPriceMutation = useMutation({
    mutationFn: ({
      serviceId,
      customPrice,
      currency,
    }: {
      serviceId: string;
      customPrice: number;
      currency: string;
    }) =>
      servicesApi.setBranchPrice(serviceId, {
        branchId: currentBranch!.id,
        customPrice,
        currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setSelectedServiceForBranchPrice(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to set branch price.');
    },
  });

  const resetCreateForm = () => {
    setName('');
    setCode('');
    setCategoryId('');
    setDescription('');
    setDefaultDuration(60);
    setDefaultPrice(100);
    setProcessNotes('');
    setDraftVariants([]);
    setFormError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name || !code) {
      setFormError('Please enter service name and code.');
      return;
    }

    createServiceMutation.mutate({
      name,
      code: code.toUpperCase().trim(),
      categoryId: categoryId || undefined,
      description: description || undefined,
      defaultDuration: Number(defaultDuration),
      defaultPrice: Number(defaultPrice),
      currency: 'INR',
      notes: processNotes || undefined,
      variants: draftVariants
        .filter((v) => v.name && v.duration > 0)
        .map((v) => ({
          name: v.name,
          duration: Number(v.duration),
          price: Number(v.price),
          currency: 'INR',
        })),
    });
  };

  const handleVariantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForVariant) return;

    addVariantMutation.mutate({
      serviceId: selectedServiceForVariant.id,
      payload: {
        name: variantName,
        duration: Number(variantDuration),
        price: Number(variantPrice),
        currency: 'INR',
      },
    });
  };

  const handleBranchPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForBranchPrice || !currentBranch) return;

    setBranchPriceMutation.mutate({
      serviceId: selectedServiceForBranchPrice.id,
      customPrice: Number(customBranchPrice),
      currency: 'INR',
    });
  };

  const services = servicesData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spa Treatment Catalog"
        description="Global spa services, duration variants, and branch-specific localized pricing"
      >
        <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)}>
          <Tag className="w-4 h-4 mr-2" />
          Add Category
        </Button>
        <Button
          variant="gold"
          onClick={() => {
            resetCreateForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Treatment
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search treatments or code..."
            value={search}
            onChange={setSearch}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Tag className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services List / Cards */}
      {isLoading ? (
        <LoadingState message="Loading treatment catalog..." />
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>Error loading spa treatments.</span>
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          title="No treatments found"
          description="Create your first luxury treatment, massage, or facial therapy to get started."
          action={
            <Button
              variant="gold"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Treatment
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const hasBranchPrice =
              service.effectivePrice !== undefined &&
              service.effectivePrice !== service.defaultPrice;

            return (
              <div
                key={service.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                        {service.code}
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 mt-1.5">
                        {service.name}
                      </h4>
                      {service.category && (
                        <span className="text-xs text-slate-500 font-medium">
                          {service.category.name}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={service.status} />
                  </div>

                  {service.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  {service.notes && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      Process: {service.notes}
                    </p>
                  )}

                  {/* Pricing Overview */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Standard Duration:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {service.defaultDuration} mins
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        Branch Effective Price:
                      </span>
                      <span className="font-extrabold text-[#117a65]">
                        {formatCurrency(service.effectivePrice ?? service.defaultPrice, 'INR')}
                        {hasBranchPrice && (
                          <span className="ml-1 text-[10px] text-[#916b30] font-bold bg-[#fcf8f0] px-1 py-0.5 rounded border border-[#ecd6b2]">
                            Override
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Variants */}
                  {service.variants && service.variants.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#705f52] flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Duration Variants ({service.variants.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {service.variants.map((v) => (
                          <span
                            key={v.id}
                            className="px-2.5 py-1 rounded-lg bg-[#fbf9f5] text-[11px] font-medium text-[#2d231c] border border-[#e8e0d5]"
                          >
                            {v.name}: {v.duration}m ({formatCurrency(v.price, 'INR')})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setVariantName('');
                      setVariantDuration(service.defaultDuration + 30);
                      setVariantPrice(service.defaultPrice + 40);
                      setSelectedServiceForVariant(service);
                    }}
                    className="text-amber-800 hover:text-amber-900 hover:bg-amber-50 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Variant
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCustomBranchPrice(
                        service.effectivePrice ?? service.defaultPrice
                      );
                      setSelectedServiceForBranchPrice(service);
                    }}
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <Building className="w-3.5 h-3.5 mr-1" />
                    Branch Price
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCategoryModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Add service category"
          size="sm"
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!categoryName.trim()) {
                setFormError('Category name is required.');
                return;
              }
              createCategoryMutation.mutate({
                name: categoryName.trim(),
                description: categoryDescription || undefined,
              });
            }}
          >
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                {formError}
              </div>
            )}
            <Input
              label="Category name *"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Massage, Facial, Body"
              required
            />
            <Input
              label="Description"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Optional"
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? 'Saving...' : 'Save category'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Service Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title="Add New Spa Treatment"
          size="xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Treatment Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Balinese Massage"
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
                  placeholder="e.g. RBM-01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Default Duration (Minutes) *
                </label>
                <Input
                  type="number"
                  min="5"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(parseInt(e.target.value) || 60)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Default Price (₹ INR) *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Details
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this massage or treatment includes"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Process
              </label>
              <Input
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                placeholder="Steps the therapist follows"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Duration options and prices
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraftVariants((rows) => [
                      ...rows,
                      { name: '60 min', duration: 60, price: Number(defaultPrice) || 0 },
                    ])
                  }
                >
                  Add 60 min
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraftVariants((rows) => [
                      ...rows,
                      { name: '90 min', duration: 90, price: Number(defaultPrice) + 500 },
                    ])
                  }
                >
                  Add 90 min
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraftVariants((rows) => [
                      ...rows,
                      { name: '', duration: 120, price: Number(defaultPrice) },
                    ])
                  }
                >
                  Add another duration
                </Button>
              </div>
              {draftVariants.map((row, index) => (
                <div key={index} className="grid grid-cols-4 gap-2">
                  <Input
                    value={row.name}
                    placeholder="60 min"
                    onChange={(e) =>
                      setDraftVariants((rows) =>
                        rows.map((item, i) =>
                          i === index ? { ...item, name: e.target.value } : item
                        )
                      )
                    }
                  />
                  <Input
                    type="number"
                    min="5"
                    value={row.duration}
                    onChange={(e) =>
                      setDraftVariants((rows) =>
                        rows.map((item, i) =>
                          i === index ? { ...item, duration: Number(e.target.value) } : item
                        )
                      )
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    value={row.price}
                    onChange={(e) =>
                      setDraftVariants((rows) =>
                        rows.map((item, i) =>
                          i === index ? { ...item, price: Number(e.target.value) } : item
                        )
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setDraftVariants((rows) => rows.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createServiceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={createServiceMutation.isPending}
              >
                {createServiceMutation.isPending ? 'Saving...' : 'Create Treatment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Variant Modal */}
      {selectedServiceForVariant && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedServiceForVariant(null)}
          title={`Add Variant to ${selectedServiceForVariant.name}`}
          size="sm"
        >
          <form onSubmit={handleVariantSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Variant Name *
              </label>
              <Input
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g. 90 Minutes Deep Tissue"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Duration (Mins) *
                </label>
                <Input
                  type="number"
                  min="5"
                  value={variantDuration}
                  onChange={(e) => setVariantDuration(parseInt(e.target.value) || 60)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Price (₹ INR) *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={variantPrice}
                  onChange={(e) => setVariantPrice(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedServiceForVariant(null)}
                disabled={addVariantMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={addVariantMutation.isPending}
              >
                {addVariantMutation.isPending ? 'Adding...' : 'Save Variant'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Branch Price Override Modal */}
      {selectedServiceForBranchPrice && currentBranch && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedServiceForBranchPrice(null)}
          title={`Branch Price Override: ${currentBranch.name}`}
          size="sm"
        >
          <form onSubmit={handleBranchPriceSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Set custom pricing for <strong className="text-slate-900">{selectedServiceForBranchPrice.name}</strong> specifically at <strong className="text-[#3e2c1e]">{currentBranch.name}</strong> in Indian Rupees (₹).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Custom Branch Price (₹ INR) *
              </label>
              <Input
                type="number"
                min="0"
                value={customBranchPrice}
                onChange={(e) => setCustomBranchPrice(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedServiceForBranchPrice(null)}
                disabled={setBranchPriceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={setBranchPriceMutation.isPending}
              >
                {setBranchPriceMutation.isPending ? 'Updating...' : 'Set Branch Price'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
