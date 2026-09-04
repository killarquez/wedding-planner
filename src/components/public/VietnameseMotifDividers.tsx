import React from 'react';

/**
 * Traditional Vietnamese Cloud Scroll (Vân Mây) Divider
 * Stylized auspicious clouds representing good fortune, peace, and heavenly blessings.
 */
export const VietnameseCloudDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-3 select-none ${className}`}>
    <svg className="w-16 sm:w-24 h-4 text-gold-500/70" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 10C15 10 20 4 35 4C45 4 48 16 60 16C72 16 75 8 85 8C92 8 95 10 100 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="35" cy="4" r="2" fill="currentColor" />
      <circle cx="60" cy="16" r="2" fill="currentColor" />
    </svg>

    {/* Center Auspicious Diamond / Floral Knot */}
    <div className="w-2.5 h-2.5 rotate-45 border border-gold-500 bg-crimson-700/80 shadow-xs" />

    <svg className="w-16 sm:w-24 h-4 text-gold-500/70 rotate-180" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 10C15 10 20 4 35 4C45 4 48 16 60 16C72 16 75 8 85 8C92 8 95 10 100 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="35" cy="4" r="2" fill="currentColor" />
      <circle cx="60" cy="16" r="2" fill="currentColor" />
    </svg>
  </div>
);

/**
 * Traditional Vietnamese Corner Filigree (Hoa văn góc kỷ hà / mây cuộn)
 */
export const VietnameseCornerFlourish: React.FC<{ position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; className?: string }> = ({
  position,
  className = 'w-6 h-6 text-gold-500/60'
}) => {
  const rotationClasses = {
    'top-left': '',
    'top-right': 'scale-x-[-1]',
    'bottom-left': 'scale-y-[-1]',
    'bottom-right': 'scale-[-1]'
  };

  return (
    <svg
      className={`${className} ${rotationClasses[position]} pointer-events-none select-none`}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 37V12C3 7.02944 7.02944 3 12 3H37"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 37V16C9 12.134 12.134 9 16 9H37"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path
        d="M17 17C17 19.5 19 21.5 21.5 21.5C24 21.5 25.5 20 25.5 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Royal Vietnamese Lotus Blossom Crest (Hoa Sen Hoàng Gia)
 */
export const VietnameseLotusCrest: React.FC<{ className?: string }> = ({ className = 'w-10 h-10 text-lotus-500' }) => (
  <svg className={`${className} select-none`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Center Bud Petal */}
    <path
      d="M32 8C32 8 26 24 26 36C26 44 32 48 32 48C32 48 38 44 38 36C38 24 32 8 32 8Z"
      fill="currentColor"
      fillOpacity="0.85"
    />
    {/* Left Petal */}
    <path
      d="M30 18C30 18 16 28 14 38C12 46 20 50 25 48C28 47 30 43 30 43C30 43 27 34 30 18Z"
      fill="currentColor"
      fillOpacity="0.6"
    />
    {/* Right Petal */}
    <path
      d="M34 18C34 18 48 28 50 38C52 46 44 50 39 48C36 47 34 43 34 43C34 43 37 34 34 18Z"
      fill="currentColor"
      fillOpacity="0.6"
    />
    {/* Outer Lotus Wings */}
    <path
      d="M26 32C26 32 10 38 6 46C2 54 12 56 18 53C23 50 26 46 26 46"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M38 32C38 32 54 38 58 46C62 54 52 56 46 53C41 50 38 46 38 46"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Pedestal Lotus Base */}
    <path
      d="M20 54C26 56 38 56 44 54C46 58 40 60 32 60C24 60 18 58 20 54Z"
      fill="currentColor"
      fillOpacity="0.9"
    />
  </svg>
);
