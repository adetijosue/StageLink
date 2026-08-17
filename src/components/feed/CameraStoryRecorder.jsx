import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCcw, Mic, Play, Pause, Trash2, Repeat, Image as ImageIcon, Zap, ZapOff, Grid, Shield, CheckSquare, Square } from 'lucide-react';
import Logo from '../common/Logo';
import { soundEngine } from '../../services/audioService';
import UserAvatar from '../common/UserAvatar';
import { compressImage } from '../../utils/imageCompressor';

export default function CameraStoryRecorder({ isOpen, onClose, onStoryCreated, resharedStoryData, users = [] }) {
  const [creationMode, setCreationMode] = useState('camera'); // 'camera' | 'video' | 'text' | 'audio'
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [cameraActive, setCameraActive] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [allowReshare, setAllowReshare] = useState(true);

  // Privacy / Zero-Trust Audience State
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyType, setPrivacyType] = useState('all_contacts'); // 'all_contacts' | 'include_only' | 'exclude'
  const [audienceRules, setAudienceRules] = useState([]);

  // Text Story State
  const [textStoryContent, setTextStoryContent] = useState('');
  const [textBgGradient, setTextBgGradient] = useState('linear-gradient(135deg, #0066FF 0%, #0047FF 100%)');

  // Audio Story State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);

  // Camera / Media Capture State
  const [capturedImage, setCapturedImage] = useState(null);
  const [captionText, setCaptionText] = useState('');
  const [focusPoint, setFocusPoint] = useState(null);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const colorGradients = [
    { name: 'Bleu StageLink', bg: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)' },
    { name: 'Sunset Glow', bg: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' },
    { name: 'Émeraude Pro', bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
    { name: 'Violet Studio', bg: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' },
    { name: 'Dark Velvet', bg: 'radial-gradient(circle at 50% 35%, #1E293B 0%, #0F172A 100%)' }
  ];

  // Populate & Enable Editing for Reshared Story Content
  useEffect(() => {
    if (isOpen && resharedStoryData) {
      const existingCaption = resharedStoryData.caption || '';
      setCaptionText(existingCaption);
      setTextStoryContent(existingCaption);

      if (resharedStoryData.isTextStory) {
        setCreationMode('text');
        if (resharedStoryData.bgGradient) setTextBgGradient(resharedStoryData.bgGradient);
      } else if (resharedStoryData.storyMedia) {
        setCreationMode('camera');
        setCapturedImage(resharedStoryData.storyMedia);
      } else if (resharedStoryData.hasAudio) {
        setCreationMode('audio');
        setAudioBlobUrl(resharedStoryData.audioUrl || 'simulated_reshared_audio');
      }
    } else if (isOpen && !resharedStoryData) {
      setCapturedImage(null);
      setCaptionText('');
      setTextStoryContent('');
      setAudioBlobUrl(null);
    }
  }, [isOpen, resharedStoryData]);

  // Auto-start device camera stream in-app when camera mode is active
  useEffect(() => {
    if (isOpen && (creationMode === 'camera' || creationMode === 'video') && !capturedImage) {
      startCameraFeed();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, creationMode, capturedImage, facingMode]);

  const startCameraFeed = async () => {
    stopCamera();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Attempt 1: Facing mode requested
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: false
        });
        mediaStreamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err1) {
        console.warn('Camera facingMode error:', err1.message);
        try {
          // Attempt 2: Generic video stream fallback
          const streamFallback = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          mediaStreamRef.current = streamFallback;
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = streamFallback;
          }
        } catch (err2) {
          console.warn('In-app camera stream notice:', err2.message);
          setCameraActive(false);
        }
      }
    } else {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacingMode = () => {
    soundEngine.playPopSound();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Tap-to-focus animation effect
  const handleTapToFocus = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });
    soundEngine.playPopSound();
    setTimeout(() => setFocusPoint(null), 1000);
  };

  // Instant Photo Capture directly inside the app using Canvas Context
  const handleTakeSnapshot = () => {
    soundEngine.playPopSound();
    if (videoRef.current && cameraActive) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } else {
      // Create a clean branded snapshot if camera is pending
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#0F172A');
        grad.addColorStop(0.5, '#0066FF');
        grad.addColorStop(1, '#090D16');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('StageLink Studio 🎤', canvas.width / 2, canvas.height / 2);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // HOLD-TO-RECORD MICROPHONE GESTURE HANDLERS
  const handleHoldStartRecording = async (e) => {
    if (e) e.preventDefault();
    if (isRecordingAudio) return;

    soundEngine.playPopSound();
    if (navigator.vibrate) navigator.vibrate(50);

    setAudioBlobUrl(null);
    setIsPlayingAudioPreview(false);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
      }
    } catch (err) {
      console.warn('Microphone access notice:', err.message);
    }

    setIsRecordingAudio(true);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleHoldReleaseRecording = (e) => {
    if (e) e.preventDefault();
    if (!isRecordingAudio) return;

    soundEngine.playPopSound();
    if (navigator.vibrate) navigator.vibrate(30);

    clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);

        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      setAudioBlobUrl('simulated_voice_note');
    }
  };

  const toggleAudioPlaybackPreview = () => {
    if (isPlayingAudioPreview) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      soundEngine.stop();
      setIsPlayingAudioPreview(false);
    } else {
      if (audioBlobUrl && audioBlobUrl !== 'simulated_voice_note' && audioBlobUrl !== 'simulated_reshared_audio') {
        const audio = new Audio(audioBlobUrl);
        audioPlayerRef.current = audio;
        audio.play();
        audio.onended = () => setIsPlayingAudioPreview(false);
      } else {
        soundEngine.generateAndPlay(120, 'Afro-Gospel');
      }
      setIsPlayingAudioPreview(true);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      soundEngine.playPopSound();
      if (file.type && file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedImage(reader.result);
          stopCamera();
        };
        reader.readAsDataURL(file);
      } else {
        const compressed = await compressImage(file, 1080, 1920, 0.78);
        setCapturedImage(compressed);
        stopCamera();
      }
    }
  };

  const handlePublishStory = () => {
    const isReshared = !!resharedStoryData;
    const resharedFrom = resharedStoryData ? (resharedStoryData.resharedFrom || resharedStoryData.userName) : null;

    const basePayload = {
      allowReshare: allowReshare,
      isReshared: isReshared,
      resharedFrom: resharedFrom,
      privacyType: privacyType,
      audienceRules: audienceRules
    };

    if (creationMode === 'text') {
      if (!textStoryContent.trim()) return;
      onStoryCreated({
        ...basePayload,
        caption: textStoryContent.trim(),
        storyMedia: null,
        bgGradient: textBgGradient,
        isTextStory: true
      });
    } else if (creationMode === 'audio') {
      if (!audioBlobUrl) return;
      onStoryCreated({
        ...basePayload,
        caption: captionText.trim() || `🎙️ Story Vocal Audio (${recordingSeconds || 5}s)`,
        storyMedia: null,
        audioUrl: audioBlobUrl,
        hasAudio: true,
        bgGradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
      });
    } else {
      if (!capturedImage) return;
      onStoryCreated({
        ...basePayload,
        caption: captionText.trim() || (isReshared ? `Repartagé de ${resharedFrom}` : 'Ma story StageLink 🎤🔥'),
        storyMedia: capturedImage
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const isPublishDisabled =
    (creationMode === 'text' && !textStoryContent.trim()) ||
    (creationMode === 'audio' && !audioBlobUrl) ||
    ((creationMode === 'camera' || creationMode === 'video') && !capturedImage);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      background: '#030712',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      color: '#FFFFFF'
    }}>
      {/* WHATSAPP-STYLE IN-APP CAMERA VIEWFINDER CANVAS */}
      <div
        onClick={handleTapToFocus}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: '#030712',
          cursor: (creationMode === 'camera' || creationMode === 'video') ? 'crosshair' : 'default'
        }}
      >
        {creationMode === 'text' ? (
          /* Text Story Canvas */
          <div style={{
            width: '100%',
            height: '100%',
            background: textBgGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            textAlign: 'center'
          }}>
            <textarea
              rows={4}
              value={textStoryContent}
              onChange={(e) => setTextStoryContent(e.target.value)}
              placeholder="Tapez votre texte ici... 🎵"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '1.4rem',
                fontWeight: 800,
                textAlign: 'center',
                outline: 'none',
                resize: 'none',
                textShadow: '0 4px 14px rgba(0,0,0,0.5)'
              }}
            />
          </div>
        ) : creationMode === 'audio' ? (
          /* Audio Story Canvas */
          <div style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 50% 35%, #1E293B 0%, #0F172A 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: isRecordingAudio ? '#EF4444' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: isRecordingAudio ? '0 0 35px rgba(239, 68, 68, 0.7)' : '0 10px 30px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.2s ease'
            }}>
              <Mic size={52} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>
              Story Vocal Audio
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '24px', maxWidth: '80%' }}>
              {isRecordingAudio
                ? `🔴 Enregistrement en cours... (${recordingSeconds}s)`
                : audioBlobUrl
                ? `✅ Vocal enregistré (${recordingSeconds || 5}s)`
                : 'Maintenez le bouton micro ci-dessous enfoncé pour enregistrer votre vocal'}
            </p>

            {audioBlobUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={toggleAudioPlaybackPreview}
                  style={{
                    background: '#8B5CF6',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '10px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {isPlayingAudioPreview ? <Pause size={16} fill="#FFF" /> : <Play size={16} fill="#FFF" />} Écouter
                </button>

                <button
                  onClick={() => {
                    setAudioBlobUrl(null);
                    setRecordingSeconds(0);
                    setIsPlayingAudioPreview(false);
                  }}
                  title="Recommencer"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    border: '1px solid #EF4444',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* WhatsApp Style Live Camera Stream Viewport */
          <>
            {capturedImage ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={capturedImage} alt="Preview Backdrop" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(0.4)', opacity: 0.75 }} />
                <img src={capturedImage} alt="Preview Story" style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#030712' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                />

                {/* Optional 3x3 Rule-of-Thirds Grid Overlay */}
                {gridEnabled && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gridTemplateRows: '1fr 1fr 1fr',
                    opacity: 0.25
                  }}>
                    <div style={{ borderRight: '1px solid #FFF', borderBottom: '1px solid #FFF' }} />
                    <div style={{ borderRight: '1px solid #FFF', borderBottom: '1px solid #FFF' }} />
                    <div style={{ borderBottom: '1px solid #FFF' }} />
                    <div style={{ borderRight: '1px solid #FFF', borderBottom: '1px solid #FFF' }} />
                    <div style={{ borderRight: '1px solid #FFF', borderBottom: '1px solid #FFF' }} />
                    <div style={{ borderBottom: '1px solid #FFF' }} />
                    <div style={{ borderRight: '1px solid #FFF' }} />
                    <div style={{ borderRight: '1px solid #FFF' }} />
                    <div />
                  </div>
                )}

                {/* Tap-to-Focus Indicator Animation */}
                {focusPoint && (
                  <div style={{
                    position: 'absolute',
                    left: focusPoint.x - 25,
                    top: focusPoint.y - 25,
                    width: '50px',
                    height: '50px',
                    border: '2px solid #0066FF',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    animation: 'ping 0.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                    boxShadow: '0 0 16px rgba(0, 102, 255, 0.8)'
                  }} />
                )}

                {/* Viewfinder Corner Framing Target Lines */}
                <div style={{
                  position: 'absolute',
                  inset: '60px 24px 140px 24px',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '22px', height: '22px', borderLeft: '3px solid rgba(255,255,255,0.7)', borderTop: '3px solid rgba(255,255,255,0.7)', borderRadius: '4px 0 0 0' }} />
                    <div style={{ width: '22px', height: '22px', borderRight: '3px solid rgba(255,255,255,0.7)', borderTop: '3px solid rgba(255,255,255,0.7)', borderRadius: '0 4px 0 0' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '22px', height: '22px', borderLeft: '3px solid rgba(255,255,255,0.7)', borderBottom: '3px solid rgba(255,255,255,0.7)', borderRadius: '0 0 0 4px' }} />
                    <div style={{ width: '22px', height: '22px', borderRight: '3px solid rgba(255,255,255,0.7)', borderBottom: '3px solid rgba(255,255,255,0.7)', borderRadius: '0 0 4px 0' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* WHATSAPP-STYLE HEADER OVERLAY */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        paddingTop: 'calc(16px + env(safe-area-inset-top, 16px))',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo size="small" variant="icon-only" />
          
          <button
            onClick={() => setIsPrivacyModalOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#FFF',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              marginLeft: '8px'
            }}
          >
            <Shield size={14} fill={privacyType === 'all_contacts' ? 'none' : '#22C55E'} color={privacyType === 'all_contacts' ? '#FFF' : '#22C55E'} />
            {privacyType === 'all_contacts' ? 'Public' : (privacyType === 'include_only' ? 'Restreint' : 'Exclusif')}
          </button>
        </div>

        {/* Quick Camera Utilities (Flash, Grid, Switch Camera) */}
        {(creationMode === 'camera' || creationMode === 'video') && !capturedImage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <button
              onClick={() => setFlashEnabled(!flashEnabled)}
              title="Toggle Flash"
              style={{ background: 'none', border: 'none', color: flashEnabled ? '#F59E0B' : '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {flashEnabled ? <Zap size={18} fill="#F59E0B" /> : <ZapOff size={18} />}
            </button>

            <button
              onClick={() => setGridEnabled(!gridEnabled)}
              title="Toggle Grid"
              style={{ background: 'none', border: 'none', color: gridEnabled ? '#0066FF' : '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Grid size={18} />
            </button>

            <button
              onClick={toggleCameraFacingMode}
              title="Changer de caméra"
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Repeat size={18} />
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.5)',
            color: '#FFF',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Hidden File Input for Gallery Selection */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleMediaUpload} style={{ display: 'none' }} />

      {/* WHATSAPP-STYLE BOTTOM ACTION & SHUTTER BAR */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        paddingTop: '12px',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)'
      }}>
        {/* MODE SWITCHER CAROUSEL (PHOTO | VIDÉO | TEXTE | VOCAL) */}
        {!capturedImage && !resharedStoryData && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '18px' }}>
            <button
              onClick={() => setCreationMode('camera')}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                background: creationMode === 'camera' ? '#0066FF' : 'rgba(0,0,0,0.5)',
                color: '#FFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
              }}
            >
              PHOTO
            </button>
            <button
              onClick={() => setCreationMode('video')}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                background: creationMode === 'video' ? '#0066FF' : 'rgba(0,0,0,0.5)',
                color: '#FFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
              }}
            >
              VIDÉO
            </button>
            <button
              onClick={() => setCreationMode('text')}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                background: creationMode === 'text' ? '#0066FF' : 'rgba(0,0,0,0.5)',
                color: '#FFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
              }}
            >
              TEXTE
            </button>
            <button
              onClick={() => setCreationMode('audio')}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                background: creationMode === 'audio' ? '#0066FF' : 'rgba(0,0,0,0.5)',
                color: '#FFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)'
              }}
            >
              VOCAL
            </button>
          </div>
        )}

        {creationMode === 'text' ? (
          /* Text Story Controls */
          <div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
              {colorGradients.map((g) => (
                <button
                  key={g.name}
                  onClick={() => setTextBgGradient(g.bg)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: g.bg,
                    border: textBgGradient === g.bg ? '3px solid #FFFFFF' : '1px solid rgba(255,255,255,0.4)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>

            <button
              onClick={handlePublishStory}
              disabled={isPublishDisabled}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                background: isPublishDisabled ? '#64748B' : 'linear-gradient(135deg, #0066FF, #0047FF)',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: isPublishDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: isPublishDisabled ? 0.6 : 1,
                boxShadow: isPublishDisabled ? 'none' : '0 6px 20px rgba(0, 102, 255, 0.4)'
              }}
            >
              <Check size={18} /> {resharedStoryData ? 'Publier le Repartage' : 'Publier la Story Texte'}
            </button>
          </div>
        ) : creationMode === 'audio' ? (
          /* Audio Story Controls */
          <div>
            <div style={{ marginBottom: '20px', userSelect: 'none' }}>
              <button
                onMouseDown={handleHoldStartRecording}
                onMouseUp={handleHoldReleaseRecording}
                onTouchStart={handleHoldStartRecording}
                onTouchEnd={handleHoldReleaseRecording}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: isRecordingAudio ? '#EF4444' : '#8B5CF6',
                  color: '#FFF',
                  border: '5px solid #FFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transform: isRecordingAudio ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s ease, background 0.15s ease',
                  boxShadow: isRecordingAudio ? '0 0 35px rgba(239, 68, 68, 0.7)' : '0 0 24px rgba(139, 92, 246, 0.5)'
                }}
              >
                <Mic size={36} />
              </button>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '8px' }}>
                {isRecordingAudio ? 'Relâchez pour terminer' : 'Maintenez appuyé pour enregistrer un vocal'}
              </p>
            </div>

            <button
              onClick={handlePublishStory}
              disabled={isPublishDisabled}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                background: isPublishDisabled ? '#64748B' : 'linear-gradient(135deg, #0066FF, #0047FF)',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: isPublishDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: isPublishDisabled ? 0.6 : 1,
                boxShadow: isPublishDisabled ? 'none' : '0 6px 20px rgba(0, 102, 255, 0.4)'
              }}
            >
              <Check size={18} /> {resharedStoryData ? 'Publier le Repartage' : 'Publier la Story Vocal Audio'}
            </button>
          </div>
        ) : (
          /* WhatsApp Style Camera Shutter Controls */
          <>
            {!resharedStoryData && !capturedImage && (
              <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', alignItems: 'center' }}>
                {/* Gallery Picker Icon */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Galerie"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    width: '46px',
                    height: '46px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ImageIcon size={22} />
                </button>

                {/* WhatsApp-Style Shutter Release Button */}
                <button
                  onClick={handleTakeSnapshot}
                  title="Prendre une photo instantanée"
                  style={{
                    width: '82px',
                    height: '82px',
                    borderRadius: '50%',
                    border: '5px solid #FFFFFF',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 0 28px rgba(0, 102, 255, 0.7)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#FFFFFF' }} />
                </button>

                {/* Flip Camera Icon Button */}
                <button
                  onClick={toggleCameraFacingMode}
                  title="Changer de caméra"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    width: '46px',
                    height: '46px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Repeat size={22} />
                </button>
              </div>
            )}

            {capturedImage && (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <textarea
                  rows={2}
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Écrire une légende..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#FFF',
                    border: '1px solid rgba(255,255,255,0.3)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    marginBottom: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      startCameraFeed();
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RotateCcw size={16} /> Recommencer
                  </button>

                  <button
                    onClick={handlePublishStory}
                    disabled={isPublishDisabled}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '16px',
                      border: 'none',
                      background: isPublishDisabled ? '#64748B' : 'linear-gradient(135deg, #0066FF, #0047FF)',
                      color: '#FFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: isPublishDisabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: isPublishDisabled ? 0.6 : 1,
                      boxShadow: isPublishDisabled ? 'none' : '0 6px 20px rgba(0, 102, 255, 0.4)'
                    }}
                  >
                    <Check size={18} /> {resharedStoryData ? 'Publier le Repartage' : 'Publier la Story StageLink'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Privacy Settings Modal Overlay */}
      {isPrivacyModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ margin: 0, color: '#FFF', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="#22C55E" /> Confidentialité
            </h2>
            <button onClick={() => setIsPrivacyModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          {/* Privacy Type Selector */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: 0, marginBottom: '16px' }}>Qui peut voir mon statut ?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FFF', cursor: 'pointer', background: privacyType === 'all_contacts' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: privacyType === 'all_contacts' ? '1px solid #22C55E' : '1px solid transparent' }}>
                <input type="radio" checked={privacyType === 'all_contacts'} onChange={() => { setPrivacyType('all_contacts'); setAudienceRules([]); }} style={{ display: 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>Mes contacts (Abonnés)</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Tous vos contacts actuels.</div>
                </div>
                {privacyType === 'all_contacts' && <Check size={18} color="#22C55E" />}
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FFF', cursor: 'pointer', background: privacyType === 'exclude' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: privacyType === 'exclude' ? '1px solid #22C55E' : '1px solid transparent' }}>
                <input type="radio" checked={privacyType === 'exclude'} onChange={() => setPrivacyType('exclude')} style={{ display: 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>Mes contacts sauf...</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Masquer à certains abonnés.</div>
                </div>
                {privacyType === 'exclude' && <Check size={18} color="#22C55E" />}
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FFF', cursor: 'pointer', background: privacyType === 'include_only' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: privacyType === 'include_only' ? '1px solid #22C55E' : '1px solid transparent' }}>
                <input type="radio" checked={privacyType === 'include_only'} onChange={() => setPrivacyType('include_only')} style={{ display: 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>Ne partager qu'avec...</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Afficher à une sélection d'amis proches.</div>
                </div>
                {privacyType === 'include_only' && <Check size={18} color="#22C55E" />}
              </label>

              {/* Allow Reshare Toggle */}
              <div 
                onClick={() => setAllowReshare(!allowReshare)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', 
                  cursor: 'pointer', marginTop: '6px' 
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#FFF', fontSize: '0.9rem' }}>Autoriser le repartage</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Permettre aux autres de repartager cette story.</div>
                </div>
                <div style={{ color: allowReshare ? '#22C55E' : '#475569' }}>
                  {allowReshare ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
              </div>
            </div>
          </div>

          {/* User Selection List (Only if exclude or include) */}
          {privacyType !== 'all_contacts' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#FFF', fontSize: '0.95rem' }}>Sélectionner les utilisateurs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {users.length > 0 ? users.map(user => {
                  const isSelected = audienceRules.includes(user.id);
                  return (
                    <div 
                      key={user.id} 
                      onClick={() => {
                        if (isSelected) {
                          setAudienceRules(audienceRules.filter(id => id !== user.id));
                        } else {
                          setAudienceRules([...audienceRules, user.id]);
                        }
                      }}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', 
                        background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer' 
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserAvatar user={user} size={36} />
                        <div>
                          <div style={{ color: '#FFF', fontWeight: '500', fontSize: '0.9rem' }}>{user.full_name || user.name}</div>
                          <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{user.role}</div>
                        </div>
                      </div>
                      <div style={{ color: isSelected ? '#22C55E' : '#475569' }}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                    </div>
                  );
                }) : (
                  <p style={{ color: '#94A3B8', fontSize: '0.9rem', textAlign: 'center' }}>Aucun contact disponible pour le moment.</p>
                )}
              </div>
            </div>
          )}
          
          {/* Action Bar */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              onClick={() => setIsPrivacyModalOpen(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#22C55E',
                color: '#FFF',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Appliquer la configuration
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
