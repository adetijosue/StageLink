import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, CheckCircle, Sparkles } from 'lucide-react';
import { soundEngine } from '../../services/audioService';

export default function PullToRefresh({ children, onRefresh, isDarkMode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshComplete, setRefreshComplete] = useState(false);

  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const THRESHOLD = 65;

  const handleTouchStart = (e) => {
    const el = containerRef.current;
    if (!el) return;

    // Only allow pull-to-refresh if scrolled at the very top
    if (el.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPullingRef.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const dy = currentY - startYRef.current;

    if (dy > 0) {
      // Damped pull effect curve formula
      const damped = Math.min(90, Math.pow(dy, 0.82) * 2.2);
      setPullDistance(damped);

      // Trigger haptic pop once when crossing threshold
      if (damped >= THRESHOLD && pullDistance < THRESHOLD) {
        soundEngine.playPopSound();
        try {
          if (navigator.vibrate) navigator.vibrate(25);
        } catch (err) {}
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      executeRefresh();
    } else {
      setPullDistance(0);
    }
  };

  const executeRefresh = () => {
    setIsRefreshing(true);
    setPullDistance(THRESHOLD);
    soundEngine.playPopSound();

    if (onRefresh) {
      onRefresh();
    }

    // Show completion tick mark after 700ms
    setTimeout(() => {
      setRefreshComplete(true);
      soundEngine.playLikePopSound();

      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshComplete(false);
        setPullDistance(0);
      }, 500);
    }, 700);
  };

  const rotationAngle = Math.min(360, (pullDistance / THRESHOLD) * 360);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Top Floating Refresh Indicator Pill */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          style={{
            position: 'sticky',
            top: '8px',
            left: 0,
            right: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: `${pullDistance}px`,
            transition: isPullingRef.current ? 'none' : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '24px',
            background: isDarkMode ? '#1E293B' : '#FFFFFF',
            color: refreshComplete ? '#10B981' : '#0066FF',
            boxShadow: '0 8px 24px rgba(0, 102, 255, 0.25)',
            border: refreshComplete ? '1px solid #A7F3D0' : '1px solid rgba(0, 102, 255, 0.3)',
            fontSize: '0.8rem',
            fontWeight: 800,
            transform: `scale(${Math.min(1, pullDistance / THRESHOLD)})`,
            transition: 'transform 0.15s ease'
          }}>
            {refreshComplete ? (
              <>
                <CheckCircle size={16} color="#10B981" />
                <span>Contenu à jour !</span>
              </>
            ) : isRefreshing ? (
              <>
                <RotateCw size={16} className="animate-spin" color="#0066FF" />
                <span>Actualisation de StageLink...</span>
              </>
            ) : (
              <>
                <RotateCw
                  size={16}
                  color="#0066FF"
                  style={{ transform: `rotate(${rotationAngle}deg)`, transition: 'transform 0.1s ease' }}
                />
                <span>{pullDistance >= THRESHOLD ? 'Relâchez pour actualiser !' : 'Tirez pour actualiser'}</span>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
