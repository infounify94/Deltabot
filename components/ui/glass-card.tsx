import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle';
  hoverEffect?: boolean;
}

export function GlassCard({ 
  children, 
  variant = 'default', 
  hoverEffect = false,
  className = '', 
  ...props 
}: GlassCardProps) {
  
  // By using the CSS classes defined in globals.css, we automatically get light/dark theme support
  const baseClasses = variant === 'default' ? 'fintech-card' : 'fintech-card-subtle';
  
  const hoverClasses = hoverEffect 
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hair-2)] hover:bg-[var(--card-hover)]' 
    : '';

  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
