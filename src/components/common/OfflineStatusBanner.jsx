import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { offlineQueue } from '../../services/offlineQueueService';
import { haptics } from '../../services/hapticsService';

export default function OfflineStatusBanner({ isDarkMode }) {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => offlineQueue.getPendingCount());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      haptics.success();
      setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      haptics.warning();
    };

    const handleQueueChange = (e) => {
      setPendingCount(e.detail?.count || offlineQueue.getPendingCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline_queue_changed', handleQueueChange);
    window.addEventListener('offline_queue_synced', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline_queue_changed', handleQueueChange);
      window.removeEventListener('offline_queue_synced', handleQueueChange);
    };
  }, []);

  if (isOnline && !showReconnected && pendingCount === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: '92%',
        width: '420px',
        animation: 'slideDownBanner 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          borderRadius: '20px',
          background: !isOnline
            ? (isDarkMode ? 'rgba(239, 68, 68, 0.92)' : 'rgba(220, 38, 38, 0.95)')
            : (isDarkMode ? 'rgba(16, 185, 129, 0.92)' : 'rgba(5, 150, 105, 0.95)'),
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#FFFFFF',
          fontSize: '0.80rem',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {!isOnline ? (
          <WifiOff size={16} style={{ flexShrink: 0, animation: 'pulseIcon 1.5s infinite alternate' }} />
        ) : (
          <Wifi size={16} style={{ flexShrink: 0 }} />
        )}

        <div style={{ flex: 1, lineHeight: 1.3 }}>
          {!isOnline ? (
            <span>
              Mode Hors-Ligne {pendingCount > 0 && `• ${pendingCount} action(s) en attente`}
            </span>
          ) : (
            <span>Connexion rétablie • Synchronisation active</span>
          )}
        </div>

        {pendingCount > 0 && !isOnline && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '2px 8px',
              borderRadius: '12px'
            }}
          >
            <RefreshCw size={11} className="spin-slow" />
            <span>Sauvegardé</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDownBanner {
          0% { transform: translate(-50%, -24px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes pulseIcon {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        .spin-slow {
          animation: spinAnim 2.5s linear infinite;
        }
        @keyframes spinAnim {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
