import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  SwitchCamera, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  Phone, 
  X, 
  ArrowLeftRight, 
  Check, 
  Share2, 
  Monitor, 
  Sparkles, 
  MessageSquare, 
  Send, 
  Wifi, 
  Flame, 
  Heart, 
  Music, 
  ThumbsUp, 
  Radio, 
  Layers 
} from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';

const QUICK_RESPONSES = [
  { icon: '🎧', text: "En session studio d'enregistrement, je te rappelle !" },
  { icon: '⏱️', text: "Je suis occupé(e), je te rappelle dans 5 minutes." },
  { icon: '🚗', text: "Je suis sur la route, on s'écrit par message." },
  { icon: '💬', text: "Envoie-moi un message direct sur StageLink." }
];

const FLOATING_REACTIONS = ['🔥', '👏', '🎵', '❤️', '🚀', '💯'];

export default function VideoCallScreen({
  isOpen,
  onClose,
  callerName,
  callerAvatar,
  callerRole = 'Artiste',
  isAudioOnly = false,
  onCallEnded,
  isIncoming = false,
  isMinimized = false,
  onMinimize,
  onMaximize,
  chatId,
  remoteUserId
}) {
  const { currentUser } = useAuth();

  // Call Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [currentIsAudioOnly, setCurrentIsAudioOnly] = useState(isAudioOnly);
  const [isVideoOff, setIsVideoOff] = useState(isAudioOnly);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [cameraActive, setCameraActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isBlurActive, setIsBlurActive] = useState(false);
  
  // Connection & Duration
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState('excellent'); // 'excellent', 'good', 'poor'
  const [pingMs, setPingMs] = useState(24);

  // Screen Swap & Views
  const [isLocalMain, setIsLocalMain] = useState(false);
  const [swapFeedback, setSwapFeedback] = useState(false);

  // Audio Visualizer Spectrum
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyBars, setFrequencyBars] = useState([15, 30, 60, 40, 75, 50, 85, 35, 65, 45, 90, 40, 20]);

  // Quick SMS & In-Call Chat Drawer
  const [showQuickRejectModal, setShowQuickRejectModal] = useState(false);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [inCallMessages, setInCallMessages] = useState([]);
  const [inCallText, setInCallText] = useState('');

  // Floating Reactions
  const [activeReactions, setActiveReactions] = useState([]);

  // Video and Stream Refs
  const localVideoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const remoteVideoMainRef = useRef(null);
  const remoteVideoPipRef = useRef(null);
  
  const mediaStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);

  // WebRTC Refs
  const peerConnectionRef = useRef(null);
  const channelRef = useRef(null);

  // ICE Servers Configuration
  const iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  // Safe Caller Info
  const partnerName = callerName || 'Correspondant StageLink';
  const safeAvatar = callerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
  const myAvatar = currentUser?.avatar || currentUser?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300';
  const myName = currentUser?.name || currentUser?.full_name || 'Moi';

  // Setup Web Audio Analyser for Real-time Voice Waveform
  const setupAudioAnalyser = useCallback((stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = audioCtxRef.current.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateSpectrum = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);

        let sum = 0;
        const bars = [];
        const count = 13;
        const step = Math.floor(data.length / count) || 1;

        for (let i = 0; i < count; i++) {
          const val = data[i * step] || 0;
          sum += val;
          bars.push(Math.max(12, Math.round((val / 255) * 100)));
        }

        const avg = Math.round((sum / data.length / 255) * 100);
        setAudioLevel(avg);
        setFrequencyBars(bars);

        animFrameRef.current = requestAnimationFrame(updateSpectrum);
      };

      updateSpectrum();
    } catch (e) {
      console.warn('Audio analyser setup note:', e);
    }
  }, []);

  // WebRTC Setup & Supabase Signaling
  const setupWebRTC = async () => {
    if (!chatId) return;

    const pc = new RTCPeerConnection(iceConfig);
    peerConnectionRef.current = pc;

    // Handle ICE Candidate transmission
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate }
        });
      }
    };

    // Handle Remote Track arrival
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      remoteStreamRef.current = stream;

      if (remoteVideoMainRef.current) {
        remoteVideoMainRef.current.srcObject = stream;
        remoteVideoMainRef.current.play().catch(() => {});
      }
      if (remoteVideoPipRef.current) {
        remoteVideoPipRef.current.srcObject = stream;
        remoteVideoPipRef.current.play().catch(() => {});
      }

      setIsConnected(true);
      soundEngine.stopRingtone();
      soundEngine.playCallConnectedChime();
    };

    // Supabase Signaling Room
    const roomName = `call_${[currentUser?.id, remoteUserId].sort().join('_')}`;
    const channel = supabase.channel(roomName);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'ice-candidate' }, (payload) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.payload.candidate)).catch(() => {});
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
        console.error('Error handling offer:', e);
      }
    });

    channel.on('broadcast', { event: 'answer' }, async (payload) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.payload.sdp));
      } catch (e) {
        console.error('Error handling answer:', e);
      }
    });

    channel.on('broadcast', { event: 'callee_ready' }, async () => {
      if (!isIncoming && peerConnectionRef.current) {
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          channel.send({
            type: 'broadcast',
            event: 'offer',
            payload: { sdp: peerConnectionRef.current.localDescription }
          });
        } catch (e) {
          console.error('Error creating offer:', e);
        }
      }
    });

    channel.on('broadcast', { event: 'video_upgrade' }, async () => {
      soundEngine.playPopSound();
      setCurrentIsAudioOnly(false);
      setIsVideoOff(false);
      initStream(facingMode, true);
    });

    channel.on('broadcast', { event: 'reaction' }, (payload) => {
      triggerFloatingReaction(payload.payload.emoji);
    });

    channel.on('broadcast', { event: 'in_call_chat' }, (payload) => {
      soundEngine.playMessageReceivedSound();
      setInCallMessages(prev => [...prev, payload.payload]);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && isIncoming) {
        channel.send({
          type: 'broadcast',
          event: 'callee_ready'
        });
      }
    });
  };

  // Initialize Media Stream
  const initStream = async (mode, forceVideo = false) => {
    stopMediaStream();
    const shouldEnableVideo = forceVideo || !currentIsAudioOnly;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          },
          video: shouldEnableVideo ? { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } } : false
        });

        mediaStreamRef.current = stream;
        setCameraActive(shouldEnableVideo);
        setupAudioAnalyser(stream);

        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        if (pipVideoRef.current) pipVideoRef.current.srcObject = stream;

        // Attach tracks to Peer Connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          senders.forEach(sender => peerConnectionRef.current.removeTrack(sender));

          stream.getTracks().forEach(track => {
            peerConnectionRef.current.addTrack(track, stream);
          });

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
        console.warn('Camera stream setup fallback:', err.message);
        setCameraActive(false);
      }
    }
  };

  // Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      initStream(facingMode, !isVideoOff);
    } else {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          screenStreamRef.current = displayStream;
          setIsScreenSharing(true);
          setCurrentIsAudioOnly(false);
          setIsVideoOff(false);

          if (localVideoRef.current) localVideoRef.current.srcObject = displayStream;
          if (pipVideoRef.current) pipVideoRef.current.srcObject = displayStream;

          const videoTrack = displayStream.getVideoTracks()[0];
          videoTrack.onended = () => {
            handleToggleScreenShare();
          };

          if (peerConnectionRef.current) {
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
            }
          }
        } catch (err) {
          console.warn('Screen share cancelled or unsupported:', err);
        }
      }
    }
  };

  // Switch Front/Back Camera
  const handleSwitchCamera = () => {
    soundEngine.playPopSound();
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    initStream(nextMode, !isVideoOff);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    soundEngine.playPopSound();
    const next = !isMuted;
    setIsMuted(next);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !next;
      });
    }
  };

  // Floating Reaction Sender
  const triggerFloatingReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setActiveReactions(prev => [...prev, { id, emoji, left: Math.floor(Math.random() * 60) + 20 }]);
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
  };

  const handleSendReaction = (emoji) => {
    soundEngine.playPopSound();
    triggerFloatingReaction(emoji);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { emoji }
      });
    }
  };

  // In-Call Chat Sender
  const handleSendInCallMessage = () => {
    if (!inCallText.trim()) return;
    const msg = {
      id: Date.now(),
      senderName: myName,
      text: inCallText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setInCallMessages(prev => [...prev, msg]);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'in_call_chat',
        payload: msg
      });
    }
    setInCallText('');
  };

  // Quick SMS Reject
  const handleQuickReject = (responseObj) => {
    cleanupCall();
    onCallEnded({
      status: 'rejected',
      reason: 'quick_sms',
      quickMessage: responseObj.text,
      duration: 0,
      isAudioOnly: currentIsAudioOnly,
      isIncoming: true
    });
  };

  // LifeCycle Effect
  useEffect(() => {
    if (isOpen) {
      setCurrentIsAudioOnly(isAudioOnly);
      setIsVideoOff(isAudioOnly);
      setIsConnected(false);

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

      // Duration Timer
      timerRef.current = setInterval(() => {
        setIsConnected((connected) => {
          if (connected) setCallDuration(v => v + 1);
          return connected;
        });
      }, 1000);

      // Latency simulation
      const pingInterval = setInterval(() => {
        setPingMs(Math.floor(Math.random() * 15) + 20);
      }, 4000);

      return () => {
        clearInterval(pingInterval);
      };
    } else {
      cleanupCall();
    }

    return cleanupCall;
  }, [isOpen, isIncoming, isAudioOnly, chatId]);

  const cleanupCall = () => {
    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try { audioCtxRef.current.close(); } catch (e) {}
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
  };

  const handleAcceptCall = () => {
    soundEngine.stopRingtone();
    initStream(facingMode, !currentIsAudioOnly);
  };

  const handleRejectCall = () => {
    cleanupCall();
    onCallEnded({ status: 'rejected', duration: 0, isAudioOnly: currentIsAudioOnly, isIncoming: true });
  };

  const handleEndCall = () => {
    soundEngine.playCallEndedChime();
    cleanupCall();
    onCallEnded({ status: 'completed', duration: callDuration, isAudioOnly: currentIsAudioOnly, isIncoming });
  };

  const handleSwapScreens = () => {
    soundEngine.playPopSound();
    setIsLocalMain(prev => !prev);
    setSwapFeedback(true);
    setTimeout(() => setSwapFeedback(false), 1200);
  };

  const handleToggleVideo = () => {
    soundEngine.playPopSound();
    if (currentIsAudioOnly) {
      initStream(facingMode, true);
      setIsVideoOff(false);
      setCurrentIsAudioOnly(false);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'video_upgrade'
        });
      }
    } else {
      setIsVideoOff(prev => !prev);
    }
  };

  const formatDuration = (s) => {
    if (isNaN(s) || s == null) return '00:00';
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // ══════════════════════════════════════════════════════════════════════════
  // PIP MINIMIZED FLOATING VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (isMinimized) {
    return (
      <div
        onClick={onMaximize}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '16px',
          zIndex: 9999,
          width: '130px',
          height: '175px',
          borderRadius: '24px',
          overflow: 'hidden',
          background: '#070B14',
          border: '2.5px solid #0066FF',
          boxShadow: '0 16px 40px rgba(0, 102, 255, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          {!isVideoOff && isConnected && cameraActive ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E293B' }}>
              <UserAvatar user={{ avatar: safeAvatar }} size={56} border="2px solid #0066FF" />
            </div>
          )}
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: 4 }}>
            <Maximize2 size={12} color="#FFF" />
          </div>
        </div>
        <div style={{ background: '#0066FF', padding: '5px', textAlign: 'center', fontSize: '0.68rem', fontWeight: 800, color: '#FFF' }}>
          {isConnected ? formatDuration(callDuration) : 'Appel...'}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER PARTICIPANT SCREEN (Full Screen or Floating Frame)
  // ══════════════════════════════════════════════════════════════════════════
  const renderParticipantContent = (isLocal, isFullScreen = false) => {
    if (isLocal) {
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
              filter: isBlurActive ? 'blur(12px)' : 'none'
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
              style={{ marginBottom: isFullScreen ? '14px' : '0' }}
            />
            {isFullScreen && (
              <>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{myName} (Vous)</h3>
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '4px' }}>
                  {currentIsAudioOnly ? 'Appel Audio HD' : 'Vidéo désactivée'}
                </p>
              </>
            )}
          </div>
        );
      }
    } else {
      if (isConnected && !currentIsAudioOnly) {
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#030712' }}>
            <video
              ref={isFullScreen ? remoteVideoMainRef : remoteVideoPipRef}
              autoPlay
              playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
            />
            <div style={{ position: 'relative', zIndex: 0, width: '100%', height: '100%' }}>
              <UserAvatar
                user={{ avatar: safeAvatar, name: partnerName }}
                size={300}
                style={{ width: '100%', height: '100%', borderRadius: 0, filter: 'brightness(0.8)' }}
              />
            </div>
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
            color: '#FFFFFF',
            position: 'relative'
          }}>
            {/* Pulsing Aura Rings during Speaking */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              {isConnected && (
                <div style={{
                  position: 'absolute',
                  width: `${140 + audioLevel * 1.2}px`,
                  height: `${140 + audioLevel * 1.2}px`,
                  borderRadius: '50%',
                  background: 'rgba(0, 102, 255, 0.25)',
                  filter: 'blur(20px)',
                  transition: 'all 0.1s ease',
                  zIndex: 0
                }} />
              )}

              <div style={{
                position: 'relative',
                zIndex: 1,
                borderRadius: '50%',
                border: '4px solid #0066FF',
                boxShadow: '0 8px 30px rgba(0, 102, 255, 0.5)'
              }}>
                <UserAvatar user={{ avatar: safeAvatar, name: partnerName }} size={isFullScreen ? 130 : 50} />
              </div>
            </div>

            {isFullScreen && (
              <>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: 0, color: '#FFF' }}>{partnerName}</h2>
                <span style={{ fontSize: '0.82rem', color: '#60A5FA', marginTop: '4px', fontWeight: 700 }}>
                  {callerRole}
                </span>

                {/* Real-time Voice Spectrum Waveform */}
                {isConnected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '36px', marginTop: '24px' }}>
                    {frequencyBars.map((height, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '4px',
                          height: `${height}%`,
                          borderRadius: '4px',
                          background: 'linear-gradient(to top, #0066FF, #00C6FF)',
                          transition: 'height 0.08s ease'
                        }}
                      />
                    ))}
                  </div>
                )}

                <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '14px' }}>
                  {isConnected ? '🎙️ Connexion Audio HD Stéréo Active' : 'Établissement du signal...'}
                </p>
              </>
            )}
          </div>
        );
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN FULL VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      background: '#070B14',
      display: 'flex',
      flexDirection: 'column',
      color: '#FFF',
      overflow: 'hidden'
    }}>
      {/* 1. MAIN BACKGROUND VIEW (Swappable) */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {renderParticipantContent(isLocalMain, true)}
      </div>

      {/* Floating Reactions Rising Animation */}
      {activeReactions.map(r => (
        <div
          key={r.id}
          style={{
            position: 'absolute',
            bottom: '120px',
            left: `${r.left}%`,
            fontSize: '2.5rem',
            zIndex: 40,
            pointerEvents: 'none',
            animation: 'floatReaction 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {r.emoji}
        </div>
      ))}

      {/* 2. TOP HEADER HUD */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: '12px',
        paddingLeft: '18px',
        paddingRight: '18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)'
      }}>
        {/* Minimize Button */}
        <button
          onClick={onMinimize}
          title="Réduire l'appel en fenêtre flottante"
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: 'none',
            borderRadius: '50%',
            padding: '10px',
            color: '#FFF',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Minimize2 size={18} />
        </button>

        {/* Center Title & Timer */}
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, letterSpacing: '-0.01em' }}>
            {partnerName}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#10B981' : '#F59E0B',
              boxShadow: isConnected ? '0 0 10px #10B981' : 'none'
            }} />
            <span style={{ fontSize: '0.78rem', color: isConnected ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
              {isConnected ? `${currentIsAudioOnly ? '🎙️ Audio HD' : '📹 Vidéo HD'} • ${formatDuration(callDuration)}` : 'Sonnerie en cours...'}
            </span>
          </div>
        </div>

        {/* Right Network & Encryption Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(16, 185, 129, 0.2)',
            padding: '4px 10px',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#10B981'
          }}>
            <Wifi size={12} /> {pingMs}ms
          </div>
        </div>
      </div>

      {/* Screen Swap Feedback Toast */}
      {swapFeedback && (
        <div style={{
          position: 'absolute',
          top: '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          background: 'rgba(0, 102, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          color: '#FFFFFF',
          padding: '8px 18px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0, 102, 255, 0.5)'
        }}>
          <ArrowLeftRight size={16} /> Écrans permutés !
        </div>
      )}

      {/* 3. FLOATING PIP MINI FRAME (Active in Video Mode) */}
      {isConnected && !currentIsAudioOnly && (
        <div
          onClick={handleSwapScreens}
          title="Cliquer pour permuter l'écran grand / petit"
          style={{
            position: 'absolute',
            top: '85px',
            right: '16px',
            width: '110px',
            height: '160px',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2.5px solid #0066FF',
            zIndex: 25,
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            background: '#070B14'
          }}
        >
          {renderParticipantContent(!isLocalMain, false)}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            background: 'rgba(0, 102, 255, 0.85)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF'
          }}>
            <ArrowLeftRight size={12} />
          </div>
        </div>
      )}

      {/* 4. IN-CALL CHAT DRAWER */}
      {showInCallChat && (
        <div style={{
          position: 'absolute',
          bottom: '120px',
          left: '16px',
          right: '16px',
          maxHeight: '260px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 35,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFF' }}>💬 Notes & Messages en Direct</span>
            <button
              onClick={() => setShowInCallChat(false)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', maxHeight: '140px' }}>
            {inCallMessages.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'center', margin: 'auto' }}>
                Aucun message échangé pendant l'appel
              </p>
            ) : (
              inCallMessages.map((m) => (
                <div key={m.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>
                  <strong style={{ color: '#60A5FA' }}>{m.senderName}: </strong> {m.text}
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inCallText}
              onChange={(e) => setInCallText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendInCallMessage()}
              placeholder="Écrire un message..."
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.4)',
                color: '#FFF',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSendInCallMessage}
              style={{
                padding: '8px 14px',
                borderRadius: '16px',
                border: 'none',
                background: '#0066FF',
                color: '#FFF',
                cursor: 'pointer'
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 5. INCOMING CALL SCREEN WITH QUICK SMS MODAL */}
      {isIncoming && !isConnected ? (
        <div style={{
          position: 'relative',
          zIndex: 20,
          marginTop: 'auto',
          padding: '30px 20px max(35px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {showQuickRejectModal ? (
            <div style={{
              width: '100%',
              maxWidth: '360px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
              padding: '18px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFF' }}>Répondre par message rapide</span>
                <button onClick={() => setShowQuickRejectModal(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {QUICK_RESPONSES.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReject(res)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#FFF',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{res.icon}</span> {res.text}
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Quick Message Reject Option */}
              <button
                onClick={() => setShowQuickRejectModal(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFF',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <MessageSquare size={15} /> Réponse rapide par SMS
              </button>

              {/* Accept / Reject Big Buttons */}
              <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>
                <button
                  onClick={handleRejectCall}
                  title="Refuser l'appel"
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#EF4444',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <PhoneOff size={30} color="#FFF" />
                </button>

                <button
                  onClick={handleAcceptCall}
                  title="Accepter l'appel"
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    background: '#10B981',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.5)',
                    animation: 'bounce 1s infinite'
                  }}
                >
                  <Phone size={34} color="#FFF" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* 6. CONNECTED CALL CONTROL HUD */
        <div style={{
          position: 'relative',
          zIndex: 20,
          marginTop: 'auto',
          padding: '24px 16px max(30px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Reaction Quick Bar */}
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            padding: '6px 12px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {FLOATING_REACTIONS.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleSendReaction(emoji)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Controls Button Row */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Mute Mic */}
            <button
              onClick={handleToggleMute}
              title={isMuted ? 'Activer le micro' : 'Couper le micro'}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Video Camera Toggle */}
            <button
              onClick={handleToggleVideo}
              title={currentIsAudioOnly ? 'Passer en Vidéo HD' : isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: currentIsAudioOnly ? '#0066FF' : isVideoOff ? '#EF4444' : 'rgba(255,255,255,0.18)',
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
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>

            {/* Screen Share Button */}
            {!currentIsAudioOnly && (
              <button
                onClick={handleToggleScreenShare}
                title={isScreenSharing ? "Arrêter le partage d'écran" : "Partager mon écran / DAW"}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: isScreenSharing ? '#10B981' : 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Monitor size={22} />
              </button>
            )}

            {/* Switch Camera (Front/Back) */}
            {!currentIsAudioOnly && !isVideoOff && (
              <button
                onClick={handleSwitchCamera}
                title="Changer de caméra"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <SwitchCamera size={22} />
              </button>
            )}

            {/* In-Call Chat Drawer Toggle */}
            <button
              onClick={() => setShowInCallChat(!showInCallChat)}
              title="Ouvrir le chat en direct"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: showInCallChat ? '#0066FF' : 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              <MessageSquare size={22} />
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              title="Raccrocher l'appel"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#EF4444',
                border: 'none',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.5)'
              }}
            >
              <PhoneOff size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
