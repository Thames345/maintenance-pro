import React from 'react';

interface BrandLogoProps {
  className?: string;
  framed?: boolean;
  label?: string;
}

export const BRAND_LOGO_PATH = `${import.meta.env.BASE_URL}brand/maintenance-pro-logo.png`;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'w-10 h-10',
  framed = false,
  label = 'Maintenance Pro',
}) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${framed ? 'brand-logo-framed' : ''} ${className}`}
    role="img"
    aria-label={label}
  >
    <img
      src={BRAND_LOGO_PATH}
      alt=""
      className="block h-full w-full object-contain select-none pointer-events-none"
      draggable={false}
    />
  </span>
);
