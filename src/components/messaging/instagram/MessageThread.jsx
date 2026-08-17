import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Sparkles } from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import ReactionOverlay from './ReactionOverlay';
import { useChatThread } from '../../../hooks/useChatThread';
import { useDirectPresence } from '../../../hooks/useDirectPresence';

export default function MessageThread({
  conversationId,
  partner,
  currentUser,
  onBack,
  onStartAudioCall,
  onStartVideoCall,
  onOpenProfile
}) {
  const [touchStartX, setTouchStartX] = useState(null);
  const [reactionOverlayData, setReactionOverlayData] = useState(null);

  const {
    messages,
    isLoading,
    isVanishMode,
    replyingTo,
    setReplyingTo,
    sendMessage,
    toggleReaction,
    toggleVanishMode
  } = useChatThread({ conversationId, currentUser, partner });

  const { typingText, isOnline, sendTypingEvent } = useDirectPresence(conversationId, currentUser);

  const messagesEndRef = useRef(null);
  const threadContainerRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  return (
    <div
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX !== null && (e.changedTouches[0].clientX - touchStartX > 100)) {
          onBack();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        // ... le reste de votre style ...
        background: isVanishMode ? '#0B0F19' : 'var(--bg-light)',
        display: 'flex',
        flexDirection: 'column',
        color: isVanishMode ? '#FFFFFF' : 'var(--text-dark)'
      }}>
      {/* 1. Header Bar */}
      <div style={{
        paddingTop: 'calc(12px + env(safe-area-inset-top, 12px))',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: isVanishMode ? '#111827' : 'var(--card-bg)',
        borderBottom: `1px solid ${isVanishMode ? '#1F2937' : 'var(--border-light)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: isVanishMode ? '#FFFFFF' : '#0F172A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={22} />
          </button>

          {/* Clickable Avatar & Status */}
          <div
            onClick={() => onOpenProfile && onOpenProfile(partner)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative' }}>
              <UserAvatar
                user={{
                  avatar: partner?.avatar_url || partner?.avatar,
                  name: partner?.full_name || partner?.name || 'Artiste'
                }}
                size={40}
              />
              {isOnline && (
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #FFF'
                }} />
              )}
            </div>

            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: isVanishMode ? '#FFFFFF' : '#0F172A',
                margin: 0
              }}>
                {partner?.full_name || partner?.name || 'Artiste StageLink'}
              </h3>
              <span style={{
                fontSize: '0.72rem',
                color: typingText ? '#0066FF' : (isOnline ? '#10B981' : '#64748B'),
                fontWeight: typingText ? 700 : 500
              }}>
                {typingText || (isOnline ? 'En ligne' : (partner?.role || 'Artiste'))}
              </span>
            </div>
          </div>
        </div>

        {/* Action Call Icons & Vanish Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={toggleVanishMode}
            title="Activer / Désactiver le mode éphémère (Vanish Mode)"
            style={{
              background: isVanishMode ? 'rgba(0, 102, 255, 0.2)' : 'transparent',
              color: isVanishMode ? '#60A5FA' : '#64748B',
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
            <Sparkles size={18} />
          </button>

          <button
            onClick={onStartAudioCall}
            title="Appel Audio HD"
            style={{
              background: '#EFF6FF',
              color: '#0066FF',
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
            <Phone size={18} />
          </button>

          <button
            onClick={onStartVideoCall}
            title="Appel Vidéo HD"
            style={{
              background: '#EFF6FF',
              color: '#0066FF',
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
            <Video size={18} />
          </button>
        </div>
      </div>

      {/* 2. Vanish Mode Banner */}
      {isVanishMode && (
        <div style={{
          background: 'linear-gradient(90deg, #1E1B4B 0%, #312E81 100%)',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#C7D2FE',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Sparkles size={14} color="#818CF8" /> Mode Éphémère activé — Les messages disparaîtront après lecture
        </div>
      )}

      {/* 3. Messages Scroll Container */}
      <div
        ref={threadContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === currentUser?.id;
          const prevMsg = messages[index - 1];
          const nextMsg = messages[index + 1];

          const isPreviousSameSender = prevMsg && prevMsg.sender_id === msg.sender_id;
          const isNextSameSender = nextMsg && nextMsg.sender_id === msg.sender_id;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={isMine}
              isPreviousSameSender={isPreviousSameSender}
              isNextSameSender={isNextSameSender}
              onReply={(m) => setReplyingTo(m)}
              onReact={(msgId, emoji) => toggleReaction(msgId, emoji)}
              onOpenReactionOverlay={(m, pos) => setReactionOverlayData({ message: m, position: pos })}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Floating Reaction Overlay */}
      <ReactionOverlay
        isOpen={Boolean(reactionOverlayData)}
        position={reactionOverlayData?.position}
        onSelectEmoji={(emoji) => {
          if (reactionOverlayData?.message?.id) {
            toggleReaction(reactionOverlayData.message.id, emoji);
          }
        }}
        onClose={() => setReactionOverlayData(null)}
      />

      {/* 5. Input Bar */}
      <InputBar
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendMessage={sendMessage}
        onTyping={sendTypingEvent}
      />
    </div>
  );
}
