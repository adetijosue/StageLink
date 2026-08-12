import React from 'react';
import { X, Heart, Sparkles, MessageCircle, Eye } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

function NotificationsDrawer({ isOpen, onClose, onSelectChat, onNavigateTab, notifications, chats = [], onDeleteNotification }) {
  if (!isOpen) return null;

  const mapNotificationToUI = (n) => {
    if (!n) return null;
    let title, subtitle, icon, iconBg, iconColor, targetTab;
    switch (n.type) {
      case 'like_post':
        title = `${n.actorName || "Quelqu'un"} a aimé votre publication.`;
        subtitle = "Ouvrez le fil d'actualité pour voir.";
        icon = Heart;
        iconBg = '#FEF2F2';
        iconColor = '#EF4444';
        targetTab = 'feed';
        break;
      case 'like_story':
        title = `${n.actorName || "Quelqu'un"} a aimé votre story.`;
        subtitle = "Appuyez pour revoir votre story.";
        icon = Heart;
        iconBg = '#FEF2F2';
        iconColor = '#EF4444';
        targetTab = 'feed';
        break;
      case 'comment_post':
        title = `${n.actorName || "Quelqu'un"} a commenté votre publication.`;
        subtitle = "Appuyez pour lire le commentaire.";
        icon = MessageCircle;
        iconBg = '#ECFDF5';
        iconColor = '#10B981';
        targetTab = 'feed';
        break;
      case 'view_story':
        title = `${n.actorName || "Quelqu'un"} a vu votre story.`;
        subtitle = "Regardez qui interagit avec vous.";
        icon = Eye;
        iconBg = '#EFF6FF';
        iconColor = '#0066FF';
        targetTab = 'feed';
        break;
      case 'message':
        title = `${n.actorName || "Quelqu'un"} vous a envoyé un message.`;
        subtitle = "Appuyez pour voir la discussion.";
        icon = MessageCircle;
        iconBg = '#EEF2FF';
        iconColor = '#4F46E5';
        targetTab = 'discussions';
        break;
      case 'reshare_story':
      case 'reshare_post':
        title = `${n.actorName || "Quelqu'un"} a partagé votre contenu.`;
        subtitle = "Votre portée s'étend !";
        icon = Sparkles;
        iconBg = '#FEF3C7';
        iconColor = '#D97706';
        targetTab = 'feed';
        break;
      case 'incoming_call':
        title = `Appel manqué de ${n.actorName || "Quelqu'un"}`;
        subtitle = "Appuyez pour voir la discussion.";
        icon = MessageCircle; // fallback icon since Phone is not imported here
        iconBg = '#FEF2F2';
        iconColor = '#EF4444';
        targetTab = 'discussions';
        break;
      default:
        title = `${n.actorName || "Quelqu'un"} a interagi avec vous.`;
        subtitle = '';
        icon = Sparkles;
        iconBg = '#EFF6FF';
        iconColor = '#0066FF';
        targetTab = 'feed';
    }
    
    return {
      id: n.id || Math.random().toString(),
      type: n.type || 'info',
      title,
      subtitle,
      time: n.time || "À l'instant",
      avatar: n.actorAvatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
      icon: icon || Sparkles,
      iconBg: iconBg || '#EFF6FF',
      iconColor: iconColor || '#0066FF',
      targetTab,
      isRead: n.isRead,
      chatObj: n.chatObj
    };
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  
  let displayNotifications = [];
  try {
    displayNotifications = safeNotifications.length > 0 
      ? safeNotifications.map(mapNotificationToUI).filter(Boolean)
      : [
        {
          id: 'empty',
          type: 'info',
          title: 'Aucune notification',
          subtitle: 'Vos nouvelles interactions apparaîtront ici.',
          time: '',
          avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          icon: Sparkles,
          iconBg: '#F3F4F6',
          iconColor: '#9CA3AF',
          targetTab: 'feed'
        }
      ];
  } catch (err) {
    console.error("Erreur lors du mappage des notifications:", err);
  }

  const handleNotificationClick = (item) => {
    if (typeof onClose === 'function') onClose();

    if ((item.type === 'message' || item.type === 'incoming_call') && typeof onSelectChat === 'function') {
      const chatObj = chats.find(c => c.id === item.actorId || (c.participant && c.participant.id === item.actorId));
      if (chatObj) {
        onSelectChat(chatObj);
      } else {
        onNavigateTab('discussions');
      }
    } else if (item.targetTab && typeof onNavigateTab === 'function') {
      onNavigateTab(item.targetTab);
    }
    
    if (typeof onDeleteNotification === 'function' && item.id) {
      onDeleteNotification(item.id);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div className="animate-slide-up" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '440px',
        background: '#FFFFFF',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        paddingTop: '20px',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 24px))',
        maxHeight: '82vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
            Fil d\\'Activité & Notifications
          </h3>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayNotifications.map((n, i) => {
            if (!n) return null;
            const Icon = n.icon || Sparkles;
            return (
              <div
                key={n.id || i}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <UserAvatar user={{ avatar: n.avatar, name: n.actorName }} size={42} />
                  <span style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: n.iconBg,
                    color: n.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #FFFFFF'
                  }}>
                    <Icon size={12} />
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{n.title}</h5>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.subtitle}</p>
                </div>

                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{n.time}</span>
              </div>
            );
          })}
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
