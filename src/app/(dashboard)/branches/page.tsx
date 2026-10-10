'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi, Branch } from '@/lib/api/branches.api';
import { useAuth, BranchView } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Plus,
  Globe,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Users,
  Edit2,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react';

export default function BranchesPage() {
  const { isSuperAdmin, setActiveBranchId, activeBranchId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const openBranchData = (b: Branch) => {
    const snapshot: BranchView = {
      id: b.id,
      branchCode: b.branchCode,
      name: b.name,
      currency: b.currency,
      timezone: b.timezone,
      country: b.country,
      city: b.city,
    };
    setActiveBranchId(b.id, snapshot);
    router.push('/customers');
  };

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBranchForEdit, setSelectedBranchForEdit] = useState<Branch | null>(null);
  const [formError, setFormError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('Jaipur');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');

  // Fetch Branches
  const { data: branchesData, isLoading, error } = useQuery({
    queryKey: ['branches', search],
    queryFn: () => branchesApi.getAll({ search: search || undefined }),
  });

  // Create Branch Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => branchesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create branch.');
    },
  });

  // Update Branch Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      branchesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setSelectedBranchForEdit(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update branch.');
    },
  });

  // Deactivate Branch Mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => branchesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const resetForm = () => {
    setName('');
    setBranchCode('');
    setCountry('India');
    setCity('Jaipur');
    setAddress('');
    setPhone('');
    setEmail('');
    setTimezone('Asia/Kolkata');
    setCurrency('INR');
    setOpeningTime('09:00');
    setClosingTime('22:00');
    setFormError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name || !branchCode) {
      setFormError('Branch name and code are required.');
      return;
    }

    createMutation.mutate({
      name,
      branchCode: branchCode.toUpperCase().trim(),
      country,
      city,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      timezone,
      currency: currency.toUpperCase().trim(),
      openingTime,
      closingTime,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchForEdit) return;

    updateMutation.mutate({
      id: selectedBranchForEdit.id,
      payload: {
        name,
        country,
        city,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        timezone,
        currency: currency.toUpperCase().trim(),
        openingTime,
        closingTime,
      },
    });
  };

  const branches = branchesData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="International Branches"
        description="Central administration of worldwide spa locations, localized timezones, and currencies"
      >
        {isSuperAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            variant="gold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Branch
          </Button>
        )}
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search branches, city, country..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* Branches Grid */}
      {isLoading ? (
        <LoadingState message="Loading international branches..." />
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>Error loading branches. Super Admin permissions required.</span>
        </div>
      ) : branches.length === 0 ? (
        <EmptyState
          title="No branches found"
          description="Register your first international branch location."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {b.branchCode}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-0.5">{b.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.city}, {b.country}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-400" />
                      Currency:
                    </span>
                    <span className="font-mono font-bold text-amber-700">{b.currency}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      Timezone:
                    </span>
                    <span className="font-mono text-slate-700">{b.timezone}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Hours:
                    </span>
                    <span className="text-slate-700">
                      {b.openingTime || '09:00'} - {b.closingTime || '22:00'}
                    </span>
                  </div>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-medium">Guests</span>
                    <span className="font-bold text-slate-800">
                      {b._count?.customers || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-medium">Staff</span>
                    <span className="font-bold text-slate-800">
                      {b._count?.staff || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-medium">Plans</span>
                    <span className="font-bold text-slate-800">
                      {b._count?.memberships || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-medium">Visits</span>
                    <span className="font-bold text-slate-800">
                      {b._count?.visits || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isSuperAdmin && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => openBranchData(b)}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                    {activeBranchId === b.id ? 'Viewing this branch' : 'View branch data'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedBranchForEdit(b);
                      setName(b.name);
                      setBranchCode(b.branchCode);
                      setCountry(b.country);
                      setCity(b.city);
                      setAddress(b.address || '');
                      setPhone(b.phone || '');
                      setEmail(b.email || '');
                      setTimezone(b.timezone);
                      setCurrency(b.currency);
                      setOpeningTime(b.openingTime || '09:00');
                      setClosingTime(b.closingTime || '22:00');
                    }}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit Branch
                  </Button>

                  {b.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deactivateMutation.mutate(b.id)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Branch Modal */}
      {(isAddModalOpen || selectedBranchForEdit) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedBranchForEdit(null);
          }}
          title={selectedBranchForEdit ? `Edit Branch: ${selectedBranchForEdit.name}` : 'Create Spa Branch'}
          size="md"
        >
          <form
            onSubmit={selectedBranchForEdit ? handleEditSubmit : handleCreateSubmit}
            className="space-y-4"
          >
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Branch Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dubai Marina Spa"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Code *
                </label>
                <Input
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="DXB-01"
                  disabled={!!selectedBranchForEdit}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City *
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Dubai"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Country *
                </label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United Arab Emirates"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Timezone *
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
                >
                  <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                  <option value="Europe/London">Europe/London (UTC+1)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="America/New_York">America/New_York (UTC-4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Currency *
                </label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="INR"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Opening Time
                </label>
                <Input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Closing Time
                </label>
                <Input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedBranchForEdit(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                variant="gold"
              >
                {selectedBranchForEdit ? 'Save Changes' : 'Create Branch'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
