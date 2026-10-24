import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'saffron' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer';

    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow font-semibold',
      saffron: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white hover:from-amber-600 hover:to-orange-600 shadow-md font-semibold',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
      ghost: 'hover:bg-slate-100 text-slate-700',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5 font-semibold',
      icon: 'h-10 w-10 p-0'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
