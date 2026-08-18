import React, { useState, useEffect } from 'react';
import { Award, Flame, Zap, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { gamification, ARTIST_TIERS, AVAILABLE_BADGES } from '../../services/gamificationService';
import { haptics } from '../../services/hapticsService';

export default function GamificationBadgeBanner({ isDarkMode }) {
  const [gameState, setGameState] = useState(() => gamification.state);
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  useEffect(() => {
    gamification.checkDailyStreak();
    const handleUpdate = (e) => {
      setGameState({ ...e.detail });
    };
    window.addEventListener('gamification_updated', handleUpdate);
    return () => window.removeEventListener('gamification_updated', handleUpdate);
  }, []);

  const currentTier = gamification.getCurrentTier();
  const nextTier = gamification.getNextTier();
  const xp = gameState.xp || 0;
  const progressPercent = nextTier
    ? Math.min(100, Math.round(((xp - currentTier.minXp) / (nextTier.minXp - currentTier.minXp)) * 100))
    : 100;

  return (
    <>
      <div
        onClick={() => {
          haptics.selection();
          setShowBadgesModal(true);
        }}
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderRadius: '20px',
          padding: '14px 16px',
          marginBottom: '16px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 6px 18px rgba(0, 102, 255, 0.06)',
          cursor: 'pointer',
          transition: 'transform 0.15s ease'
        }}
        className="gamification-card"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>{currentTier.badge}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  {currentTier.name}
                </h4>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#0066FF',
                    background: isDarkMode ? 'rgba(0, 102, 255, 0.2)' : '#EFF6FF',
                    padding: '2px 6px',
                    borderRadius: '8px'
                  }}
                >
                  Niv. {currentTier.level}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                {xp} XP {nextTier && `• ${nextTier.minXp - xp} XP pour ${nextTier.name}`}
              </p>
            </div>
          </div>

          {/* Daily Streak Flame Counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'linear-gradient(135deg, #FF6B00 0%, #EF4444 100%)',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
            }}
          >
            <Flame size={14} fill="#FFF" />
            <span>{gameState.streak || 1} j</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: '6px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #0066FF 0%, #00F0FF 100%)',
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Badges and Accomplishments Modal */}
      {showBadgesModal && (
        <div
          onClick={() => setShowBadgesModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderRadius: '24px',
              padding: '22px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0066FF, #00F0FF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 20px rgba(0, 102, 255, 0.35)'
                }}
              >
                <Award size={28} />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                Badges & Succès Artiste
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Gagnez de l'XP en publiant, collaborant et restant actif chaque jour.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AVAILABLE_BADGES.map((badge) => {
                const isUnlocked = (gameState.unlockedBadges || []).includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      background: isUnlocked
                        ? (isDarkMode ? 'rgba(0, 102, 255, 0.12)' : '#F0FDF4')
                        : (isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC'),
                      border: isUnlocked
                        ? (isDarkMode ? '1px solid rgba(0, 102, 255, 0.3)' : '1px solid #BBF7D0')
                        : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'),
                      opacity: isUnlocked ? 1 : 0.6
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.6rem',
                        width: '42px',
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#FFFFFF'
                      }}
                    >
                      {badge.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                          {badge.title}
                        </h5>
                        {isUnlocked && <CheckCircle2 size={14} color="#10B981" />}
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748B' }}>
                        {badge.desc}
                      </p>
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: isUnlocked ? '#10B981' : '#94A3B8'
                      }}
                    >
                      +{badge.xpReward} XP
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowBadgesModal(false)}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '18px',
                padding: '12px',
                borderRadius: '14px',
                fontSize: '0.88rem',
                fontWeight: 700
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
