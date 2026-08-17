import React from 'react';
import { Search, Plus, PhoneCall } from 'lucide-react';
import UserAvatar from '../../common/UserAvatar';
import MessageStatusTicks from '../MessageStatusTicks';

import { useConversationList } from '../../../hooks/useConversationList';
import { soundEngine } from '../../../services/audioService';
import { presenceService } from '../../../services/presenceService';
import { useLanguage } from '../../../context/LanguageContext';

const InboxView = React.memo(function InboxView({
  currentUser,
  onSelectConversation,
  onOpenNewChatModal,
  onOpenCallHistoryModal,
  onOpenProfile
}) {
  const { t, language } = useLanguage();
  const [onlineUserIds, setOnlineUserIds] = React.useState(() => presenceService.getOnlineUserIds());

  React.useEffect(() => {
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

      {/* 4. Filter Tabs */}
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
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{language === 'en' ? 'No conversations found' : 'Aucune discussion trouvée'}</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const partnerId = conv.partner?.id || conv.participant?.id || conv.participantId || conv.partnerId;
            const isOnline = Boolean(partnerId && onlineUserIds.includes(String(partnerId)));
            const lastMsg = conv.lastMessage;
            const isMine = lastMsg?.sender_id === currentUser?.id;

            return (
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
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', flexShrink: 0 }}>
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
            );
          })
        )}
      </div>
    </div>
  );
});

export default InboxView;
