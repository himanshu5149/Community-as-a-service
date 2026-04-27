import React from 'react';

export const BrandLogo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Metallic Gradient */}
      <defs>
        <linearGradient id="copper-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B87333" />
          <stop offset="50%" stopColor="#E3963E" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Skyline Silhouette */}
      <path 
        d="M20 140H40V100H60V120H75V60H95V100H105V40H125V90H140V70H160V110H180V140" 
        stroke="url(#copper-gradient)" 
        strokeWidth="4" 
        strokeLinejoin="round"
      />

      {/* Pulse / Heartbeat Line */}
      <path 
        d="M10 150H60L75 120L90 180L110 80L130 160L145 140H190" 
        stroke="url(#copper-gradient)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter="url(#glow)"
      >
        <animate 
          attributeName="stroke-dasharray" 
          from="0, 1000" 
          to="1000, 0" 
          dur="3s" 
          repeatCount="indefinite" 
        />
      </path>
    </svg>
  );
};
