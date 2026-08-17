import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Archive, MessageSquare, MessageCircle, Trash } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import MessageStatusTicks from './MessageStatusTicks';

function SwipeableChatItem({ chat, onSelectChat, onArchive, onDelete, onToggleUnread, onOpenPublicProfile }) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  
  const ACTION_WIDTH = 60; // Width of one action button
  const NUM_ACTIONS = 3; // Delete, Archive, Unread
  const MAX_SWIPE = ACTION_WIDTH * NUM_ACTIONS;
  const SNAP_THRESHOLD = MAX_SWIPE / 2;

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const current = e.touches[0].clientX;
    const diff = current - startX;
    
    // Only allow swiping left (negative diff)
    if (diff < 0) {
      setCurrentX(Math.max(diff, -MAX_SWIPE - 20)); // Allow slight overscroll
    } else {
      setCurrentX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentX < -SNAP_THRESHOLD) {
      setCurrentX(-MAX_SWIPE); // Snap open
    } else {
      setCurrentX(0); // Snap closed
    }
  };

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setCurrentX(0);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
  const lastMsgPreview = lastMsg 
    ? (lastMsg.text || (lastMsg.isAudio ? '🎤 Message audio' : (lastMsg.isVideo ? '📹 Vidéo' : (lastMsg.mediaUrl ? '📷 Photo' : (lastMsg.isCallNotice ? '📞 Appel' : 'Message')))))
    : (chat.lastMessage || 'Aucun message');

  const partnerName = chat.participant?.full_name || chat.participant?.name || chat.participant?.fullName || chat.participant?.userName || chat.title || 'Artiste StageLink';
  const partnerAvatar = chat.participant?.avatar_url || chat.participant?.avatar || chat.participant?.avatarUrl || chat.avatar || '';
  const isOnline = Boolean(chat.participant?.online);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        marginBottom: '8px'
      }}
    >
      {/* Background Actions */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: `${MAX_SWIPE}px`,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#F1F5F9'
      }}>
        {/* Toggle Unread */}
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentX(0); onToggleUnread && onToggleUnread(chat); }}
          style={{ width: `${ACTION_WIDTH}px`, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          <MessageCircle size={18} />
          <span style={{ fontSize: '0.65rem' }}>Lu/Non lu</span>
        </button>
        {/* Archive */}
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentX(0); onArchive && onArchive(chat); }}
          style={{ width: `${ACTION_WIDTH}px`, border: 'none', background: '#F59E0B', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          <Archive size={18} />
          <span style={{ fontSize: '0.65rem' }}>Archiver</span>
        </button>
        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentX(0); onDelete && onDelete(chat); }}
          style={{ width: `${ACTION_WIDTH}px`, border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          <Trash2 size={18} />
          <span style={{ fontSize: '0.65rem' }}>Supprimer</span>
        </button>
      </div>

      {/* Foreground Chat Item */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (currentX === 0) onSelectChat && onSelectChat(chat);
          else setCurrentX(0); // Close swipe on tap
        }}
        style={{
          background: 'var(--card-bg)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid var(--border-light)',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 10,
          transform: `translateX(${currentX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Avatar with Online indicator */}
        <div style={{ position: 'relative' }}>
          <UserAvatar 
            user={{ avatar: partnerAvatar, name: partnerName }} 
            size={48} 
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenPublicProfile && chat.participant) onOpenPublicProfile(chat.participant);
            }}
          />
          {isOnline && (
            <span style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '12px',
              height: '12px',
              background: '#10B981',
              borderRadius: '50%',
              border: '2px solid #FFFFFF'
            }} />
          )}
        </div>

        {/* Chat Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: chat.unreadCount > 0 ? 800 : 700, color: 'var(--text-dark)' }}>
              {partnerName}
            </h4>
            <span style={{ fontSize: '0.72rem', color: chat.unreadCount > 0 ? '#0066FF' : 'var(--text-muted)' }}>
              {chat.lastMessageTime || 'Récemment'}
            </span>
          </div>
          <div style={{
            fontSize: '0.82rem',
            color: chat.unreadCount > 0 ? 'var(--text-dark)' : 'var(--text-muted)',
            fontWeight: chat.unreadCount > 0 ? 600 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {lastMsg && (lastMsg.sender === 'me' || lastMsg.isCurrent) && (
              <MessageStatusTicks
                status={lastMsg.status || (lastMsg.isRead ? 'read' : 'sent')}
                isRead={lastMsg.isRead === true || lastMsg.status === 'read'}
                isRecipientOnline={isOnline}
                size={13}
              />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lastMsgPreview}
            </span>
          </div>
        </div>

        {/* Unread Message Badge Counter */}
        {chat.unreadCount > 0 && (
          <span style={{
            background: '#EF4444',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '2px 7px',
            fontSize: '0.72rem',
            fontWeight: 800
          }}>
            {chat.unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}

export default React.memo(SwipeableChatItem);