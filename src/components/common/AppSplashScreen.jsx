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
          setTimeout(() => { if (onFinish) onFinish(); }, 400);
        }
      }}
    >
      {/* 1. Ambient Background Glows */}
      <div className="splash-ambient-radial-1" />
      <div className="splash-ambient-radial-2" />

      {/* 2. Concentric Ripple Rings (Stage 4: 2.2s - 3.2s) */}
      <div className="splash-ripple-ring ripple-1" />
      <div className="splash-ripple-ring ripple-2" />

      {/* 3. Main StageLink Logo Animated Container */}
      <div className="splash-brand-stage">
        
        {/* Official StageLink App Icon Card */}
        <div className="splash-official-icon-container">
          
          {/* Base Official Logo Image */}
          <div className="splash-official-logo-card">
            <img
              src="/stagelink-logo.png"
              alt="StageLink Official Logo"
              className="splash-official-logo-img"
            />
            {/* Shimmer Light Glint Sweep */}
            <div className="splash-shimmer-sweep" />
          </div>

          {/* Glowing Vector Stroke Trace Overlay (Stage 1: 0.0s - 1.2s) */}
          <svg
            viewBox="0 0 200 200"
            className="splash-trace-overlay-svg"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="neonStrokeGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur1" />
                <feGaussianBlur stdDeviation="6" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="splash-vector-trace-group">
              {/* Outer S-Curve Top */}
              <path
                d="M 132,48 C 118,34 82,34 66,48 C 50,62 48,88 56,104 C 62,116 72,122 84,122"
                stroke="#FFFFFF"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-trace-path p1"
              />
              {/* Outer S-Curve Bottom */}
              <path
                d="M 68,122 C 68,142 90,154 114,152 C 134,150 144,136 144,116"
                stroke="#FFFFFF"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-trace-path p2"
              />
              {/* Student Cap */}
              <polygon
                points="72,66 84,60 96,66 84,72"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-trace-path p3"
              />
              {/* Student Head */}
              <circle
                cx="84"
                cy="76"
                r="7"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                pathLength="100"
                className="splash-trace-path p4"
              />
              {/* Professional Head */}
              <circle
                cx="120"
                cy="72"
                r="7"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                pathLength="100"
                className="splash-trace-path p5"
              />
              {/* Handshake & Shoulders */}
              <path
                d="M 72,110 C 72,94 78,86 88,86 C 94,86 98,92 104,98 L 110,92 C 114,86 118,86 124,86 C 130,86 134,92 136,98 L 148,78"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-trace-path p6"
              />
              {/* Ascending Arrow Tip */}
              <polygon
                points="140,76 158,64 152,86"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-trace-path p7"
              />
            </g>
          </svg>

          {/* Dynamic Arrow Sparkle Star on Top-Right Arrow Tip (Stage 4: 2.2s - 3.2s) */}
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

        {/* --- 4. TYPOGRAPHY 'StageLink' (Stage 3: 1.6s - 2.4s) --- */}
        <div className="splash-brand-typography">
          <span className="splash-text-stage">Stage</span>
          <span className="splash-text-link">Link</span>
        </div>

        {/* Subtitle Slogan */}
        <div className="splash-tagline-text">
          Connectez votre talent au monde
        </div>
      </div>

      {/* --- 5. FOOTER BRANDING --- */}
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
          background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(13, 114, 209, 0) 70%);
          top: 25%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(55px);
          pointer-events: none;
          animation: ambientFloat 4s ease-in-out infinite alternate;
        }

        .splash-ambient-radial-2 {
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, rgba(10, 60, 150, 0) 65%);
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
           STAGE 4: Concentric Ripple Rings (2.2s – 3.2s)
           ------------------------------------------------------------ */
        .splash-ripple-ring {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.75);
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.6);
          pointer-events: none;
          opacity: 0;
        }

        .ripple-1 {
          width: 170px;
          height: 170px;
          animation: rippleExpand 1.1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: 2.2s;
        }

        .ripple-2 {
          width: 170px;
          height: 170px;
          animation: rippleExpand 1.1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: 2.45s;
        }

        @keyframes rippleExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.6;
            border-width: 2px;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.4);
            opacity: 0;
            border-width: 0.5px;
          }
        }

        /* ------------------------------------------------------------
           LOGO STAGE & BREATHING PULSE (Stage 4 & 5)
           ------------------------------------------------------------ */
        .splash-brand-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          position: relative;
          z-index: 10;
          animation: logoPulse 1.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-delay: 2.2s;
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
          width: 165px;
          height: 165px;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .splash-official-logo-card {
          width: 100%;
          height: 100%;
          border-radius: 38px;
          overflow: hidden;
          position: relative;
          box-shadow: 
            0 24px 50px rgba(0, 15, 60, 0.45),
            0 0 50px rgba(56, 189, 248, 0.3),
            inset 0 1px 1px rgba(255, 255, 255, 0.35);
          animation: cardEmerge 1.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        .splash-official-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transform: scale(1.01);
        }

        @keyframes cardEmerge {
          0% {
            opacity: 0;
            transform: scale(0.85);
            filter: brightness(1.4) blur(10px);
          }
          50% {
            opacity: 0.7;
            filter: brightness(1.2) blur(3px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: brightness(1) blur(0px);
          }
        }

        /* ------------------------------------------------------------
           STAGE 1: Stroke Path Tracing Overlay (0.0s – 1.2s)
           ------------------------------------------------------------ */
        .splash-trace-overlay-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
          filter: url(#neonStrokeGlow);
          animation: traceFadeOut 0.5s ease-out forwards;
          animation-delay: 1.25s;
        }

        .splash-trace-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawStrokePath 1.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        .p1 { animation-delay: 0.0s; }
        .p2 { animation-delay: 0.15s; }
        .p3 { animation-delay: 0.25s; }
        .p4 { animation-delay: 0.3s; }
        .p5 { animation-delay: 0.4s; }
        .p6 { animation-delay: 0.5s; }
        .p7 { animation-delay: 0.65s; }

        @keyframes drawStrokePath {
          0% { stroke-dashoffset: 100; opacity: 0.2; }
          30% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }

        @keyframes traceFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ------------------------------------------------------------
           STAGE 2: Shimmer Glint Sweep (1.2s – 2.0s)
           ------------------------------------------------------------ */
        .splash-shimmer-sweep {
          position: absolute;
          top: 0;
          left: -120%;
          width: 70%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.55) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          animation: shimmerSweepAnim 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 1.25s;
          pointer-events: none;
          z-index: 3;
        }

        @keyframes shimmerSweepAnim {
          0% { left: -120%; }
          100% { left: 220%; }
        }

        /* ------------------------------------------------------------
           STAGE 4: Dynamic Arrow Sparkle (2.2s – 3.2s)
           ------------------------------------------------------------ */
        .splash-arrow-sparkle-anchor {
          position: absolute;
          top: 17%;
          right: 17%;
          width: 36px;
          height: 36px;
          z-index: 10;
          pointer-events: none;
          transform: translate(50%, -50%);
          opacity: 0;
          animation: sparkleBurstAnim 0.9s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          animation-delay: 2.15s;
        }

        .splash-sparkle-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .splash-sparkle-star {
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.9));
          animation: idleShimmerAnim 2.2s ease-in-out infinite alternate;
          animation-delay: 3.0s;
        }

        @keyframes sparkleBurstAnim {
          0% {
            transform: translate(50%, -50%) scale(0) rotate(0deg);
            opacity: 0;
          }
          45% {
            transform: translate(50%, -50%) scale(1.4) rotate(45deg);
            opacity: 1;
          }
          80% {
            transform: translate(50%, -50%) scale(0.95) rotate(90deg);
            opacity: 0.95;
          }
          100% {
            transform: translate(50%, -50%) scale(1) rotate(90deg);
            opacity: 0.95;
          }
        }

        @keyframes idleShimmerAnim {
          0% { opacity: 0.55; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 14px rgba(255, 255, 255, 1)); }
        }

        /* ------------------------------------------------------------
           STAGE 3: Typography & Slogan (1.6s – 2.4s)
           ------------------------------------------------------------ */
        .splash-brand-typography {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', 'Inter', sans-serif;
          font-size: 2.25rem;
          color: #FFFFFF;
          text-shadow: 0 4px 18px rgba(0, 20, 60, 0.4);
          opacity: 0;
          transform: translateY(22px);
          animation: textSlideUpAnim 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-delay: 1.6s;
        }

        .splash-text-stage {
          font-weight: 850;
          letter-spacing: -0.5px;
        }

        .splash-text-link {
          font-weight: 600;
          letter-spacing: -0.5px;
          margin-left: 1px;
        }

        @keyframes textSlideUpAnim {
          0% {
            opacity: 0;
            transform: translateY(22px);
            letter-spacing: 2px;
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
            letter-spacing: normal;
          }
        }

        .splash-tagline-text {
          margin-top: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          letter-spacing: 0.2px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.25);
          opacity: 0;
          transform: translateY(14px);
          animation: taglineFadeInAnim 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-delay: 1.85s;
        }

        @keyframes taglineFadeInAnim {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 0.9; transform: translateY(0); }
        }

        /* ------------------------------------------------------------
           Footer
           ------------------------------------------------------------ */
        .splash-brand-footer {
          position: absolute;
          bottom: 34px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.78rem;
          letter-spacing: 0.6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
          opacity: 0;
          animation: footerFadeAnim 0.8s ease-out forwards;
          animation-delay: 2.1s;
        }

        .splash-brand-footer strong {
          color: #FFFFFF;
          font-weight: 700;
        }

        @keyframes footerFadeAnim {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
