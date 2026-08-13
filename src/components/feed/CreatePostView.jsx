import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Image, Video, Trash2, Send, Eye, Globe, Lock, Mic, Play, Pause, X, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../services/audioService';
import UserAvatar from '../common/UserAvatar';
import confetti from 'canvas-confetti';

export default function CreatePostView({ onBack, onSubmitPost, isDarkMode }) {
  const { currentUser } = useAuth();

  // States with Draft Loading
  const [postText, setPostText] = useState(() => {
    return localStorage.getItem('stagelink_post_draft_text') || '';
  });

  const [selectedMediaList, setSelectedMediaList] = useState([]); // Array of { type: 'image' | 'video', url: string }
  const [hasAudio, setHasAudio] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);

  const [visibility, setVisibility] = useState('public'); // 'public' | 'members'
  const [activeTabMode, setActiveTabMode] = useState('edit'); // 'edit' | 'preview'

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Draft Auto-Save
  useEffect(() => {
    localStorage.setItem('stagelink_post_draft_text', postText);
  }, [postText]);

  if (!currentUser) return null;

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      soundEngine.playPopSound();
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedMediaList(prev => [...prev, { type: 'image', url: reader.result }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      soundEngine.playPopSound();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMediaList(prev => [...prev, { type: 'video', url: reader.result }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = (index) => {
    soundEngine.playPopSound();
    setSelectedMediaList(prev => prev.filter((_, i) => i !== index));
  };

  // AUDIO RECORDING LOGIC
  const handleStartMicRecord = async () => {
    soundEngine.playPopSound();
    if (navigator.vibrate) navigator.vibrate(50);

    setRecordedAudioUrl(null);
    setHasAudio(false);
    setIsPlayingAudioPreview(false);
    audioChunksRef.current = [];
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecordingMic(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Mic access notice:', err.message);
    }
  };

  const handleStopMicRecord = () => {
    if (!isRecordingMic) return;
    soundEngine.playPopSound();

    clearInterval(recordingTimerRef.current);
    setIsRecordingMic(false);
    setHasAudio(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
  };

  const toggleAudioPlayback = () => {
    if (isPlayingAudioPreview) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setIsPlayingAudioPreview(false);
    } else {
      if (recordedAudioUrl) {
        const audio = new Audio(recordedAudioUrl);
        audioPlayerRef.current = audio;
        audio.play();
        audio.onended = () => setIsPlayingAudioPreview(false);
        setIsPlayingAudioPreview(true);
      }
    }
  };

  const handlePublish = () => {
    if (!postText.trim() && selectedMediaList.length === 0 && !hasAudio) return;

    soundEngine.playPopSound();
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) { console.error("Suppressed error", e); }

    onSubmitPost({
      text: postText,
      mediaList: selectedMediaList,
      hasAudio: hasAudio,
      audioUrl: recordedAudioUrl,
      visibility: visibility
    });

    localStorage.removeItem('stagelink_post_draft_text');
    onBack();
  };

  const isFormValid = postText.trim().length > 0 || selectedMediaList.length > 0 || hasAudio;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 140,
      background: isDarkMode ? '#0B0F19' : '#F8FAFC',
      color: isDarkMode ? '#F8FAFC' : '#0F172A',
      display: 'flex',
      flexDirection: 'column',
      WebkitUserSelect: 'none',
      userSelect: 'none'
    }}>
      {/* Header */}
      <div style={{
        background: isDarkMode ? '#151D2A' : '#FFFFFF',
        paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Créer une Publication</h2>
        </div>
        <button
          onClick={handlePublish}
          disabled={!isFormValid}
          style={{
            background: isFormValid ? 'linear-gradient(135deg, #0066FF, #0047FF)' : (isDarkMode ? '#1E293B' : '#E2E8F0'),
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: isFormValid ? 'pointer' : 'not-allowed',
            opacity: isFormValid ? 1 : 0.6
          }}
        >
          <Send size={15} /> Publier
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: isDarkMode ? '#151D2A' : '#FFFFFF', padding: '8px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px' }}>
        <button onClick={() => setActiveTabMode('edit')} style={{ flex: 1, padding: '8px', borderRadius: '12px', border: 'none', background: activeTabMode === 'edit' ? '#0066FF' : 'transparent', color: activeTabMode === 'edit' ? '#FFF' : 'inherit', fontWeight: 700 }}>Éditer</button>
        <button onClick={() => setActiveTabMode('preview')} style={{ flex: 1, padding: '8px', borderRadius: '12px', border: 'none', background: activeTabMode === 'preview' ? '#0066FF' : 'transparent', color: activeTabMode === 'preview' ? '#FFF' : 'inherit', fontWeight: 700 }}>Aperçu</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 120px 16px' }}>
        {activeTabMode === 'preview' ? (
          <div style={{ background: isDarkMode ? '#151D2A' : '#FFFFFF', borderRadius: '20px', padding: '16px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <UserAvatar user={currentUser} size={40} />
              <div><h4 style={{ margin: 0, fontSize: '0.9rem' }}>{currentUser.name}</h4><span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{currentUser.role}</span></div>
            </div>
            <p style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>{postText || 'Texte de la publication...'}</p>
            {selectedMediaList.map((media, i) => (
              <div key={i} style={{ marginBottom: '10px', borderRadius: '12px', overflow: 'hidden' }}>
                {media.type === 'image' ? <img src={media.url} style={{ width: '100%' }} /> : <video src={media.url} controls style={{ width: '100%' }} />}
              </div>
            ))}
            {hasAudio && (
              <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0066FF' }}>
                <Mic size={18} /> <span>Vocal joint ({recordingTime}s)</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Visibility Selector */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setVisibility(v => v === 'public' ? 'members' : 'public')} style={{ background: '#EFF6FF', color: '#0066FF', border: 'none', borderRadius: '12px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {visibility === 'public' ? <Globe size={14} /> : <Lock size={14} />} {visibility === 'public' ? 'Public' : 'Membres'}
              </button>
            </div>

            {/* Textarea */}
            <textarea
              rows={6}
              placeholder="Qu'avez-vous à partager ?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              style={{ width: '100%', background: isDarkMode ? '#151D2A' : '#FFF', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '16px', fontSize: '1rem', color: 'inherit', resize: 'none', outline: 'none' }}
            />

            {/* Media List */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {selectedMediaList.map((media, i) => (
                <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  {media.type === 'image' ? <img src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <button onClick={() => removeMedia(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: 4, color: '#FFF' }}><X size={12} /></button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} style={{ width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed var(--border-light)', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={24} /></button>
            </div>

            {/* Audio Widget */}
            {hasAudio && (
              <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0066FF' }}>
                  <button onClick={toggleAudioPlayback} style={{ background: '#0066FF', color: '#FFF', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isPlayingAudioPreview ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                  </button>
                  <span style={{ fontWeight: 700 }}>Vocal enregistré ({recordingTime}s)</span>
                </div>
                <button onClick={() => { setHasAudio(false); setRecordedAudioUrl(null); }} style={{ background: 'transparent', border: 'none', color: '#EF4444' }}><Trash2 size={18} /></button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {activeTabMode === 'edit' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: isDarkMode ? '#151D2A' : '#FFF', borderTop: '1px solid var(--border-light)', padding: '12px 16px max(16px, env(safe-area-inset-bottom, 16px))', display: 'flex', gap: '10px' }}>
          <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: '#EFF6FF', color: '#0066FF', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Image size={20} /> Photo</button>
          <button onClick={() => videoInputRef.current?.click()} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: '#ECFDF5', color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Video size={20} /> Vidéo</button>
          <button
            onMouseDown={handleStartMicRecord}
            onMouseUp={handleStopMicRecord}
            onTouchStart={handleStartMicRecord}
            onTouchEnd={handleStopMicRecord}
            style={{ flex: 1, padding: '12px', borderRadius: '16px', border: 'none', background: isRecordingMic ? '#FEF2F2' : '#F5F3FF', color: isRecordingMic ? '#EF4444' : '#8B5CF6', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transform: isRecordingMic ? 'scale(1.05)' : 'none', transition: 'all 0.2s' }}
          >
            <Mic size={20} /> {isRecordingMic ? 'Rec...' : 'Vocal'}
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
      <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} style={{ display: 'none' }} />
    </div>
  );
}
