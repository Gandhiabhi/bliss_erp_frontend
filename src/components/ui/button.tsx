import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-[#3e2c1e] hover:bg-[#322316] text-[#f8f5ee] font-semibold shadow-sm shadow-[#3e2c1e]/20 focus:ring-[#b5915f] border border-[#3e2c1e]',
      gold:
        'bg-gradient-to-r from-[#b5915f] to-[#c4a270] hover:from-[#a47f4e] hover:to-[#b5915f] text-[#241a13] font-bold shadow-sm shadow-[#b5915f]/25 focus:ring-[#b5915f] border border-[#b5915f]/60',
      secondary:
        'bg-[#f4efe6] hover:bg-[#ece4d6] text-[#3e2c1e] border border-[#e2d8ca] font-medium focus:ring-[#b5915f] shadow-2xs',
      outline:
        'bg-white hover:bg-[#fbf9f5] text-[#3e2c1e] border border-[#e2d8ca] hover:border-[#b5915f] font-medium focus:ring-[#b5915f] shadow-2xs',
      ghost:
        'bg-transparent hover:bg-[#f4efe6] text-[#5c4a3b] hover:text-[#2d231c] font-medium focus:ring-[#b5915f]',
      danger:
        'bg-[#be3a34] hover:bg-[#a5312c] text-white font-semibold shadow-sm shadow-rose-900/20 focus:ring-rose-500 border border-[#be3a34]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-6 py-2.5 gap-2.5 h-12',
      icon: 'p-2 h-10 w-10 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
