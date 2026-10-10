import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-[#3e2c1e]">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-xl border border-[#e2d8ca] bg-white px-3.5 py-2 text-sm text-[#2d231c] placeholder:text-[#9e8f80] focus:outline-none focus:border-[#b5915f] focus:ring-2 focus:ring-[#b5915f]/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#fbf9f5] transition-all duration-150 shadow-2xs',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
