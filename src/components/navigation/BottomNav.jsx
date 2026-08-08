import React from 'react';
import { Home, Users, MessageCircle, ShoppingBag, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function BottomNav({ activeTab, setActiveTab, unreadMessagesCount = 1, isDarkMode }) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'match', label: t('nav_match'), icon: Users },
    { id: 'discussions', label: t('nav_discussions'), icon: MessageCircle, badge: unreadMessagesCount },
    { id: 'feed', label: t('nav_home'), icon: Home, isCenter: true },
    { id: 'studio', label: t('nav_services'), icon: ShoppingBag },
    { id: 'profile', label: t('nav_profile'), icon: User }
  ];

  const bgColor = isDarkMode ? '#0F172A' : '#FFFFFF';

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      zIndex: 80,
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{
        position: 'relative',
        paddingTop: '6px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
        background: bgColor,
        borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: isDarkMode ? '0 -6px 20px rgba(0, 0, 0, 0.4)' : '0 -6px 18px rgba(0, 0, 0, 0.06)',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
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
                  cursor: 'pointer',
                  flex: 1,
                  position: 'relative',
                  marginTop: '-22px',
                  zIndex: 10
                }}
              >
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: isActive
                    ? 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)'
                    : isDarkMode
                    ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
                    : 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: isActive
                    ? '0 10px 25px rgba(0, 102, 255, 0.65)'
                    : isDarkMode
                    ? '0 6px 18px rgba(0, 0, 0, 0.5)'
                    : '0 6px 18px rgba(0, 102, 255, 0.35)',
                  border: `4px solid ${bgColor}`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)'
                }}>
                  <Icon size={24} strokeWidth={2.5} color={isActive ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#FFFFFF'} />
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#0066FF' : isDarkMode ? '#64748B' : '#94A3B8',
                  marginTop: '2px',
                  lineHeight: 1
                }}>
                  {tab.label}
                </span>
              </button>
            );
          }

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
                padding: '4px 0',
                transition: 'color 0.2s ease'
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {tab.badge && tab.badge > 0 ? (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-7px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1px 5px',
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

      {/* Extended Bottom Edge Color Block — guarantees zero black space under navbar on iPhone 15 Pro Max and all mobile devices */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        height: '250px',
        background: bgColor,
        pointerEvents: 'none'
      }} />
    </div>
  );
}

