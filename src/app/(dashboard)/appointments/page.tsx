'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, Appointment } from '@/lib/api/appointments.api';
import { customersApi } from '@/lib/api/customers.api';
import { servicesApi, SpaService } from '@/lib/api/services.api';
import { staffApi } from '@/lib/api/staff.api';
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
  Calendar as CalendarIcon,
  Clock,
  Plus,
  User,
  Scissors,
  CheckCircle,
  AlertCircle,
  Filter,
  Trash2,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

export default function AppointmentsPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [formError, setFormError] = useState('');

  // Booking Form State
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>('existing');
  const [customerId, setCustomerId] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceVariantId, setServiceVariantId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  // Fetch Appointments
  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', currentBranch?.id, search, statusFilter, dateFilter],
    queryFn: () =>
      appointmentsApi.getAll({
        branchId: currentBranch?.id,
        search: search || undefined,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
      }),
  });

  // Fetch customers for selector
  const { data: customersData } = useQuery({
    queryKey: ['customers-selector', currentBranch?.id],
    queryFn: () => customersApi.getAll({ branchId: currentBranch?.id, limit: 100 }),
    enabled: isBookModalOpen,
  });

  // Fetch services for selector
  const { data: servicesData } = useQuery({
    queryKey: ['services-selector', currentBranch?.id],
    queryFn: () => servicesApi.getAll({ branchId: currentBranch?.id }),
    enabled: isBookModalOpen,
  });

  // Fetch staff for selector
  const { data: staffData } = useQuery({
    queryKey: ['staff-selector', currentBranch?.id],
    queryFn: () => staffApi.getAll({ branchId: currentBranch?.id, status: 'ACTIVE' }),
    enabled: isBookModalOpen,
  });

  // Selected service details for duration calculation
  const selectedService = servicesData?.data?.find((s) => s.id === serviceId);

  const { data: selectedCustomerRes } = useQuery({
    queryKey: ['appointment-customer', customerId],
    queryFn: () => customersApi.getById(customerId),
    enabled: guestMode === 'existing' && Boolean(customerId),
  });
  const selectedCustomer = selectedCustomerRes?.data;

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.update(id, { status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const resetForm = () => {
    setGuestMode('existing');
    setCustomerId('');
    setNewFirstName('');
    setNewLastName('');
    setNewPhone('');
    setServiceId('');
    setServiceVariantId('');
    setStaffId('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setStartTime('10:00');
    setEndTime('11:00');
    setNotes('');
    setFormError('');
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!currentBranch?.id) {
      setFormError('Select a branch from the header before booking.');
      return;
    }
    if (!serviceId) {
      setFormError('Please select a treatment or massage.');
      return;
    }

    setIsBooking(true);
    try {
      let resolvedCustomerId = customerId;
      if (guestMode === 'new') {
        if (!newFirstName.trim() || !newPhone.trim()) {
          setFormError('New guest needs a first name and phone number.');
          return;
        }
        const created = await customersApi.create({
          branchId: currentBranch.id,
          firstName: newFirstName.trim(),
          lastName: newLastName.trim() || undefined,
          phone: newPhone.trim(),
        });
        resolvedCustomerId = created.data.id;
      } else if (!customerId) {
        setFormError('Please select a customer.');
        return;
      }

      await appointmentsApi.create({
        branchId: currentBranch.id,
        customerId: resolvedCustomerId,
        serviceId,
        serviceVariantId: serviceVariantId || undefined,
        staffId: staffId || undefined,
        scheduledDate: new Date(scheduledDate).toISOString(),
        startTime,
        endTime,
        notes: notes || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setIsBookModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to book appointment.');
    } finally {
      setIsBooking(false);
    }
  };

  const appointments = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments & Schedule"
        description="Book guest reservations, manage treatment slots, and assign spa therapists"
      >
        <Button
          variant="gold"
          onClick={() => {
            resetForm();
            setIsBookModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </PageHeader>

      {/* Filter and Date Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search guest or code..."
            value={search}
            onChange={setSearch}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointment Listings */}
      {isLoading ? (
        <LoadingState message="Loading spa appointment schedule..." />
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>Error loading appointments schedule.</span>
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments scheduled"
          description={
            dateFilter
              ? `No bookings found for ${new Date(dateFilter).toLocaleDateString()}.`
              : 'No appointments match the selected filters.'
          }
          action={
            <Button
              variant="gold"
              onClick={() => setIsBookModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                      {appt.appointmentCode}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1.5">
                      {appt.customer?.displayName}
                    </h4>
                    <p className="text-xs text-slate-500">{appt.customer?.phone}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Scissors className="w-3.5 h-3.5 text-amber-600" />
                    <span>{appt.service?.name}</span>
                    {appt.serviceVariant && (
                      <span className="text-slate-500 font-normal">({appt.serviceVariant.name})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {appt.startTime} &rarr; {appt.endTime} (
                      {new Date(appt.scheduledDate).toLocaleDateString()})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Therapist: {appt.staff ? appt.staff.name : 'Any Available Staff'}
                    </span>
                  </div>
                </div>

                {appt.notes && (
                  <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60">
                    &ldquo;{appt.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <select
                  value={appt.status}
                  onChange={(e) =>
                    updateStatusMutation.mutate({ id: appt.id, status: e.target.value })
                  }
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKED_IN">Checked in</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">Did not come</option>
                </select>
                <div className="flex items-center gap-1">
                  <Link href={`/check-in?customerId=${appt.customerId}`}>
                    <Button size="sm" variant="ghost" className="text-emerald-700 hover:bg-emerald-50">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Check in
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm('Delete this appointment?')) {
                        deleteMutation.mutate(appt.id);
                      }
                    }}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsBookModalOpen(false)}
          title="Schedule Spa Appointment"
          size="md"
        >
          <form onSubmit={handleBookSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGuestMode('existing')}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  guestMode === 'existing'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <User className="w-3.5 h-3.5 inline mr-1" />
                Existing customer
              </button>
              <button
                type="button"
                onClick={() => setGuestMode('new')}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  guestMode === 'new'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                New customer
              </button>
            </div>

            {guestMode === 'existing' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Guest / Customer *
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
                      {c.activeMembership ? ` · ${c.activeMembership.name}` : ' · No membership'}
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-slate-700">
                    {(selectedCustomer.memberships || []).some((m: any) => m.status === 'ACTIVE') ? (
                      <>
                        <p className="font-bold text-amber-900">
                          Membership:{' '}
                          {
                            (selectedCustomer.memberships || []).find(
                              (m: any) => m.status === 'ACTIVE'
                            )?.name
                          }
                        </p>
                        <p className="mt-1">
                          Sessions left:{' '}
                          {(selectedCustomer.serviceEntitlements || []).reduce(
                            (sum, item) => sum + item.remaining,
                            0
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-slate-800">
                        No membership. This booking is a single service visit.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="First name *"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Last name"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
                <Input
                  label="Phone *"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Treatment Service */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Spa Treatment / Service *
              </label>
              <select
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setServiceVariantId('');
                }}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="">-- Choose a treatment --</option>
                {servicesData?.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.defaultDuration} mins) - {formatCurrency(s.defaultPrice, 'INR')}
                  </option>
                ))}
              </select>
            </div>

            {/* Variants if any */}
            {selectedService && selectedService.variants.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Treatment Variant (Optional)
                </label>
                <select
                  value={serviceVariantId}
                  onChange={(e) => setServiceVariantId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
                >
                  <option value="">Default ({selectedService.defaultDuration} mins)</option>
                  {selectedService.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.duration} mins) - {formatCurrency(v.price, 'INR')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Therapist */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assign Therapist (Optional)
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="">Any Available Therapist</option>
                {staffData?.data.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.position || 'Therapist'})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date *
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Start Time *
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  End Time *
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reservation Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Guest requested aromatherapy lavender oil"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsBookModalOpen(false)}
                disabled={isBooking}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={isBooking}
              >
                {isBooking ? 'Booking...' : 'Confirm Reservation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
