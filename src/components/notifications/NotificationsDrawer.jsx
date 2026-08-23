import React, { useState, useRef, useEffect } from 'react';
import { X, Heart, Sparkles, MessageCircle, Eye, Trash2, Trash, PhoneIncoming, PhoneMissed, CheckCheck } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { soundEngine } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

function SwipeableNotificationItem({ item, onClick, onDelete }) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isHorizontalSwipeRef = useRef(false);
  const containerRef = useRef(null);

  const DELETE_SNAP_WIDTH = 75; // Width of revealed delete button
  const AUTO_DELETE_THRESHOLD = 130; // Threshold to auto delete on fling

  const handleTouchStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    isHorizontalSwipeRef.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const touch = e.touches ? e.touches[0] : e;
    const diffX = touch.clientX - touchStartXRef.current;
    const diffY = touch.clientY - touchStartYRef.current;

    // Detect if movement is primarily horizontal
    if (!isHorizontalSwipeRef.current) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
        isHorizontalSwipeRef.current = true;
      } else if (Math.abs(diffY) > 10) {
        setIsSwiping(false);
        return;
      }
    }

    if (isHorizontalSwipeRef.current) {
      if (e.cancelable && e.preventDefault) {
        e.preventDefault();
      }
      // Only allow swiping to the left (negative diff)
      if (diffX < 0) {
        setSwipeOffset(Math.max(diffX, -AUTO_DELETE_THRESHOLD - 30));
      } else {
        setSwipeOffset(Math.min(diffX * 0.2, 20)); // slight resistance on right swipe
      }
    }
  };

  const triggerDelete = () => {
    try {
      if (navigator.vibrate) navigator.vibrate(25);
    } catch (err) {}
    soundEngine.playPopSound();
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(item.id);
    }, 250);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    if (Math.abs(swipeOffset) >= AUTO_DELETE_THRESHOLD) {
      triggerDelete();
    } else if (swipeOffset < -DELETE_SNAP_WIDTH / 1.5) {
      setSwipeOffset(-DELETE_SNAP_WIDTH); // snap open delete button
    } else {
      setSwipeOffset(0); // snap closed
    }
  };

  // Close swipe on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSwipeOffset(0);
      }
    };
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const Icon = item.icon || Sparkles;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        maxHeight: isDeleting ? '0px' : '110px',
        opacity: isDeleting ? 0 : 1,
        transform: isDeleting ? 'translateX(-100%)' : 'none',
        transition: isDeleting ? 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' : 'max-height 0.25s ease',
        marginBottom: isDeleting ? '0px' : '8px',
        userSelect: 'none'
      }}
    >
      {/* Background Red Delete Action Container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${DELETE_SNAP_WIDTH + 30}px`,
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '20px',
          color: '#FFFFFF',
          cursor: 'pointer',
          zIndex: 1
        }}
        onClick={(e) => {
          e.stopPropagation();
          triggerDelete();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <Trash2 size={20} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>Supprimer</span>
        </div>
      </div>

      {/* Foreground Notification Content Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={(e) => { if (isSwiping) handleTouchMove(e); }}
        onMouseUp={handleTouchEnd}
        onClick={() => {
          if (swipeOffset === 0) {
            onClick(item);
          } else {
            setSwipeOffset(0);
          }
        }}
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '12px 14px',
          borderRadius: '16px',
          background: item.isRead ? '#FFFFFF' : '#F8FAFC',
          border: item.isRead ? '1px solid #E2E8F0' : '1.5px solid #0066FF',
          boxShadow: item.isRead ? '0 2px 6px rgba(0, 0, 0, 0.03)' : '0 4px 12px rgba(0, 102, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.15s ease'
        }}
      >
        {/* User Avatar with incrusted notification type icon */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <UserAvatar user={{ avatar: item.avatar, name: item.actorName }} size={42} />
          <span style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: item.iconBg,
            color: item.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Icon size={12} strokeWidth={2.5} />
          </span>
        </div>

        {/* Notification Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h5 style={{
            fontSize: '0.88rem',
            fontWeight: item.isRead ? 600 : 800,
            color: '#0F172A',
            margin: 0,
            lineHeight: 1.3
          }}>
            {item.title}
          </h5>
          {item.subtitle && (
            <p style={{
              fontSize: '0.76rem',
              color: '#64748B',
              margin: '3px 0 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {item.subtitle}
            </p>
          )}
        </div>

        {/* Timestamp & Direct Delete Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 500 }}>{item.time}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerDelete();
            }}
            title="Supprimer cette notification"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#CBD5E1',
              padding: '4px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease, background 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEE2E2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationsDrawer({
  isOpen,
  onClose,
  onSelectChat,
  onNavigateTab,
  onOpenNotification,
  notifications = [],
  chats = [],
  onDeleteNotification,
  onClearAllNotifications
}) {
  const { t, language } = useLanguage();
  if (!isOpen) return null;

  const mapNotificationToUI = (n) => {
    if (!n) return null;
    let title, subtitle, icon, iconBg, iconColor, targetTab;
    const someone = language === 'en' ? 'Someone' : "Quelqu'un";
    const postId = n.postId || n.post_id || n.reference_id || n.referenceId || n.data?.postId || n.metadata?.postId;
    const storyId = n.storyId || n.story_id || n.data?.storyId || n.metadata?.storyId;

    switch (n.type) {
      case 'like_post':
        title = language === 'en' ? `${n.actorName || someone} liked your post.` : `${n.actorName || someone} a aimé votre publication.`;
        subtitle = language === 'en' ? "Open feed to view." : "Ouvrez le fil d'actualité pour voir.";
        icon = Heart;
        iconBg = '#FEF2F2';
        iconColor = '#EF4444';
        targetTab = 'feed';
        break;
      case 'like_story':
        title = language === 'en' ? `${n.actorName || someone} liked your story.` : `${n.actorName || someone} a aimé votre story.`;
        subtitle = language === 'en' ? "Tap to rewatch your story." : "Appuyez pour revoir votre story.";
        icon = Heart;
        iconBg = '#FEF2F2';
        iconColor = '#EF4444';
        targetTab = 'feed';
        break;
      case 'comment_post':
        title = language === 'en' ? `${n.actorName || someone} commented on your post.` : `${n.actorName || someone} a commenté votre publication.`;
        subtitle = language === 'en' ? "Tap to read comment." : "Appuyez pour lire le commentaire.";
        icon = MessageCircle;
        iconBg = '#ECFDF5';
        iconColor = '#10B981';
        targetTab = 'feed';
        break;
      case 'view_story':
        title = language === 'en' ? `${n.actorName || someone} viewed your story.` : `${n.actorName || someone} a vu votre story.`;
        subtitle = language === 'en' ? "See who interacts with your statuses." : "Regardez qui interagit avec vos statuts.";
        icon = Eye;
        iconBg = '#EFF6FF';
        iconColor = '#0066FF';
        targetTab = 'feed';
        break;
      case 'message':
        title = language === 'en' ? `${n.actorName || someone} sent you a message.` : `${n.actorName || someone} vous a envoyé un message.`;
        subtitle = language === 'en' ? "Tap to open chat." : "Appuyez pour ouvrir la discussion.";
        icon = MessageCircle;
        iconBg = '#EEF2FF';
        iconColor = '#4F46E5';
        targetTab = 'discussions';
        break;
      case 'reshare_story':
      case 'reshare_post':
        title = language === 'en' ? `${n.actorName || someone} shared your content.` : `${n.actorName || someone} a partagé votre contenu.`;
        subtitle = language === 'en' ? "Your visibility is growing!" : "Votre visibilité augmente !";
        icon = Sparkles;
        iconBg = '#FEF3C7';
        iconColor = '#D97706';
        targetTab = 'feed';
        break;
      case 'incoming_call_audio':
      case 'incoming_call_video':
        title = language === 'en' ? `Call from ${n.actorName || someone}` : `Appel de ${n.actorName || someone}`;
        subtitle = language === 'en' ? "Tap to view conversation." : "Appuyez pour voir la discussion.";
        icon = PhoneMissed;
        iconBg = '#FEF2F2';
        iconColor = '#EF4444';
        targetTab = 'discussions';
        break;
      default:
        title = language === 'en' ? `${n.actorName || someone} interacted with you.` : `${n.actorName || someone} a interagi avec vous.`;
        subtitle = '';
        icon = Sparkles;
        iconBg = '#EFF6FF';
        iconColor = '#0066FF';
        targetTab = 'feed';
    }

    return {
      id: n.id || Math.random().toString(),
      actorId: n.actorId || n.actor_id,
      actorName: n.actorName || (language === 'en' ? 'Artist' : 'Artiste'),
      type: n.type || 'info',
      title,
      subtitle,
      time: n.time || (language === 'en' ? 'Just now' : "À l'instant"),
      avatar: n.actorAvatar || '',
      icon: icon || Sparkles,
      iconBg: iconBg || '#EFF6FF',
      iconColor: iconColor || '#0066FF',
      targetTab,
      postId,
      storyId,
      referenceId: n.reference_id || n.referenceId,
      isRead: n.isRead,
      chatObj: n.chatObj,
      raw: n
    };
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const displayNotifications = safeNotifications.map(mapNotificationToUI).filter(Boolean);

  const handleNotificationClick = (item) => {
    if (typeof onClose === 'function') onClose();

    if (typeof onOpenNotification === 'function') {
      onOpenNotification(item);
      return;
    }

    if ((item.type === 'message' || item.type === 'incoming_call_audio' || item.type === 'incoming_call_video') && typeof onSelectChat === 'function') {
      const chatObj = chats.find(c => c.id === item.actorId || (c.participant && c.participant.id === item.actorId));
      if (chatObj) {
        onSelectChat(chatObj);
      } else {
        onNavigateTab('discussions');
      }
    } else if (item.targetTab && typeof onNavigateTab === 'function') {
      onNavigateTab(item.targetTab);
    }
  };

  const handleClearAll = () => {
    soundEngine.playPopSound();
    if (typeof onClearAllNotifications === 'function') {
      onClearAllNotifications();
    } else if (typeof onDeleteNotification === 'function') {
      displayNotifications.forEach(n => onDeleteNotification(n.id));
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#FFFFFF',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          paddingTop: '20px',
          paddingLeft: '18px',
          paddingRight: '18px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 24px))',
          maxHeight: '84vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {language === 'en' ? 'Notifications & Activity' : 'Notifications & Activité'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>
              {language === 'en' ? 'Swipe left to delete' : 'Glissez vers la gauche (Swipe) pour supprimer'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {displayNotifications.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  color: '#EF4444',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={language === 'en' ? 'Clear all' : 'Tout effacer'}
              >
                <Trash2 size={13} />
                <span>{language === 'en' ? 'Clear all' : 'Tout effacer'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B'
              }}
              title={t('modal_close')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
          {displayNotifications.length > 0 ? (
            displayNotifications.map((n) => (
              <SwipeableNotificationItem
                key={n.id}
                item={n}
                onClick={handleNotificationClick}
                onDelete={onDeleteNotification}
              />
            ))
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 16px',
              textAlign: 'center',
              color: '#94A3B8'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: '#0066FF'
              }}>
                <Sparkles size={28} />
              </div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>
                {language === 'en' ? 'No notifications' : 'Aucune notification'}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, maxWidth: '260px', lineHeight: 1.4 }}>
                {language === 'en' ? 'Your new likes, comments, messages, and story views will appear here.' : 'Vos nouveaux likes, commentaires, messages et vues de stories apparaîtront ici.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '20px', overflowY: 'auto' }}>
          <h2 style={{ color: '#EF4444' }}>Erreur Notifications</h2>
          <p>L\\'interface de notification a rencontré un problème. Veuillez signaler cette erreur.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#333', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={this.props.onClose} style={{ marginTop: 20, padding: '10px 20px', background: '#0066FF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Fermer la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function NotificationsDrawerWrapper(props) {
  return (
    <ErrorBoundary onClose={props.onClose}>
      <NotificationsDrawer {...props} />
    </ErrorBoundary>
  );
}
