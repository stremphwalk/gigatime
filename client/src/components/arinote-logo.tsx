import React from 'react';

interface ArinoteLogoProps {
  className?: string;
  size?: number;
}

export const ArinoteLogo: React.FC<ArinoteLogoProps> = ({ 
  className = "", 
  size = 32 
}) => {
  return (
    <img
      src="/brand/arinote-logo.svg"
      alt="Arinote Logo"
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        // Fallback if image not found
        console.warn('Arinote logo SVG not found at /brand/arinote-logo.svg');
      }}
    />
  );
};

export default ArinoteLogo;
