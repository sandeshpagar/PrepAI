import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary:
      'bg-primary-container text-on-primary-container font-semibold shadow-glow-primary hover:bg-primary-fixed-dim active:scale-[0.98]',
    secondary:
      'bg-secondary-container text-secondary-fixed font-semibold shadow-glow-secondary hover:bg-secondary/30 active:scale-[0.98]',
    glass:
      'bg-surface-container-high/80 text-on-surface border border-white/10 hover:border-white/20 hover:bg-surface-bright active:scale-[0.98]',
    ghost:
      'text-on-surface-variant hover:text-on-surface hover:bg-white/5 active:scale-[0.98]',
  }[variant];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
  }[size];

  return (
    <button
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses,
          sizeClasses,
          className
        )
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};
