'use client';
import React from 'react';

// Complex, modern logo with flowing waves inspired by the Green Wave design
export default function Logo({ 
  size = 'default', 
  className = '', 
  variant = 'full' 
}: { 
  size?: 'small' | 'default' | 'large',
  className?: string,
  variant?: 'full' | 'simple' | 'minimal'
}) {
  // SVG gradient ids must be unique per instance: two logos on one page
  // (e.g. the auth shell's desktop panel + mobile lockup) would otherwise
  // both define the same id, and url(#id) resolves to the first match in
  // document order - which may sit inside a display:none subtree and paint
  // nothing.
  const uid = React.useId().replace(/:/g, '');
  const sizeClasses = {
    small: 'w-10 h-10',
    default: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  // Simplified version for small spaces
  if (variant === 'minimal') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id={`minimalGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#95dccd" />
              <stop offset="100%" stopColor="#0c8b7c" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="95" fill={`url(#minimalGrad-${uid})`} />
          <path
            d="M 100 65 C 85 65, 75 75, 75 90 C 75 110, 100 135, 100 135 C 100 135, 125 110, 125 90 C 125 75, 115 65, 100 65 Z"
            fill="white"
          />
        </svg>
      </div>
    );
  }

  // Simple version - cleaner, less complex
  if (variant === 'simple') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id={`simpleGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#95dccd" />
              <stop offset="50%" stopColor="#32b49f" />
              <stop offset="100%" stopColor="#0c8b7c" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="95" fill={`url(#simpleGrad-${uid})`} />
          <path
            d="M 100 65 C 85 65, 75 75, 75 90 C 75 110, 100 135, 100 135 C 100 135, 125 110, 125 90 C 125 75, 115 65, 100 65 Z"
            fill="white"
            opacity="0.95"
          />
        </svg>
      </div>
    );
  }

  // Full complex version - inspired by Green Wave
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
        <defs>
          {/* Primary blue gradient */}
          <linearGradient id={`blueGrad1-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c7ece5" />
            <stop offset="50%" stopColor="#95dccd" />
            <stop offset="100%" stopColor="#5cc8b4" />
          </linearGradient>

          <linearGradient id={`blueGrad2-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#95dccd" />
            <stop offset="50%" stopColor="#32b49f" />
            <stop offset="100%" stopColor="#15a18b" />
          </linearGradient>

          <linearGradient id={`blueGrad3-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#32b49f" />
            <stop offset="50%" stopColor="#0c8b7c" />
            <stop offset="100%" stopColor="#0b7064" />
          </linearGradient>

          {/* Radial gradient for glow */}
          <radialGradient id={`glowGrad-${uid}`}>
            <stop offset="0%" stopColor="#e8f7f4" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#95dccd" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#32b49f" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background glow effect */}
        <circle cx="100" cy="100" r="98" fill={`url(#glowGrad-${uid})`} />

        {/* Outer flowing wave - inspired by Green Wave Solutions */}
        <path
          d="M 35 100 Q 50 50, 85 60 Q 115 68, 135 45 Q 150 55, 155 85 Q 160 115, 145 140 Q 125 160, 100 155 Q 75 150, 55 165 Q 40 150, 35 125 Q 30 108, 35 100 Z"
          fill={`url(#blueGrad1-${uid})`}
          opacity="0.75"
        />

        {/* Middle flowing wave */}
        <path
          d="M 45 102 Q 60 65, 90 72 Q 115 78, 145 58 Q 152 75, 150 100 Q 148 125, 130 140 Q 112 152, 100 148 Q 88 144, 70 153 Q 55 143, 48 120 Q 43 108, 45 102 Z"
          fill={`url(#blueGrad2-${uid})`}
          opacity="0.85"
        />

        {/* Inner wave with heart integration */}
        <path
          d="M 60 98 Q 72 78, 88 82 Q 100 85, 112 82 Q 128 78, 140 98 Q 143 112, 137 125 Q 127 140, 112 136 Q 100 133, 88 136 Q 73 140, 63 125 Q 57 112, 60 98 Z"
          fill={`url(#blueGrad3-${uid})`}
        />

        {/* Central heart element - white for contrast */}
        <path
          d="M 100 80 C 92 80, 85 87, 85 95 C 85 108, 100 125, 100 125 C 100 125, 115 108, 115 95 C 115 87, 108 80, 100 80 Z"
          fill="white"
          opacity="0.95"
        />

        {/* Decorative elements - organic leaves/branches */}
        <g opacity="0.7">
          {/* Right branch */}
          <path
            d="M 108 90 Q 120 85, 128 78 L 125 80 Q 118 85, 108 90 Z"
            fill="white"
            opacity="0.8"
          />
          <ellipse cx="130" cy="75" rx="3" ry="4" fill="white" opacity="0.6" />
          <ellipse cx="125" cy="82" rx="2.5" ry="3.5" fill="white" opacity="0.6" />

          {/* Left branch */}
          <path
            d="M 92 90 Q 80 85, 72 78 L 75 80 Q 82 85, 92 90 Z"
            fill="white"
            opacity="0.8"
          />
          <ellipse cx="70" cy="75" rx="3" ry="4" fill="white" opacity="0.6" />
          <ellipse cx="75" cy="82" rx="2.5" ry="3.5" fill="white" opacity="0.6" />
        </g>

        {/* Accent hearts */}
        <path
          d="M 65 70 C 62 70, 60 72, 60 75 C 60 79, 65 84, 65 84 C 65 84, 70 79, 70 75 C 70 72, 68 70, 65 70 Z"
          fill="white"
          opacity="0.5"
        />
        <path
          d="M 135 118 C 132 118, 130 120, 130 123 C 130 127, 135 132, 135 132 C 135 132, 140 127, 140 123 C 140 120, 138 118, 135 118 Z"
          fill="white"
          opacity="0.5"
        />

        {/* Flowing detail line */}
        <path
          d="M 65 108 Q 80 105, 100 108 Q 120 111, 135 108"
          stroke="white"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
          strokeLinecap="round"
        />

        {/* Small decorative circles */}
        <circle cx="55" cy="90" r="2.5" fill="white" opacity="0.4" />
        <circle cx="145" cy="105" r="2.5" fill="white" opacity="0.4" />
        <circle cx="100" cy="145" r="2" fill="white" opacity="0.3" />
      </svg>
    </div>
  );
}

export function LogoWithText({ 
  size = 'default', 
  showTagline = true,
  variant = 'full'
}: { 
  size?: 'small' | 'default' | 'large',
  showTagline?: boolean,
  variant?: 'full' | 'simple' | 'minimal'
}) {
  const textSizes = {
    small: 'text-lg',
    default: 'text-3xl',
    large: 'text-5xl'
  };

  const taglineSizes = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-lg'
  };

  return (
    <div className="flex items-center gap-4">
      <Logo size={size} variant={variant} />
      <div className="flex flex-col">
        <h1 className={`${textSizes[size]} font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700 bg-clip-text text-transparent leading-tight`}>
          Our Story
        </h1>
        {showTagline && (
          <p className={`${taglineSizes[size]} text-brand-600 dark:text-brand-400 italic mt-1 font-medium`}>
            Love, written together
          </p>
        )}
      </div>
    </div>
  );
}

// Brand mark - just the symbol for favicons, app icons
export function BrandMark({ className = '' }: { className?: string }) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={`w-full h-full ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id={`brandGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#95dccd" />
            <stop offset="50%" stopColor="#32b49f" />
            <stop offset="100%" stopColor="#0c8b7c" />
          </linearGradient>
        </defs>
        
        {/* Simplified brand mark */}
        <circle cx="100" cy="100" r="95" fill={`url(#brandGrad-${uid})`} />
        
        {/* Heart symbol */}
        <path
          d="M 100 70 C 88 70, 78 80, 78 92 C 78 110, 100 135, 100 135 C 100 135, 122 110, 122 92 C 122 80, 112 70, 100 70 Z"
          fill="white"
        />
        
        {/* Decorative wave accent */}
        <path
          d="M 70 110 Q 85 107, 100 110 Q 115 113, 130 110"
          stroke="white"
          strokeWidth="3"
          fill="none"
          opacity="0.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
