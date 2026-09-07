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
  
  const baseClasses = variant === 'default' 
    ? 'bg-[rgba(20,23,32,0.4)] border-[rgba(255,255,255,0.05)] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] rounded-2xl backdrop-blur-xl'
    : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.03)] rounded-xl backdrop-blur-md';

  const hoverClasses = hoverEffect 
    ? 'transition-all duration-300 hover:bg-[rgba(23,27,38,0.6)] hover:border-[rgba(255,255,255,0.08)] hover:-translate-y-0.5' 
    : '';

  return (
    <div 
      className={`border ${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
