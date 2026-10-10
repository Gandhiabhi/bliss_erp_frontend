'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings.api';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Building,
  Globe,
  DollarSign,
  Clock,
  Bell,
  Receipt,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { currentBranch, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [taxRate, setTaxRate] = useState(5);
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [expiryWarningDays, setExpiryWarningDays] = useState(7);
  const [autoCheckoutHours, setAutoCheckoutHours] = useState(3);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch settings
  const { data, isLoading } = useQuery({
    queryKey: ['settings', currentBranch?.id],
    queryFn: () => settingsApi.getSettings(currentBranch?.id),
  });

  useEffect(() => {
    if (data?.data?.settings) {
      const s = data.data.settings;
      if (s.taxRate !== undefined) setTaxRate(s.taxRate);
      if (s.invoicePrefix) setInvoicePrefix(s.invoicePrefix);
      if (s.expiryWarningDays) setExpiryWarningDays(s.expiryWarningDays);
      if (s.autoCheckoutHours) setAutoCheckoutHours(s.autoCheckoutHours);
    }
  }, [data]);

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      await settingsApi.updateSetting('taxRate', Number(taxRate), currentBranch?.id);
      await settingsApi.updateSetting('invoicePrefix', invoicePrefix, currentBranch?.id);
      await settingsApi.updateSetting('expiryWarningDays', Number(expiryWarningDays), currentBranch?.id);
      await settingsApi.updateSetting('autoCheckoutHours', Number(autoCheckoutHours), currentBranch?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Localization"
        description="Branch operating parameters, tax calculations, and system policies"
      />

      {isLoading ? (
        <LoadingState message="Loading system settings..." />
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <span>Settings updated successfully.</span>
            </div>
          )}

          {/* Branch Identity Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-600" />
                Active Branch Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Branch Name</span>
                  <p className="font-semibold text-slate-900">
                    {data?.data?.branch?.name || currentBranch?.name}
                  </p>
                  <p className="text-xs font-mono font-bold text-amber-700">
                    {data?.data?.branch?.branchCode || currentBranch?.branchCode}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Currency</span>
                  <p className="font-mono font-bold text-emerald-600 text-base">
                    {data?.data?.branch?.currency || currentBranch?.currency}
                  </p>
                  <p className="text-[11px] text-slate-500">Localized Billing</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Timezone</span>
                  <p className="font-mono font-medium text-slate-800">
                    {data?.data?.branch?.timezone || currentBranch?.timezone}
                  </p>
                  <p className="text-[11px] text-slate-500">All dates UTC normalized</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax & Invoicing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                Financial & Tax Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Standard Tax / VAT Rate (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Applied automatically to plan packages and walk-in invoices.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Invoice Number Prefix
                  </label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV-"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    e.g. INV-DXB- or INV-LND-
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational Rules & Expiry Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                Guest Alerts & Operational Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Membership Expiry Alert (Days in advance)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={expiryWarningDays}
                    onChange={(e) => setExpiryWarningDays(parseInt(e.target.value) || 7)}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Highlights memberships approaching expiration on reception dashboards.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Visit Auto-Completion Buffer (Hours)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={autoCheckoutHours}
                    onChange={(e) => setAutoCheckoutHours(parseInt(e.target.value) || 3)}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Estimated treatment window before visit transitions to completed.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              variant="gold"
              className="px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving Settings...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
