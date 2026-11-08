'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customersApi, Customer } from '@/lib/api/customers.api';
import { servicesApi } from '@/lib/api/services.api';
import { plansApi } from '@/lib/api/plans.api';
import { visitsApi } from '@/lib/api/visits.api';
import { membershipsApi } from '@/lib/api/memberships.api';
import { paymentsApi } from '@/lib/api/payments.api';
import { staffApi } from '@/lib/api/staff.api';
import { paymentFields, PAYMENT_CHOICES } from '@/lib/payment-methods';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, validityLabel } from '@/lib/utils';
import { GuestPlanServicesEditor, GuestServiceRow, rowsFromPlan } from '@/components/customers/guest-plan-services';

export function RegisterGuestModal({
  isOpen,
  onClose,
  initialPhone = '',
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  onCreated?: (customer: Customer) => void;
}) {
  const { activeBranchId, currentBranch, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const branchId = currentBranch?.id || activeBranchId || undefined;

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
  const [planPrice, setPlanPrice] = useState('');
  const [planServices, setPlanServices] = useState<GuestServiceRow[]>([]);
  const [menuPrice, setMenuPrice] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentChoiceId, setPaymentChoiceId] = useState('CASH');
  const [staffId, setStaffId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFirstName('');
    setLastName('');
    setPhone(initialPhone);
    setEmail('');
    setGender('');
    setNotes('');
    setOfferType('none');
    setServiceId('');
    setServiceVariantId('');
    setPlanId('');
    setPlanPrice('');
    setPlanServices([]);
    setMenuPrice(null);
    setAmount('');
    setPaymentChoiceId('CASH');
    setStaffId('');
    setFormError(null);
  }, [isOpen, initialPhone]);

  const { data: servicesRes } = useQuery({
    queryKey: ['customer-offer-services', branchId],
    queryFn: () => servicesApi.getAll({ branchId }),
    enabled: isOpen,
  });
  const { data: plansRes } = useQuery({
    queryKey: ['customer-offer-plans', branchId],
    queryFn: () => plansApi.getAll({ branchId, status: 'ACTIVE' }),
    enabled: isOpen && offerType === 'membership',
  });
  const { data: staffRes } = useQuery({
    queryKey: ['customer-offer-staff', branchId],
    queryFn: () => staffApi.getAll({ branchId, status: 'ACTIVE' }),
    enabled: isOpen && offerType === 'service',
  });
  const selectedService = servicesRes?.data?.find((s) => s.id === serviceId);
  const selectedPlan = plansRes?.data?.find((p) => p.id === planId);

  const createMutation = useMutation({
    mutationFn: async () => {
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
        if (!staffId) throw new Error('Choose the therapist who will give this service.');
        const paid = Number(amount);
        if (amount === '' || Number.isNaN(paid) || paid < 0) {
          throw new Error('Enter the price for this guest.');
        }
        const pay = paymentFields(paymentChoiceId, 'Single service');
        await visitsApi.create({
          customerId,
          branchId,
          notes: 'Single service at registration',
          services: [
            {
              serviceId,
              serviceVariantId: serviceVariantId || undefined,
              staffId: staffId || undefined,
              quantity: 1,
              unitPrice: paid,
            },
          ],
        });
        if (paid > 0) {
          await paymentsApi.createPayment({
            customerId,
            branchId,
            amount: paid,
            currency: 'INR',
            paymentMethod: pay.paymentMethod,
            notes: pay.notes,
          });
        }
      }

      if (offerType === 'membership') {
        if (!selectedPlan) throw new Error('Choose a membership plan.');
        if (planServices.length === 0) throw new Error('Add at least one service for this guest.');
        const agreed = Number(planPrice);
        if (planPrice === '' || Number.isNaN(agreed) || agreed < 0) {
          throw new Error('Enter the price for this guest.');
        }
        const start = new Date();
        const lifetime = Boolean(selectedPlan.isLifetime);
        const end = new Date(start);
        end.setDate(end.getDate() + (selectedPlan.durationDays || 30));
        await membershipsApi.create({
          customerId,
          branchId,
          planTemplateId: selectedPlan.id,
          isCustomPlan: false,
          isLifetime: lifetime,
          name: selectedPlan.name,
          startDate: start.toISOString(),
          endDate: lifetime ? undefined : end.toISOString(),
          price: agreed,
          currency: 'INR',
          recordPayment: agreed > 0,
          paymentMethod: paymentFields(paymentChoiceId).paymentMethod,
          notes: paymentFields(paymentChoiceId, 'Membership').notes,
          services: planServices.map((row) => ({
            serviceId: row.serviceId,
            serviceVariantId: row.serviceVariantId,
            allocatedQuantity: Number(row.allocatedQuantity),
          })),
        });
      }

      return created.data;
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['checkin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onCreated?.(customer);
      onClose();
    },
    onError: (err: Error) => {
      setFormError(err?.message || 'Failed to create customer');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) {
      setFormError('First name and phone number are required.');
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Spa Guest"
      description="Save the guest, then give a single service with payment or a membership."
      size="2xl"
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

        {isSuperAdmin && !branchId && (
          <p className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
            With one location, this guest is saved to the business. If you run more than one branch, choose it in the header first.
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
                if (service) {
                  setMenuPrice(Number(service.defaultPrice));
                  setAmount(String(service.defaultPrice));
                }
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
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Duration *</label>
                <select
                  value={serviceVariantId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setServiceVariantId(nextId);
                    if (!nextId) {
                      setMenuPrice(Number(selectedService.defaultPrice));
                      setAmount(String(selectedService.defaultPrice));
                      return;
                    }
                    const variant = selectedService.variants.find((v) => v.id === nextId);
                    if (variant) {
                      setMenuPrice(Number(variant.price));
                      setAmount(String(variant.price));
                    }
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="">
                    {selectedService.defaultDuration} min · {formatCurrency(selectedService.defaultPrice, 'INR')}
                  </option>
                  {selectedService.variants.map((v) => {
                    const minutes = `${v.duration} min`;
                    const named = v.name && v.name.trim().toLowerCase() !== minutes.toLowerCase();
                    return (
                      <option key={v.id} value={v.id}>
                        {named ? `${v.name} · ` : ''}
                        {minutes} · {formatCurrency(v.price, 'INR')}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <div className="space-y-1.5 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <label className="block text-xs font-semibold text-slate-800">Therapist *</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
                required
              >
                <option value="">Select therapist</option>
                {staffRes?.data?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                    {member.position ? ` · ${member.position}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-600">This therapist is saved on the visit.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Price for this guest (₹) *"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {menuPrice !== null && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Menu price stays {formatCurrency(menuPrice, 'INR')}.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Payment method *</label>
                <select
                  value={paymentChoiceId}
                  onChange={(e) => setPaymentChoiceId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  {PAYMENT_CHOICES.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {choice.label}
                    </option>
                  ))}
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
              onChange={(e) => {
                const nextId = e.target.value;
                setPlanId(nextId);
                const plan = plansRes?.data?.find((item) => item.id === nextId);
                setPlanPrice(plan ? String(plan.price) : '');
                setPlanServices(plan ? rowsFromPlan(plan.services) : []);
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
            >
              <option value="">Choose a plan</option>
              {plansRes?.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {validityLabel(p)} · {formatCurrency(p.price, 'INR')}
                </option>
              ))}
            </select>
            {selectedPlan && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  {selectedPlan.name} · {validityLabel(selectedPlan)} · package price {formatCurrency(Number(selectedPlan.price), 'INR')}
                </p>
                <GuestPlanServicesEditor
                  catalog={servicesRes?.data || []}
                  rows={planServices}
                  onChange={setPlanServices}
                />
                <Input
                  label="Price for this guest (₹) *"
                  type="number"
                  min="0"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(e.target.value)}
                />
                <p className="text-[11px] text-slate-500">
                  Package price stays {formatCurrency(selectedPlan.price, 'INR')} for the next guest.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Payment method *</label>
              <select
                value={paymentChoiceId}
                onChange={(e) => setPaymentChoiceId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {PAYMENT_CHOICES.map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" isLoading={createMutation.isPending}>
            Save & Register
          </Button>
        </div>
      </form>
    </Modal>
  );
}
