import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
}

export default function Logo({ className = "w-8 h-8", variant = 'color' }: LogoProps) {
  const primaryColor = variant === 'light' ? 'white' : '#FF0000';
  const secondaryColor = variant === 'light' ? '#FF0000' : 'white';

  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Main Background Circle */}
        <circle cx="50" cy="50" r="48" fill={primaryColor} />
        
        {/* Stylized Aero Trail */}
        <path 
          d="M10 70C25 70 45 60 60 40C70 25 80 15 90 10" 
          stroke={secondaryColor} 
          strokeWidth="6" 
          strokeLinecap="round" 
          opacity="0.9"
          fill="none"
        />
        
        {/* Airplane Body */}
        <path 
          d="M45 55L85 15C87 13 90 14 91 16C92 18 91 21 89 23L55 60L45 55Z" 
          fill={secondaryColor} 
        />
        
        {/* Wings */}
        <path 
          d="M60 38L75 10L85 15L68 45L60 38Z" 
          fill={secondaryColor} 
        />
        <path 
          d="M52 52L40 80L30 75L48 48L52 52Z" 
          fill={secondaryColor} 
        />
        
        {/* Tail Fin */}
        <path 
          d="M48 58L32 85L25 80L42 55L48 58Z" 
          fill={secondaryColor} 
        />
      </svg>
    </div>
  );
}
