import React, { useState, useRef } from 'react';
import { Send, Image, Paperclip, Mic, Eye, X, Trash2, FileText, Film, Music } from 'lucide-react';
import { useVoiceRecorder } from '../../../hooks/useVoiceRecorder';
import { soundEngine } from '../../../services/audioService';

export default function InputBar({
  replyingTo,
  onCancelReply,
  onSendMessage,
  onTyping
}) {
  const [inputText, setInputText] = useState('');
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const {
    isRecording,
    recordingTime,
    audioPreviewData,
    startRecording,
    stopRecording,
    cancelRecording
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

  const handlePhotoVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playPopSound();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    onSendMessage({
      mediaBlob: file,
      mediaType: isVideo ? 'video' : 'image',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        view_once: isViewOnce
      }
    });

    e.target.value = '';
    setIsViewOnce(false);
    setShowAttachMenu(false);
  };

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
        ref={fileInputRef}
        onChange={handlePhotoVideoSelect}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocSelect}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.mp3,.wav,.ogg,.flac,.aac,.m4a,.json,.rtf,.xls,.xlsx,.ppt,.pptx"
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
            <span style={{ fontWeight: 700, color: '#0066FF' }}>Répondre à </span>
            <span style={{ color: 'var(--text-dark)' }}>{replyingTo.content || 'Média'}</span>
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
              minWidth: '210px',
              zIndex: 101,
              animation: 'slideUpFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button
              onClick={() => {
                fileInputRef.current?.click();
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
              Photos & Vidéos
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
              Documents & Fichiers
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
          padding: '10px 16px',
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
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
              {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={cancelRecording}
              style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={stopRecording}
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
                cursor: 'pointer'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : audioPreviewData ? (
        /* Voice Note Preview Ready to Send */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#EFF6FF',
          padding: '10px 16px',
          borderRadius: '24px',
          border: '1px solid #BFDBFE'
        }}>
          <span style={{ fontSize: '0.85rem', color: '#0066FF', fontWeight: 700 }}>
            🎙️ Vocal ({audioPreviewData.duration})
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={cancelRecording}
              style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={handleSendVoiceNote}
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
                cursor: 'pointer'
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
            title="Joindre un fichier (Photo, Vidéo, Document)"
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

          {/* Quick Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Envoyer une Photo ou Vidéo"
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
            title={isViewOnce ? 'Vue unique activée' : 'Activer vue unique'}
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
            placeholder="Votre message..."
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
