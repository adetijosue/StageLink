import React from 'react';

/**
 * Official StageLink Logo Component
 * Renders the EXACT official logo image provided by the user, resizing appropriately for every UI location.
 * Support for "icon-only" variant using the brand vector mark.
 */
export default function Logo({ size = 'medium', variant = 'full', className = '' }) {
  // Dimension presets for various UI placements (Enlarged for high prominence)
  const dimensions = {
    small: { height: 46, iconSize: 32, shadow: '0 4px 12px rgba(0, 102, 255, 0.22)' },
    medium: { height: 58, iconSize: 42, shadow: '0 8px 20px rgba(0, 102, 255, 0.25)' },
    large: { height: 104, iconSize: 72, shadow: '0 12px 30px rgba(0, 102, 255, 0.3)' },
    xlarge: { height: 140, iconSize: 96, shadow: '0 16px 40px rgba(0, 102, 255, 0.35)' }
  };

  const current = dimensions[size] || dimensions.medium;

  if (variant === 'icon-only') {
    return (
      <div
        className={`stagelink-icon-container ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${current.iconSize}px`,
          height: `${current.iconSize}px`,
          background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
          borderRadius: size === 'small' ? '10px' : '14px',
          boxShadow: current.shadow,
          padding: '6px'
        }}
      >
        <svg viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path
            fill="white"
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`stagelink-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <img
        src="/stagelink-logo.png"
        alt="StageLink Official Logo"
        style={{
          height: `${current.height}px`,
          width: 'auto',
          borderRadius: size === 'small' ? '10px' : '14px',
          boxShadow: current.shadow,
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}
