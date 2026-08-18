import React from 'react';

// Decorative wave pattern for backgrounds
export function WavePattern({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden opacity-30 ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#4A90E2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#87CEEB" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#2C5AA0" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        
        {/* Wave 1 */}
        <path
          d="M0,100 Q300,150 600,100 T1200,100 L1200,600 L0,600 Z"
          fill="url(#waveGrad1)"
        />
        
        {/* Wave 2 */}
        <path
          d="M0,200 Q300,250 600,200 T1200,200 L1200,600 L0,600 Z"
          fill="url(#waveGrad2)"
        />
      </svg>
    </div>
  );
}

// Floating heart decorations
export function FloatingHearts({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${20 + i * 20}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${8 + i}s`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-300 opacity-20">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="currentColor"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

// Decorative corner flourish
export function CornerFlourish({ position = 'top-left', className = '' }: { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', className?: string }) {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 scale-x-[-1]',
    'bottom-left': 'bottom-0 left-0 scale-y-[-1]',
    'bottom-right': 'bottom-0 right-0 scale-[-1]',
  };

  return (
    <div className={`absolute ${positionClasses[position]} w-32 h-32 pointer-events-none ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
        <defs>
          <linearGradient id={`flourishGrad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#4A90E2" />
          </linearGradient>
        </defs>
        
        {/* Decorative swirl */}
        <path
          d="M 10 10 Q 30 10, 40 20 Q 50 30, 50 50 Q 50 70, 40 80 Q 30 90, 10 90"
          stroke={`url(#flourishGrad-${position})`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Small hearts */}
        <path
          d="M 15 15 C 13 15, 12 16, 12 18 C 12 20, 15 23, 15 23 C 15 23, 18 20, 18 18 C 18 16, 17 15, 15 15 Z"
          fill={`url(#flourishGrad-${position})`}
        />
        
        {/* Leaves */}
        <ellipse cx="25" cy="25" rx="3" ry="5" fill={`url(#flourishGrad-${position})`} opacity="0.6" />
        <ellipse cx="35" cy="35" rx="3" ry="5" fill={`url(#flourishGrad-${position})`} opacity="0.6" />
      </svg>
    </div>
  );
}

// Gradient orb decoration
export function GradientOrb({ size = 'medium', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) {
  const sizes = {
    small: 'w-32 h-32',
    medium: 'w-64 h-64',
    large: 'w-96 h-96',
  };

  return (
    <div className={`${sizes[size]} ${className} pointer-events-none`}>
      <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-50 via-brand-300 to-brand-500 opacity-20 blur-3xl"></div>
    </div>
  );
}

// Animated particle background
export function ParticleBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-brand-300 opacity-10 animate-pulse"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          }}
        />
      ))}
    </div>
  );
}

// Decorative divider
export function Divider({ variant = 'default', className = '' }: { variant?: 'default' | 'hearts' | 'wave', className?: string }) {
  if (variant === 'hearts') {
    return (
      <div className={`flex items-center justify-center gap-4 my-8 ${className}`}>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-200 to-transparent"></div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <svg key={i} width="12" height="12" viewBox="0 0 24 24" className="text-brand-500">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
          ))}
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-200 to-transparent"></div>
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={`w-full my-8 ${className}`}>
        <svg width="100%" height="20" viewBox="0 0 1200 20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dividerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E6F2FF" />
              <stop offset="50%" stopColor="#4A90E2" />
              <stop offset="100%" stopColor="#E6F2FF" />
            </linearGradient>
          </defs>
          <path
            d="M0,10 Q300,0 600,10 T1200,10"
            stroke="url(#dividerGrad)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`h-px w-full bg-gradient-to-r from-transparent via-brand-200 to-transparent my-8 ${className}`}></div>
  );
}

// Card with decorative background
export function DecorativeCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl shadow-lg ${className}`}>
      <CornerFlourish position="top-right" />
      <CornerFlourish position="bottom-left" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
