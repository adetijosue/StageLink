import React, { useRef, useEffect, useState } from 'react';
import UserAvatar from '../common/UserAvatar';
import { RotateCcw, VideoOff, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function VideoCallView({
  participant,
  localStream,
  remoteStream,
  isVideoOff,
  callDuration,
  onSwitchCamera
}) {
  const { t, language } = useLanguage();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [pipPosition, setPipPosition] = useState({ x: 16, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const durationFormatted = `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`;

  // Attach local stream to PiP video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to main background video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartRef.current = {
      x: touch.clientX - pipPosition.x,
      y: touch.clientY - pipPosition.y
    };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = Math.max(10, Math.min(window.innerWidth - 130, touch.clientX - dragStartRef.current.x));
    const newY = Math.max(70, Math.min(window.innerHeight - 200, touch.clientY - dragStartRef.current.y));
    setPipPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* 1. Main Remote Video Stream */}
      {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        /* Video Off Remote Placeholder */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}>
          <UserAvatar
            user={{
              avatar: participant?.avatar_url || participant?.avatar,
              name: participant?.full_name || participant?.name || (language === 'en' ? 'Artist' : 'Artiste')
            }}
            size={110}
          />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              {participant?.full_name || participant?.name || (language === 'en' ? 'StageLink Artist' : 'Artiste StageLink')}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <VideoOff size={14} /> {language === 'en' ? "Participant's camera turned off" : 'Caméra du correspondant désactivée'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Bar Info Overlay */}
      <div style={{
        position: 'absolute',
        top: 'calc(16px + env(safe-area-inset-top, 16px))',
        left: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '0.82rem', color: '#FFFFFF', fontWeight: 700 }}>
            {participant?.full_name || participant?.name || (language === 'en' ? 'Artist' : 'Artiste')}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
          <span style={{ fontSize: '0.82rem', color: '#93C5FD', fontWeight: 600 }}>
            {durationFormatted}
          </span>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span style={{ fontSize: '0.72rem', color: '#E2E8F0', fontWeight: 600 }}>{language === 'en' ? 'Encrypted HD' : 'HD Chiffré'}</span>
        </div>
      </div>

      {/* 3. Draggable Local Video Preview (PiP Window) */}
      {!isVideoOff && localStream && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'absolute',
            top: `${pipPosition.y}px`,
            right: `${pipPosition.x}px`,
            width: '110px',
            height: '155px',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            zIndex: 30,
            cursor: 'grab',
            background: '#1E293B'
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)' // Mirror local view
            }}
          />

          {/* Quick Flip Camera Button on PiP */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwitchCamera();
            }}
            title={language === 'en' ? 'Switch camera' : 'Changer caméra'}
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.6)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
