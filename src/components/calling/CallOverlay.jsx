import React from 'react';
import { Phone, PhoneOff, Video, ShieldCheck, User } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import AudioCallView from './AudioCallView';
import VideoCallView from './VideoCallView';
import InCallControls from './InCallControls';
import { CALL_STATUS } from '../../hooks/useWebRTCCall';
import { useLanguage } from '../../context/LanguageContext';

export default function CallOverlay({
  callStatus,
  callType,
  remoteParticipant,
  isAudioOnly,
  isMuted,
  isVideoOff,
  audioOutput,
  isMinimized,
  callDuration,
  networkQuality,
  audioVolume,
  localStream,
  remoteStream,
  onAcceptCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  onToggleAudioOutput,
  onSetMinimized
}) {
  const { t, language } = useLanguage();
  if (callStatus === CALL_STATUS.IDLE) return null;

  const durationFormatted = `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`;

  // =========================================================================
  // 1. FLOATING MINIMIZED PiP VIEW (When user navigates the app during a call)
  // =========================================================================
  if (isMinimized && (callStatus === CALL_STATUS.CONNECTED || callStatus === CALL_STATUS.CONNECTING)) {
    return (
      <div
        onClick={() => onSetMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          zIndex: 9999,
          background: '#0F172A',
          borderRadius: '24px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          border: '1.5px solid rgba(0, 102, 255, 0.5)',
          cursor: 'pointer',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div style={{ position: 'relative' }}>
          <UserAvatar
            user={{
              avatar: remoteParticipant?.avatar_url || remoteParticipant?.avatar,
              name: remoteParticipant?.full_name || remoteParticipant?.name || (language === 'en' ? 'Artist' : 'Artiste')
            }}
            size={36}
          />
          <span style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#10B981',
            border: '2px solid #0F172A'
          }} />
        </div>

        <div>
          <h5 style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 700, margin: 0 }}>
            {remoteParticipant?.full_name?.split(' ')[0] || (language === 'en' ? 'Call' : 'Appel')}
          </h5>
          <span style={{ fontSize: '0.7rem', color: '#93C5FD', fontWeight: 600 }}>
            {durationFormatted}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEndCall();
          }}
          title={language === 'en' ? 'Hang up' : 'Raccrocher'}
          style={{
            background: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginLeft: '4px'
          }}
        >
          <PhoneOff size={14} />
        </button>
      </div>
    );
  }

  // =========================================================================
  // 2. INCOMING CALL SCREEN
  // =========================================================================
  if (callStatus === CALL_STATUS.RINGING_INCOMING) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'linear-gradient(180deg, #0B132B 0%, #1C2541 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'calc(40px + env(safe-area-inset-top, 40px)) 24px calc(40px + env(safe-area-inset-bottom, 40px)) 24px'
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 102, 255, 0.15)',
            color: '#60A5FA',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            {callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
            {language === 'en' ? `Incoming ${callType === 'video' ? 'Video' : 'Audio'} Call` : `Appel ${callType === 'video' ? 'Vidéo' : 'Audio'} Entrant`}
          </span>
        </div>

        {/* Center Avatar with Pulsing Waves */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(0, 102, 255, 0.2)',
            animation: 'pulse 2s infinite ease-in-out'
          }} />

          <UserAvatar
            user={{
              avatar: remoteParticipant?.avatar_url || remoteParticipant?.avatar,
              name: remoteParticipant?.full_name || remoteParticipant?.name || (language === 'en' ? 'Artist' : 'Artiste')
            }}
            size={120}
          />

          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginTop: '24px',
            marginBottom: '4px',
            textAlign: 'center'
          }}>
            {remoteParticipant?.full_name || remoteParticipant?.name || (language === 'en' ? 'StageLink Artist' : 'Artiste StageLink')}
          </h2>

          <p style={{ fontSize: '0.92rem', color: '#93C5FD', margin: 0, fontWeight: 600 }}>
            {remoteParticipant?.role || (language === 'en' ? 'Artist' : 'Artiste')}
          </p>
        </div>

        {/* Bottom Accept / Decline Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%',
          maxWidth: '320px'
        }}>
          {/* Decline Button */}
          <button
            onClick={() => onEndCall('declined')}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '68px',
              height: '68px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)'
            }}
          >
            <PhoneOff size={28} />
          </button>

          {/* Accept Button */}
          <button
            onClick={onAcceptCall}
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '68px',
              height: '68px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
              animation: 'bounce 1.5s infinite'
            }}
          >
            {callType === 'video' ? <Video size={28} /> : <Phone size={28} />}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. OUTGOING RINGING SCREEN
  // =========================================================================
  if (callStatus === CALL_STATUS.INITIATING || callStatus === CALL_STATUS.RINGING_OUTGOING) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'linear-gradient(180deg, #0B132B 0%, #1C2541 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'calc(40px + env(safe-area-inset-top, 40px)) 24px calc(40px + env(safe-area-inset-bottom, 40px)) 24px'
      }}>
        {/* Status indicator */}
        <div style={{ textAlign: 'center' }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#E2E8F0',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            {callStatus === CALL_STATUS.INITIATING ? (language === 'en' ? 'Connecting...' : 'Connexion en cours...') : (language === 'en' ? 'Ringing...' : 'Sonnerie...')}
          </span>
        </div>

        {/* Center Avatar with Pulsing Halo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(0, 102, 255, 0.25)',
            animation: 'pulse 1.8s infinite'
          }} />

          <UserAvatar
            user={{
              avatar: remoteParticipant?.avatar_url || remoteParticipant?.avatar,
              name: remoteParticipant?.full_name || remoteParticipant?.name || (language === 'en' ? 'Artist' : 'Artiste')
            }}
            size={120}
          />

          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginTop: '24px',
            marginBottom: '4px',
            textAlign: 'center'
          }}>
            {remoteParticipant?.full_name || remoteParticipant?.name || (language === 'en' ? 'StageLink Artist' : 'Artiste StageLink')}
          </h2>

          <p style={{ fontSize: '0.92rem', color: '#93C5FD', margin: 0, fontWeight: 600 }}>
            {remoteParticipant?.role || (language === 'en' ? 'Artist' : 'Artiste')}
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => onEndCall('cancelled')}
          style={{
            background: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            width: '68px',
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)'
          }}
        >
          <PhoneOff size={28} />
        </button>
      </div>
    );
  }

  // =========================================================================
  // 4. ACTIVE CONNECTED CALL SCREEN (Audio or Video)
  // =========================================================================
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: '#0B132B',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Main Stream or Audio Visualizer */}
      {isAudioOnly ? (
        <AudioCallView
          participant={remoteParticipant}
          callDuration={callDuration}
          audioVolume={audioVolume}
          networkQuality={networkQuality}
          isMuted={isMuted}
        />
      ) : (
        <VideoCallView
          participant={remoteParticipant}
          localStream={localStream}
          remoteStream={remoteStream}
          isVideoOff={isVideoOff}
          callDuration={callDuration}
          onSwitchCamera={onSwitchCamera}
        />
      )}

      {/* Floating Rounded In-Call Controls */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 24px))',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 50,
        padding: '0 16px'
      }}>
        <InCallControls
          isAudioOnly={isAudioOnly}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          audioOutput={audioOutput}
          onToggleMute={onToggleMute}
          onToggleVideo={onToggleVideo}
          onSwitchCamera={onSwitchCamera}
          onToggleAudioOutput={onToggleAudioOutput}
          onMinimize={() => onSetMinimized(true)}
          onEndCall={onEndCall}
        />
      </div>
    </div>
  );
}
