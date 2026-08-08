import React, { useState, useRef } from 'react';
import { X, Image, Video, Music, Check, Eye, Trash2, Send, Mic, Play, Pause, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../services/audioService';
import UserAvatar from '../common/UserAvatar';
import confetti from 'canvas-confetti';

export default function CreatePostModal({ isOpen, onClose, onSubmitPost }) {
  const { currentUser } = useAuth();
  const [postText, setPostText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null); // image URL or Data URL
  const [selectedVideo, setSelectedVideo] = useState(null); // video URL or Data URL
  const [hasAudio, setHasAudio] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  if (!isOpen || !currentUser) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia(reader.result);
        setSelectedVideo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedVideo(reader.result);
        setSelectedMedia(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // HOLD-TO-RECORD MIC HANDLERS
  const handleHoldStartMicRecord = async (e) => {
    if (e) e.preventDefault();
    if (isRecordingMic) return;

    soundEngine.playPopSound();
    if (navigator.vibrate) navigator.vibrate(50);

    setRecordedAudioUrl(null);
    setHasAudio(false);
    setIsPlayingAudioPreview(false);
    audioChunksRef.current = [];
    setRecordingTime(0);

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
      console.warn('Mic access notice:', err.message);
    }

    setIsRecordingMic(true);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handleHoldReleaseMicRecord = (e) => {
    if (e) e.preventDefault();
    if (!isRecordingMic) return;

    soundEngine.playPopSound();
    if (navigator.vibrate) navigator.vibrate(30);

    clearInterval(recordingTimerRef.current);
    setIsRecordingMic(false);
    setHasAudio(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      setRecordedAudioUrl('simulated_vocal_post_url');
    }
  };

  const toggleAudioPlayback = () => {
    if (isPlayingAudioPreview) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      soundEngine.stop();
      setIsPlayingAudioPreview(false);
    } else {
      if (recordedAudioUrl && recordedAudioUrl !== 'simulated_vocal_post_url') {
        const audio = new Audio(recordedAudioUrl);
        audioPlayerRef.current = audio;
        audio.play();
        audio.onended = () => setIsPlayingAudioPreview(false);
      } else {
        soundEngine.generateAndPlay(120, 'Afro-Gospel');
      }
      setIsPlayingAudioPreview(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!postText.trim() && !selectedMedia && !selectedVideo && !hasAudio) return;

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    onSubmitPost({
      text: postText,
      image: selectedMedia,
      video: selectedVideo,
      hasAudio: hasAudio,
      audioUrl: recordedAudioUrl
    });

    setPostText('');
    setSelectedMedia(null);
    setSelectedVideo(null);
    setHasAudio(false);
    setRecordedAudioUrl(null);
    setIsPreviewMode(false);
    onClose();
  };

  const isSubmitDisabled = !postText.trim() && !selectedMedia && !selectedVideo && !hasAudio;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: '480px',
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Sticky Header Bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#FFFFFF',
          paddingBottom: '12px',
          marginBottom: '16px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {isPreviewMode ? 'Aperçu de la publication' : 'Créer une publication'}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              style={{
                background: isPreviewMode ? '#EFF6FF' : '#F1F5F9',
                color: isPreviewMode ? '#0066FF' : '#64748B',
                border: 'none',
                borderRadius: '16px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Eye size={14} /> {isPreviewMode ? 'Éditer' : 'Aperçu Direct'}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                minWidth: '40px',
                minHeight: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} color="#0F172A" />
            </button>
          </div>
        </div>

        {/* Live Preview Card Mode */}
        {isPreviewMode ? (
          <div style={{ background: '#F8FAFC', borderRadius: '18px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <UserAvatar user={currentUser} size={40} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{currentUser.name}</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{currentUser.role} • À l'instant</span>
              </div>
            </div>

            {postText && (
              <p style={{ fontSize: '0.88rem', color: '#1E293B', lineHeight: 1.5, marginBottom: '12px', whiteSpace: 'pre-line' }}>
                {postText}
              </p>
            )}

            {/* Audio Preview */}
            {hasAudio && (
              <div style={{ background: '#EFF6FF', borderRadius: '14px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', border: '1px solid #BFDBFE' }}>
                <button
                  onClick={toggleAudioPlayback}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0066FF', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {isPlayingAudioPreview ? <Pause size={16} fill="#FFF" /> : <Play size={16} fill="#FFF" style={{ marginLeft: '2px' }} />}
                </button>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0066FF' }}>
                  Extrait vocal audio enregistrée ({recordingTime || 5}s)
                </span>
              </div>
            )}

            {/* Video Preview */}
            {selectedVideo && (
              <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
                <video src={selectedVideo} controls style={{ width: '100%', maxHeight: '300px', display: 'block' }} />
              </div>
            )}

            {/* Image Preview */}
            {selectedMedia && (
              <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
                <img src={selectedMedia} alt="Aperçu" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}
          </div>
        ) : (
          /* Normal Editing Form */
          <form onSubmit={handleSubmit}>
            {/* Author Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <UserAvatar user={currentUser} size={42} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{currentUser.name}</h4>
                <span style={{ fontSize: '0.75rem', color: '#0066FF', fontWeight: 600 }}>{currentUser.role}</span>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              rows={4}
              placeholder="Exprimez-vous, partagez une démo audio, un projet ou une vidéo..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'none',
                marginBottom: '14px',
                background: '#F8FAFC'
              }}
            />

            {/* Audio Recording Attachment Widget */}
            {isRecordingMic ? (
              <div style={{ background: '#FEF2F2', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', border: '1px solid #FCA5A5' }}>
                <span style={{ fontSize: '0.82rem', color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'ping 1s infinite' }} />
                  Enregistrement en cours... ({recordingTime}s) - Relâchez pour finir
                </span>
              </div>
            ) : hasAudio && (
              <div style={{ background: '#EFF6FF', borderRadius: '14px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={toggleAudioPlayback}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0066FF', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    {isPlayingAudioPreview ? <Pause size={14} fill="#FFF" /> : <Play size={14} fill="#FFF" style={{ marginLeft: '2px' }} />}
                  </button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0066FF' }}>
                    Extrait vocal audio joint ({recordingTime || 5}s)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHasAudio(false);
                    setRecordedAudioUrl(null);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {/* Video Attachment Preview Bar */}
            {selectedVideo && (
              <div style={{ position: 'relative', marginBottom: '14px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <video src={selectedVideo} controls style={{ width: '100%', maxHeight: '220px', display: 'block' }} />
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#FFF', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Image Attachment Preview Bar */}
            {selectedMedia && (
              <div style={{ position: 'relative', marginBottom: '14px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <img src={selectedMedia} alt="Aperçu visuel" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#FFF', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Hidden Inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} style={{ display: 'none' }} />

            {/* Attachments Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: selectedMedia ? '#EFF6FF' : '#F8FAFC',
                  color: selectedMedia ? '#0066FF' : '#64748B',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Image size={15} /> Photo
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                style={{
                  background: selectedVideo ? '#EFF6FF' : '#F8FAFC',
                  color: selectedVideo ? '#0066FF' : '#64748B',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Video size={15} /> Vidéo
              </button>

              {/* Hold-To-Record Microphone Button */}
              <button
                type="button"
                onMouseDown={handleHoldStartMicRecord}
                onMouseUp={handleHoldReleaseMicRecord}
                onTouchStart={handleHoldStartMicRecord}
                onTouchEnd={handleHoldReleaseMicRecord}
                style={{
                  background: isRecordingMic ? '#EF4444' : hasAudio ? '#EFF6FF' : '#F8FAFC',
                  color: isRecordingMic ? '#FFFFFF' : hasAudio ? '#0066FF' : '#64748B',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <Mic size={15} /> {isRecordingMic ? 'Enregistrement...' : 'Vocal'}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ flex: 1, padding: '12px', borderRadius: '16px', border: '1px solid #CBD5E1', background: '#FFF', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: isSubmitDisabled ? '#64748B' : 'linear-gradient(135deg, #0066FF, #0047FF)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isSubmitDisabled ? 0.6 : 1,
                  boxShadow: isSubmitDisabled ? 'none' : '0 6px 18px rgba(0, 102, 255, 0.35)'
                }}
              >
                <Send size={16} /> Publier le Post
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
