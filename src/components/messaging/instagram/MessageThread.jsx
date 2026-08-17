import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Sparkles } from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import ReactionOverlay from './ReactionOverlay';
import { useChatThread } from '../../../hooks/useChatThread';
import { useDirectPresence } from '../../../hooks/useDirectPresence';
import { supabase, isSupabaseConfigured } from '../../../services/supabaseClient';

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
  const [partnerProfile, setPartnerProfile] = useState(partner || null);

  // Sync internal partner state if prop changes
  useEffect(() => {
    if (partner) {
      setPartnerProfile(partner);
    }
  }, [partner]);

  // Fallback: If partner has no name or avatar or role, fetch directly from Supabase profiles
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const partnerId = partnerProfile?.id || partnerProfile?.userId || partner?.id || partner?.userId;
      if (partnerId && isSupabaseConfigured()) {
        try {
          const { data: prof, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, role, verified_badge')
            .eq('id', partnerId)
            .single();

          if (!error && prof && isMounted) {
            setPartnerProfile((prev) => ({
              ...prev,
              ...prof,
              id: prof.id,
              name: prof.full_name || prof.username || 'Artiste',
              full_name: prof.full_name || prof.username || 'Artiste',
              username: prof.username || '',
              avatar: prof.avatar_url || '',
              avatar_url: prof.avatar_url || '',
              role: prof.role || 'Artiste',
              userRole: prof.role || 'Artiste'
            }));
            return;
          }
        } catch (err) {
          console.warn('MessageThread direct profile fetch note:', err);
        }
      }

      if (conversationId && isSupabaseConfigured()) {
        try {
          const { data: participants, error } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profile:user_id(id, full_name, username, avatar_url, role, verified_badge)
            `)
            .eq('conversation_id', conversationId)
            .neq('user_id', currentUser?.id || '');

          if (!error && participants && participants.length > 0 && isMounted) {
            const partObj = participants[0];
            const prof = Array.isArray(partObj.profile) ? partObj.profile[0] : partObj.profile;
            if (prof) {
              setPartnerProfile((prev) => ({
                ...prev,
                ...prof,
                id: prof.id || partObj.user_id,
                name: prof.full_name || prof.username || 'Artiste',
                full_name: prof.full_name || prof.username || 'Artiste',
                username: prof.username || '',
                avatar: prof.avatar_url || prof.avatar || '',
                avatar_url: prof.avatar_url || prof.avatar || '',
                role: prof.role || 'Artiste',
                userRole: prof.role || 'Artiste'
              }));
            }
          }
        } catch (err) {
          console.warn('MessageThread conversation participant fallback note:', err);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [conversationId, currentUser?.id, partner?.id]);

  const activePartner = partnerProfile || partner || {};
  const partnerName = activePartner.full_name || activePartner.name || activePartner.username || activePartner.userName || 'Artiste';
  const partnerUsername = activePartner.username || '';
  const partnerAvatar = activePartner.avatar_url || activePartner.avatar || activePartner.userAvatar || '';
  const partnerRole = activePartner.role || activePartner.userRole || activePartner.metier || 'Artiste';
  const partnerId = activePartner.id || activePartner.userId;

  const {
    messages,
    isLoading,
    isVanishMode,
    replyingTo,
    setReplyingTo,
    sendMessage,
    toggleReaction,
    toggleVanishMode
  } = useChatThread({ conversationId, currentUser, partner: activePartner });

  const { typingText, isOnline, sendTypingEvent } = useDirectPresence(conversationId, currentUser, partnerId);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: isVanishMode ? '#FFFFFF' : '#0F172A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            <ArrowLeft size={22} />
          </button>

          {/* Clickable Avatar & Status */}
          <div
            onClick={() => onOpenProfile && onOpenProfile(activePartner)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <UserAvatar
                user={{
                  avatar: partnerAvatar,
                  name: partnerName
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

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <h3 style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: isVanishMode ? '#FFFFFF' : '#0F172A',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {partnerName}
                </h3>
                {partnerUsername && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: isVanishMode ? '#94A3B8' : '#64748B',
                    whiteSpace: 'nowrap'
                  }}>
                    @{partnerUsername.replace(/^@/, '')}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                <span style={{
                  fontSize: '0.74rem',
                  color: isVanishMode ? '#60A5FA' : '#0066FF',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {partnerRole}
                </span>
                <span style={{ fontSize: '0.65rem', color: isVanishMode ? '#64748B' : '#94A3B8' }}>•</span>
                <span style={{
                  fontSize: '0.72rem',
                  color: typingText ? '#0066FF' : (isOnline ? '#10B981' : '#64748B'),
                  fontWeight: typingText ? 700 : 500,
                  whiteSpace: 'nowrap'
                }}>
                  {typingText || (isOnline ? 'En ligne' : 'Hors ligne')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Call Icons & Vanish Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
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
