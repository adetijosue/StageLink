import React, { useState, useRef } from 'react';
import { Play, Pause, Heart, Eye, EyeOff, Music, Reply, Check, CheckCheck } from 'lucide-react';
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
  const handleDoubleTap = (e) => {
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
  const togglePlayAudio = () => {
    if (!message.media_url) return;

    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioRef.current) {
        const audio = new Audio(message.media_url);
        audioRef.current = audio;
        audio.playbackRate = playbackSpeed;
        audio.onended = () => setIsPlayingAudio(false);
      }
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const toggleSpeed = (e) => {
    e.stopPropagation();
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  const isViewOnce = message.metadata?.view_once;
  const isViewed = message.metadata?.is_viewed;

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
        maxWidth: '78%',
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

        {/* 2. Photo / Video Attachment */}
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
            )}
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
          </div>
        )}

        {/* 4. Text Content */}
        {message.content && (
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: 1.4,
            wordBreak: 'break-word'
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
