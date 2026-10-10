import React, { isValidElement, createElement } from 'react';
import { Card } from './card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: IconProp,
  trend,
  className,
}: StatsCardProps) {
  const renderedIcon = isValidElement(IconProp)
    ? IconProp
    : createElement(IconProp as React.ElementType<{ className?: string }>, {
        className: 'w-5 h-5',
      });

  return (
    <Card className={cn('p-6 glass-card', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[#705f52]">
          {title}
        </p>
        <div className="p-2.5 rounded-xl bg-[#f5efe6] text-[#b5915f] border border-[#e8dfd3] shadow-2xs">
          {renderedIcon}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-[#2d231c]">
          {value}
        </h3>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full border',
                  trend.isPositive
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-rose-800 bg-rose-50 border-rose-200'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtitle && <p className="text-xs text-[#705f52] font-medium">{subtitle}</p>}
          </div>
        )}
      </div>
    </Card>
  );
}
