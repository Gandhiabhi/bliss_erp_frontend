'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

export type GuestServiceRow = {
  serviceId: string;
  serviceVariantId?: string;
  allocatedQuantity: number;
};

export function rowsFromPlan(
  services: Array<{ serviceId: string; serviceVariantId?: string | null; quantity: number }>
): GuestServiceRow[] {
  return services.map((service) => ({
    serviceId: service.serviceId,
    serviceVariantId: service.serviceVariantId || undefined,
    allocatedQuantity: service.quantity,
  }));
}

export function GuestPlanServicesEditor({
  catalog,
  rows,
  onChange,
}: {
  catalog: Array<{
    id: string;
    name: string;
    variants?: Array<{ id: string; name: string; duration: number }>;
  }>;
  rows: GuestServiceRow[];
  onChange: (rows: GuestServiceRow[]) => void;
}) {
  const updateRow = (index: number, patch: Partial<GuestServiceRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">Services for this guest</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!catalog[0]) return;
            onChange([...rows, { serviceId: catalog[0].id, allocatedQuantity: 1 }]);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add service
        </Button>
      </div>
      <p className="text-[11px] text-slate-500">
        Change the sessions, add a service, or remove one. The original package stays the same for the next guest.
      </p>
      {rows.map((row, index) => {
        const service = catalog.find((item) => item.id === row.serviceId);
        const variants = service?.variants || [];
        return (
          <div key={`${row.serviceId}-${row.serviceVariantId || 'base'}-${index}`} className="flex items-center gap-2">
            <select
              value={row.serviceId}
              onChange={(e) => updateRow(index, { serviceId: e.target.value, serviceVariantId: undefined })}
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {variants.length > 0 && (
              <select
                value={row.serviceVariantId || ''}
                aria-label="Duration"
                onChange={(e) => updateRow(index, { serviceVariantId: e.target.value || undefined })}
                className="h-10 w-36 rounded-xl border border-slate-300 bg-white px-2 text-sm"
              >
                <option value="">Default</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.duration} min
                  </option>
                ))}
              </select>
            )}
            <div className="w-20">
              <Input
                type="number"
                min="1"
                aria-label="Number of sessions"
                value={row.allocatedQuantity}
                onChange={(e) => updateRow(index, { allocatedQuantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              />
            </div>
            <button
              type="button"
              aria-label="Remove service"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="p-2 text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      {rows.length === 0 && (
        <p className="text-xs text-slate-500">Add at least one service for this guest.</p>
      )}
    </div>
  );
}
