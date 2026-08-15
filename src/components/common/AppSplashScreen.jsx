import React, { useState, useEffect } from 'react';

/**
 * High-End Motion Design Splash Screen for StageLink
 * Designed with senior motion graphics standards:
 * - 3D squircle logo entrance with spring physics & reflective light sweep
 * - Expanding sonic aura rings symbolizing music and network connectivity
 * - Ambient glowing mesh orbs & star-dust atmospheric particles
 * - Shimmering typography reveal & animated soundwave visualizer
 * - Cinematic scale & blur exit transition
 */
export default function AppSplashScreen({ onFinish }) {
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress bar fill
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2.5; // reaches 100 in ~2s
      });
    }, 45);

    // Trigger exit animation
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2200);

    // Complete splash sequence and hand over to app
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2600);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#040714',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top, 40px) 24px env(safe-area-inset-bottom, 36px)',
        opacity: isFading ? 0 : 1,
        transform: isFading ? 'scale(1.08)' : 'scale(1)',
        filter: isFading ? 'blur(10px)' : 'blur(0px)',
        transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), filter 0.45s ease',
        pointerEvents: 'none',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* 1. AMBIENT GLOWING MESH ORBS */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.35) 0%, rgba(0, 198, 255, 0.15) 45%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'ambientOrbFloat 4s ease-in-out infinite alternate',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 65%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      {/* Atmospheric Star-Dust Particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${(i * 19) % 95}%`,
              left: `${(i * 23) % 92}%`,
              width: i % 3 === 0 ? '3px' : '2px',
              height: i % 3 === 0 ? '3px' : '2px',
              borderRadius: '50%',
              background: '#38BDF8',
              boxShadow: '0 0 8px #38BDF8',
              opacity: 0.6,
              animation: `particleTwinkle ${1.5 + (i % 3) * 0.8}s ease-in-out infinite alternate ${(i * 0.2)}s`
            }}
          />
        ))}
      </div>

      {/* Top Spacer */}
      <div style={{ height: '10px' }} />

      {/* 2. CENTER HERO LOGO & STAGE PRESENCE */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        {/* Concentric Sonic Wave Ripple Rings */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            border: '1.5px solid rgba(0, 198, 255, 0.4)',
            animation: 'sonicRipple 2.4s infinite cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: '1.5px solid rgba(0, 102, 255, 0.5)',
            animation: 'sonicRipple 2.4s infinite cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            animation: 'sonicRipple 2.4s infinite cubic-bezier(0.2, 0.8, 0.2, 1) 1.2s',
            pointerEvents: 'none'
          }}
        />

        {/* 3D Glassmorphic Logo Squircle Container */}
        <div
          style={{
            position: 'relative',
            width: '116px',
            height: '116px',
            borderRadius: '30px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(0, 102, 255, 0.1) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 0 50px rgba(0, 140, 255, 0.6), 0 20px 45px rgba(0, 0, 0, 0.7), inset 0 1px 3px rgba(255, 255, 255, 0.6)',
            animation: 'logoEntrance 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, logoFloat 3s ease-in-out infinite 0.9s'
          }}
        >
          {/* Logo Image */}
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

          {/* High-End Glass Light Sheen Sweep Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-60%',
              width: '60%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.65) 50%, transparent 100%)',
              transform: 'rotate(28deg)',
              animation: 'lightSweep 2.2s infinite ease-in-out 0.6s',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Brand Name Typography Reveal */}
        <div
          style={{
            marginTop: '22px',
            textAlign: 'center',
            animation: 'textReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards',
            opacity: 0,
            transform: 'translateY(14px)'
          }}
        >
          <h1
            style={{
              fontSize: '2.3rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              margin: 0,
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #FFFFFF 20%, #E0F2FE 60%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 20px rgba(0, 102, 255, 0.4)'
            }}
          >
            StageLink
          </h1>

          {/* Tagline Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              padding: '4px 14px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#22C55E',
                boxShadow: '0 0 8px #22C55E'
              }}
            />
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#94A3B8',
                letterSpacing: '0.4px'
              }}
            >
              La Passerelle des Talents & Opportunités
            </span>
          </div>
        </div>

        {/* Dynamic Neon Equalizer Visualizer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '28px',
            height: '28px',
            animation: 'fadeIn 0.6s ease 0.5s forwards',
            opacity: 0
          }}
        >
          {[14, 26, 38, 20, 48, 30, 42, 18, 28].map((baseHeight, i) => (
            <div
              key={i}
              style={{
                width: '3.5px',
                height: `${baseHeight}px`,
                borderRadius: '4px',
                background: i % 2 === 0
                  ? 'linear-gradient(180deg, #38BDF8 0%, #0066FF 100%)'
                  : 'linear-gradient(180deg, #00C6FF 0%, #0047FF 100%)',
                boxShadow: '0 0 10px rgba(0, 198, 255, 0.6)',
                animation: `equalizerBounce 0.7s infinite ease-in-out alternate ${i * 0.08}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* 3. SLEEK BOTTOM PROGRESS BAR & FOOTER */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          width: '100%',
          maxWidth: '220px',
          zIndex: 10,
          animation: 'fadeIn 0.8s ease 0.4s forwards',
          opacity: 0
        }}
      >
        {/* Modern Precision Loading Track */}
        <div
          style={{
            width: '100%',
            height: '3.5px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #0066FF 0%, #00C6FF 70%, #FFFFFF 100%)',
              boxShadow: '0 0 12px #00C6FF',
              transition: 'width 0.1s linear'
            }}
          />
        </div>

        {/* Footer Credits */}
        <div
          style={{
            fontSize: '0.76rem',
            color: 'rgba(148, 163, 184, 0.8)',
            fontWeight: 500,
            letterSpacing: '0.3px'
          }}
        >
          Powered by{' '}
          <strong style={{ color: '#FFFFFF', fontWeight: 700 }}>JABE PRODUCTION</strong>
        </div>
      </div>

      {/* 4. MOTION GRAPHICS KEYFRAMES */}
      <style>{`
        @keyframes logoEntrance {
          0% {
            transform: scale(0.35) perspective(600px) rotateX(15deg);
            opacity: 0;
          }
          65% {
            transform: scale(1.08) perspective(600px) rotateX(-4deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) perspective(600px) rotateX(0deg);
            opacity: 1;
          }
        }

        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 0 50px rgba(0, 140, 255, 0.6), 0 20px 45px rgba(0, 0, 0, 0.7);
          }
          50% {
            transform: translateY(-8px);
            box-shadow: 0 0 65px rgba(0, 180, 255, 0.8), 0 28px 55px rgba(0, 0, 0, 0.8);
          }
        }

        @keyframes lightSweep {
          0% {
            left: -80%;
          }
          50%, 100% {
            left: 140%;
          }
        }

        @keyframes sonicRipple {
          0% {
            transform: translate(-50%, -50%) scale(0.65);
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }

        @keyframes textReveal {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes equalizerBounce {
          0% {
            transform: scaleY(0.3);
            filter: brightness(0.85);
          }
          100% {
            transform: scaleY(1.35);
            filter: brightness(1.2);
          }
        }

        @keyframes ambientOrbFloat {
          0% {
            transform: translate(-50%, -50%) scale(0.9);
          }
          100% {
            transform: translate(-46%, -54%) scale(1.15);
          }
        }

        @keyframes particleTwinkle {
          0% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          100% {
            opacity: 0.9;
            transform: scale(1.4);
          }
        }
      `}</style>
    </div>
  );
}
