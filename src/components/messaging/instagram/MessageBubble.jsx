import React, { useState, useRef } from 'react';
import { Play, Pause, Heart, Eye, FileText, Download, Film, Music, Reply, File } from 'lucide-react';
import { soundEngine } from '../../../services/audioService';

export default function MessageBubble({
  message,
  isMine,
  isPreviousSameSender,
  isNextSameSender,
  onReply,
  onReact,
  onOpenMedia,
  onOpenReactionOverlay
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [heartAnim, setHeartAnim] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const audioRef = useRef(null);
  const lastTapRef = useRef(0);
  const touchStartRef = useRef(0);

  // Dynamic grouping corner radii
  const borderRadius = isMine
    ? `${isPreviousSameSender ? '18px' : '22px'} ${isPreviousSameSender ? '6px' : '22px'} ${isNextSameSender ? '6px' : '22px'} 18px`
    : `${isPreviousSameSender ? '6px' : '22px'} ${isPreviousSameSender ? '18px' : '22px'} 18px ${isNextSameSender ? '6px' : '22px'}`;

  // Double-tap to like handler
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      soundEngine.playPopSound();
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 900);
      if (onReact) onReact(message.id, '❤️');
    }
    lastTapRef.current = now;
  };

  // Swipe-to-Reply Touch Handlers
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - touchStartRef.current;
    if (deltaX > 0 && deltaX < 80) {
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 45 && onReply) {
      soundEngine.playPopSound();
      onReply(message);
    }
    setSwipeOffset(0);
  };

  // Toggle Voice Note Audio
  const togglePlayAudio = (e) => {
    e?.stopPropagation();
    if (!message.media_url) return;

    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioRef.current || audioRef.current.src !== message.media_url) {
        if (audioRef.current) {
          try { audioRef.current.pause(); } catch (_) {}
        }
        const audio = new Audio(message.media_url);
        audioRef.current = audio;
        audio.playbackRate = playbackSpeed;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
      }
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch((err) => {
        console.warn("Audio play error:", err);
        setIsPlayingAudio(false);
      });
      setIsPlayingAudio(true);
    }
  };

  const toggleSpeed = (e) => {
    e.stopPropagation();
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  const handleDownloadFile = (e, url, fileName) => {
    e.stopPropagation();
    if (!url) return;
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'fichier';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const isViewOnce = message.metadata?.view_once;
  const isViewed = message.metadata?.is_viewed;

  const fileName = message.metadata?.fileName || message.content || 'Document';
  const fileExt = fileName.split('.').pop()?.toUpperCase() || 'DOC';
  const fileSizeText = message.metadata?.fileSize
    ? message.metadata.fileSize > 1048576
      ? `${(message.metadata.fileSize / 1048576).toFixed(1)} MB`
      : `${(message.metadata.fileSize / 1024).toFixed(0)} KB`
    : 'Fichier joint';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        if (onOpenReactionOverlay) {
          onOpenReactionOverlay(message, { x: rect.x + rect.width / 2, y: rect.top });
        }
      }}
      onClick={handleDoubleTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        marginBottom: isNextSameSender ? '3px' : '10px',
        position: 'relative',
        transform: `translateX(${swipeOffset}px)`,
        transition: swipeOffset === 0 ? 'transform 0.2s ease' : 'none'
      }}
    >
      {/* Swipe to reply icon indicator */}
      {swipeOffset > 20 && (
        <div style={{
          position: 'absolute',
          left: '-32px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#0066FF'
        }}>
          <Reply size={18} />
        </div>
      )}

      {/* Quoted Message Header */}
      {message.metadata?.quotedMessage && (
        <div style={{
          background: isMine ? 'rgba(0, 102, 255, 0.12)' : 'rgba(241, 245, 249, 0.9)',
          borderRadius: '12px',
          padding: '4px 10px',
          fontSize: '0.75rem',
          color: isMine ? '#0066FF' : '#64748B',
          marginBottom: '3px',
          borderLeft: `3px solid ${isMine ? '#0066FF' : '#94A3B8'}`,
          maxWidth: '75%'
        }}>
          <span style={{ fontWeight: 700 }}>{message.metadata.quotedMessage.senderName}: </span>
          <span>{message.metadata.quotedMessage.content || 'Média'}</span>
        </div>
      )}

      {/* Main Message Bubble */}
      <div style={{
        maxWidth: '82%',
        background: isMine
          ? 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)'
          : 'var(--card-bg)',
        color: isMine ? '#FFFFFF' : 'var(--text-dark)',
        borderRadius,
        padding: message.message_type === 'image' || message.message_type === 'video' ? '4px' : '10px 14px',
        boxShadow: isMine ? '0 4px 14px rgba(0, 102, 255, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
        border: isMine ? 'none' : '1px solid var(--border-light)',
        position: 'relative',
        userSelect: 'none'
      }}>
        {/* 1. Reshared Story / Post Preview Card */}
        {message.message_type === 'story_share' && (
          <div style={{
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '6px',
            cursor: 'pointer'
          }}>
            {message.metadata?.storyPreview && (
              <img
                src={message.metadata.storyPreview}
                alt="Story"
                style={{ width: '100%', height: '140px', objectFit: 'cover' }}
              />
            )}
            <div style={{ padding: '8px', fontSize: '0.78rem', fontWeight: 600 }}>
              📸 Story de {message.metadata?.authorName || 'Artiste'}
            </div>
          </div>
        )}

        {/* 1.1 Story Comment / Reaction Context Card */}
        {message.metadata?.isStoryComment && (
          <div style={{
            background: isMine ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '6px',
            border: `1px solid ${isMine ? 'rgba(255, 255, 255, 0.15)' : 'var(--border-light)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px'
          }}>
            {(message.metadata.storyThumbnail || message.metadata.storyMedia) && (
              <img
                src={message.metadata.storyThumbnail || message.metadata.storyMedia}
                alt="Story"
                style={{ width: '36px', height: '48px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ fontSize: '0.74rem', minWidth: 0 }}>
              <div style={{ fontWeight: 700, opacity: 0.95 }}>
                📸 Réponse à la story
              </div>
              {message.metadata?.storyCaption && (
                <div style={{ fontSize: '0.68rem', opacity: 0.75, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {message.metadata.storyCaption}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Photo Attachment */}
        {message.message_type === 'image' && (
          <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden' }}>
            {isViewOnce ? (
              <div
                onClick={() => onOpenMedia && onOpenMedia(message)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: isMine ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                  borderRadius: '16px',
                  cursor: 'pointer'
                }}
              >
                <Eye size={18} color={isMine ? '#FFF' : '#0066FF'} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {isViewed ? 'Photo éphémère (Vue)' : 'Photo vue unique (Appuyer)'}
                </span>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={message.media_url}
                  alt="Photo"
                  onClick={() => onOpenMedia && onOpenMedia(message)}
                  style={{
                    width: '100%',
                    maxHeight: '280px',
                    objectFit: 'cover',
                    borderRadius: '16px',
                    display: 'block',
                    cursor: 'pointer'
                  }}
                />
                <button
                  onClick={(e) => handleDownloadFile(e, message.media_url, message.metadata?.fileName || 'photo.jpg')}
                  title="Télécharger l'image"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <Download size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2.1 Video Attachment */}
        {message.message_type === 'video' && (
          <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', maxWidth: '100%' }}>
            <video
              src={message.media_url}
              controls
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                maxHeight: '280px',
                borderRadius: '16px',
                display: 'block',
                background: '#000000'
              }}
            />
          </div>
        )}

        {/* 2.2 Document / File Attachment */}
        {(message.message_type === 'file' || message.message_type === 'document') && (
          <div
            onClick={(e) => handleDownloadFile(e, message.media_url, fileName)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 14px',
              background: isMine ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.04)',
              borderRadius: '14px',
              cursor: 'pointer',
              border: `1px solid ${isMine ? 'rgba(255,255,255,0.25)' : 'var(--border-light)'}`,
              minWidth: '200px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isMine ? '#FFFFFF' : '#0066FF',
                  color: isMine ? '#0066FF' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  flexShrink: 0
                }}
              >
                {fileExt.length <= 4 ? fileExt : <FileText size={18} />}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <h5 style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: isMine ? '#FFFFFF' : 'var(--text-dark)'
                }}>
                  {fileName}
                </h5>
                <span style={{
                  fontSize: '0.72rem',
                  opacity: 0.85,
                  color: isMine ? '#FFFFFF' : '#64748B'
                }}>
                  {fileSizeText} • Télécharger
                </span>
              </div>
            </div>

            <button
              onClick={(e) => handleDownloadFile(e, message.media_url, fileName)}
              title="Télécharger le document"
              style={{
                background: isMine ? 'rgba(255,255,255,0.25)' : '#EFF6FF',
                color: isMine ? '#FFFFFF' : '#0066FF',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Download size={16} />
            </button>
          </div>
        )}

        {/* 3. Audio Voice Note with Waveform */}
        {message.message_type === 'audio' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '190px' }}>
            <button
              onClick={togglePlayAudio}
              style={{
                background: isMine ? '#FFFFFF' : '#0066FF',
                color: isMine ? '#0066FF' : '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {isPlayingAudio ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
            </button>

            {/* Fake / Real Waveform bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, height: '26px' }}>
              {(message.metadata?.waveform || [30, 60, 45, 80, 55, 90, 40, 70, 85, 50, 65, 40, 75, 50]).map((amp, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '3px',
                    height: `${Math.max(6, Math.min(24, amp * 0.26))}px`,
                    background: isMine ? 'rgba(255,255,255,0.7)' : '#94A3B8',
                    borderRadius: '2px'
                  }}
                />
              ))}
            </div>

            {/* Audio Duration */}
            {message.metadata?.duration && (
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                opacity: 0.9,
                color: isMine ? '#FFFFFF' : '#64748B'
              }}>
                {message.metadata.duration}
              </span>
            )}

            {/* Speed Toggle Button */}
            <button
              onClick={toggleSpeed}
              style={{
                background: isMine ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: isMine ? '#FFFFFF' : '#0066FF',
                border: 'none',
                borderRadius: '12px',
                padding: '2px 6px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {playbackSpeed}x
            </button>

            {/* Audio Download */}
            <button
              onClick={(e) => handleDownloadFile(e, message.media_url, message.metadata?.fileName || 'vocal.mp3')}
              title="Télécharger l'audio"
              style={{
                background: isMine ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: isMine ? '#FFFFFF' : '#0066FF',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
            </button>
          </div>
        )}

        {/* 4. Text Content */}
        {message.content && message.message_type !== 'file' && message.message_type !== 'document' && (
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: 1.4,
            wordBreak: 'break-word',
            marginTop: (message.message_type === 'image' || message.message_type === 'video') ? '6px' : 0
          }}>
            {message.content}
          </p>
        )}
      </div>

      {/* Double Tap Heart Burst Animation */}
      {heartAnim && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1.6)',
          color: '#EF4444',
          zIndex: 10,
          animation: 'heartBurst 0.8s ease-out forwards',
          pointerEvents: 'none'
        }}>
          <Heart size={44} fill="#EF4444" />
        </div>
      )}

      {/* Emoji Reaction Badges Overlay */}
      {message.reactions && message.reactions.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '2px',
          marginTop: '-8px',
          marginRight: isMine ? '8px' : 'auto',
          marginLeft: isMine ? 'auto' : '8px',
          background: '#FFFFFF',
          padding: '2px 6px',
          borderRadius: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          border: '1px solid #E2E8F0',
          fontSize: '0.78rem',
          zIndex: 2
        }}>
          {message.reactions.map((r, i) => (
            <span key={i}>{r.emoji}</span>
          ))}
        </div>
      )}
    </div>
  );
}
