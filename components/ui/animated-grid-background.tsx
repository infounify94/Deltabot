'use client';

import React from 'react';

export function AnimatedGridBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      
      {/* Top Ambient Glow Orb */}
      <div 
        className="absolute left-1/2 -top-[120px] -translate-x-1/2 w-[600px] sm:w-[900px] h-[400px] rounded-full blur-[100px] opacity-40 dark:opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(217, 119, 6, 0.25), rgba(245, 158, 11, 0.08), transparent 70%)',
        }}
      />

      {/* Subtle Fine Dot Mesh */}
      <div 
        className="absolute inset-0 opacity-[0.45] dark:opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(var(--hair-2) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'linear-gradient(180deg, black 0%, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 70%, transparent 100%)',
        }}
      />

      {/* Subtle Horizontal & Vertical Focus Lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--hair-2)] to-transparent opacity-60" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-[var(--hair)] to-transparent opacity-40 -translate-x-1/2" />

    </div>
  );
}
