import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3;
  specular?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  level = 1,
  specular = true,
  className,
  ...props
}) => {
  const levelClasses = {
    1: 'glass-panel-1',
    2: 'glass-panel-2',
    3: 'glass-panel-3',
  }[level];

  return (
    <div
      className={twMerge(
        clsx(
          levelClasses,
          'rounded-xl transition-all duration-200',
          specular && 'specular-top-edge',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
