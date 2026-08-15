import React, { useState, useEffect } from 'react';

export default function AppSplashScreen({ onFinish }) {
  const [stage, setStage] = useState('entering'); // entering -> exiting

  useEffect(() => {
    // Trigger the exit sequence (zoom through) after 1.8 seconds
    const exitTimer = setTimeout(() => {
      setStage('exiting');
    }, 1800);

    // Completely unmount and remove splash screen after 2.4 seconds
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2400);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  const isExiting = stage === 'exiting';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: '#040814', // Ultra deep slate blue, nearly black
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isExiting ? 0 : 1,
      transition: 'opacity 0.6s cubic-bezier(0.8, 0, 0.2, 1)',
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      {/* 1. Ambient Background Glows */}
      <div className="splash-ambient-glow" />
      <div className="splash-ambient-glow-secondary" />

      {/* 2. Concentric Pulsing Network Rings */}
      <div className="splash-network-ring ring-1" />
      <div className="splash-network-ring ring-2" />

      {/* 3. Main Logo Container (Performs the massive zoom-through on exit) */}
      <div className={`splash-logo-container ${isExiting ? 'splash-exit' : 'splash-enter'}`}>
        
        {/* The App Icon Mask (Apple standard squircle proportion) */}
        <div className="splash-logo-mask">
          <img
            src="/stagelink-logo.png"
            alt="StageLink App"
            className="splash-logo-image"
          />
          {/* Shimmering glass reflection sweep */}
          <div className="splash-shimmer-sweep" />
        </div>
        
      </div>

      {/* 4. Subtitle / Catchphrase */}
      <div className={`splash-tagline ${isExiting ? 'splash-footer-exit' : 'splash-tagline-enter'}`}>
        Connectez votre talent au monde
      </div>

      {/* 5. Footer branding */}
      <div className={`splash-footer ${isExiting ? 'splash-footer-exit' : 'splash-footer-enter'}`}>
        Powered by <strong style={{ color: '#FFFFFF', fontWeight: 700, letterSpacing: '0.5px' }}>JABE PRODUCTION</strong>
      </div>

      <style>{`
        /* --- Background Ambience --- */
        .splash-ambient-glow {
          position: absolute;
          width: 60vw;
          height: 60vw;
          max-width: 600px;
          max-height: 600px;
          background: radial-gradient(circle, rgba(0, 102, 255, 0.18) 0%, rgba(0, 0, 0, 0) 65%);
          filter: blur(50px);
          animation: pulseGlow 4s ease-in-out infinite alternate;
        }

        .splash-ambient-glow-secondary {
          position: absolute;
          top: 30%;
          left: 60%;
          width: 40vw;
          height: 40vw;
          max-width: 400px;
          max-height: 400px;
          background: radial-gradient(circle, rgba(0, 200, 255, 0.12) 0%, rgba(0, 0, 0, 0) 60%);
          filter: blur(40px);
          animation: pulseGlow 3s ease-in-out infinite alternate-reverse;
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.8) translate(-10%, -10%); opacity: 0.5; }
          100% { transform: scale(1.1) translate(10%, 10%); opacity: 1; }
        }

        /* --- Network Rings (expanding outward) --- */
        .splash-network-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid rgba(0, 102, 255, 0.4);
          opacity: 0;
        }

        .ring-1 {
          width: 160px; height: 160px;
          animation: ripple 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: 0.2s;
        }

        .ring-2 {
          width: 160px; height: 160px;
          animation: ripple 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: 0.6s;
        }

        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; border-width: 2px; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 0px; }
        }

        /* --- Logo Animations --- */
        .splash-logo-container {
          position: relative;
          z-index: 10;
          perspective: 1000px;
        }

        .splash-enter {
          animation: logoEnter 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .splash-exit {
          animation: logoExitZoom 0.6s cubic-bezier(0.8, 0, 0.2, 1) forwards;
        }

        @keyframes logoEnter {
          0% { 
            transform: scale(0.3) translateY(60px) rotateX(15deg); 
            opacity: 0; 
            filter: blur(15px); 
          }
          100% { 
            transform: scale(1) translateY(0) rotateX(0deg); 
            opacity: 1; 
            filter: blur(0px); 
          }
        }

        @keyframes logoExitZoom {
          0% { transform: scale(1); opacity: 1; filter: blur(0px); }
          40% { filter: blur(2px); }
          100% { transform: scale(15); opacity: 0; filter: blur(10px); }
        }

        /* --- Logo App Icon Styles --- */
        .splash-logo-mask {
          position: relative;
          width: 150px;
          height: 150px;
          border-radius: 34px; /* iOS smooth curve */
          overflow: hidden;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.5), 
            0 0 80px rgba(0, 102, 255, 0.3),
            inset 0 1px 1px rgba(255, 255, 255, 0.2);
          background: #000;
          transform-style: preserve-3d;
          animation: float 4s ease-in-out infinite alternate;
        }

        .splash-logo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform-origin: center;
          animation: imageBreathe 5s ease-in-out infinite alternate;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-8px); }
        }

        @keyframes imageBreathe {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }

        /* --- Glass Shimmer Effect --- */
        .splash-shimmer-sweep {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          animation: shimmerSweep 3s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: 0.8s;
          pointer-events: none;
        }

        @keyframes shimmerSweep {
          0% { left: -100%; }
          35% { left: 200%; }
          100% { left: 200%; }
        }

        /* --- Typography & Text Fades --- */
        .splash-tagline {
          position: absolute;
          bottom: 100px;
          color: #E2E8F0;
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: -0.2px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        .splash-tagline-enter {
          animation: textEnter 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.6s;
          opacity: 0;
          transform: translateY(15px);
        }

        .splash-footer {
          position: absolute;
          bottom: 35px;
          color: #64748B;
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }

        .splash-footer-enter {
          animation: textEnter 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.8s;
          opacity: 0;
          transform: translateY(15px);
        }

        .splash-footer-exit {
          animation: textExit 0.3s ease-in forwards;
        }

        @keyframes textEnter {
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes textExit {
          to { opacity: 0; transform: translateY(10px); }
        }
      `}</style>
    </div>
  );
}
