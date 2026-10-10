import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const normStatus = (status || '').toUpperCase().trim();

  const getStyle = () => {
    switch (normStatus) {
      case 'ACTIVE':
      case 'PAID':
      case 'COMPLETED':
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/90 font-semibold';
      case 'PENDING':
      case 'ISSUED':
      case 'PARTIAL':
      case 'PARTIALLY_PAID':
      case 'CHECKED_IN':
      case 'IN_SERVICE':
        return 'bg-[#fcf8f0] text-[#916b30] border-[#ecd6b2] font-semibold';
      case 'INACTIVE':
      case 'PAUSED':
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
      case 'EXPIRED':
      case 'CANCELLED':
      case 'FAILED':
      case 'REFUNDED':
      case 'NO_SHOW':
      case 'SUSPENDED':
        return 'bg-rose-50 text-rose-700 border-rose-200/90 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border tracking-wide uppercase shadow-2xs',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        getStyle(),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-90" />
      {formatText(normStatus)}
    </span>
  );
}
