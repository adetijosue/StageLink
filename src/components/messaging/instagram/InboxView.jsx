import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, PhoneCall, Trash2, MoreVertical, X, CheckCircle2, AlertCircle } from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';
import MessageStatusTicks from '../MessageStatusTicks';

import { useConversationList } from '../../../hooks/useConversationList';
import { soundEngine } from '../../../services/audioService';
import { presenceService } from '../../../services/presenceService';
import { useLanguage } from '../../../context/LanguageContext';

const SwipeableDiscussionItem = React.memo(function SwipeableDiscussionItem({
  conv,
  currentUser,
  onlineUserIds,
  language,
  t,
  onSelectConversation,
  onOpenProfile,
  onDeleteConv
}) {
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const wasDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const containerRef = useRef(null);

  const ACTION_WIDTH = 76;
  const SNAP_THRESHOLD = 38;

  // Touch handlers
  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const current = e.touches[0].clientX;
    const diff = current - startXRef.current;
    if (diff < 0) {
      const val = Math.max(diff, -ACTION_WIDTH - 20);
      currentXRef.current = val;
      setCurrentX(val);
    } else {
      currentXRef.current = 0;
      setCurrentX(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (Math.abs(currentXRef.current) > 10) {
      wasDraggingRef.current = true;
      setTimeout(() => { wasDraggingRef.current = false; }, 300);
    }

    if (currentXRef.current < -SNAP_THRESHOLD) {
      currentXRef.current = -ACTION_WIDTH;
      setCurrentX(-ACTION_WIDTH);
    } else {
      currentXRef.current = 0;
      setCurrentX(0);
    }
  };

  // Mouse handlers (desktop & simulator)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const diff = e.clientX - startXRef.current;
    if (diff < 0) {
      const val = Math.max(diff, -ACTION_WIDTH - 20);
      currentXRef.current = val;
      setCurrentX(val);
    } else {
      currentXRef.current = 0;
      setCurrentX(0);
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (Math.abs(currentXRef.current) > 10) {
      wasDraggingRef.current = true;
      setTimeout(() => { wasDraggingRef.current = false; }, 300);
    }

    if (currentXRef.current < -SNAP_THRESHOLD) {
      currentXRef.current = -ACTION_WIDTH;
      setCurrentX(-ACTION_WIDTH);
    } else {
      currentXRef.current = 0;
      setCurrentX(0);
    }
  };

  // Close swipe when tapping/clicking anywhere outside this card
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        currentXRef.current = 0;
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

  const partnerId = conv.partner?.id || conv.participant?.id || conv.participantId || conv.partnerId;
  const isOnline = Boolean(partnerId && onlineUserIds.includes(String(partnerId)));
  const lastMsg = conv.lastMessage;
  const isMine = lastMsg?.sender_id === currentUser?.id;

  return (
    <div
      ref={containerRef}
      data-swipe-container="true"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '18px',
        marginBottom: '8px',
        userSelect: 'none'
      }}
    >
      {/* Background Red Swipe Delete Action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCurrentX(0);
          soundEngine.playPopSound();
          onDeleteConv(conv);
        }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${ACTION_WIDTH}px`,
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          zIndex: 1,
          borderTopRightRadius: '18px',
          borderBottomRightRadius: '18px',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.15)'
        }}
        title={language === 'en' ? 'Delete conversation' : 'Supprimer la discussion'}
      >
        <Trash2 size={19} color="#FFFFFF" />
        <span style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.02em' }}>
          {language === 'en' ? 'Delete' : 'Supprimer'}
        </span>
      </button>

      {/* Foreground Discussion Row */}
      <div
        data-swipe-item="true"
        onClick={(e) => {
          if (wasDraggingRef.current) {
            e.stopPropagation();
            return;
          }
          if (currentX < -10) {
            e.stopPropagation();
            setCurrentX(0);
          } else {
            soundEngine.playPopSound();
            onSelectConversation(conv);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '18px',
          background: 'var(--card-bg)',
          cursor: 'pointer',
          border: '1px solid var(--border-light)',
          transform: `translateX(${currentX}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: conv.unreadCount > 0 ? '0 4px 12px rgba(0, 102, 255, 0.08)' : 'none',
          position: 'relative',
          zIndex: 2,
          touchAction: 'pan-y'
        }}
      >
        <div
          onClick={(e) => {
            if (onOpenProfile && conv.participant) {
              e.stopPropagation();
              onOpenProfile(conv.participant);
            }
          }}
          style={{ position: 'relative', cursor: onOpenProfile && conv.participant ? 'pointer' : 'default', flexShrink: 0 }}
        >
          <UserAvatar
            user={{
              avatar: conv.avatar,
              name: conv.title
            }}
            size={50}
          />
          <span
            title={isOnline ? t('online_status') : t('offline_status')}
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              background: isOnline ? '#10B981' : '#94A3B8',
              border: '2.5px solid var(--card-bg, #FFFFFF)',
              boxShadow: isOnline ? '0 0 8px rgba(16, 185, 129, 0.45)' : 'none',
              transition: 'all 0.25s ease'
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{
              fontSize: '0.92rem',
              fontWeight: conv.unreadCount > 0 ? 800 : 700,
              color: 'var(--text-dark)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {conv.title}
            </h4>
            {lastMsg && (
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', flexShrink: 0, marginLeft: '8px' }}>
                {new Date(lastMsg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', gap: '8px' }}>
            <div style={{
              fontSize: '0.8rem',
              color: conv.unreadCount > 0 ? '#0066FF' : '#64748B',
              fontWeight: conv.unreadCount > 0 ? 700 : 400,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {lastMsg ? (
                <>
                  {isMine && (
                    <MessageStatusTicks
                      status={lastMsg.status || (lastMsg.read ? 'read' : 'sent')}
                      isRead={lastMsg.status === 'read' || lastMsg.read === true}
                      isRecipientOnline={isOnline}
                      size={13}
                    />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastMsg.message_type === 'audio'
                      ? (language === 'en' ? '🎙️ Voice note' : '🎙️ Note vocale')
                      : lastMsg.message_type === 'image'
                      ? (language === 'en' ? '📷 Photo' : '📷 Photo')
                      : (lastMsg.content || (language === 'en' ? 'Message' : 'Message'))}
                  </span>
                </>
              ) : (language === 'en' ? 'New conversation' : 'Nouvelle discussion')}
            </div>

            {conv.unreadCount > 0 && (
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#0066FF',
                flexShrink: 0
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const InboxView = React.memo(function InboxView({
  currentUser,
  onSelectConversation,
  onOpenNewChatModal,
  onOpenCallHistoryModal,
  onOpenProfile
}) {
  const { t, language } = useLanguage();
  const [onlineUserIds, setOnlineUserIds] = useState(() => presenceService.getOnlineUserIds());
  
  // Deletion modal & feedback state
  const [confirmDeleteConv, setConfirmDeleteConv] = useState(null);
  const [openSwipeId, setOpenSwipeId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const unsubscribe = presenceService.subscribe((ids) => {
      setOnlineUserIds(ids);
    });
    return unsubscribe;
  }, []);

  const {
    conversations,
    directNotes,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    postNote,
    deleteConversation
  } = useConversationList(currentUser);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteConv) return;
    setIsDeleting(true);
    try {
      soundEngine.playPopSound();
      await deleteConversation(confirmDeleteConv.id);
      setOpenSwipeId(null);
      showToast(language === 'en' ? 'Conversation deleted' : 'Discussion supprimée');
    } catch (err) {
      console.warn('Error deleting conversation:', err);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteConv(null);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (!e.target.closest('[data-swipe-container]')) {
          setOpenSwipeId(null);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-light)',
        position: 'relative'
      }}
    >
      {/* 1. Header Bar */}
      <div style={{
        paddingTop: '12px',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{
          fontSize: '1.65rem',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          color: 'var(--text-dark)',
          margin: 0
        }}>
          {t('messages')}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenCallHistoryModal}
            title={language === 'en' ? 'Call history' : 'Historique des appels'}
            style={{
              background: '#EFF6FF',
              color: '#0066FF',
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
            <PhoneCall size={18} />
          </button>

          <button
            onClick={onOpenNewChatModal}
            title={language === 'en' ? 'New message' : 'Nouveau message'}
            style={{
              background: '#0066FF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)'
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div style={{ padding: '12px 16px 6px 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--card-bg)',
          padding: '8px 14px',
          borderRadius: '16px',
          border: '1px solid var(--border-light)'
        }}>
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search artists, groups...' : 'Rechercher des artistes, groupes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.88rem',
              color: 'var(--text-dark)'
            }}
          />
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-light)'
      }}>
        {[
          { id: 'all', label: language === 'en' ? 'All' : 'Toutes' },
          { id: 'unread', label: language === 'en' ? 'Unread' : 'Non lues' },
          { id: 'groups', label: language === 'en' ? 'Groups' : 'Groupes' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundEngine.playPopSound();
              setActiveFilter(tab.id);
            }}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeFilter === tab.id ? '#0066FF' : 'rgba(0,0,0,0.05)',
              color: activeFilter === tab.id ? '#FFFFFF' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Conversations List with Swipeable Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {conversations.filter(c => Boolean(c && c.lastMessage)).length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '240px',
            color: '#94A3B8'
          }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{language === 'en' ? 'No conversations found' : 'Aucune discussion trouvée'}</p>
          </div>
        ) : (
          conversations.filter(c => Boolean(c && c.lastMessage)).map((conv) => (
            <SwipeableDiscussionItem
              key={conv.id}
              conv={conv}
              currentUser={currentUser}
              onlineUserIds={onlineUserIds}
              language={language}
              t={t}
              onSelectConversation={onSelectConversation}
              onOpenProfile={onOpenProfile}
              onDeleteConv={(c) => setConfirmDeleteConv(c)}
            />
          ))
        )}
      </div>

      {/* 5. Sleek Confirmation Modal for Deleting Conversation */}
      {confirmDeleteConv && (
        <div
          onClick={() => !isDeleting && setConfirmDeleteConv(null)}
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
                  ? `Are you sure you want to delete your conversation with "${confirmDeleteConv.title}"? It will be permanently removed from your inbox.`
                  : `Voulez-vous vraiment supprimer votre discussion avec "${confirmDeleteConv.title}" ? Elle disparaîtra définitivement de votre boîte de réception.`
                }
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                disabled={isDeleting}
                onClick={() => setConfirmDeleteConv(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--text-dark, #334155)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                {language === 'en' ? 'Cancel' : 'Annuler'}
              </button>

              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'transform 0.1s ease'
                }}
              >
                {isDeleting ? (
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

      {/* 6. Success Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1100,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: '30px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.88rem',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
});

export default InboxView;
