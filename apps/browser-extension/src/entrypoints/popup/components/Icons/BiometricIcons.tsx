import React from 'react';

/**
 * Touch ID icon component.
 */
export const TouchIDIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => {
  return (
    <svg 
      className={className}
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 2a10 10 0 0 1 10 10c0 1.2-.2 2.4-.6 3.5" />
      <path d="M12 2v10l4.5 4.5" />
      <path d="M12 2a10 10 0 0 0-9.4 13.4" />
      <path d="M12 12a4 4 0 1 0 4 4" />
      <path d="M12 12v4" />
      <path d="M16 8v2" />
      <path d="M8 8v2" />
      <path d="M18 12h2" />
      <path d="M4 12h2" />
    </svg>
  );
};

/**
 * Fingerprint icon component.
 */
export const FingerprintIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => {
  return (
    <svg 
      className={className}
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
      <path d="M5 19.5C5.5 18 6 15 6 12c0-1.6.8-3 2-4" />
      <path d="M9 19c-.6-1-1-2.2-1-4a3 3 0 0 1 6 0c0 1.7-.4 3-1 4" />
      <path d="M12 19v3" />
      <path d="M12 6v2" />
      <path d="M15 19c.6-1 1-2.2 1-4a3 3 0 0 0-1-2" />
      <path d="M18 19c.5-1.5 1-4.5 1-7.5 0-2-.5-3-1-4" />
      <path d="M17 7a5 5 0 0 0-4-2" />
    </svg>
  );
};

/**
 * Generic biometric icon component.
 * This component renders the appropriate biometric icon based on the platform.
 */
export const BiometricIcon: React.FC<{ className?: string; size?: number; type?: 'touchid' | 'fingerprint' }> = ({ 
  className = '', 
  size = 24,
  type = 'touchid'
}) => {
  if (type === 'fingerprint') {
    return <FingerprintIcon className={className} size={size} />;
  }
  
  return <TouchIDIcon className={className} size={size} />;
};

