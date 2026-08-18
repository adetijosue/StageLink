import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Flame, X, Download, Music, Trash2, MoreVertical } from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import ReactionOverlay from './ReactionOverlay';
import { useChatThread } from '../../../hooks/useChatThread';
import { useDirectPresence } from '../../../hooks/useDirectPresence';
import { supabase, isSupabaseConfigured } from '../../../services/supabaseClient';
import { directChatService } from '../../../services/directChatService';
import { soundEngine } from '../../../services/audioService';
import { useLanguage } from '../../../context/LanguageContext';
import { haptics } from '../../../services/hapticsService';

export default function MessageThread({
  conversationId,
  partner,
  currentUser,
  onBack,
  onStartAudioCall,
  onStartVideoCall,
  onOpenProfile
}) {
  const { t, language } = useLanguage();
  const [touchStartX, setTouchStartX] = useState(null);
  const [reactionOverlayData, setReactionOverlayData] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(partner || null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingConv, setIsDeletingConv] = useState(false);

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
        background: isVanishMode ? '#0B0F19' : 'var(--bg-light)',
        display: 'flex',
        flexDirection: 'column',
        color: isVanishMode ? '#FFFFFF' : 'var(--text-dark)',
        height: '100%',
        touchAction: 'pan-y'
      }}>
      {/* 1. Header Bar */}
      <div style={{
        paddingTop: 'calc(14px + env(safe-area-inset-top, 14px))',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: isVanishMode ? 'rgba(15, 23, 42, 0.95)' : 'var(--card-bg)',
        borderBottom: isVanishMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
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
              <span
                title={isOnline ? t('online_status') : t('offline_status')}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isOnline ? '#10B981' : '#94A3B8',
                  border: '2px solid #FFF',
                  boxShadow: isOnline ? '0 0 8px rgba(16, 185, 129, 0.45)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <h3 style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                color: isVanishMode ? '#FFFFFF' : '#0F172A',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {partnerName}
              </h3>

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
                  {typingText || (isOnline ? t('online_status') : t('offline_status'))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Call Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          <button
            onClick={() => {
              haptics.light();
              onStartAudioCall();
            }}
            title={language === 'en' ? 'HD Audio Call' : 'Appel Audio HD'}
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
            onClick={() => {
              haptics.light();
              onStartVideoCall();
            }}
            title={language === 'en' ? 'HD Video Call' : 'Appel Vidéo HD'}
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

          <button
            onClick={() => {
              soundEngine.playPopSound();
              setShowDeleteModal(true);
            }}
            title={language === 'en' ? 'Delete conversation' : 'Supprimer la discussion'}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#EF4444',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <Trash2 size={17} />
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
          <Flame size={14} color="#F43F5E" /> {language === 'en' ? 'Vanish Mode active — Messages disappear after being seen' : 'Mode Éphémère activé — Les messages disparaîtront après lecture'}
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
              isRecipientOnline={isOnline}
              onReply={(m) => setReplyingTo(m)}
              onReact={(msgId, emoji) => toggleReaction(msgId, emoji)}
              onOpenMedia={(m) => setPreviewMedia(m)}
              onOpenReactionOverlay={(m, pos) => setReactionOverlayData({ message: m, position: pos })}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Floating Reaction Overlay (WhatsApp / Instagram style) */}
      <ReactionOverlay
        isOpen={Boolean(reactionOverlayData)}
        position={reactionOverlayData?.position}
        message={reactionOverlayData?.message}
        isMine={reactionOverlayData?.message?.sender_id === currentUser?.id}
        onSelectEmoji={(emoji) => {
          if (reactionOverlayData?.message?.id) {
            toggleReaction(reactionOverlayData.message.id, emoji);
          }
        }}
        onReply={(msg) => {
          setReplyingTo(msg);
        }}
        onCopy={(msg) => {
          // Handled inside ReactionOverlay with clipboard API
        }}
        onDelete={(msg) => {
          setMessages(prev => prev.filter(m => m.id !== msg.id));
        }}
        onClose={() => setReactionOverlayData(null)}
      />

      {/* 5. Fullscreen Media Preview Modal */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <button
            onClick={() => setPreviewMedia(null)}
            style={{
              position: 'absolute',
              top: 'calc(16px + env(safe-area-inset-top, 16px))',
              right: '16px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={22} />
          </button>

          {previewMedia.message_type === 'video' ? (
            <video
              src={previewMedia.media_url}
              controls
              autoPlay
              playsInline
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '16px' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewMedia.media_url}
              alt="Média"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '16px' }}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {previewMedia.media_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = previewMedia.media_url;
                link.download = previewMedia.metadata?.fileName || 'media';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              style={{
                position: 'absolute',
                bottom: 'calc(24px + env(safe-area-inset-bottom, 24px))',
                background: '#0066FF',
                color: '#FFF',
                border: 'none',
                borderRadius: '30px',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,102,255,0.4)',
                zIndex: 10
              }}
            >
              <Download size={18} /> {language === 'en' ? 'Download media' : 'Télécharger le média'}
            </button>
          )}
        </div>
      )}

      {/* 6. Input Bar */}
      <InputBar
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendMessage={sendMessage}
        onTyping={sendTypingEvent}
      />

      {/* 7. Delete Conversation Confirmation Modal */}
      {showDeleteModal && (
        <div
          onClick={() => !isDeletingConv && setShowDeleteModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--card-bg, #FFFFFF)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-light, #E2E8F0)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
            }}>
              <Trash2 size={28} />
            </div>

            <div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-dark, #0F172A)',
                margin: '0 0 8px 0'
              }}>
                {language === 'en' ? 'Delete conversation?' : 'Supprimer la discussion ?'}
              </h3>
              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-muted, #64748B)',
                margin: 0,
                lineHeight: 1.45
              }}>
                {language === 'en'
                  ? `Are you sure you want to delete this conversation with "${partnerName}"? You will return to your inbox.`
                  : `Voulez-vous vraiment supprimer votre discussion avec "${partnerName}" ? Vous retournerez à votre liste de messages.`
                }
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                disabled={isDeletingConv}
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--text-dark, #334155)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isDeletingConv ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                {language === 'en' ? 'Cancel' : 'Annuler'}
              </button>

              <button
                disabled={isDeletingConv}
                onClick={async () => {
                  setIsDeletingConv(true);
                  try {
                    soundEngine.playPopSound();
                    await directChatService.deleteConversation(conversationId, currentUser?.id);
                    onBack();
                  } catch (err) {
                    console.warn('Error deleting conversation from thread:', err);
                  } finally {
                    setIsDeletingConv(false);
                    setShowDeleteModal(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isDeletingConv ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'transform 0.1s ease'
                }}
              >
                {isDeletingConv ? (
                  <span>{language === 'en' ? 'Deleting...' : 'Suppression...'}</span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>{language === 'en' ? 'Delete' : 'Supprimer'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
