import React from 'react';
import { Search, Plus, PhoneCall } from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';

import { useConversationList } from '../../../hooks/useConversationList';
import { soundEngine } from '../../../services/audioService';

const InboxView = React.memo(function InboxView({
  currentUser,
  onSelectConversation,
  onOpenNewChatModal,
  onOpenCallHistoryModal,
  onOpenProfile
}) {
  const {
    conversations,
    directNotes,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    postNote
  } = useConversationList(currentUser);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-light)'
    }}>
      {/* 1. Header Bar */}
      <div style={{
        paddingTop: 'calc(14px + env(safe-area-inset-top, 14px))',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
          Messages
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenCallHistoryModal}
            title="Historique des appels"
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
            title="Nouveau message"
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


      {/* 3. Search Bar */}
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
            placeholder="Rechercher des artistes, groupes..."
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

      {/* 4. Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-light)'
      }}>
        {[
          { id: 'all', label: 'Toutes' },
          { id: 'unread', label: 'Non lues' },
          { id: 'groups', label: 'Groupes' }
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

      {/* 5. Conversations List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {conversations.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '240px',
            color: '#94A3B8'
          }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Aucune discussion trouvée</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                soundEngine.playPopSound();
                onSelectConversation(conv);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '18px',
                background: 'var(--card-bg)',
                marginBottom: '8px',
                cursor: 'pointer',
                border: '1px solid var(--border-light)',
                transition: 'transform 0.1s ease',
                boxShadow: conv.unreadCount > 0 ? '0 4px 12px rgba(0, 102, 255, 0.08)' : 'none'
              }}
            >
              <UserAvatar
                user={{
                  avatar: conv.avatar,
                  name: conv.title
                }}
                size={50}
              />

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
                  {conv.lastMessage && (
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8', flexShrink: 0 }}>
                      {new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <p style={{
                    fontSize: '0.8rem',
                    color: conv.unreadCount > 0 ? '#0066FF' : '#64748B',
                    fontWeight: conv.unreadCount > 0 ? 700 : 400,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conv.lastMessage?.message_type === 'audio'
                      ? '🎙️ Note vocale'
                      : conv.lastMessage?.message_type === 'image'
                      ? '📷 Photo'
                      : (conv.lastMessage?.content || 'Nouvelle discussion')}
                  </p>

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
          ))
        )}
      </div>
    </div>
  );
});

export default InboxView;
