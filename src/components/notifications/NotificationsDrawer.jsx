import React from 'react';
import { X, Heart, Sparkles, MessageCircle, Crown } from 'lucide-react';

export default function NotificationsDrawer({ isOpen, onClose, onSelectChat, onNavigateTab }) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n1',
      type: 'like',
      title: 'Sarah Jenkins a aimé votre maquette audio.',
      subtitle: 'En plein enregistrement des prises vocales pour notre nouvel EP...',
      time: '15m ago',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      icon: Heart,
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      targetTab: 'feed'
    },
    {
      id: 'n2',
      type: 'match',
      title: 'Nouveau match pour votre offre musicale',
      subtitle: 'Harmonix Records - Guitariste Lead Solo (Tournée 2026)',
      time: '1h ago',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
      icon: Sparkles,
      iconBg: '#EFF6FF',
      iconColor: '#0066FF',
      targetTab: 'match'
    },
    {
      id: 'n3',
      type: 'message',
      title: 'Daniad Stansom vous a envoyé un message',
      subtitle: 'Salut ! J\'ai écouté ton mix sur StageLink...',
      time: '2h ago',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      icon: MessageCircle,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      targetTab: 'discussions',
      chatObj: {
        id: 'chat_daniad',
        participant: {
          id: 'usr_daniad',
          name: 'Daniad Stansom',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          role: 'Ingénieur Mixage & Mastering',
          online: true
        },
        unreadCount: 0,
        messages: [
          { id: 'm1', sender: 'other', text: 'Salut ! J\'ai écouté ton mix sur StageLink...', timestamp: '2h ago' }
        ]
      }
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
    }}>
      <div className="animate-slide-up" style={{
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
          {notifications.map((n) => {
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
