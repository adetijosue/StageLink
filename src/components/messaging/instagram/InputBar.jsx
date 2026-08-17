import React, { useState, useRef } from 'react';
import { 
  Send, 
  Image, 
  Paperclip, 
  Mic, 
  Eye, 
  X, 
  Trash2, 
  FileText, 
  Music, 
  Play, 
  Pause,
  Film
} from 'lucide-react';
import { useVoiceRecorder } from '../../../hooks/useVoiceRecorder';
import { soundEngine } from '../../../services/audioService';
import { useLanguage } from '../../../context/LanguageContext';

export default function InputBar({
  replyingTo,
  onCancelReply,
  onSendMessage,
  onTyping
}) {
  const { t, language } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const photoVideoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const docInputRef = useRef(null);

  const {
    isRecording,
    recordingTime,
    audioPreviewData,
    isPlayingPreview,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording,
    togglePlayPreview
  } = useVoiceRecorder();

  const handleTextChange = (e) => {
    setInputText(e.target.value);
    if (onTyping) onTyping(e.target.value.length > 0);
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    onSendMessage({
      text: inputText.trim(),
      mediaType: 'text'
    });
    setInputText('');
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Dispatch Voice Note
  const handleSendVoiceNote = (customPreview) => {
    const dataToSend = customPreview || audioPreviewData;
    if (!dataToSend?.blob) return;

    soundEngine.playPopSound();
    onSendMessage({
      mediaBlob: dataToSend.blob,
      mediaType: 'audio',
      metadata: {
        fileName: `vocal_${Date.now()}.webm`,
        duration: dataToSend.duration || '00:00',
        durationSeconds: dataToSend.durationSeconds || 1,
        waveform: dataToSend.waveform || [],
        view_once: isViewOnce
      }
    });

    cancelRecording();
    setIsViewOnce(false);
  };

  // Direct Send while actively recording
  const handleDirectSendRecording = () => {
    stopRecording((preview) => {
      handleSendVoiceNote(preview);
    });
  };

  // Handle Photo & Video Selection
  const handlePhotoVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playPopSound();
    const isVideo = file.type.startsWith('video/');

    onSendMessage({
      mediaBlob: file,
      mediaType: isVideo ? 'video' : 'image',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        view_once: isViewOnce
      }
    });

    e.target.value = '';
    setIsViewOnce(false);
    setShowAttachMenu(false);
  };

  // Handle Audio & Music File Selection
  const handleAudioFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playPopSound();

    onSendMessage({
      mediaBlob: file,
      mediaType: 'audio',
      text: file.name,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'audio/mpeg',
        view_once: isViewOnce
      }
    });

    e.target.value = '';
    setIsViewOnce(false);
    setShowAttachMenu(false);
  };

  // Handle Document & Project File Selection
  const handleDocSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playPopSound();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    const determinedType = isVideo ? 'video' : isImage ? 'image' : isAudio ? 'audio' : 'file';

    onSendMessage({
      mediaBlob: file,
      mediaType: determinedType,
      text: determinedType === 'file' ? file.name : '',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        view_once: isViewOnce
      }
    });

    e.target.value = '';
    setIsViewOnce(false);
    setShowAttachMenu(false);
  };

  return (
    <div style={{
      padding: '8px 14px calc(10px + env(safe-area-inset-bottom, 10px)) 14px',
      background: 'var(--card-bg)',
      borderTop: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative'
    }}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={photoVideoInputRef}
        onChange={handlePhotoVideoSelect}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={audioInputRef}
        onChange={handleAudioFileSelect}
        accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a,.mid,.midi"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocSelect}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.json,.rtf,.xls,.xlsx,.ppt,.pptx"
        style={{ display: 'none' }}
      />

      {/* Quoted Message Header Banner */}
      {replyingTo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 102, 255, 0.08)',
          padding: '6px 12px',
          borderRadius: '12px',
          borderLeft: '3px solid #0066FF'
        }}>
          <div style={{ fontSize: '0.78rem' }}>
            <span style={{ fontWeight: 700, color: '#0066FF' }}>{language === 'en' ? 'Replying to ' : 'Répondre à '}</span>
            <span style={{ color: 'var(--text-dark)' }}>{replyingTo.content || (language === 'en' ? 'Media' : 'Média')}</span>
          </div>
          <button
            onClick={onCancelReply}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Pop-up Attachment Menu */}
      {showAttachMenu && (
        <>
          <div
            onClick={() => setShowAttachMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '14px',
              marginBottom: '10px',
              background: 'var(--card-bg)',
              borderRadius: '20px',
              padding: '10px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '220px',
              zIndex: 101,
              animation: 'slideUpFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button
              onClick={() => {
                photoVideoInputRef.current?.click();
                setShowAttachMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-dark)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: '#EFF6FF',
                  color: '#0066FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Image size={18} />
              </div>
              {language === 'en' ? 'Photos & Videos' : 'Photos & Vidéos'}
            </button>

            <button
              onClick={() => {
                audioInputRef.current?.click();
                setShowAttachMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-dark)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: '#F5F3FF',
                  color: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Music size={18} />
              </div>
              {language === 'en' ? 'Audio & Beats' : 'Audios & Beats'}
            </button>

            <button
              onClick={() => {
                docInputRef.current?.click();
                setShowAttachMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-dark)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={18} />
              </div>
              {language === 'en' ? 'Documents & Files' : 'Documents & Fichiers'}
            </button>
          </div>
        </>
      )}

      {/* Voice Recording Active Bar */}
      {isRecording ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FEF2F2',
          padding: '8px 16px',
          borderRadius: '24px',
          border: '1px solid #FCA5A5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#EF4444',
              animation: 'pulse 1s infinite'
            }} />
            <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>
              {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Realtime Waveform Animation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '22px', flex: 1, margin: '0 16px', justifyContent: 'center' }}>
            {(waveformData.length > 0 ? waveformData.slice(-20) : [20, 40, 60, 30, 80, 50, 70, 40, 60]).map((amp, idx) => (
              <div
                key={idx}
                style={{
                  width: '3px',
                  height: `${Math.max(4, Math.min(22, amp * 0.22))}px`,
                  background: '#EF4444',
                  borderRadius: '2px',
                  transition: 'height 0.05s ease'
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={cancelRecording}
              title={language === 'en' ? 'Discard recording' : 'Annuler'}
              style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px' }}
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleDirectSendRecording}
              title={language === 'en' ? 'Send voice note' : 'Envoyer la note vocale'}
              style={{
                background: '#0066FF',
                color: '#FFF',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0, 102, 255, 0.3)'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : audioPreviewData ? (
        /* Voice Note Preview Ready to Send or Listen */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#EFF6FF',
          padding: '8px 16px',
          borderRadius: '24px',
          border: '1px solid #BFDBFE'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={togglePlayPreview}
              style={{
                background: '#0066FF',
                color: '#FFF',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isPlayingPreview ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
            </button>
            <span style={{ fontSize: '0.85rem', color: '#0066FF', fontWeight: 800 }}>
              {language === 'en' ? '🎙️ Voice note' : '🎙️ Note vocale'} ({audioPreviewData.duration})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={cancelRecording}
              title={language === 'en' ? 'Discard' : 'Supprimer'}
              style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px' }}
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => handleSendVoiceNote()}
              title={language === 'en' ? 'Send' : 'Envoyer'}
              style={{
                background: '#0066FF',
                color: '#FFF',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0, 102, 255, 0.3)'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* Regular Input Controls */
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Attachment Menu Trigger (Paperclip) */}
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            title={language === 'en' ? 'Attach file (Photo, Video, Audio, Document)' : 'Joindre un fichier (Photo, Vidéo, Audio, Document)'}
            style={{
              background: showAttachMenu ? 'rgba(0, 102, 255, 0.15)' : 'transparent',
              color: showAttachMenu ? '#0066FF' : '#94A3B8',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <Paperclip size={20} />
          </button>

          {/* Quick Photo / Video Button */}
          <button
            onClick={() => photoVideoInputRef.current?.click()}
            title={language === 'en' ? 'Send a Photo or Video' : 'Envoyer une Photo ou Vidéo'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image size={21} />
          </button>

          {/* View Once Ephemeral Toggle */}
          <button
            onClick={() => setIsViewOnce(!isViewOnce)}
            title={isViewOnce ? (language === 'en' ? 'View once enabled' : 'Vue unique activée') : (language === 'en' ? 'Enable view once' : 'Activer vue unique')}
            style={{
              background: isViewOnce ? 'rgba(0, 102, 255, 0.15)' : 'transparent',
              color: isViewOnce ? '#0066FF' : '#94A3B8',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Eye size={19} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={t('chat_placeholder')}
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '22px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-light)',
              color: 'var(--text-dark)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />

          {/* Send or Voice Record Button */}
          {inputText.trim() ? (
            <button
              onClick={handleSendText}
              style={{
                background: '#0066FF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0, 102, 255, 0.3)'
              }}
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              onClick={startRecording}
              title={language === 'en' ? 'Hold or tap to record voice note' : 'Enregistrer une note vocale'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0066FF',
                cursor: 'pointer',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Mic size={22} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
