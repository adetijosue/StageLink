import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 2, isDarkMode }) {
  const bg = isDarkMode ? '#1E293B' : '#E2E8F0';

  if (type === 'feed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 14px' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              background: isDarkMode ? '#151D2A' : '#FFFFFF',
              borderRadius: '20px',
              padding: '16px',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: bg }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ width: '120px', height: '14px', borderRadius: '6px', background: bg }} />
                <div style={{ width: '80px', height: '10px', borderRadius: '4px', background: bg }} />
              </div>
            </div>
            {/* Body Lines */}
            <div style={{ width: '100%', height: '12px', borderRadius: '4px', background: bg }} />
            <div style={{ width: '75%', height: '12px', borderRadius: '4px', background: bg }} />
            {/* Media Block */}
            <div style={{ width: '100%', height: '160px', borderRadius: '14px', background: bg }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <div
        className="animate-pulse"
        style={{
          width: '100%',
          height: '240px',
          borderRadius: '24px',
          background: isDarkMode ? '#151D2A' : '#FFFFFF',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
        }}
      />
    </div>
  );
}
