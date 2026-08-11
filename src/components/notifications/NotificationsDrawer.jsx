import React from 'react';
import { X, Heart, Sparkles, MessageCircle, Crown } from 'lucide-react';

export default function NotificationsDrawer({ isOpen, onClose, onSelectChat, onNavigateTab }) {
  if (!isOpen) return null;

  const mapNotificationToUI = (n) => {
    let title, subtitle, icon, iconBg, iconColor, targetTab;
    switch (n.type) {
      case 'like_post':
        title = `${n.actorName} a aimé votre publication.`;
        subtitle = 'Ouvrez le fil d\'actualité pour voir.';
        icon = Heart;
        iconBg = '#FEF2F2';
        iconColor = '#EF4444';
        targetTab = 'feed';
        break;
      case 'like_story':
        title = `${n.actorName} a aimé votre story.`;
        subtitle = 'Appuyez pour revoir votre story.';
        icon = Heart;
        iconBg = '#FEF2F2';
        iconColor = '#EF4444';
        targetTab = 'feed';
        break;
      case 'comment_post':
        title = `${n.actorName} a commenté votre publication.`;
        subtitle = 'Appuyez pour lire le commentaire.';
        icon = MessageCircle;
        iconBg = '#ECFDF5';
        iconColor = '#10B981';
        targetTab = 'feed';
        break;
      case 'view_story':
        title = `${n.actorName} a vu votre story.`;
        subtitle = 'Regardez qui interagit avec vous.';
        icon = Eye;
        iconBg = '#EFF6FF';
        iconColor = '#0066FF';
        targetTab = 'feed';
        break;
      case 'reshare_story':
      case 'reshare_post':
        title = `${n.actorName} a partagé votre contenu.`;
        subtitle = 'Votre portée s\'étend !';
        icon = Sparkles;
        iconBg = '#FEF3C7';
        iconColor = '#D97706';
        targetTab = 'feed';
        break;
      default:
        title = `${n.actorName} a interagi avec vous.`;
        subtitle = '';
        icon = Sparkles;
        iconBg = '#EFF6FF';
        iconColor = '#0066FF';
        targetTab = 'feed';
    }
    
    return {
      id: n.id,
      type: n.type,
      title,
      subtitle,
      time: n.time,
      avatar: n.actorAvatar,
      icon,
      iconBg,
      iconColor,
      targetTab,
      isRead: n.isRead,
      chatObj: n.chatObj
    };
  };

  const displayNotifications = notifications && notifications.length > 0 
    ? notifications.map(mapNotificationToUI) 
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

  const handleNotificationClick = (item) => {
    onClose();

    if (item.type === 'message' && item.chatObj && onSelectChat) {
      onSelectChat(item.chatObj);
    } else if (item.targetTab && onNavigateTab) {
      onNavigateTab(item.targetTab);
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
            Fil d'Activité & Notifications
          </h3>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayNotifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
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
                  <img src={n.avatar} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
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
