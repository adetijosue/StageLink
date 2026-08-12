import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, SwitchCamera, Volume2, VolumeX, Clock, Maximize2, Minimize2, ShieldCheck, Zap, Phone, X, Repeat, ArrowLeftRight, User, Check, AlertCircle } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';

export default function VideoCallScreen({
  isOpen, onClose, callerName, callerAvatar, isAudioOnly, onCallEnded,
  isIncoming = false, isMinimized = false, onMinimize, onMaximize,
  chatId, remoteUserId
}) {
  const { currentUser } = useAuth();

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Audio to Video Call Migration State
  const [currentIsAudioOnly, setCurrentIsAudioOnly] = useState(isAudioOnly);
  const [isVideoOff, setIsVideoOff] = useState(isAudioOnly);
  
  // Removing manual video upgrade states to auto-activate video
  const [callDuration, setCallDuration] = useState(0);
  const [facingMode, setFacingMode] = useState('user');
  const [cameraActive, setCameraActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // WebRTC will set this to true when connected
  const [isBlurActive, setIsBlurActive] = useState(false);

  // Screen Swap State
  const [isLocalMain, setIsLocalMain] = useState(false);
  const [swapFeedback, setSwapFeedback] = useState(false);

  const localVideoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const remoteVideoMainRef = useRef(null);
  const remoteVideoPipRef = useRef(null);
  
  const mediaStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const timerRef = useRef(null);
  
  // WebRTC Refs
  const peerConnectionRef = useRef(null);
  const channelRef = useRef(null);

  // WebRTC ICE Servers
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
  };

  const setupWebRTC = async () => {
    if (!chatId) return;

    // Create Peer Connection
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate }
        });
      }
    };

    // Handle receiving remote tracks
    pc.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      remoteStreamRef.current.addTrack(event.track);
      
      if (remoteVideoMainRef.current) remoteVideoMainRef.current.srcObject = remoteStreamRef.current;
      if (remoteVideoPipRef.current) remoteVideoPipRef.current.srcObject = remoteStreamRef.current;
      
      setIsConnected(true);
      soundEngine.stopRingtone();
      soundEngine.playCallConnectedChime();
    };

    // Setup Supabase Realtime Channel for signaling
    const roomName = `call_${[currentUser?.id, remoteUserId].sort().join('_')}`;
    const channel = supabase.channel(roomName);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'ice-candidate' }, (payload) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.payload.candidate)).catch(e => console.error(e));
      }
    });

    channel.on('broadcast', { event: 'offer' }, async (payload) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.payload.sdp));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        channel.send({
          type: 'broadcast',
          event: 'answer',
          payload: { sdp: peerConnectionRef.current.localDescription }
        });
      } catch (e) {
        console.error("Error handling offer:", e);
      }
    });

    channel.on('broadcast', { event: 'answer' }, async (payload) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.payload.sdp));
      } catch (e) {
        console.error("Error handling answer:", e);
      }
    });

    channel.on('broadcast', { event: 'callee_ready' }, async () => {
      // Callee is ready, Caller should send the offer
      if (!isIncoming && peerConnectionRef.current) {
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          channel.send({
            type: 'broadcast',
            event: 'offer',
            payload: { sdp: peerConnectionRef.current.localDescription }
          });
        } catch(e) {
           console.error("Error creating offer:", e);
        }
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
         if (isIncoming) {
            // Callee tells Caller they are ready to receive offer
            channel.send({
              type: 'broadcast',
              event: 'callee_ready'
            });
         }
      }
    });
  };

  const initStream = async (mode, forceVideo = false) => {
    stopMediaStream();
    const shouldEnableVideo = forceVideo || !currentIsAudioOnly;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
           audio: true, 
           video: shouldEnableVideo ? { facingMode: mode } : false 
        });
        mediaStreamRef.current = stream;
        setCameraActive(shouldEnableVideo);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        if (pipVideoRef.current) pipVideoRef.current.srcObject = stream;

        // Add tracks to peer connection
        if (peerConnectionRef.current) {
           // Remove old tracks first if renegotiating
           const senders = peerConnectionRef.current.getSenders();
           senders.forEach(sender => peerConnectionRef.current.removeTrack(sender));

           stream.getTracks().forEach(track => {
              peerConnectionRef.current.addTrack(track, stream);
           });
           
           // Renegotiation is handled automatically by some browsers, but for manual:
           // If we're already connected, we need to send a new offer
           if (isConnected) {
              const offer = await peerConnectionRef.current.createOffer();
              await peerConnectionRef.current.setLocalDescription(offer);
              if (channelRef.current) {
                 channelRef.current.send({
                    type: 'broadcast',
                    event: 'offer',
                    payload: { sdp: peerConnectionRef.current.localDescription }
                 });
              }
           }
        }
      } catch (err) {
         console.warn('Camera stream error:', err.message);
         setCameraActive(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentIsAudioOnly(isAudioOnly);
      setIsVideoOff(isAudioOnly);
      setIsConnected(false); // reset state

      if (!isIncoming) {
        soundEngine.playCallingRingtone();
      } else {
        soundEngine.playIncomingRingtone();
      }

      setupWebRTC().then(() => {
         if (!isIncoming) {
             initStream(facingMode, !isAudioOnly);
         }
      });

      timerRef.current = setInterval(() => {
        setIsConnected((connected) => {
           if (connected) setCallDuration(v => v + 1);
           return connected;
        });
      }, 1000);
      
    } else {
      cleanupCall();
    }
    
    return cleanupCall;
  }, [isOpen, isIncoming, isAudioOnly, chatId]);

  const cleanupCall = () => {
      clearInterval(timerRef.current);
      stopMediaStream();
      soundEngine.stopRingtone();
      setIsConnected(false);
      setCallDuration(0);
      
      if (channelRef.current) {
         supabase.removeChannel(channelRef.current);
         channelRef.current = null;
      }
      if (peerConnectionRef.current) {
         peerConnectionRef.current.close();
         peerConnectionRef.current = null;
      }
      if (remoteStreamRef.current) {
         remoteStreamRef.current.getTracks().forEach(t => t.stop());
         remoteStreamRef.current = null;
      }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleAcceptCall = () => {
    soundEngine.stopRingtone();
    // Callee initializes their stream, WebRTC tracks are added, and negotiation triggers
    initStream(facingMode, !currentIsAudioOnly);
  };

  const handleRejectCall = () => {
    cleanupCall();
    onCallEnded({ status: 'rejected', duration: 0, isAudioOnly: currentIsAudioOnly, isIncoming: true });
  };

  const handleEndCall = () => {
    cleanupCall();
    onCallEnded({ status: 'completed', duration: callDuration, isAudioOnly: currentIsAudioOnly, isIncoming });
  };

  // Toggle Screen Swapping between Main Full Screen and Floating PiP Frame
  const handleSwapScreens = () => {
    soundEngine.playPopSound();
    setIsLocalMain(prev => !prev);
    setSwapFeedback(true);
    setTimeout(() => setSwapFeedback(false), 1200);
  };

  const handleToggleVideo = () => {
    soundEngine.playPopSound();

    if (currentIsAudioOnly) {
      // INITIATOR clicks camera during audio call:
      // 1. Activate their own camera immediately
      // 2. Show waiting overlay (NOT accept/reject modal)
      // 3. Send notification to remote partner (simulated)
      setIsUpgradePending(true);
      setUpgradeMessage(`En attente de ${callerName || 'l\'interlocuteur'}...`);
      
      // Activate local camera stream immediately for the initiator
      initStream(facingMode, true);
      setIsVideoOff(false);

      // Simulate remote partner receiving notification and accepting after delay
      // In real implementation, this would be via WebSocket/signaling
      clearTimeout(upgradeTimerRef.current);
      upgradeTimerRef.current = setTimeout(() => {
        // Simulate partner accepting the video upgrade
        handlePartnerAcceptedUpgrade();
      }, 4000);
    } else {
      // Normal Video Toggle during Video Call
      setIsVideoOff(prev => !prev);
    }
  };

  // Called when partner ACCEPTS video upgrade (initiator's side)
  // Called when partner REJECTS video upgrade (initiator's side)
  // REMOTE PARTNER receives video upgrade invitation (incoming side)
  // In a real app, this would be triggered by a WebSocket event
  if (!isOpen) return null;

  const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const safeAvatar = callerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
  const myAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200';
  const myName = currentUser?.name || 'Moi';
  const partnerName = callerName || 'Correspondant StageLink';

  if (isMinimized) {
    return (
      <div onClick={onMaximize} style={{ position: 'fixed', bottom: '90px', right: '16px', zIndex: 9999, width: '120px', height: '160px', borderRadius: '20px', overflow: 'hidden', background: '#070B14', border: '2px solid #0066FF', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          {!isVideoOff && isConnected && cameraActive ? (
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E293B' }}>
              <UserAvatar user={{ avatar: safeAvatar }} size={50} border="2px solid #0066FF" />
            </div>
          )}
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: 4 }}><Maximize2 size={12} color="#FFF" /></div>
        </div>
        <div style={{ background: '#0066FF', padding: '4px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#FFF' }}>{isConnected ? formatDuration(callDuration) : 'Appel...'}</div>
      </div>
    );
  }

  // Renders participant screen content (Local user or Remote partner)
  const renderParticipantContent = (isLocal, isFullScreen = false) => {
    if (isLocal) {
      // Local User View
      if (!isVideoOff && isConnected && cameraActive) {
        return (
          <video
            ref={isFullScreen ? localVideoRef : pipVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              filter: isBlurActive ? 'blur(15px)' : 'none'
            }}
          />
        );
      } else {
        return (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 40%, #1E293B 0%, #070B14 100%)',
            color: '#FFFFFF'
          }}>
            <UserAvatar
              user={{ avatar: myAvatar, name: myName }}
              size={isFullScreen ? 120 : 44}
              border="3px solid #0066FF"
              style={{
                marginBottom: isFullScreen ? '14px' : '0'
              }}
            />
            {isFullScreen && (
              <>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{myName} (Vous)</h3>
                <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{currentIsAudioOnly ? 'Appel Audio (Caméra Éteinte)' : 'Vidéo désactivée'}</p>
              </>
            )}
          </div>
        );
      }
    } else {
      // Remote Partner View
      if (isConnected && !currentIsAudioOnly) {
        return (
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 50% 30%, #0F172A 0%, #030712 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserAvatar
              user={{ avatar: safeAvatar, name: partnerName }}
              size={300} // Approximate large size for background
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 0,
                filter: 'brightness(0.95)'
              }}
            />

            {/* Live HD Calling Badge Overlay */}
            {isFullScreen && (
              <div style={{
                position: 'absolute',
                top: '70px',
                left: '20px',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(12px)',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFF' }}>{partnerName} • HD Vidéo</span>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 35%, #1E293B 0%, #070B14 100%)',
            color: '#FFFFFF'
          }}>
            <div style={{
              width: isFullScreen ? '140px' : '50px',
              height: isFullScreen ? '140px' : '50px',
              borderRadius: '50%',
              border: '4px solid #0066FF',
              overflow: 'hidden',
              marginBottom: isFullScreen ? '20px' : '0',
              boxShadow: '0 8px 24px rgba(0, 102, 255, 0.4)'
            }}>
              <UserAvatar user={{ avatar: safeAvatar }} size={isFullScreen ? 140 : 50} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            </div>
            {isFullScreen && (
              <>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{partnerName}</h2>
                <p style={{ color: '#94A3B8', marginTop: '8px' }}>
                  {isConnected ? '🎙️ Appel Audio HD en cours...' : 'Connexion en cours...'}
                </p>
              </>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: '#070B14', display: 'flex', flexDirection: 'column', color: '#FFF', overflow: 'hidden' }}>
      
      {/* 1. MAIN FULL SCREEN VIEW (Swappable) */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {renderParticipantContent(isLocalMain, true)}
      </div>

      {/* TOP HEADER BAR OVERLAY */}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: '12px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)' }}>
        <button onClick={onMinimize} title="Réduire l'appel" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '10px', color: '#FFF', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
          <Minimize2 size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>{partnerName}</h4>
          <p style={{ fontSize: '0.75rem', color: '#10B981', margin: 0, fontWeight: 700 }}>
            {isConnected ? `${currentIsAudioOnly ? '🎙️ Audio' : '📹 Vidéo HD'} • ${formatDuration(callDuration)}` : 'Sonnerie...'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <ShieldCheck size={14} color="#10B981" />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10B981' }}>Chiffré</span>
        </div>
      </div>

      {/* MIGRATION & SWAP NOTIFICATION TOAST BADGES */}
      {upgradeMessage && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          color: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0, 102, 255, 0.5)',
          border: '1px solid rgba(0, 102, 255, 0.6)',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          <Video size={16} color="#0066FF" /> {upgradeMessage}
        </div>
      )}

      {swapFeedback && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          background: 'rgba(0, 102, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          color: '#FFFFFF',
          padding: '8px 18px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0, 102, 255, 0.5)',
          border: '1px solid rgba(255,255,255,0.4)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <ArrowLeftRight size={16} /> Écrans permutés avec succès !
        </div>
      )}

      {/* INITIATOR WAITING OVERLAY — Shown to the person who requested video upgrade */}
      {isUpgradePending && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(7, 11, 20, 0.85)',
          backdropFilter: 'blur(16px)'
        }}>
          {/* Live camera preview behind the overlay */}
          {cameraActive && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                opacity: 0.35,
                filter: 'blur(6px)'
              }}
            />
          )}

          {/* Waiting content */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Pulsing camera icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0066FF, #0047FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(0, 102, 255, 0.5)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <Video size={36} color="#FFF" />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFF', textAlign: 'center' }}>
              Migration en Appel Vidéo HD
            </h3>

            <p style={{ fontSize: '0.9rem', color: '#94A3B8', textAlign: 'center', maxWidth: '280px', lineHeight: 1.5 }}>
              Votre caméra est activée. En attente de la réponse de <strong style={{ color: '#FFF' }}>{partnerName}</strong>...
            </p>

            {/* Animated waiting dots */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#0066FF',
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.6
                }} />
              ))}
            </div>

            {/* Cancel button */}
            <button
              onClick={() => {
                clearTimeout(upgradeTimerRef.current);
                handlePartnerRejectedUpgrade();
              }}
              style={{
                marginTop: '10px',
                padding: '10px 28px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <X size={16} /> Annuler la demande
            </button>
          </div>
        </div>
      )}

      {/* REMOTE PARTNER UPGRADE MODAL — ONLY shown to partner receiving video upgrade invitation */}
      {showVideoUpgradePrompt && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 40,
          width: '90%',
          maxWidth: '360px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(0, 102, 255, 0.5)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          textAlign: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0066FF, #0047FF)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 24px rgba(0, 102, 255, 0.6)'
          }}>
            <Video size={32} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px' }}>
            Demande d'Appel Vidéo HD 📹
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '20px', lineHeight: 1.4 }}>
            <strong style={{ color: '#FFF' }}>{partnerName}</strong> souhaite basculer cet appel en <strong>Appel Vidéo HD</strong>. Accepter ?
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRejectVideoUpgrade}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              ❌ Refuser
            </button>
            <button
              onClick={handleAcceptVideoUpgrade}
              style={{
                flex: 1.2,
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #0066FF, #0047FF)',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 102, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} /> 📹 Accepter la Vidéo
            </button>
          </div>
        </div>
      )}

      {/* 2. FLOATING PIP FRAME (INTERACTIVE SWAPPABLE MINI SCREEN - Active during Video Mode) */}
      {isConnected && !currentIsAudioOnly && (
        <div
          onClick={handleSwapScreens}
          title="Cliquer pour permuter l'écran grand / petit"
          style={{
            position: 'absolute',
            bottom: '160px',
            right: '20px',
            width: '115px',
            height: '165px',
            borderRadius: '18px',
            overflow: 'hidden',
            border: '2.5px solid #0066FF',
            zIndex: 25,
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            transition: 'transform 0.2s ease, border-color 0.2s ease',
            background: '#070B14'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {/* Render Opposite Participant in Floating Frame */}
          {renderParticipantContent(!isLocalMain, false)}

          {/* Click-to-Swap Icon Badge Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            background: 'rgba(0, 102, 255, 0.85)',
            backdropFilter: 'blur(6px)',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            <ArrowLeftRight size={13} />
          </div>

          {/* Participant Label Badge */}
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            padding: '2px 6px',
            borderRadius: '8px',
            fontSize: '0.62rem',
            fontWeight: 800,
            color: '#FFFFFF'
          }}>
            {!isLocalMain ? 'Vous' : partnerName.split(' ')[0]}
          </div>
        </div>
      )}

      {/* BOTTOM ACTION CONTROLS BAR */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', padding: '30px 20px max(35px, env(safe-area-inset-bottom))', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        {isIncoming && !isConnected ? (
          <div style={{ display: 'flex', gap: '50px' }}>
            <button onClick={handleRejectCall} style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#EF4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><PhoneOff size={30} color="#FFF" /></button>
            <button onClick={handleAcceptCall} style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#10B981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'bounce 1s infinite' }}><Phone size={30} color="#FFF" /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            {/* Mute Microphone Button */}
            <button onClick={() => setIsMuted(!isMuted)} title={isMuted ? 'Activer le micro' : 'Couper le micro'} style={{ width: '52px', height: '52px', borderRadius: '50%', background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* End Call Button */}
            <button onClick={handleEndCall} title="Raccrocher l'appel" style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#EF4444', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 25px rgba(239, 68, 68, 0.5)' }}>
              <PhoneOff size={32} />
            </button>

            {/* Camera / Video Call Upgrade Button */}
            <button
              onClick={handleToggleVideo}
              title={currentIsAudioOnly ? 'Passer en Appel Vidéo HD' : isVideoOff ? 'Activer ma caméra' : 'Désactiver ma caméra'}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: currentIsAudioOnly
                  ? '#0066FF'
                  : isVideoOff
                  ? '#EF4444'
                  : 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: currentIsAudioOnly ? '0 0 20px rgba(0, 102, 255, 0.6)' : 'none'
              }}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>

            {/* Swap Screen Button (Active during Video mode) */}
            {!currentIsAudioOnly && (
              <button onClick={handleSwapScreens} title="Permuter l'affichage des écrans" style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(0, 102, 255, 0.4)', border: '1px solid rgba(0, 102, 255, 0.6)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                <ArrowLeftRight size={22} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
