export interface PaymentChoice {
  id: string;
  label: string;
  apiMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'UPI' | 'ONLINE' | 'OTHER';
}

export const PAYMENT_CHOICES: PaymentChoice[] = [
  { id: 'CASH', label: 'Cash', apiMethod: 'CASH' },
  { id: 'UPI', label: 'UPI', apiMethod: 'UPI' },
  { id: 'CREDIT_CARD', label: 'Credit card', apiMethod: 'CARD' },
  { id: 'DEBIT_CARD', label: 'Debit card', apiMethod: 'CARD' },
  { id: 'BANK_TRANSFER', label: 'Bank transfer', apiMethod: 'BANK_TRANSFER' },
  { id: 'ONLINE', label: 'Online', apiMethod: 'ONLINE' },
];

export function paymentChoice(id: string) {
  return PAYMENT_CHOICES.find((choice) => choice.id === id) || PAYMENT_CHOICES[0];
}

export function paymentFields(id: string, detail?: string) {
  const choice = paymentChoice(id);
  return {
    paymentMethod: choice.apiMethod,
    notes: [choice.label, detail].filter(Boolean).join(' — '),
  };
}
