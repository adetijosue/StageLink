import React from 'react';
import { Bell, Search } from 'lucide-react';
import Logo from '../common/Logo';
import { soundEngine } from '../../services/audioService';

export default function TopBar({ activeTab, onOpenNotifications, onOpenUserSearch, unreadNotificationsCount = 0, isDarkMode }) {
  const handleSearchClick = () => {
    soundEngine.playPopSound();
    if (onOpenUserSearch) onOpenUserSearch();
  };

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 60,
      background: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.8)',
      paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
      paddingBottom: '10px',
      paddingLeft: '16px',
      paddingRight: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
      transition: 'all 0.3s ease'
    }}>
      {/* Prominent Enlarged Brand Logo */}
      <Logo size="medium" variant="horizontal" />

      {/* Top Right Action Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* Global User Search Button */}
        <button
          onClick={handleSearchClick}
          title="Rechercher un membre ou artiste"
          style={{
            background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(248, 250, 252, 0.8)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0066FF',
            transition: 'all 0.2s ease'
          }}
        >
          <Search size={18} color={isDarkMode ? '#38BDF8' : '#0066FF'} />
        </button>

        {/* Notifications Bell Button with Dynamic Badge Counter */}
        <button
          onClick={onOpenNotifications}
          style={{
            position: 'relative',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(248, 250, 252, 0.8)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Bell size={18} color={isDarkMode ? '#F8FAFC' : '#0F172A'} />
          {unreadNotificationsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#EF4444',
              border: isDarkMode ? '2px solid #0F172A' : '2px solid #FFFFFF'
            }} />
          )}
        </button>
      </div>
    </div>
  );
}
