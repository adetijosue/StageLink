import { useState, useRef, useCallback } from 'react';
import { webrtcEngine } from '../services/webrtcService';
import { soundEngine } from '../services/audioService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { nativeCallKit } from '../services/nativeCallKitBridge';

export const CALL_STATUS = {
  IDLE: 'idle',
  INITIATING: 'initiating',
  RINGING_OUTGOING: 'ringing_outgoing',
  RINGING_INCOMING: 'ringing_incoming',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ENDED: 'ended',
  BUSY: 'busy',
  MISSED: 'missed',
  REJECTED: 'rejected'
};

export function useWebRTCCall({ currentUser, onSendChatMessage }) {
  const [callStatus, setCallStatus] = useState(CALL_STATUS.IDLE);
  const [callSession, setCallSession] = useState(null);
  const [callType, setCallType] = useState('audio'); // 'audio' or 'video'
  const [remoteParticipant, setRemoteParticipant] = useState(null);
  const [isAudioOnly, setIsAudioOnly] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [audioOutput, setAudioOutput] = useState('speaker'); // 'speaker' | 'earpiece'
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState({ quality: 'excellent', rtt: 25, packetLoss: 0 });
  const [audioVolume, setAudioVolume] = useState({ local: 0, remote: 0 });

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const durationTimerRef = useRef(null);
  const ringingTimerRef = useRef(null);
  const statsTimerRef = useRef(null);
  const volumeAnimRef = useRef(null);
  const callSessionRef = useRef(null);
  const remoteParticipantRef = useRef(null);
  const callTypeRef = useRef(callType);
  const callDurationRef = useRef(0);

  callSessionRef.current = callSession;
  remoteParticipantRef.current = remoteParticipant;
  callTypeRef.current = callType;
  callDurationRef.current = callDuration;

  /**
   * Cleans up all call timers, sound effects, and signaling channels
   */
  const cleanupCallResources = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current);
    if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    if (volumeAnimRef.current) cancelAnimationFrame(volumeAnimRef.current);

    soundEngine.stopRingtone();
    webrtcEngine.close();

    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
      realtimeChannelRef.current = null;
    }
  }, []);

  /**
   * Start Call Duration Timer & Stats Monitoring
   */
  const startCallTimer = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Audio Visualizer Volume Loop
    const updateVolumeLoop = () => {
      const volData = webrtcEngine.getAudioVolumeData();
      setAudioVolume({ local: volData.volume, remote: volData.volume });
      volumeAnimRef.current = requestAnimationFrame(updateVolumeLoop);
    };
    volumeAnimRef.current = requestAnimationFrame(updateVolumeLoop);

    // Network stats monitor (every 3 seconds)
    statsTimerRef.current = setInterval(async () => {
      const stats = await webrtcEngine.getConnectionQualityStats();
      setNetworkQuality(stats);
    }, 3000);
  }, []);

  /**
   * End or Decline Call
   */
  const endCall = useCallback(async (reason = 'normal_hangup', notifyPeer = true) => {
    soundEngine.stopRingtone();
    soundEngine.playCallEndedChime();
    const curSession = callSessionRef.current;
    const curParticipant = remoteParticipantRef.current;
    const curType = callTypeRef.current;
    const curDuration = callDurationRef.current;

    nativeCallKit.endNativeCall(curSession?.id);

    if (notifyPeer && realtimeChannelRef.current && curSession) {
      try {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'end_call', callId: curSession.id, reason }
        });
      } catch (_) {}
    }

    if (isSupabaseConfigured() && curSession?.id) {
      try {
        await supabase.rpc('end_call', { p_call_id: curSession.id, p_reason: reason });
      } catch (_) {}
    }

    // Post call record into chat
    if (onSendChatMessage && curParticipant?.id) {
      const isMissed = reason.includes('missed') || reason.includes('timeout');
      const durationFormatted = `${Math.floor(curDuration / 60).toString().padStart(2, '0')}:${(curDuration % 60).toString().padStart(2, '0')}`;
      const noticeText = isMissed
        ? `📞 Appel ${curType === 'video' ? 'vidéo' : 'audio'} manqué`
        : `📞 Appel ${curType === 'video' ? 'vidéo' : 'audio'} (${durationFormatted})`;

      onSendChatMessage(`chat_${curParticipant.id}`, {
        text: noticeText,
        isCallNotice: true,
        callStatus: isMissed ? 'missed' : 'completed',
        isAudioOnly: curType === 'audio'
      });
    }

    setCallStatus(CALL_STATUS.ENDED);
    cleanupCallResources();
    setTimeout(() => {
      setCallStatus(CALL_STATUS.IDLE);
      setCallSession(null);
      setRemoteParticipant(null);
    }, 1200);
  }, [onSendChatMessage, cleanupCallResources]);

  /**
   * Handle Call Timeout -> Record as Missed
   */
  const handleCallTimeout = useCallback(() => {
    endCall('missed_timeout', true);
  }, [endCall]);

  /**
   * Setup Realtime Broadcast & Signaling Channel
   */
  const setupSignalingChannel = useCallback((roomId, callId, _partnerId, isCaller) => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase.channel(`voip:${roomId}`, {
      config: { broadcast: { self: false } }
    });

    realtimeChannelRef.current = channel;

    // WebRTC Engine callbacks
    webrtcEngine.onIceCandidate = (candidate) => {
      channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'ice-candidate', candidate, callId, senderId: currentUser?.id }
      });
    };

    webrtcEngine.onRemoteStream = (stream) => {
      remoteStreamRef.current = stream;
      setCallStatus(CALL_STATUS.CONNECTED);
      soundEngine.stopRingtone();
      soundEngine.playCallConnectedChime();
      startCallTimer();
      nativeCallKit.reportConnected(callId);
    };

    webrtcEngine.onConnectionStateChange = (state) => {
      if (state === 'connected') {
        setCallStatus(CALL_STATUS.CONNECTED);
      } else if (state === 'disconnected' || state === 'failed') {
        setCallStatus(CALL_STATUS.RECONNECTING);
        webrtcEngine.restartIce().then((newOffer) => {
          if (newOffer) {
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { type: 'renegotiate', offer: newOffer, callId, senderId: currentUser?.id }
            });
          }
        });
      }
    };

    channel
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (!payload || payload.callId !== callId) return;

        if (payload.type === 'offer' && !isCaller) {
          const answer = await webrtcEngine.createAnswer(payload.offer);
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', answer, callId, senderId: currentUser?.id }
          });
        } else if (payload.type === 'answer' && isCaller) {
          if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current);
          await webrtcEngine.handleAnswer(payload.answer);
          setCallStatus(CALL_STATUS.CONNECTING);
        } else if (payload.type === 'ice-candidate') {
          await webrtcEngine.addIceCandidate(payload.candidate);
        } else if (payload.type === 'renegotiate' && !isCaller) {
          const answer = await webrtcEngine.createAnswer(payload.offer);
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', answer, callId, senderId: currentUser?.id }
          });
        } else if (payload.type === 'end_call') {
          endCall('remote_hangup', false);
        } else if (payload.type === 'media_state') {
          if (payload.isVideoOff !== undefined) setIsVideoOff(payload.isVideoOff);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isCaller) {
          // Send initial SDP Offer
          const offer = await webrtcEngine.createOffer();
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'offer', offer, callId, senderId: currentUser?.id }
          });
        }
      });
  }, [currentUser?.id, endCall, startCallTimer]);

  /**
   * Start 1:1 or Group Audio/Video Call (Outgoing)
   */
  const startCall = useCallback(async ({ targetUser, type = 'audio', isGroup = false }) => {
    if (!currentUser?.id || !targetUser?.id) return;

    cleanupCallResources();
    setCallStatus(CALL_STATUS.INITIATING);
    setCallType(type);
    setIsAudioOnly(type === 'audio');
    setIsVideoOff(type === 'audio');
    setRemoteParticipant(targetUser);
    setCallDuration(0);
    setIsMinimized(false);

    try {
      // 1. Initialize Local Media Stream
      const stream = await webrtcEngine.initLocalStream({ audioOnly: type === 'audio' });
      localStreamRef.current = stream;

      // 2. Play Calling Ringtone
      soundEngine.playCallingRingtone();

      let callId = `call_${Date.now()}`;
      let roomId = `room_${[currentUser.id, targetUser.id].sort().join('_')}`;

      // 3. Initiate Call Session in Supabase
      if (isSupabaseConfigured()) {
        try {
          const { data: rpcRes } = await supabase.rpc('initiate_call', {
            p_receiver_ids: [targetUser.id],
            p_call_type: type,
            p_is_group: isGroup
          });

          if (rpcRes && rpcRes.success) {
            callId = rpcRes.call_id;
            roomId = rpcRes.room_id;
            setCallSession({ id: callId, roomId, caller_id: currentUser.id });
          } else if (rpcRes && rpcRes.error === 'USER_BUSY') {
            soundEngine.stopRingtone();
            soundEngine.playCallEndedChime();
            setCallStatus(CALL_STATUS.BUSY);
            setTimeout(() => setCallStatus(CALL_STATUS.IDLE), 3500);
            return;
          }
        } catch (dbErr) {
          console.warn('RPC initiate_call note:', dbErr);
        }
      }

      setCallStatus(CALL_STATUS.RINGING_OUTGOING);

      // 4. Setup Realtime Signaling Channel
      setupSignalingChannel(roomId, callId, targetUser.id, true);

      // 5. Ringing Timeout (35 seconds)
      ringingTimerRef.current = setTimeout(() => {
        handleCallTimeout();
      }, 35000);

    } catch (err) {
      console.error('Failed to start call:', err);
      cleanupCallResources();
      setCallStatus(CALL_STATUS.IDLE);
    }
  }, [currentUser, cleanupCallResources, setupSignalingChannel, handleCallTimeout]);

  /**
   * Handle Incoming Call notification / trigger
   */
  const handleIncomingCall = useCallback(({ callId, caller, type = 'audio', roomId }) => {
    cleanupCallResources();
    setCallStatus(CALL_STATUS.RINGING_INCOMING);
    setCallType(type);
    setIsAudioOnly(type === 'audio');
    setRemoteParticipant(caller);
    setCallSession({ id: callId, roomId, caller_id: caller.id });
    setCallDuration(0);

    soundEngine.playIncomingRingtone();
    nativeCallKit.displayIncomingCall({
      callId,
      callerName: caller.full_name || caller.name || 'Artiste StageLink',
      callerAvatar: caller.avatar_url || caller.avatar,
      hasVideo: type === 'video'
    });

    // Ringing timeout (35s)
    ringingTimerRef.current = setTimeout(() => {
      endCall('missed_timeout', true);
    }, 35000);
  }, [cleanupCallResources, endCall]);

  /**
   * Accept & Answer Incoming Call
   */
  const acceptCall = useCallback(async () => {
    if (!callSession) return;
    if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current);
    soundEngine.stopRingtone();
    setCallStatus(CALL_STATUS.CONNECTING);

    try {
      // 1. Initialize local media
      const stream = await webrtcEngine.initLocalStream({ audioOnly: isAudioOnly });
      localStreamRef.current = stream;

      // 2. Update Supabase call state
      if (isSupabaseConfigured()) {
        try {
          await supabase.rpc('answer_call', { p_call_id: callSession.id });
        } catch (_) {}
      }

      // 3. Setup signaling
      setupSignalingChannel(callSession.roomId, callSession.id, remoteParticipant?.id, false);
    } catch (err) {
      console.error('Failed to answer call:', err);
      endCall('error', true);
    }
  }, [callSession, isAudioOnly, remoteParticipant, setupSignalingChannel, endCall]);

  /**
   * Toggle Mic Mute
   */
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    webrtcEngine.toggleMute(nextMuted);
  };

  /**
   * Toggle Video On/Off
   */
  const toggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    webrtcEngine.toggleVideo(nextVideoOff);

    if (realtimeChannelRef.current && callSession) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'media_state', isVideoOff: nextVideoOff, callId: callSession.id }
      });
    }
  };

  /**
   * Switch Camera Front / Back
   */
  const switchCamera = async () => {
    await webrtcEngine.switchCamera();
  };

  /**
   * Route Audio Output (Speakerphone vs Earpiece)
   */
  const toggleAudioOutput = async (audioElement) => {
    if (!audioElement) return;
    const nextOutput = audioOutput === 'speaker' ? 'earpiece' : 'speaker';
    setAudioOutput(nextOutput);
    await webrtcEngine.setAudioOutput(audioElement, nextOutput);
  };

  return {
    callStatus,
    callType,
    callSession,
    remoteParticipant,
    isAudioOnly,
    isMuted,
    isVideoOff,
    audioOutput,
    isMinimized,
    callDuration,
    networkQuality,
    audioVolume,
    localStream: webrtcEngine.localStream,
    remoteStream: webrtcEngine.remoteStream,
    startCall,
    acceptCall,
    endCall,
    handleIncomingCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    toggleAudioOutput,
    setIsMinimized
  };
}
