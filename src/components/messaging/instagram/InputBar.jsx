import React, { useState, useRef } from 'react';
import { Send, Image, Mic, MicOff, Eye, X, Trash2 } from 'lucide-react';
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
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
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
        view_once: isViewOnce
      }
    });

    e.target.value = '';
    setIsViewOnce(false);
  };

  const handleSendVoiceNote = () => {
    if (!audioPreviewData) return;

    onSendMessage({
      mediaBlob: audioPreviewData.blob,
      mediaType: 'audio',
      metadata: {
        duration: audioPreviewData.duration,
        durationSeconds: audioPreviewData.durationSeconds,
        waveform: audioPreviewData.waveform
      }
    });

    cancelRecording();
  };

  return (
    <div style={{
      padding: '8px 14px calc(10px + env(safe-area-inset-bottom, 10px)) 14px',
      background: 'var(--card-bg)',
      borderTop: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
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
          {/* View Once Ephemeral Toggle */}
          <button
            onClick={() => setIsViewOnce(!isViewOnce)}
            title={isViewOnce ? 'Vue unique activée' : 'Activer vue unique'}
            style={{
              background: isViewOnce ? 'rgba(0, 102, 255, 0.15)' : 'transparent',
              color: isViewOnce ? '#0066FF' : '#94A3B8',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Eye size={20} />
          </button>

          {/* Photo / Video Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image size={22} />
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Mic size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
