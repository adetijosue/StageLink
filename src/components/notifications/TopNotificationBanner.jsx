import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Heart, MessageSquare, Phone, Video, Sparkles, Eye, X, ChevronRight, Flame, CheckCircle2 } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { soundEngine } from '../../services/audioService';

/**
 * StageLink Top Floating In-App Push & Pop-up Notification Banner
 * Inspired by iOS Dynamic Island & Instagram In-App Notifications
 */
export default function TopNotificationBanner({
  notification,
  onOpen,
  onClose,
  isDarkMode = true
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [swipeOffsetY, setSwipeOffsetY] = useState(0);
  const touchStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!notification) return;

    // Reset exiting state on new notification
    setIsExiting(false);
    setSwipeOffsetY(0);

    // Auto-dismiss after 3.8 seconds for success/info, or 4.5 seconds for calls/messages
    const duration = (notification.type === 'success' || notification.type === 'post_published') ? 3500 : 4500;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose();
      setIsExiting(false);
    }, 280);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    try {
      if (navigator.vibrate) navigator.vibrate(20);
    } catch (_) {}
    soundEngine.playPopSound();
    if (onOpen) onOpen(notification);
    if (onClose) onClose();
  };

  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches ? e.touches[0].clientY : e.clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - touchStartYRef.current;
    if (deltaY < 0) {
      // Swiping up
      setSwipeOffsetY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (swipeOffsetY < -30) {
      handleDismiss();
    } else {
      setSwipeOffsetY(0);
    }
  };

  if (!notification) return null;

  const actorName = notification.title || notification.actorName || notification.senderName || 'Notification';
  const messageText = notification.message || notification.content || notification.text || 'Action effectuée';
  const avatarUrl = notification.avatar || notification.actorAvatar || notification.avatar_url;
  const notifType = notification.type || 'message';

  // Determine Badge Icon and Colors
  let BadgeIcon = MessageCircle;
  let badgeBg = '#0066FF';
  let badgeColor = '#FFFFFF';
  let typeLabel = 'Message direct';

  switch (notifType) {
    case 'success':
    case 'post_published':
    case 'published':
      BadgeIcon = CheckCircle2;
      badgeBg = '#10B981';
      typeLabel = 'Succès';
      break;
    case 'like_post':
    case 'post_like':
      BadgeIcon = Heart;
      badgeBg = '#EF4444';
      typeLabel = 'Mention J’aime';
      break;
    case 'like_story':
    case 'story_like':
      BadgeIcon = Heart;
      badgeBg = '#EC4899';
      typeLabel = 'J’aime Story';
      break;
    case 'comment_post':
    case 'post_comment':
      BadgeIcon = MessageSquare;
      badgeBg = '#10B981';
      typeLabel = 'Commentaire';
      break;
    case 'view_story':
    case 'story_view':
      BadgeIcon = Eye;
      badgeBg = '#6366F1';
      typeLabel = 'Vue Story';
      break;
    case 'match':
      BadgeIcon = Flame;
      badgeBg = '#F59E0B';
      typeLabel = 'Nouveau Match';
      break;
    case 'incoming_call_audio':
      BadgeIcon = Phone;
      badgeBg = '#10B981';
      typeLabel = 'Appel vocal';
      break;
    case 'incoming_call_video':
      BadgeIcon = Video;
      badgeBg = '#8B5CF6';
      typeLabel = 'Appel vidéo';
      break;
    case 'reaction':
      BadgeIcon = Sparkles;
      badgeBg = '#EC4899';
      typeLabel = 'Réaction';
      break;
    default:
      BadgeIcon = MessageCircle;
      badgeBg = '#0066FF';
      typeLabel = 'Message direct';
      break;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(10px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: `translate(-50%, ${swipeOffsetY}px) ${isExiting ? 'translateY(-120%) scale(0.95)' : 'translateY(0) scale(1)'}`,
        transition: isDraggingRef.current ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        opacity: isExiting ? 0 : 1,
        zIndex: 99999,
        width: 'calc(100% - 24px)',
        maxWidth: '440px',
        pointerEvents: 'auto',
        touchAction: 'pan-x'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      <div
        onClick={handleClick}
        style={{
          background: isDarkMode
            ? 'rgba(15, 23, 42, 0.88)'
            : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: isDarkMode
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDarkMode
            ? '0 16px 36px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06), 0 4px 12px rgba(0, 102, 255, 0.15)'
            : '0 16px 36px -8px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 102, 255, 0.12)',
          borderRadius: '22px',
          padding: '10px 14px 10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Glowing Top Edge Highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: '1.5px',
            background: `linear-gradient(90deg, transparent, ${badgeBg}, transparent)`,
            opacity: 0.8
          }}
        />

        {/* Avatar with Action Badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <UserAvatar
            avatarUrl={avatarUrl}
            user={{ name: actorName, avatar: avatarUrl }}
            size={44}
            border={isDarkMode ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid rgba(0, 0, 0, 0.1)'}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-3px',
              background: badgeBg,
              color: badgeColor,
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              border: isDarkMode ? '1.5px solid #0F172A' : '1.5px solid #FFFFFF'
            }}
          >
            <BadgeIcon size={11} strokeWidth={2.4} />
          </div>
        </div>

        {/* Notification Text Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {actorName}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: isDarkMode ? '#94A3B8' : '#64748B',
                fontWeight: 500,
                flexShrink: 0
              }}
            >
              à l'instant
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '0.78rem',
              color: isDarkMode ? '#CBD5E1' : '#475569',
              lineHeight: 1.35,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 450
            }}
          >
            {messageText}
          </p>
        </div>

        {/* Quick Open Action / Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={handleClick}
            style={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 102, 255, 0.08)',
              color: isDarkMode ? '#38BDF8' : '#0066FF',
              border: 'none',
              borderRadius: '12px',
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <span>Ouvrir</span>
            <ChevronRight size={12} strokeWidth={2.5} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            title="Masquer"
            style={{
              background: 'transparent',
              border: 'none',
              color: isDarkMode ? '#64748B' : '#94A3B8',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
