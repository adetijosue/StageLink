import React, { useState } from 'react';
import { Plus, Search, MessageSquare, PhoneCall } from 'lucide-react';
import SwipeableChatItem from './SwipeableChatItem';

export default function ChatList({ chats, onSelectChat, onOpenNewChatModal, onOpenCallHistoryModal, isDarkMode, onArchiveChat, onDeleteChat, onToggleUnread, onOpenPublicProfile }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Check if there are any missed calls across chats
  let missedCallsCount = 0;
  (chats || []).forEach((c) => {
    (c.messages || []).forEach((m) => {
      if (m.callStatus === 'missed' || (m.text && m.text.toLowerCase().includes('manqué'))) {
        missedCallsCount++;
      }
    });
  });

  const filteredChats = (chats || []).filter(chat => {
    if (!searchQuery) return true;
    const partnerName = chat.participant?.name?.toLowerCase() || '';
    return partnerName.includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header with Title, Discreet Call History Button and New Chat Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
            Discussions
          </h2>

          {/* Discreet Call History Icon Button */}
          <button
            onClick={onOpenCallHistoryModal}
            title="Historique des Appels Audio & Vidéo"
            style={{
              background: isDarkMode ? '#1E293B' : '#F1F5F9',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0066FF',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            <PhoneCall size={18} />
            {missedCallsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#EF4444',
                border: '2px solid #FFFFFF'
              }} />
            )}
          </button>
        </div>

        <button
          onClick={onOpenNewChatModal}
          style={{
            background: '#0066FF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)'
          }}
        >
          <Plus size={16} /> Nouvelle Discussion
        </button>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une discussion..."
          style={{
            width: '100%',
            padding: '10px 12px 10px 38px',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
            background: 'var(--card-bg)',
            color: 'var(--text-dark)',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Chat Conversations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredChats.map((chat) => (
          <SwipeableChatItem
            key={chat.id}
            chat={chat}
            onSelectChat={onSelectChat}
            onArchive={onArchiveChat}
            onDelete={onDeleteChat}
            onToggleUnread={onToggleUnread}
            onOpenPublicProfile={onOpenPublicProfile}
          />
        ))}
      </div>
    </div>
  );
}
