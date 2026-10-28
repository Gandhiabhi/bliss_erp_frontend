'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, Invoice, Payment } from '@/lib/api/payments.api';
import { customersApi } from '@/lib/api/customers.api';
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
import { formatCurrency } from '@/lib/utils';
import { paymentFields, PAYMENT_CHOICES } from '@/lib/payment-methods';
import {
  Receipt,
  CreditCard,
  Plus,
  Eye,
  RotateCcw,
  Calendar,
  AlertCircle,
  CheckCircle,
  DollarSign,
  FileText,
} from 'lucide-react';

export default function BillingPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<Payment | null>(null);
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // New Payment Form State
  const [paymentCustomerId, setPaymentCustomerId] = useState('');
  const [paymentInvoiceId, setPaymentInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [paymentRef, setPaymentRef] = useState('');

  // Refund Form State
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  // Fetch Invoices
  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices', currentBranch?.id, search, page],
    queryFn: () =>
      paymentsApi.getInvoices({
        branchId: currentBranch?.id,
        search: search || undefined,
        page,
        limit,
      }),
    enabled: activeTab === 'INVOICES',
  });

  // Fetch Payments
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['payments', currentBranch?.id, search, page],
    queryFn: () =>
      paymentsApi.getPayments({
        branchId: currentBranch?.id,
        search: search || undefined,
        page,
        limit,
      }),
    enabled: activeTab === 'PAYMENTS',
  });

  // Fetch Customers for payment modal
  const { data: customersData } = useQuery({
    queryKey: ['customers-selector-billing', currentBranch?.id],
    queryFn: () => customersApi.getAll({ branchId: currentBranch?.id, limit: 100 }),
    enabled: isNewPaymentModalOpen,
  });

  // Create Payment Mutation
  const createPaymentMutation = useMutation({
    mutationFn: (payload: any) => paymentsApi.createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsNewPaymentModalOpen(false);
      resetPaymentForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Payment processing failed.');
    },
  });

  // Refund Mutation
  const refundMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
      paymentsApi.refundPayment(id, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedPaymentForRefund(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Refund failed.');
    },
  });

  const resetPaymentForm = () => {
    setPaymentCustomerId('');
    setPaymentInvoiceId('');
    setPaymentAmount(0);
    setPaymentMethod('CREDIT_CARD');
    setPaymentRef('');
    setFormError('');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!paymentCustomerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (paymentAmount <= 0) {
      setFormError('Payment amount must be greater than zero.');
      return;
    }

    const pay = paymentFields(paymentMethod, 'Billing');
    createPaymentMutation.mutate({
      branchId: currentBranch?.id,
      customerId: paymentCustomerId,
      invoiceId: paymentInvoiceId || undefined,
      amount: Number(paymentAmount),
      currency: 'INR',
      paymentMethod: pay.paymentMethod,
      notes: pay.notes,
      transactionReference: paymentRef || undefined,
    });
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForRefund) return;

    refundMutation.mutate({
      id: selectedPaymentForRefund.id,
      amount: Number(refundAmount),
      reason: refundReason || 'Customer requested refund',
    });
  };

  const invoices = invoicesData?.data || [];
  const invoicesMeta = invoicesData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const payments = paymentsData?.data || [];
  const paymentsMeta = paymentsData?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing, Invoices & Payments"
        description="Comprehensive accounting, transaction snapshots, payment records, and refunds"
      >
        <Button
          onClick={() => {
            resetPaymentForm();
            setIsNewPaymentModalOpen(true);
          }}
          variant="gold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('INVOICES');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'INVOICES'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Invoices & Bills
        </button>

        <button
          onClick={() => {
            setActiveTab('PAYMENTS');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'PAYMENTS'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Received Payments
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'INVOICES' && (
        <>
          {isInvoicesLoading ? (
            <LoadingState message="Loading invoices and billing statements..." />
          ) : invoices.length === 0 ? (
            <EmptyState
              title="No invoices found"
              description="Invoices are automatically generated when guests purchase packages or custom plans."
            />
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Invoice #</th>
                      <th className="px-6 py-4">Guest</th>
                      <th className="px-6 py-4">Issue Date</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Paid</th>
                      <th className="px-6 py-4">Balance</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/70 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">
                            {inv.customer?.displayName}
                          </div>
                          <div className="text-xs text-slate-500">{inv.customer?.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#2d231c]">
                          {formatCurrency(inv.total, 'INR')}
                        </td>
                        <td className="px-6 py-4 text-[#117a65] font-medium">
                          {formatCurrency(inv.paidAmount, 'INR')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              Number(inv.balanceAmount) > 0
                                ? 'text-[#8c662b] font-bold'
                                : 'text-slate-400'
                            }
                          >
                            {formatCurrency(inv.balanceAmount, 'INR')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={invoicesMeta.page}
                totalPages={invoicesMeta.totalPages}
                totalItems={invoicesMeta.total}
                pageSize={invoicesMeta.limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* TAB 2: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <>
          {isPaymentsLoading ? (
            <LoadingState message="Loading payment transactions..." />
          ) : payments.length === 0 ? (
            <EmptyState
              title="No payments recorded"
              description="Record payments received through Card, Cash, UPI, or Bank Transfer."
              action={
                <Button
                  onClick={() => setIsNewPaymentModalOpen(true)}
                  variant="gold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record First Payment
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Payment Code</th>
                      <th className="px-6 py-4">Guest</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/70 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                          {p.paymentCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">
                            {p.customer?.displayName}
                          </div>
                          <div className="text-xs text-slate-500">{p.customer?.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {p.notes?.split(' — ')[0] || p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#117a65]">
                          {formatCurrency(p.amount, 'INR')}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === 'PAID' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRefundAmount(p.amount);
                                setRefundReason('');
                                setSelectedPaymentForRefund(p);
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Refund
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={paymentsMeta.page}
                totalPages={paymentsMeta.totalPages}
                totalItems={paymentsMeta.total}
                pageSize={paymentsMeta.limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice: ${selectedInvoice.invoiceNumber}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <p className="text-xs text-slate-500">Guest</p>
                <p className="font-semibold text-slate-800">
                  {selectedInvoice.customer?.displayName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium text-slate-800">
                  {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Amount</p>
                <p className="font-bold text-slate-900">
                  {selectedInvoice.currency} {Number(selectedInvoice.total).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>

            {/* Line Items Snapshots */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Billed Items (Historical Pricing Snapshots)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Unit Price Snapshot</th>
                      <th className="px-4 py-3">Tax</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedInvoice.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {item.description}
                        </td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3 font-mono">
                          {formatCurrency(item.unitPriceSnapshot, 'INR')}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {formatCurrency(item.tax, 'INR')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(item.total, 'INR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-sm">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  Subtotal: {formatCurrency(selectedInvoice.subtotal, 'INR')}
                </p>
                <p className="text-xs text-slate-500">
                  Discount: {formatCurrency(selectedInvoice.discount, 'INR')}
                </p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-xs text-[#117a65] font-medium">
                  Paid: {formatCurrency(selectedInvoice.paidAmount, 'INR')}
                </p>
                <p className="text-sm font-bold text-[#3e2c1e]">
                  Balance: {formatCurrency(selectedInvoice.balanceAmount, 'INR')}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {isNewPaymentModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewPaymentModalOpen(false)}
          title="Record Payment Receipt"
          size="md"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Guest / Customer *
              </label>
              <select
                value={paymentCustomerId}
                onChange={(e) => setPaymentCustomerId(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="">-- Select Customer --</option>
                {customersData?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} ({c.phone || c.customerCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Amount (₹ INR) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Transaction Reference / Auth Code
              </label>
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. TXN-89472-VISA"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsNewPaymentModalOpen(false)}
                disabled={createPaymentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPaymentMutation.isPending}
                variant="gold"
              >
                {createPaymentMutation.isPending ? 'Processing...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Refund Modal */}
      {selectedPaymentForRefund && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPaymentForRefund(null)}
          title={`Process Refund: ${selectedPaymentForRefund.paymentCode}`}
          size="sm"
        >
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              You are refunding transaction{' '}
              <strong className="text-slate-900">
                {selectedPaymentForRefund.currency}{' '}
                {Number(selectedPaymentForRefund.amount).toLocaleString()}
              </strong>{' '}
              paid via {selectedPaymentForRefund.paymentMethod}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Refund Amount ({selectedPaymentForRefund.currency}) *
              </label>
              <Input
                type="number"
                min="1"
                max={selectedPaymentForRefund.amount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Refund *
              </label>
              <Input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Guest cancelled upcoming package reservation"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedPaymentForRefund(null)}
                disabled={refundMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={refundMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {refundMutation.isPending ? 'Refunding...' : 'Confirm Refund'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
