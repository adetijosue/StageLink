import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw, Volume2, Volume1, Minimize2 } from 'lucide-react';
import { soundEngine } from '../../services/audioService';

export default function InCallControls({
  isAudioOnly,
  isMuted,
  isVideoOff,
  audioOutput,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  onToggleAudioOutput,
  onMinimize,
  onEndCall
}) {
  const handleAction = (actionFn) => {
    soundEngine.playPopSound();
    if (actionFn) actionFn();
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '16px 20px',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(16px)',
      borderRadius: '32px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Minimize to Floating PiP */}
      <button
        onClick={() => handleAction(onMinimize)}
        title="Réduire en vignette flottante"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '50%',
          width: '46px',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <Minimize2 size={20} />
      </button>

      {/* Toggle Microphone */}
      <button
        onClick={() => handleAction(onToggleMute)}
        title={isMuted ? 'Activer le micro' : 'Couper le micro'}
        style={{
          background: isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '50%',
          width: '46px',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {/* Video Toggle (If Video Call) */}
      {!isAudioOnly && (
        <button
          onClick={() => handleAction(onToggleVideo)}
          title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
          style={{
            background: isVideoOff ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
      )}

      {/* Switch Camera (If Video Call & Camera active) */}
      {!isAudioOnly && !isVideoOff && (
        <button
          onClick={() => handleAction(onSwitchCamera)}
          title="Changer de caméra (Avant / Arrière)"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <RotateCcw size={20} />
        </button>
      )}

      {/* Audio Output Router (Speaker vs Earpiece) */}
      <button
        onClick={() => handleAction(onToggleAudioOutput)}
        title={audioOutput === 'speaker' ? 'Haut-parleur actif' : 'Écouteur actif'}
        style={{
          background: audioOutput === 'speaker' ? 'rgba(0, 102, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '50%',
          width: '46px',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        {audioOutput === 'speaker' ? <Volume2 size={20} /> : <Volume1 size={20} />}
      </button>

      {/* End Call Button (Red Pill) */}
      <button
        onClick={() => handleAction(onEndCall)}
        title="Raccrocher"
        style={{
          background: '#EF4444',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '26px',
          padding: '0 22px',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.88rem',
          boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
          transition: 'all 0.15s ease'
        }}
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
