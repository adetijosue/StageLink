import React, { useState, useEffect } from 'react';

/**
 * AppSplashScreen - Official StageLink Splash Screen Animation
 * 
 * Timeline & Specifications:
 * - 0.0s – 1.2s : SVG Path Tracing (stroke-dashoffset 100% -> 0%, glow trail, light dot flare)
 * - 1.2s – 1.8s : Solid White Fill Emergence & Lower "S" Light Sweep / Glint
 * - 1.6s – 2.4s : Typography Slide-Up & Kinetic Letter-Spacing ("StageLink")
 * - 2.2s – 3.2s : Arrow Tip Accent Spark, Radial Ripple Waves & Logo Breath Pulse
 * - 3.2s – 3.8s : Stabilized Hero State with 4-point Star Idle Shimmer
 * - 3.8s – 4.2s : Smooth Fade-out Exit into Main Application
 */
export default function AppSplashScreen({ onFinish }) {
  const [stage, setStage] = useState('active'); // 'active' -> 'exiting'

  useEffect(() => {
    // Start exit transition after full animation sequence (3.8s)
    const exitTimer = setTimeout(() => {
      setStage('exiting');
    }, 3800);

    // Complete unmount after exit transition (4.2s)
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 4200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const isExiting = stage === 'exiting';

  return (
    <div
      className={`stagelink-splash-root ${isExiting ? 'splash-exiting' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'linear-gradient(180deg, #0D72D1 0%, #0A3C96 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      {/* 1. Ambient Background Particles & Subtle Cyan Glow */}
      <div className="splash-ambient-center" />
      <div className="splash-cyan-aurora" />

      {/* 2. Concentric Radial Ripple Waves (Impact Waves at 2.2s) */}
      <div className="splash-ripple-wave ripple-1" />
      <div className="splash-ripple-wave ripple-2" />

      {/* 3. Main Central Hero Logo Container */}
      <div className="splash-hero-wrapper">
        <div className="splash-logo-core">
          
          <svg
            viewBox="0 0 240 240"
            className="splash-svg-canvas"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Glowing Blur Filter for stroke tracing */}
              <filter id="trace-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Cyan Accent Flare Gradient */}
              <linearGradient id="flare-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0EA5E9" />
              </linearGradient>

              {/* Light Sweep Linear Gradient */}
              <linearGradient id="shine-sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>

              {/* Clip Path for the Bottom Curve Shine Sweep */}
              <clipPath id="bottom-s-clip">
                <path d="M 45 160 C 45 195, 80 215, 120 215 C 165 215, 195 190, 195 155 C 195 125, 160 110, 120 100 C 80 90, 45 75, 45 45 Z" />
              </clipPath>
            </defs>

            {/* A. Outer "S" Vector Path & Ascending Growth Arrow */}
            {/* 1. Traced Stroke Layer (0s - 1.2s) */}
            <path
              d="M 168 62 L 194 36 M 172 36 L 194 36 L 194 58 M 165 70 C 145 46, 110 32, 75 42 C 48 50, 36 74, 42 98 C 48 122, 76 132, 116 142 C 160 152, 196 168, 190 200 C 182 226, 146 238, 108 232 C 72 226, 44 204, 38 178"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anim-path-stroke"
              filter="url(#trace-glow)"
            />

            {/* B. Inner Silhouettes (Graduate at left, Professional with arrow at right, handshake node) */}
            {/* Student Graduate Cap & Silhouette (Left) */}
            <g className="anim-inner-elements">
              {/* Graduation Mortarboard */}
              <polygon
                points="72,66 90,57 108,66 90,75"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="anim-path-stroke-fast"
              />
              <path
                d="M 108 66 L 112 78"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                className="anim-path-stroke-fast"
              />
              {/* Student Profile Head */}
              <circle
                cx="90"
                cy="85"
                r="6.5"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="anim-path-stroke-fast"
              />
              {/* Student Torso / Connection */}
              <path
                d="M 75 106 C 75 96, 105 96, 105 106 L 105 116"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="anim-path-stroke-fast"
              />

              {/* Professional Mentor / Growth Profile (Right) */}
              <circle
                cx="148"
                cy="98"
                r="6.5"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="anim-path-stroke-fast"
              />
              <path
                d="M 133 120 C 133 110, 163 110, 163 120 L 163 130"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="anim-path-stroke-fast"
              />

              {/* Central Handshake / Link Node */}
              <path
                d="M 98 126 C 110 118, 126 118, 138 126"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                className="anim-path-stroke-fast"
              />
            </g>

            {/* C. Solid Fill Shapes (Emerge smoothly at 1.2s – 1.8s) */}
            <g className="anim-solid-fill">
              {/* Main Outer S Contour Filled Body */}
              <path
                d="M 166 60 L 194 36 M 172 36 L 194 36 L 194 58 M 165 70 C 145 46, 110 32, 75 42 C 48 50, 36 74, 42 98 C 48 122, 76 132, 116 142 C 160 152, 196 168, 190 200 C 182 226, 146 238, 108 232 C 72 226, 44 204, 38 178"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Student Cap Filled */}
              <polygon points="72,66 90,57 108,66 90,75" fill="#FFFFFF" />
              <path d="M 108 66 L 112 78" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="90" cy="85" r="6.5" fill="#FFFFFF" />
              <path d="M 75 106 C 75 96, 105 96, 105 106 Z" fill="#FFFFFF" />

              {/* Professional Filled */}
              <circle cx="148" cy="98" r="6.5" fill="#FFFFFF" />
              <path d="M 133 120 C 133 110, 163 110, 163 120 Z" fill="#FFFFFF" />

              {/* Central Connection Bar */}
              <path d="M 98 124 C 110 117, 126 117, 138 124" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* D. Micro-interaction: Light Glint Sweep (1.2s - 1.8s) */}
            <g clipPath="url(#bottom-s-clip)">
              <rect
                x="-80"
                y="120"
                width="90"
                height="100"
                fill="url(#shine-sweep-grad)"
                className="anim-light-sweep"
              />
            </g>

            {/* E. Arrow Tip Accent Spark & Arc Swoop (Fires at 2.2s) */}
            <g className="anim-arrow-spark-group">
              {/* Arc Swoop */}
              <path
                d="M 194 36 C 210 24, 222 42, 206 58"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="anim-arc-swoop"
              />
              {/* 4-Ray Spark Burst */}
              <line x1="194" y1="24" x2="194" y2="12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="206" y1="36" x2="218" y2="36" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="203" y1="27" x2="212" y2="18" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="194" cy="36" r="3.5" fill="#FFFFFF" filter="url(#trace-glow)" />
            </g>

            {/* F. Four-Pointed Sparkle Star (Bottom Right - Idle Shimmer at 3.2s+) */}
            <g className="anim-star-shimmer">
              <path
                d="M 202 188 Q 202 198 212 198 Q 202 198 202 208 Q 202 198 192 198 Q 202 198 202 188 Z"
                fill="#FFFFFF"
                filter="url(#trace-glow)"
              />
              <circle cx="202" cy="198" r="1.5" fill="#38BDF8" />
            </g>
          </svg>

          {/* Trace Flare Light Dot (Follows outline during 0.0s – 1.2s) */}
          <div className="splash-trace-flare" />
        </div>

        {/* 4. Typography Entrance: "StageLink" (1.6s – 2.4s) */}
        <div className="splash-typography-block">
          <h1 className="splash-brand-title">StageLink</h1>
          <p className="splash-brand-tagline">Connectez votre talent au monde</p>
        </div>

      </div>

      {/* 5. Subdued Corporate Signature */}
      <div className="splash-signature-footer">
        Powered by <span style={{ color: '#FFFFFF', fontWeight: 800 }}>JABE PRODUCTION</span>
      </div>

      <style>{`
        /* =========================================================================
           1. CORE VARIABLES & EASING
           ========================================================================= */
        :root {
          --splash-ease: cubic-bezier(0.4, 0.0, 0.2, 1);
          --splash-bounce: cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* =========================================================================
           2. AMBIENT BACKGROUND GLOWS
           ========================================================================= */
        .splash-ambient-center {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(13, 114, 209, 0) 70%);
          filter: blur(60px);
          animation: ambientBreathe 4s ease-in-out infinite alternate;
        }

        .splash-cyan-aurora {
          position: absolute;
          top: 15%;
          right: 20%;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(10, 60, 150, 0) 65%);
          filter: blur(50px);
          animation: auroraFloat 5s ease-in-out infinite alternate-reverse;
        }

        @keyframes ambientBreathe {
          0% { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 1; }
        }

        @keyframes auroraFloat {
          0% { transform: translate(0, 0) scale(0.9); }
          100% { transform: translate(-30px, 25px) scale(1.2); }
        }

        /* =========================================================================
           3. CONCENTRIC IMPACT RIPPLE WAVES (Triggered at 2.2s)
           ========================================================================= */
        .splash-ripple-wave {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.6);
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
          opacity: 0;
          pointer-events: none;
        }

        .ripple-1 {
          width: 240px;
          height: 240px;
          animation: rippleTrigger 1.0s var(--splash-bounce) 2.2s forwards;
        }

        .ripple-2 {
          width: 240px;
          height: 240px;
          animation: rippleTrigger 1.0s var(--splash-bounce) 2.38s forwards;
        }

        @keyframes rippleTrigger {
          0% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.45;
            border-width: 2px;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.2);
            opacity: 0;
            border-width: 0.5px;
          }
        }

        /* =========================================================================
           4. HERO WRAPPER & LOGO CORE
           ========================================================================= */
        .splash-hero-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          position: relative;
          z-index: 10;
        }

        .splash-logo-core {
          position: relative;
          width: 170px;
          height: 170px;
          animation: logoBreathePulse 1.0s var(--splash-ease) 2.2s forwards;
        }

        @keyframes logoBreathePulse {
          0% { transform: scale(1.0); }
          45% { transform: scale(1.045); filter: drop-shadow(0 0 20px rgba(255,255,255,0.7)); }
          100% { transform: scale(1.0); filter: drop-shadow(0 0 12px rgba(255,255,255,0.3)); }
        }

        .splash-svg-canvas {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /* =========================================================================
           5. STAGE 1: STROKE PATH TRACING (0.0s – 1.2s)
           ========================================================================= */
        .anim-path-stroke {
          stroke-dasharray: 800;
          stroke-dashoffset: 800;
          animation: traceOuter 1.2s var(--splash-ease) forwards;
        }

        .anim-path-stroke-fast {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: traceInner 1.1s var(--splash-ease) 0.1s forwards;
        }

        @keyframes traceOuter {
          0% {
            stroke-dashoffset: 800;
            opacity: 1;
          }
          90% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes traceInner {
          0% {
            stroke-dashoffset: 400;
            opacity: 1;
          }
          90% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        /* Flare Light Dot following trace */
        .splash-trace-flare {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 14px 4px #38BDF8, 0 0 24px 8px #FFFFFF;
          top: 25px;
          right: 25px;
          opacity: 0;
          animation: flareGlow 1.2s var(--splash-ease) forwards;
          pointer-events: none;
        }

        @keyframes flareGlow {
          0% { opacity: 0; transform: scale(0.2); }
          20% { opacity: 1; transform: scale(1.4); }
          75% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(0.4); }
        }

        /* =========================================================================
           6. STAGE 2: SOLID FILL EMERGENCE & LIGHT SWEEP (1.2s – 1.8s)
           ========================================================================= */
        .anim-solid-fill {
          opacity: 0;
          animation: solidFillFadeIn 0.6s var(--splash-ease) 1.15s forwards;
        }

        @keyframes solidFillFadeIn {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1.0); }
        }

        .anim-light-sweep {
          animation: sweepAction 0.65s ease-out 1.25s forwards;
          opacity: 0;
        }

        @keyframes sweepAction {
          0% { transform: translateX(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 0.9; }
          100% { transform: translateX(260px); opacity: 0; }
        }

        /* =========================================================================
           7. STAGE 3: TYPOGRAPHY ENTRANCE (1.6s – 2.4s)
           ========================================================================= */
        .splash-typography-block {
          margin-top: 22px;
          text-align: center;
          opacity: 0;
          transform: translateY(25px);
          animation: typographyEntrance 0.8s var(--splash-ease) 1.6s forwards;
        }

        @keyframes typographyEntrance {
          0% {
            opacity: 0;
            transform: translateY(25px);
            letter-spacing: 3.5px;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: -0.3px;
          }
        }

        .splash-brand-title {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Outfit', 'Inter', 'Segoe UI', Roboto, sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.1;
          text-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
        }

        .splash-brand-tagline {
          margin: 6px 0 0 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          letter-spacing: 0.2px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* =========================================================================
           8. STAGE 4: ARROW ACCENT SPARK & SWOOP (2.2s – 3.2s)
           ========================================================================= */
        .anim-arrow-spark-group {
          opacity: 0;
          transform-origin: 194px 36px;
          animation: sparkBurst 0.75s var(--splash-bounce) 2.2s forwards;
        }

        @keyframes sparkBurst {
          0% {
            transform: scale(0) rotate(-20deg);
            opacity: 0;
          }
          40% {
            transform: scale(1.3) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(0.9) rotate(5deg);
            opacity: 0.9;
          }
        }

        .anim-arc-swoop {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: swoopTrace 0.5s ease-out 2.2s forwards;
        }

        @keyframes swoopTrace {
          0% { stroke-dashoffset: 60; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }

        /* =========================================================================
           9. STAGE 5: STABILIZATION & IDLE STAR SHIMMER (3.2s+)
           ========================================================================= */
        .anim-star-shimmer {
          opacity: 0;
          transform-origin: 202px 198px;
          animation: starEmerge 0.5s ease-out 1.7s forwards, starIdleShimmer 2.0s ease-in-out 3.2s infinite alternate;
        }

        @keyframes starEmerge {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes starIdleShimmer {
          0% {
            opacity: 0.5;
            transform: scale(0.92) rotate(0deg);
            filter: drop-shadow(0 0 2px rgba(255,255,255,0.4));
          }
          100% {
            opacity: 1.0;
            transform: scale(1.15) rotate(90deg);
            filter: drop-shadow(0 0 8px rgba(56,189,248,0.9));
          }
        }

        /* =========================================================================
           10. FOOTER SIGNATURE & EXIT ANIMATION (3.8s – 4.2s)
           ========================================================================= */
        .splash-signature-footer {
          position: absolute;
          bottom: 28px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.78rem;
          letter-spacing: 0.6px;
          opacity: 0;
          animation: footerFadeIn 0.8s ease-out 2.0s forwards;
        }

        @keyframes footerFadeIn {
          to { opacity: 1; }
        }

        .stagelink-splash-root {
          opacity: 1;
          transition: opacity 0.45s var(--splash-ease), transform 0.45s var(--splash-ease);
        }

        .stagelink-splash-root.splash-exiting {
          opacity: 0;
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
