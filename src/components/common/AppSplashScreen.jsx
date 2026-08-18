import React, { useState, useEffect, useRef } from 'react';

export default function AppSplashScreen({ onFinish }) {
  const [stage, setStage] = useState('active'); // active -> exiting
  const onFinishRef = useRef(onFinish);
  
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Guaranteed single-shot timer for snappy ~1.0s transition
    const exitTimer = setTimeout(() => {
      setStage('exiting');
    }, 1000);

    const finishTimer = setTimeout(() => {
      if (onFinishRef.current) {
        onFinishRef.current();
      }
    }, 1250);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, []); // Run once on mount!

  const isExiting = stage === 'exiting';

  return (
    <div
      className="stagelink-splash-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'linear-gradient(180deg, #0D72D1 0%, #0B52B5 50%, #0A3C96 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.03)' : 'scale(1)',
        transition: 'opacity 0.35s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1)',
        pointerEvents: isExiting ? 'none' : 'auto',
        overflow: 'hidden',
        userSelect: 'none'
      }}
      onClick={() => {
        // Quick instant skip on tap
        if (stage === 'active') {
          setStage('exiting');
          setTimeout(() => { if (onFinish) onFinish(); }, 150);
        }
      }}
    >
      {/* 1. Ambient Background Glows */}
      <div className="splash-ambient-radial-1" />
      <div className="splash-ambient-radial-2" />

      {/* 2. Concentric Ripple Rings */}
      <div className="splash-ripple-ring ripple-1" />
      <div className="splash-ripple-ring ripple-2" />

      {/* 3. Main StageLink Logo Animated Stage */}
      <div className="splash-brand-stage">
        
        {/* Official StageLink App Icon Card */}
        <div className="splash-official-icon-container">
          
          {/* Base Official Logo Image with Elevation and Geometry */}
          <div className="splash-official-logo-card">
            <img
              src="/stagelink-logo.png"
              alt="StageLink Official Logo"
              className="splash-official-logo-img"
            />
            {/* Shimmer Light Glint Sweep */}
            <div className="splash-shimmer-sweep" />
          </div>

          {/* Dynamic Arrow Sparkle Star on Top-Right Arrow Tip */}
          <div className="splash-arrow-sparkle-anchor">
            <svg viewBox="0 0 40 40" className="splash-sparkle-svg">
              <path
                d="M 20,2 L 23.5,14.5 L 36,18 L 23.5,21.5 L 20,34 L 16.5,21.5 L 4,18 L 16.5,14.5 Z"
                fill="#FFFFFF"
                className="splash-sparkle-star"
              />
              <circle cx="20" cy="18" r="3.5" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        {/* Subtitle Slogan */}
        <div className="splash-tagline-text">
          Connectez votre talent au monde
        </div>
      </div>

      {/* 4. Footer Branding */}
      <div className="splash-brand-footer">
        Powered by <strong>JABE PRODUCTION</strong>
      </div>

      {/* CSS ANIMATION TIMELINE & KEYFRAMES (Snappy ~1.2s timing) */}
      <style>{`
        /* Ambient Glow Pulses */
        .splash-ambient-radial-1 {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(13, 114, 209, 0) 70%);
          top: 35%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(40px);
          pointer-events: none;
          animation: ambientFloat 2.5s ease-in-out infinite alternate;
        }

        .splash-ambient-radial-2 {
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(10, 60, 150, 0) 65%);
          top: 65%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(35px);
          pointer-events: none;
        }

        @keyframes ambientFloat {
          0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.7; }
          100% { transform: translate(-50%, -48%) scale(1.1); opacity: 1; }
        }

        /* Ripple Rings */
        .splash-ripple-ring {
          position: absolute;
          top: 42%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.75);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
          pointer-events: none;
          opacity: 0;
        }

        .ripple-1 {
          width: 160px;
          height: 160px;
          animation: rippleExpand 0.8s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: 0.6s;
        }

        .ripple-2 {
          width: 160px;
          height: 160px;
          animation: rippleExpand 0.8s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: 0.75s;
        }

        @keyframes rippleExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.7);
            opacity: 0.7;
            border-width: 2px;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.3);
            opacity: 0;
            border-width: 0.5px;
          }
        }

        /* Logo Stage */
        .splash-brand-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          position: relative;
          z-index: 10;
        }

        /* Logo Card */
        .splash-official-icon-container {
          position: relative;
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .splash-official-logo-card {
          width: 100%;
          height: 100%;
          border-radius: 36px;
          overflow: hidden;
          position: relative;
          box-shadow: 
            0 20px 45px rgba(0, 15, 60, 0.45),
            0 0 35px rgba(56, 189, 248, 0.3),
            inset 0 1px 2px rgba(255, 255, 255, 0.4);
          animation: cardEmerge 0.55s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
        }

        .splash-official-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @keyframes cardEmerge {
          0% {
            opacity: 0;
            transform: scale(0.85);
            filter: brightness(1.2) blur(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: brightness(1) blur(0px);
          }
        }

        /* Shimmer Sweep */
        .splash-shimmer-sweep {
          position: absolute;
          top: 0;
          left: -140%;
          width: 80%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.65) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          animation: shimmerSweepAnim 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 0.4s;
          pointer-events: none;
          z-index: 3;
        }

        @keyframes shimmerSweepAnim {
          0% { left: -140%; }
          100% { left: 240%; }
        }

        /* Sparkle Star */
        .splash-arrow-sparkle-anchor {
          position: absolute;
          top: 31%;
          left: 73%;
          width: 38px;
          height: 38px;
          z-index: 10;
          pointer-events: none;
          transform: translate(-50%, -50%);
          opacity: 0;
          animation: sparkleBurstAnim 0.65s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          animation-delay: 0.55s;
        }

        .splash-sparkle-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .splash-sparkle-star {
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.95));
        }

        @keyframes sparkleBurstAnim {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.35) rotate(45deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(90deg);
            opacity: 0.95;
          }
        }

        /* Slogan */
        .splash-tagline-text {
          margin-top: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', 'Inter', sans-serif;
          font-size: 0.98rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.92);
          letter-spacing: 0.3px;
          text-shadow: 0 2px 10px rgba(0, 15, 60, 0.5);
          opacity: 0;
          transform: translateY(12px);
          animation: taglineSlideUp 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-delay: 0.45s;
          text-align: center;
          padding: 0 16px;
        }

        @keyframes taglineSlideUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 0.95; transform: translateY(0); }
        }

        /* Footer */
        .splash-brand-footer {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif;
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          opacity: 0;
          animation: footerFadeIn 0.5s ease forwards;
          animation-delay: 0.5s;
          white-space: nowrap;
          pointer-events: none;
        }

        .splash-brand-footer strong {
          color: rgba(255, 255, 255, 0.95);
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        @keyframes footerFadeIn {
          0% { opacity: 0; }
          100% { opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
