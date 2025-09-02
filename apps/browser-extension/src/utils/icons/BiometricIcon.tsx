import React from 'react';

interface BiometricIconProps {
  size?: number;
  className?: string;
}

/**
 * Biometric authentication icon (fingerprint)
 */
const BiometricIcon: React.FC<BiometricIconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 11c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
      <path d="M12 11V8" />
      <path d="M12 11V8" />
      <path d="M12 11c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3" />
      <path d="M9 11v3" />
      <path d="M15 11v3" />
      <path d="M12 14v4" />
      <path d="M6 18h12" />
      <path d="M3 3l18 18" />
    </svg>
  );
};

export default BiometricIcon;
