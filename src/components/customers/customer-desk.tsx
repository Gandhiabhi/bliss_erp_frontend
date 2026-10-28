'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { customersApi, Customer } from '@/lib/api/customers.api';
import { servicesApi } from '@/lib/api/services.api';
import { staffApi } from '@/lib/api/staff.api';
import { plansApi } from '@/lib/api/plans.api';
import { visitsApi } from '@/lib/api/visits.api';
import { paymentsApi } from '@/lib/api/payments.api';
import { membershipsApi } from '@/lib/api/memberships.api';
import { paymentFields, PAYMENT_CHOICES } from '@/lib/payment-methods';
import { formatCurrency } from '@/lib/utils';
import { Pencil, Sparkles, CreditCard } from 'lucide-react';

export function CustomerDeskActions({
  customer,
  compact = false,
}: {
  customer: Customer;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'edit' | 'service' | 'membership' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(customer.firstName || '');
  const [lastName, setLastName] = useState(customer.lastName || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [email, setEmail] = useState(customer.email || '');
  const [notes, setNotes] = useState(customer.notes || '');

  const [serviceId, setServiceId] = useState('');
  const [serviceVariantId, setServiceVariantId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentChoiceId, setPaymentChoiceId] = useState('CASH');
  const [planId, setPlanId] = useState('');

  const { data: servicesRes } = useQuery({
    queryKey: ['desk-services', customer.branchId],
    queryFn: () => servicesApi.getAll({ branchId: customer.branchId }),
    enabled: mode === 'service',
  });
  const { data: staffRes } = useQuery({
    queryKey: ['desk-staff', customer.branchId],
    queryFn: () => staffApi.getAll({ branchId: customer.branchId, status: 'ACTIVE' }),
    enabled: mode === 'service',
  });
  const { data: plansRes } = useQuery({
    queryKey: ['desk-plans', customer.branchId],
    queryFn: () => plansApi.getAll({ branchId: customer.branchId, status: 'ACTIVE' }),
    enabled: mode === 'membership',
  });

  const selectedService = servicesRes?.data?.find((service) => service.id === serviceId);
  const selectedPlan = plansRes?.data?.find((plan) => plan.id === planId);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-profile', customer.id] });
    queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    queryClient.invalidateQueries({ queryKey: ['memberships'] });
    queryClient.invalidateQueries({ queryKey: ['visits'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  };

  const close = () => {
    setMode(null);
    setError(null);
  };

  const editMutation = useMutation({
    mutationFn: () =>
      customersApi.update(customer.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      }),
    onSuccess: () => {
      refresh();
      close();
    },
    onError: (err: Error) => setError(err.message),
  });

  const serviceMutation = useMutation({
    mutationFn: async () => {
      const pay = paymentFields(paymentChoiceId, 'Return visit');
      await visitsApi.create({
        customerId: customer.id,
        branchId: customer.branchId,
        notes: 'Service added on a return visit',
        services: [
          {
            serviceId,
            serviceVariantId: serviceVariantId || undefined,
            staffId: staffId || undefined,
            quantity: 1,
          },
        ],
      });
      await paymentsApi.createPayment({
        customerId: customer.id,
        branchId: customer.branchId,
        amount: Number(amount),
        currency: 'INR',
        paymentMethod: pay.paymentMethod,
        notes: pay.notes,
      });
    },
    onSuccess: () => {
      refresh();
      close();
    },
    onError: (err: Error) => setError(err.message),
  });

  const membershipMutation = useMutation({
    mutationFn: () => {
      if (!selectedPlan) throw new Error('Choose a membership.');
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + Number(selectedPlan.durationDays || 30));
      const pay = paymentFields(paymentChoiceId, 'Membership');
      return membershipsApi.create({
        customerId: customer.id,
        branchId: customer.branchId,
        planTemplateId: selectedPlan.id,
        name: selectedPlan.name,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        price: Number(selectedPlan.price),
        currency: 'INR',
        recordPayment: true,
        paymentMethod: pay.paymentMethod,
        notes: pay.notes,
      });
    },
    onSuccess: () => {
      refresh();
      close();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <>
      {compact ? (
        <div className="flex flex-col items-stretch gap-1.5 min-w-[132px]">
          <Button size="sm" variant="gold" onClick={() => { setError(null); setMode('service'); }}>
            Add service
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setError(null); setMode('membership'); }}>
            Add membership
          </Button>
        </div>
      ) : (
        <>
          <Button variant="secondary" size="md" onClick={() => { setError(null); setMode('edit'); }}>
            <Pencil className="w-4 h-4" />
            Edit details
          </Button>
          <Button variant="gold" size="md" onClick={() => { setError(null); setMode('service'); }}>
            <Sparkles className="w-4 h-4" />
            Add service
          </Button>
          <Button variant="gold" size="md" onClick={() => { setError(null); setMode('membership'); }}>
            <CreditCard className="w-4 h-4" />
            Add membership
          </Button>
        </>
      )}

      <Modal isOpen={mode === 'edit'} onClose={close} title="Update guest" size="md">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            editMutation.mutate();
          }}
        >
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button type="submit" variant="gold" disabled={editMutation.isPending}>
            Save changes
          </Button>
        </form>
      </Modal>

      <Modal isOpen={mode === 'service'} onClose={close} title="Add a service" size="md">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!serviceId || Number(amount) <= 0) {
              setError('Choose a service and enter the amount paid.');
              return;
            }
            if (!staffId) {
              setError('Choose the therapist who will give this service.');
              return;
            }
            serviceMutation.mutate();
          }}
        >
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setServiceVariantId('');
              const service = servicesRes?.data?.find((item) => item.id === e.target.value);
              if (service) setAmount(String(service.defaultPrice));
            }}
            className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
          >
            <option value="">Choose a service</option>
            {servicesRes?.data?.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · {formatCurrency(service.defaultPrice, 'INR')}
              </option>
            ))}
          </select>
          {selectedService && selectedService.variants.length > 0 && (
            <select
              value={serviceVariantId}
              onChange={(e) => {
                setServiceVariantId(e.target.value);
                const variant = selectedService.variants.find((item) => item.id === e.target.value);
                if (variant) setAmount(String(variant.price));
              }}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
            >
              <option value="">Standard duration</option>
              {selectedService.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name} · {variant.duration} min · {formatCurrency(variant.price, 'INR')}
                </option>
              ))}
            </select>
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
            <p className="text-[11px] text-slate-600">Saved with this visit so you can see who gave the service.</p>
          </div>
          <Input label="Amount paid (₹)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
          <Button type="submit" variant="gold" disabled={serviceMutation.isPending}>
            Save service
          </Button>
        </form>
      </Modal>

      <Modal isOpen={mode === 'membership'} onClose={close} title="Assign a membership" size="md">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            membershipMutation.mutate();
          }}
        >
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm"
          >
            <option value="">Choose a membership</option>
            {plansRes?.data?.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {plan.durationDays} days · {formatCurrency(Number(plan.price), 'INR')}
              </option>
            ))}
          </select>
          {selectedPlan && (
            <p className="text-xs text-slate-600">
              {selectedPlan.name} · {formatCurrency(Number(selectedPlan.price), 'INR')} · {selectedPlan.durationDays} days
            </p>
          )}
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
          <Button type="submit" variant="gold" disabled={membershipMutation.isPending || !selectedPlan}>
            Assign and record payment
          </Button>
        </form>
      </Modal>
    </>
  );
}
