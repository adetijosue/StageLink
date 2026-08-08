import React from 'react';

/**
 * Official StageLink Logo Component
 * Renders the EXACT official logo image provided by the user (/stagelink-logo.png)
 */
export default function Logo({ size = 'medium', variant = 'full', className = '' }) {
  const dimensions = {
    small: { height: 46, iconSize: 36, shadow: '0 4px 12px rgba(0, 102, 255, 0.22)' },
    medium: { height: 58, iconSize: 48, shadow: '0 8px 20px rgba(0, 102, 255, 0.25)' },
    large: { height: 104, iconSize: 84, shadow: '0 12px 30px rgba(0, 102, 255, 0.3)' },
    xlarge: { height: 140, iconSize: 110, shadow: '0 16px 40px rgba(0, 102, 255, 0.35)' }
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
          borderRadius: size === 'small' ? '12px' : '18px',
          boxShadow: current.shadow,
          overflow: 'hidden'
        }}
      >
        <img
          src="/stagelink-logo.png"
          alt="StageLink Official Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
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
