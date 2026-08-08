import React from 'react';
import { Home, Users, MessageCircle, ShoppingBag, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function BottomNav({ activeTab, setActiveTab, unreadMessagesCount = 1, isDarkMode }) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'feed', label: t('nav_home'), icon: Home },
    { id: 'match', label: t('nav_match'), icon: Users },
    { id: 'discussions', label: t('nav_discussions'), icon: MessageCircle, badge: unreadMessagesCount },
    { id: 'studio', label: t('nav_services'), icon: ShoppingBag },
    { id: 'profile', label: t('nav_profile'), icon: User }
  ];

  const bgColor = isDarkMode ? '#0F172A' : '#FFFFFF';

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 80,
      transition: 'all 0.3s ease'
    }}>
      {/* Main nav row */}
      <div style={{
        paddingTop: '6px',
        paddingBottom: '6px',
        background: bgColor,
        borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: isDarkMode ? '0 -6px 20px rgba(0, 0, 0, 0.4)' : '0 -6px 18px rgba(0, 0, 0, 0.06)',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                color: isActive ? '#0066FF' : isDarkMode ? '#64748B' : '#94A3B8',
                cursor: 'pointer',
                flex: 1,
                position: 'relative',
                padding: '3px 0',
                transition: 'color 0.2s ease'
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {tab.badge && tab.badge > 0 ? (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-7px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1px 4px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    border: isDarkMode ? '1.5px solid #0F172A' : '1.5px solid #FFFFFF'
                  }}>
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span style={{
                fontSize: '0.70rem',
                fontWeight: isActive ? 700 : 500,
                lineHeight: 1
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Safe area bottom fill — extends background color to physical screen edge on notched iPhones */}
      <div style={{
        height: 'env(safe-area-inset-bottom, 0px)',
        background: bgColor
      }} />
    </div>
  );
}
