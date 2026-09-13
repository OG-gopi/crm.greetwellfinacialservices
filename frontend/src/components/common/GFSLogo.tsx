import React from 'react';
import gfsLogoImg from '../../assets/gfs-logo.png';

export interface GFSLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  variant?: 'light' | 'dark' | 'raw' | 'card';
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  alt?: string;
}

export const GFSLogo: React.FC<GFSLogoProps> = ({
  size = 'md',
  variant = 'dark',
  className = '',
  imgClassName = '',
  onClick,
  alt = 'Greetwell Financial Services Logo',
}) => {
  // Dimension mapping maintaining 1:1 aspect ratio
  const sizeClasses = {
    xs: 'h-8 w-8',
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28',
    '2xl': 'h-36 w-36',
    custom: '',
  };

  // Container styling for visibility on light vs dark backgrounds
  const containerStyle = () => {
    switch (variant) {
      case 'light':
      case 'card':
        // Logo on light background: wrap in premium dark navy circular container with gold border & shadow
        return 'bg-[#091526] p-1.5 rounded-full border-2 border-amber-400/40 shadow-md hover:border-amber-400/80 transition-all aspect-square overflow-hidden';
      case 'dark':
        // Logo on dark background: circular container with gold accent ring
        return 'bg-[#091526] p-1 rounded-full border border-amber-400/40 shadow-sm aspect-square overflow-hidden';
      case 'raw':
      default:
        return 'rounded-full overflow-hidden aspect-square';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none ${containerStyle()} ${className} ${
        onClick ? 'cursor-pointer hover:opacity-95' : ''
      }`}
    >
      <img
        src={gfsLogoImg}
        onError={(e) => {
          // Fallback to public asset path if bundled asset fails
          (e.target as HTMLImageElement).src = '/assets/gfs-logo.png';
        }}
        alt={alt}
        className={`object-contain rounded-full ${size !== 'custom' ? sizeClasses[size] : ''} ${imgClassName}`}
      />
    </div>
  );
};

export default GFSLogo;
