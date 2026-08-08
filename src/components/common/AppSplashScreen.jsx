import React, { useState, useEffect } from 'react';
import Logo from './Logo';

export default function AppSplashScreen({ onFinish }) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1200);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'radial-gradient(circle at 50% 40%, #1E293B 0%, #0B0F19 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '40px 20px',
      opacity: isFading ? 0 : 1,
      transition: 'opacity 0.4s ease-in-out',
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      {/* Dynamic Pulsating Soundwave Rings Background */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '260px',
        height: '260px',
        borderRadius: '50%',
        background: 'rgba(0, 102, 255, 0.12)',
        border: '1.5px solid rgba(0, 102, 255, 0.3)',
        animation: 'splashRingPulse 2s infinite ease-out'
      }} />

      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'rgba(0, 102, 255, 0.18)',
        border: '1.5px solid rgba(0, 102, 255, 0.5)',
        animation: 'splashRingPulse 2s infinite ease-out 0.4s'
      }} />

      <div style={{ height: '20px' }} />

      {/* Main Logo Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'splashScaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Animated Glowing Logo */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '26px',
          background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 45px rgba(0, 102, 255, 0.65)',
          marginBottom: '20px',
          animation: 'splashBounce 1.8s infinite ease-in-out'
        }}>
          <Logo size="large" variant="icon-only" />
        </div>

        {/* Brand Name */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          color: '#FFFFFF',
          margin: 0,
          background: 'linear-gradient(135deg, #FFFFFF 30%, #93C5FD 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          StageLink
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#94A3B8',
          marginTop: '6px',
          letterSpacing: '0.5px'
        }}>
          L'Écosystème Musical & Réseau Collaboratif
        </p>

        {/* Equalizer Audio Bar Animation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '28px', height: '24px' }}>
          {[12, 22, 16, 24, 18, 14, 20].map((h, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                height: `${h}px`,
                borderRadius: '4px',
                background: i % 2 === 0 ? '#0066FF' : '#38BDF8',
                animation: `splashBarEq 0.8s infinite ease-in-out alternate ${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Powered by JABE PRODUCTION Credit Footer */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', color: '#94A3B8', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.3px' }}>
        Powered by <strong style={{ color: '#FFFFFF' }}>JABE PRODUCTION</strong>
      </div>

      <style>{`
        @keyframes splashRingPulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
        @keyframes splashScaleIn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splashBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes splashBarEq {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.3); }
        }
      `}</style>
    </div>
  );
}
