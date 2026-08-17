import React, { useState, useEffect } from 'react';

export default function AppSplashScreen({ onFinish }) {
  const [stage, setStage] = useState('active'); // active -> exiting

  useEffect(() => {
    // Transition to main app at ~3.6s
    const exitTimer = setTimeout(() => {
      setStage('exiting');
    }, 3600);

    // Complete unmount callback at ~4.0s
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

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
        transform: isExiting ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
        pointerEvents: isExiting ? 'none' : 'auto',
        overflow: 'hidden',
        userSelect: 'none'
      }}
      onClick={() => {
        // Quick skip on tap
        if (stage === 'active') {
          setStage('exiting');
          setTimeout(() => { if (onFinish) onFinish(); }, 350);
        }
      }}
    >
      {/* 1. Ambient Background Glows */}
      <div className="splash-ambient-radial-1" />
      <div className="splash-ambient-radial-2" />

      {/* 2. Concentric Ripple Rings (Stage 3: 1.8s - 2.8s) */}
      <div className="splash-ripple-ring ripple-1" />
      <div className="splash-ripple-ring ripple-2" />

      {/* 3. Main StageLink Logo Animated Stage */}
      <div className="splash-brand-stage">
        
        {/* Official StageLink App Icon Card */}
        <div className="splash-official-icon-container">
          
          {/* Base Official Logo Image with Perfect Elevation and Geometry */}
          <div className="splash-official-logo-card">
            <img
              src="/stagelink-logo.png"
              alt="StageLink Official Logo"
              className="splash-official-logo-img"
            />
            {/* Shimmer Light Glint Sweep */}
            <div className="splash-shimmer-sweep" />
          </div>

          {/* Dynamic Arrow Sparkle Star on Top-Right Arrow Tip (top: 31%, left: 73%) */}
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

      {/* --- 4. FOOTER BRANDING --- */}
      <div className="splash-brand-footer">
        Powered by <strong>JABE PRODUCTION</strong>
      </div>

      {/* --- CSS ANIMATION TIMELINE & KEYFRAMES --- */}
      <style>{`
        /* ============================================================
           GLOBAL SPLASH KEYFRAMES & EASING
           Duration: 3.6s - 4.0s
           Easing: cubic-bezier(0.4, 0.0, 0.2, 1)
           ============================================================ */

        /* Ambient Glow Pulses */
        .splash-ambient-radial-1 {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(13, 114, 209, 0) 70%);
          top: 35%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(50px);
          pointer-events: none;
          animation: ambientFloat 4s ease-in-out infinite alternate;
        }

        .splash-ambient-radial-2 {
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(10, 60, 150, 0) 65%);
          top: 65%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(45px);
          pointer-events: none;
        }

        @keyframes ambientFloat {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
          100% { transform: translate(-50%, -46%) scale(1.15); opacity: 1; }
        }

        /* ------------------------------------------------------------
           Concentric Ripple Rings (1.8s – 3.0s)
           ------------------------------------------------------------ */
        .splash-ripple-ring {
          position: absolute;
          top: 42%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.75);
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.6);
          pointer-events: none;
          opacity: 0;
        }

        .ripple-1 {
          width: 175px;
          height: 175px;
          animation: rippleExpand 1.2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: 1.8s;
        }

        .ripple-2 {
          width: 175px;
          height: 175px;
          animation: rippleExpand 1.2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: 2.1s;
        }

        @keyframes rippleExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.7;
            border-width: 2px;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.6);
            opacity: 0;
            border-width: 0.5px;
          }
        }

        /* ------------------------------------------------------------
           LOGO STAGE & BREATHING PULSE
           ------------------------------------------------------------ */
        .splash-brand-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          position: relative;
          z-index: 10;
          animation: logoPulse 1.4s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-delay: 1.8s;
        }

        @keyframes logoPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }

        /* ------------------------------------------------------------
           OFFICIAL LOGO SQUIRCLE CARD
           ------------------------------------------------------------ */
        .splash-official-icon-container {
          position: relative;
          width: 175px;
          height: 175px;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .splash-official-logo-card {
          width: 100%;
          height: 100%;
          border-radius: 40px;
          overflow: hidden;
          position: relative;
          box-shadow: 
            0 24px 55px rgba(0, 15, 60, 0.5),
            0 0 45px rgba(56, 189, 248, 0.35),
            inset 0 1px 2px rgba(255, 255, 255, 0.4);
          animation: cardEmerge 1.2s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
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
            transform: scale(0.8);
            filter: brightness(1.3) blur(10px);
          }
          60% {
            opacity: 0.95;
            filter: brightness(1.1) blur(2px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: brightness(1) blur(0px);
          }
        }

        /* ------------------------------------------------------------
           SHIMMER GLINT SWEEP (1.1s – 2.3s)
           ------------------------------------------------------------ */
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
          animation: shimmerSweepAnim 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 1.1s;
          pointer-events: none;
          z-index: 3;
        }

        @keyframes shimmerSweepAnim {
          0% { left: -140%; }
          100% { left: 240%; }
        }

        /* ------------------------------------------------------------
           DYNAMIC ARROW SPARKLE (1.8s – 3.2s)
           Positioned exactly on the arrow tip (top: 31%, left: 73%)
           ------------------------------------------------------------ */
        .splash-arrow-sparkle-anchor {
          position: absolute;
          top: 31%;
          left: 73%;
          width: 42px;
          height: 42px;
          z-index: 10;
          pointer-events: none;
          transform: translate(-50%, -50%);
          opacity: 0;
          animation: sparkleBurstAnim 1.0s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          animation-delay: 1.8s;
        }

        .splash-sparkle-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .splash-sparkle-star {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 1)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.95));
          animation: idleShimmerAnim 2.0s ease-in-out infinite alternate;
          animation-delay: 2.7s;
        }

        @keyframes sparkleBurstAnim {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 0;
          }
          45% {
            transform: translate(-50%, -50%) scale(1.45) rotate(45deg);
            opacity: 1;
          }
          80% {
            transform: translate(-50%, -50%) scale(0.95) rotate(90deg);
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(90deg);
            opacity: 0.95;
          }
        }

        @keyframes idleShimmerAnim {
          0% { opacity: 0.55; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1.25); filter: drop-shadow(0 0 16px rgba(255, 255, 255, 1)); }
        }

        /* ------------------------------------------------------------
           SLOGAN & TAGLINE (1.5s – 2.4s)
           ------------------------------------------------------------ */
        .splash-tagline-text {
          margin-top: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Outfit', 'Inter', sans-serif;
          font-size: 1.02rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.92);
          letter-spacing: 0.3px;
          text-shadow: 0 2px 10px rgba(0, 15, 60, 0.5);
          opacity: 0;
          transform: translateY(16px);
          animation: taglineSlideUp 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-delay: 1.5s;
          text-align: center;
          padding: 0 16px;
        }

        @keyframes taglineSlideUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 0.95; transform: translateY(0); }
        }

        /* ------------------------------------------------------------
           FOOTER BRANDING (2.0s – 2.8s)
           ------------------------------------------------------------ */
        .splash-brand-footer {
          position: absolute;
          bottom: 34px;
          left: 50%;
          transform: translateX(-50%);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          opacity: 0;
          animation: footerFadeIn 0.8s ease forwards;
          animation-delay: 2.0s;
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
