import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, rightElement, className, id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-on-surface">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3 text-on-surface-variant pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={twMerge(
              clsx(
                'w-full bg-surface-container-lowest/80 text-on-surface text-sm rounded-lg px-3 py-2.5',
                'placeholder:text-on-surface-variant/50 border border-white/10 transition-all duration-200',
                'focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 focus:bg-surface-container-lowest',
                icon && 'pl-10',
                rightElement && 'pr-10',
                error && 'border-error focus:border-error focus:ring-error/40',
                className
              )
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-error mt-0.5">{error}</span>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
