import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw, Volume2, Volume1, Minimize2 } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t, language } = useLanguage();
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
        title={language === 'en' ? 'Minimize to floating window' : 'Réduire en vignette flottante'}
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
        title={isMuted ? (language === 'en' ? 'Unmute microphone' : 'Activer le micro') : (language === 'en' ? 'Mute microphone' : 'Couper le micro')}
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
          title={isVideoOff ? (language === 'en' ? 'Turn camera on' : 'Activer la caméra') : (language === 'en' ? 'Turn camera off' : 'Désactiver la caméra')}
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
          title={language === 'en' ? 'Switch camera (Front / Back)' : 'Changer de caméra (Avant / Arrière)'}
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
        title={audioOutput === 'speaker' ? (language === 'en' ? 'Speakerphone active' : 'Haut-parleur actif') : (language === 'en' ? 'Earpiece active' : 'Écouteur actif')}
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
        title={language === 'en' ? 'Hang up' : 'Raccrocher'}
        style={{
          background: '#EF4444',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
          transition: 'all 0.15s ease'
        }}
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
}
