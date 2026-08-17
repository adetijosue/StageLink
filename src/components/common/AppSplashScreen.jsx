import React, { useState, useEffect } from 'react';

export default function AppSplashScreen({ onFinish }) {
  const [stage, setStage] = useState('active'); // active -> exiting

  useEffect(() => {
    // Phase 5 Transition to main app at ~3.6s
    const exitTimer = setTimeout(() => {
      setStage('exiting');
    }, 3600);

    // Full unmount callback at ~4.0s
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
        // Optional quick skip on tap if user wants instant entry
        if (stage === 'active') {
          setStage('exiting');
          setTimeout(() => { if (onFinish) onFinish(); }, 400);
        }
      }}
    >
      {/* 1. Ambient Dynamic Glows */}
      <div className="splash-ambient-radial-1" />
      <div className="splash-ambient-radial-2" />

      {/* 2. Concentric Ripple Rings (Stage 4: 2.2s - 3.2s) */}
      <div className="splash-ripple-ring ripple-1" />
      <div className="splash-ripple-ring ripple-2" />

      {/* 3. Main StageLink Logo Animated Container */}
      <div className="splash-brand-stage">
        
        {/* SVG Animated Emblem */}
        <div className="splash-logo-wrapper">
          <svg
            viewBox="0 0 340 300"
            className="splash-svg-logo"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Neon cyan glowing stroke filter */}
              <filter id="splashGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur1" />
                <feGaussianBlur stdDeviation="8" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Linear gradient shine mask */}
              <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* Clip path for the bottom sweep */}
              <clipPath id="logoClip">
                {/* Outer S Ribbon */}
                <path d="M 238,62 C 205,32 128,32 94,66 C 62,98 58,154 75,190 C 86,214 108,228 132,228 L 132,204 C 116,204 100,192 92,176 C 80,148 84,106 108,82 C 132,58 190,56 216,78 C 228,88 238,98 238,98 Z" />
                <path d="M 94,228 C 94,268 144,292 196,290 C 238,288 258,252 258,206 L 234,206 C 234,240 218,266 188,266 C 148,266 118,246 118,228 Z" />
                {/* Student */}
                <circle cx="128" cy="120" r="14" />
                <polygon points="104,104 128,92 152,104 128,114" />
                {/* Professional */}
                <circle cx="198" cy="112" r="14" />
                {/* Handshake & Torso */}
                <path d="M 104,196 C 104,160 120,144 140,144 C 150,144 158,154 164,166 L 174,178 L 184,166 C 190,154 198,144 208,144 C 218,144 224,152 228,162 L 254,124 L 274,104 L 268,136 L 256,150 L 236,182 C 232,192 222,196 212,196 L 188,196 L 174,182 L 160,196 Z" />
              </clipPath>
            </defs>

            {/* --- 1. STROKE OUTLINE TRACING (Stage 1: 0.0s - 1.2s) --- */}
            <g className="splash-stroke-layer">
              {/* Outer Top S-Arch */}
              <path
                d="M 238,72 C 210,40 134,38 98,72 C 68,102 64,152 78,186 C 88,210 108,224 130,224"
                stroke="#FFFFFF"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-draw-path path-s-top"
              />

              {/* Outer Bottom S-Arch */}
              <path
                d="M 102,224 C 102,264 148,284 194,282 C 234,280 252,248 252,204"
                stroke="#FFFFFF"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-draw-path path-s-bottom"
              />

              {/* Student Mortarboard Cap Diamond */}
              <path
                d="M 104,100 L 128,88 L 152,100 L 128,110 Z"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-draw-path path-cap"
              />
              {/* Cap Tassel */}
              <path
                d="M 110,103 C 104,110 102,118 104,124"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeLinecap="round"
                pathLength="100"
                className="splash-draw-path path-tassel"
              />

              {/* Student Head */}
              <circle
                cx="128"
                cy="118"
                r="13"
                stroke="#FFFFFF"
                strokeWidth="4"
                pathLength="100"
                className="splash-draw-path path-head-1"
              />

              {/* Student Torso & Left Arm */}
              <path
                d="M 106,192 C 106,162 118,146 136,146 C 146,146 154,154 162,166 L 172,178"
                stroke="#FFFFFF"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-draw-path path-body-student"
              />

              {/* Professional Head */}
              <circle
                cx="198"
                cy="110"
                r="13"
                stroke="#FFFFFF"
                strokeWidth="4"
                pathLength="100"
                className="splash-draw-path path-head-2"
              />

              {/* Handshake Clasp (Connection) */}
              <path
                d="M 160,170 L 172,182 L 184,170"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-draw-path path-handshake"
              />

              {/* Professional Torso & Ascending Arrow Arm */}
              <path
                d="M 182,172 C 190,158 198,146 208,146 C 218,146 226,156 230,166 L 258,124"
                stroke="#FFFFFF"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-draw-path path-body-pro"
              />

              {/* Arrow Head */}
              <path
                d="M 242,122 L 278,98 L 268,140 Z"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinejoin="round"
                pathLength="100"
                className="splash-draw-path path-arrowhead"
              />
            </g>

            {/* --- 2. SOLID FILL SHAPES (Stage 2: 1.2s - 1.8s) --- */}
            <g className="splash-fill-layer">
              {/* Outer Top S-Arch Ribbon */}
              <path
                d="M 238,72 C 210,40 134,38 98,72 C 68,102 64,152 78,186 C 88,210 108,224 130,224"
                stroke="#FFFFFF"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Outer Bottom S-Arch Ribbon */}
              <path
                d="M 102,224 C 102,264 148,284 194,282 C 234,280 252,248 252,204"
                stroke="#FFFFFF"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Student Mortarboard Cap */}
              <polygon
                points="104,100 128,88 152,100 128,110"
                fill="#FFFFFF"
              />
              {/* Cap Tassel */}
              <path
                d="M 110,103 C 104,110 102,118 104,124"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="104" cy="125" r="2.5" fill="#FFFFFF" />

              {/* Student Head */}
              <circle cx="128" cy="118" r="13" fill="#FFFFFF" />

              {/* Professional Head */}
              <circle cx="198" cy="110" r="13" fill="#FFFFFF" />

              {/* Combined Student Body, Handshake & Professional Suit Body */}
              <path
                d="M 106,192 C 106,162 118,146 136,146 C 146,146 154,154 162,166 L 172,178 L 182,166 C 190,154 198,146 208,146 C 218,146 226,156 230,166 L 258,124"
                stroke="#FFFFFF"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Solid Student Torso Base */}
              <path
                d="M 104,196 C 104,166 116,152 134,152 C 146,152 154,162 162,176 L 172,188 L 160,196 Z"
                fill="#FFFFFF"
              />

              {/* Solid Pro Torso Base */}
              <path
                d="M 184,176 C 192,162 200,152 212,152 C 224,152 232,166 234,196 L 184,196 Z"
                fill="#FFFFFF"
              />

              {/* Solid Arrow Head */}
              <polygon
                points="242,122 280,96 268,140"
                fill="#FFFFFF"
              />

              {/* Light Sweep Glint along Bottom Curve */}
              <g clipPath="url(#logoClip)">
                <rect
                  className="splash-light-glint"
                  x="-150"
                  y="0"
                  width="120"
                  height="300"
                  fill="url(#shineGradient)"
                  transform="skewX(-25)"
                />
              </g>
            </g>

            {/* --- 3. DYNAMIC ARROW SPARK (Stage 4: 2.2s - 3.2s) --- */}
            <g className="splash-arrow-spark-group" transform="translate(280, 96)">
              {/* Bursting Star Rays */}
              <path
                d="M 0,-18 L 4,-5 L 18,0 L 4,5 L 0,18 L -4,5 L -18,0 L -4,-5 Z"
                fill="#FFFFFF"
                className="splash-spark-star"
              />
              <circle cx="0" cy="0" r="4" fill="#FFFFFF" className="splash-spark-center" />
            </g>
          </svg>
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

      {/* --- PURE CSS ANIMATION TIMELINE & KEYFRAMES --- */}
      <style>{`
        /* ============================================================
           GLOBAL SPLASH KEYFRAMES & EASING
           Duration: 3.6s - 4.0s
           Easing: cubic-bezier(0.4, 0.0, 0.2, 1)
           ============================================================ */

        /* Ambient Glow Pulses */
        .splash-ambient-radial-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(13, 114, 209, 0) 70%);
          top: 20%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(50px);
          pointer-events: none;
          animation: ambientFloat 4s ease-in-out infinite alternate;
        }

        .splash-ambient-radial-2 {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(10, 60, 150, 0) 65%);
          top: 65%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(40px);
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
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
          pointer-events: none;
          opacity: 0;
        }

        .ripple-1 {
          width: 140px;
          height: 140px;
          animation: rippleExpand 1.1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: 2.2s;
        }

        .ripple-2 {
          width: 140px;
          height: 140px;
          animation: rippleExpand 1.1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
          animation-delay: 2.45s;
        }

        @keyframes rippleExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.55;
            border-width: 2px;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.3);
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
          50% { transform: scale(1.035); }
          100% { transform: scale(1); }
        }

        .splash-logo-wrapper {
          width: 220px;
          height: 195px;
          display: flex;
          align-items: center;
          justifyContent: center;
          position: relative;
        }

        .splash-svg-logo {
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 12px 30px rgba(0, 20, 70, 0.35));
        }

        /* ------------------------------------------------------------
           STAGE 1: Stroke Path Tracing (0.0s – 1.2s)
           ------------------------------------------------------------ */
        .splash-stroke-layer {
          filter: url(#splashGlow);
          animation: strokeFadeOut 0.4s ease-out forwards;
          animation-delay: 1.4s;
        }

        .splash-draw-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawPath 1.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        .path-s-top { animation-delay: 0.0s; }
        .path-s-bottom { animation-delay: 0.15s; }
        .path-cap { animation-delay: 0.25s; }
        .path-tassel { animation-delay: 0.35s; }
        .path-head-1 { animation-delay: 0.3s; }
        .path-body-student { animation-delay: 0.4s; }
        .path-handshake { animation-delay: 0.5s; }
        .path-head-2 { animation-delay: 0.45s; }
        .path-body-pro { animation-delay: 0.55s; }
        .path-arrowhead { animation-delay: 0.7s; }

        @keyframes drawPath {
          0% {
            stroke-dashoffset: 100;
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes strokeFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ------------------------------------------------------------
           STAGE 2: Solid Fill Emergence & Light Sweep (1.2s – 1.8s)
           ------------------------------------------------------------ */
        .splash-fill-layer {
          opacity: 0;
          animation: fillEmerge 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-delay: 1.2s;
        }

        @keyframes fillEmerge {
          0% {
            opacity: 0;
            filter: brightness(1.6) drop-shadow(0 0 16px rgba(255, 255, 255, 0.9));
          }
          100% {
            opacity: 1;
            filter: brightness(1) drop-shadow(0 4px 16px rgba(0, 0, 0, 0.15));
          }
        }

        /* Glint Light Sweep (1.3s - 2.1s) */
        .splash-light-glint {
          animation: glintSweep 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 1.3s;
        }

        @keyframes glintSweep {
          0% { transform: translateX(-120px) skewX(-25deg); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translateX(380px) skewX(-25deg); opacity: 0; }
        }

        /* ------------------------------------------------------------
           STAGE 3: Typography 'StageLink' (1.6s – 2.4s)
           ------------------------------------------------------------ */
        .splash-brand-typography {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', 'Inter', sans-serif;
          font-size: 2.35rem;
          color: #FFFFFF;
          text-shadow: 0 4px 18px rgba(0, 20, 60, 0.35);
          opacity: 0;
          transform: translateY(25px);
          animation: textSlideUp 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
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

        @keyframes textSlideUp {
          0% {
            opacity: 0;
            transform: translateY(25px);
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
          font-size: 0.92rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          letter-spacing: 0.2px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.25);
          opacity: 0;
          transform: translateY(15px);
          animation: taglineFadeIn 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          animation-delay: 1.85s;
        }

        @keyframes taglineFadeIn {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 0.9; transform: translateY(0); }
        }

        /* ------------------------------------------------------------
           STAGE 4: Dynamic Arrow Spark & Star (2.2s – 3.2s)
           ------------------------------------------------------------ */
        .splash-arrow-spark-group {
          opacity: 0;
          transform-origin: center;
          animation: sparkBurst 0.9s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          animation-delay: 2.15s;
        }

        .splash-spark-star {
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 14px rgba(56, 189, 248, 0.8));
          animation: idleShimmer 2.2s ease-in-out infinite alternate;
          animation-delay: 3.0s;
        }

        @keyframes sparkBurst {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          40% {
            transform: scale(1.35) rotate(45deg);
            opacity: 1;
          }
          75% {
            transform: scale(0.9) rotate(90deg);
            opacity: 0.9;
          }
          100% {
            transform: scale(1) rotate(90deg);
            opacity: 0.95;
          }
        }

        /* ------------------------------------------------------------
           STAGE 5: Idle Shimmer (3.2s+)
           ------------------------------------------------------------ */
        @keyframes idleShimmer {
          0% { opacity: 0.55; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1.15); filter: drop-shadow(0 0 12px rgba(255, 255, 255, 1)); }
        }

        /* ------------------------------------------------------------
           Footer
           ------------------------------------------------------------ */
        .splash-brand-footer {
          position: absolute;
          bottom: 34px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.78rem;
          letter-spacing: 0.6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
          opacity: 0;
          animation: footerFade 0.8s ease-out forwards;
          animation-delay: 2.1s;
        }

        .splash-brand-footer strong {
          color: #FFFFFF;
          font-weight: 700;
        }

        @keyframes footerFade {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
