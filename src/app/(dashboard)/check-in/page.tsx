'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, Customer, ServiceEntitlement } from '@/lib/api/customers.api';
import { staffApi } from '@/lib/api/staff.api';
import { visitsApi } from '@/lib/api/visits.api';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/utils';
import {
  Sparkles,
  Search,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function FastCheckInPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedEntitlement, setSelectedEntitlement] = useState<ServiceEntitlement | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [checkInSuccess, setCheckInSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search customers query
  const { data: searchRes, isFetching: isSearching } = useQuery({
    queryKey: ['checkin-customers', searchQuery, currentBranch?.id],
    queryFn: () =>
      customersApi.getAll({
        search: searchQuery,
        limit: 8,
        branchId: currentBranch?.id,
      }),
    enabled: searchQuery.length >= 1,
  });

  const searchResults = searchRes?.data || [];

  // Selected customer full profile query
  const { data: customerRes, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['checkin-customer-profile', selectedCustomerId],
    queryFn: () => (selectedCustomerId ? customersApi.getById(selectedCustomerId) : null),
    enabled: Boolean(selectedCustomerId),
  });

  const customer = customerRes?.data;
  const entitlements = customer?.serviceEntitlements || [];

  // Staff query for therapist assignment
  const { data: staffRes } = useQuery({
    queryKey: ['checkin-therapists', currentBranch?.id],
    queryFn: () => staffApi.getAll({ status: 'ACTIVE', branchId: currentBranch?.id }),
  });
  const staffList = staffRes?.data || [];

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data: any) => visitsApi.create(data),
    onSuccess: (res) => {
      setCheckInSuccess(res.data);
      setSelectedEntitlement(null);
      setVisitNotes('');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['checkin-customer-profile', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['checkin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Check-in failed. Please verify entitlement balance.');
    },
  });

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setSelectedEntitlement(null);
    setCheckInSuccess(null);
    setErrorMessage(null);
  };

  const handleConfirmCheckIn = () => {
    if (!customer || !selectedEntitlement) return;
    setErrorMessage(null);

    checkInMutation.mutate({
      customerId: customer.id,
      membershipId: selectedEntitlement.membershipId,
      notes: visitNotes || 'Reception desk fast check-in',
      services: [
        {
          serviceId: selectedEntitlement.serviceId,
          membershipServiceId: selectedEntitlement.membershipServiceId,
          staffId: selectedStaffId || undefined,
          quantity: 1,
          notes: visitNotes,
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fast Reception Check-in"
        description="Streamlined guest check-in, real-time entitlement validation and atomic service redemption."
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Front Desk Suite
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Search & Selection */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white border-slate-200/90 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-600" />
                Step 1: Locate Guest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type guest name, Indian mobile (e.g. 9876543210), or code..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#e2d8ca] bg-white text-sm text-[#2d231c] placeholder:text-[#9e8f80] focus:outline-none focus:border-[#b5915f] focus:ring-1 focus:ring-[#b5915f] shadow-2xs transition-all"
                />
              </div>

              {/* Search results list */}
              {isSearching ? (
                <div className="py-4 text-center text-xs text-slate-500">Searching records...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {searchResults.map((c) => {
                    const isSelected = c.id === selectedCustomerId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-400 shadow-xs ring-1 ring-amber-400/50'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-600" />
                            {c.displayName}
                          </p>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                            {c.customerCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {c.phone}
                          </span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            {c.totalServicesRemaining ?? 0} sessions left
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <p className="text-xs text-slate-500 text-center py-4">No guests found for &quot;{searchQuery}&quot;</p>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  Search by guest name (e.g. &quot;John&quot;) or phone number.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Entitlement Selection & Redemption Form */}
        <div className="lg:col-span-7 space-y-6">
          {!selectedCustomerId ? (
            <Card className="bg-white border-slate-200/90 shadow-xs p-12 text-center">
              <EmptyState
                title="No Guest Selected"
                description="Search and choose a guest from the left panel to load their membership plan and redeem entitlements."
                icon={<User className="w-10 h-10 text-slate-400" />}
              />
            </Card>
          ) : isLoadingCustomer ? (
            <LoadingState message="Loading guest profile and active entitlements..." />
          ) : (
            <div className="space-y-6">
              {/* Guest Profile Capsule */}
              <Card className="bg-white border-slate-200/90 shadow-xs">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{customer?.displayName}</h2>
                        <StatusBadge status={customer?.status || 'ACTIVE'} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        ID: <span className="font-mono text-amber-700 font-semibold">{customer?.customerCode}</span> • Phone: {customer?.phone}
                      </p>
                    </div>
                    <Link href={`/customers/${customer?.id}`}>
                      <Button variant="outline" size="sm">
                        View Full History <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Success Notification Banner */}
              {checkInSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1 animate-in fade-in-50 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Visit Checked In Successfully! (Code: {checkInSuccess.visitCode})
                  </div>
                  <p className="text-xs text-emerald-700">
                    Service entitlement deducted atomically. Updated balance is live.
                  </p>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-semibold shadow-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  {errorMessage}
                </div>
              )}

              {/* Entitlement Balances */}
              <Card className="bg-white border-slate-200/90 shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Step 2: Select Service to Redeem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {entitlements.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                      No active service entitlements found for this guest. Please enrol them in a plan or custom package.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {entitlements.map((e) => {
                        const isZero = e.remaining === 0;
                        const isSelected = selectedEntitlement?.membershipServiceId === e.membershipServiceId;

                        return (
                          <div
                            key={e.membershipServiceId}
                            onClick={() => !isZero && setSelectedEntitlement(e)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isZero
                                ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                                : isSelected
                                ? 'bg-amber-50/80 border-amber-400 shadow-xs ring-1 ring-amber-400'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-slate-900">{e.serviceName}</p>
                                <p className="text-[11px] text-slate-500">
                                  {e.variantName || 'Standard Session'} • Plan:{' '}
                                  <span className="text-amber-700 font-semibold">{e.membershipName}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`text-sm font-extrabold block ${
                                    isZero ? 'text-slate-400' : 'text-emerald-700'
                                  }`}
                                >
                                  {e.remaining} Remaining
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {e.used} / {e.allocated} Used
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5 border border-slate-200/50">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, e.percentageUsed)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Therapist assignment and Final Confirmation */}
              {selectedEntitlement && (
                <Card className="border border-amber-300 bg-amber-50/30 shadow-xs">
                  <CardHeader className="pb-3 border-b border-amber-200/60">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Step 3: Assign Therapist & Confirm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Assigned Therapist (Optional)
                      </label>
                      <select
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                      >
                        <option value="">-- Any Available Therapist / General --</option>
                        {staffList.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.position || 'Staff'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Treatment Notes or Suite Number"
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      placeholder="e.g. Suite 3, guest requested extra warm towels..."
                    />

                    <div className="pt-2">
                      <Button
                        variant="gold"
                        size="lg"
                        className="w-full font-bold shadow-md shadow-amber-600/20"
                        onClick={handleConfirmCheckIn}
                        isLoading={checkInMutation.isPending}
                      >
                        <CheckCircle2 className="w-5 h-5 mr-1" />
                        Confirm Check-in & Redeem 1 Entitlement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
