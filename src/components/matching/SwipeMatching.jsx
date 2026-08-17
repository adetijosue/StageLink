import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Star, 
  Check, 
  MapPin, 
  RotateCcw, 
  MessageCircle, 
  User, 
  Users, 
  Music, 
  Disc, 
  Headphones, 
  Mic, 
  Radio, 
  Award, 
  RefreshCw, 
  Flame, 
  ExternalLink 
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

const SwipeMatching = React.memo(function SwipeMatching({ 
  matches = [], 
  onApplyMatch, 
  onRefreshMatches, 
  onOpenProfile, 
  currentUser 
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchSuccess, setShowMatchSuccess] = useState(null);
  const [appliedIds, setAppliedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_applied_matches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Touch & Drag Gesture States
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // Filter real user match cards based on musical categories
  const filteredMatches = useMemo(() => {
    return (matches || []).filter(card => {
      // Don't show current logged in user
      if (currentUser && (card.userId === currentUser.id || card.id === `match_${currentUser.id}`)) {
        return false;
      }

      if (activeFilter === 'applied') {
        return appliedIds.includes(card.id) || appliedIds.includes(card.userId);
      }

      const roleStr = `${card.role || ''} ${card.category || ''} ${(card.skills || []).join(' ')}`.toLowerCase();

      if (activeFilter === 'producers') {
        return roleStr.includes('produc') || roleStr.includes('beat') || roleStr.includes('compos') || roleStr.includes('arrangeur');
      }
      if (activeFilter === 'singers') {
        return roleStr.includes('chant') || roleStr.includes('sing') || roleStr.includes('vocal') || roleStr.includes('rapp') || roleStr.includes('music') || roleStr.includes('guit') || roleStr.includes('pian');
      }
      if (activeFilter === 'engineers') {
        return roleStr.includes('ingé') || roleStr.includes('mix') || roleStr.includes('mast') || roleStr.includes('sound') || roleStr.includes('studio');
      }

      return true;
    });
  }, [matches, activeFilter, appliedIds, currentUser]);

  const currentCard = filteredMatches[currentIndex] || filteredMatches[0];

  // Save applied IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stagelink_applied_matches', JSON.stringify(appliedIds));
    } catch (e) {}
  }, [appliedIds]);

  // Confetti trigger
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Perform Match Action
  const handleAction = (type) => {
    if (!currentCard) return;

    if (type === 'apply' || type === 'like' || type === 'superlike') {
      triggerConfetti();
      setShowMatchSuccess(currentCard);

      const targetId = currentCard.id || currentCard.userId;
      if (targetId && !appliedIds.includes(targetId)) {
        setAppliedIds(prev => [...prev, targetId]);
      }
      if (onApplyMatch) onApplyMatch(currentCard);
    }

    // Move to next card
    if (currentIndex < filteredMatches.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setDragOffset({ x: 0, y: 0 });
  };

  const handleRewind = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (filteredMatches.length > 0) {
      setCurrentIndex(filteredMatches.length - 1);
    }
  };

  // Native Touch Handlers for Drag Swiping
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset.x > 90) {
      // Swiped Right -> Match / Like
      handleAction('apply');
    } else if (dragOffset.x < -90) {
      // Swiped Left -> Pass / Dislike
      handleAction('dislike');
    } else if (dragOffset.y < -100) {
      // Swiped Up -> Super Like
      handleAction('superlike');
    } else {
      // Reset position
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Dynamic card transform based on drag
  const rotation = dragOffset.x * 0.08;
  const matchOpacity = Math.min(1, Math.max(0, dragOffset.x / 75));
  const passOpacity = Math.min(1, Math.max(0, -dragOffset.x / 75));

  const filterTabs = [
    { id: 'all', label: 'Tous', icon: <Users size={14} /> },
    { id: 'producers', label: 'Producteurs', icon: <Disc size={14} /> },
    { id: 'singers', label: 'Chanteurs & Musiciens', icon: <Mic size={14} /> },
    { id: 'engineers', label: 'Ingénieurs & Studios', icon: <Headphones size={14} /> },
    { id: 'applied', label: 'Mes Matchs', icon: <Flame size={14} /> }
  ];

  return (
    <div style={{
      padding: '16px 16px 90px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      maxWidth: '600px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* 1. Header Banner & Filter Pills */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0066FF 100%)',
        borderRadius: '24px',
        padding: '18px 20px',
        color: '#FFFFFF',
        boxShadow: '0 10px 30px rgba(0, 102, 255, 0.18)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Radio size={12} color="#10B981" /> TALENTS EN DIRECT
            </span>
          </div>

          {onRefreshMatches && (
            <button
              onClick={onRefreshMatches}
              title="Actualiser les profils réels"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          Match Pro • Collaborations
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.3 }}>
          Connectez-vous directement avec des artistes, producteurs et ingénieurs réels.
        </p>
      </div>

      {/* 2. Filter Category Pills */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none'
      }}>
        {filterTabs.map((tab) => {
          const isSel = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                setCurrentIndex(0);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: isSel ? '1px solid #0066FF' : '1px solid var(--border-light)',
                background: isSel ? '#0066FF' : 'var(--card-bg)',
                color: isSel ? '#FFFFFF' : 'var(--text-dark)',
                fontWeight: isSel ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isSel ? '0 4px 12px rgba(0, 102, 255, 0.25)' : 'none'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Main Swipe Profile Card Stack */}
      {currentCard ? (
        <div style={{ position: 'relative', minHeight: '490px', touchAction: 'none' }}>
          <div
            ref={cardRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'relative',
              borderRadius: '28px',
              overflow: 'hidden',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            {/* Dynamic Stamp Badges during Swipe */}
            {matchOpacity > 0.1 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                border: '4px solid #10B981',
                color: '#10B981',
                borderRadius: '12px',
                padding: '6px 14px',
                fontSize: '1.2rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                transform: 'rotate(-15deg)',
                opacity: matchOpacity,
                zIndex: 20,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)'
              }}>
                MATCHER 🤝
              </div>
            )}

            {passOpacity > 0.1 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                border: '4px solid #EF4444',
                color: '#EF4444',
                borderRadius: '12px',
                padding: '6px 14px',
                fontSize: '1.2rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                transform: 'rotate(15deg)',
                opacity: passOpacity,
                zIndex: 20,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)'
              }}>
                PASSER ✕
              </div>
            )}

            {/* Profile Banner Area */}
            <div style={{
              position: 'relative',
              height: '240px',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {currentCard.image || currentCard.cover_url || currentCard.avatar ? (
                <img
                  src={currentCard.image || currentCard.cover_url || currentCard.avatar}
                  alt={currentCard.title || currentCard.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <UserAvatar size={90} border="3px solid #0066FF" />
                </div>
              )}

              {/* Gradient Dark Scrim */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%)'
              }} />

              {/* Verified Badge & Synergy Score */}
              <div style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(0, 102, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                color: '#FFFFFF',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4)'
              }}>
                <Flame size={14} color="#FACC15" /> {currentCard.matchPercentage || 94}% Synergie
              </div>

              {/* Name & Role Overlay in Banner */}
              <div style={{
                position: 'absolute',
                bottom: '14px',
                left: '18px',
                right: '18px',
                color: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#FFF' }}>
                    {currentCard.title || currentCard.name || 'Artiste'}
                  </h3>
                  {currentCard.verified && (
                    <Award size={18} color="#FACC15" />
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', opacity: 0.9 }}>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {currentCard.role || currentCard.category || 'Artiste'}
                  </span>
                  {currentCard.location && (
                    <span style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} color="#60A5FA" /> {currentCard.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Bio & Skills Info Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Bio description */}
              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-dark)',
                lineHeight: 1.45,
                margin: 0,
                opacity: 0.9
              }}>
                {currentCard.bio || currentCard.description || 'Membre vérifié sur StageLink à la recherche de collaborations artistiques.'}
              </p>

              {/* Musical Skills / Genres Tags */}
              {Array.isArray(currentCard.skills) && currentCard.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {currentCard.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(0, 102, 255, 0.08)',
                        color: '#0066FF',
                        borderRadius: '12px',
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: '1px solid rgba(0, 102, 255, 0.2)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Public Profile Shortcut */}
              {onOpenProfile && (currentCard.rawUser || currentCard.userId) && (
                <button
                  onClick={() => onOpenProfile(currentCard.rawUser || { id: currentCard.userId, name: currentCard.name, role: currentCard.role, avatar: currentCard.avatar })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0066FF',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: '2px'
                  }}
                >
                  <ExternalLink size={14} /> Voir le profil complet de l'artiste
                </button>
              )}
            </div>

            {/* Action Bar: Dislike, Rewind, Superlike, Match */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '14px 20px',
              borderTop: '1px solid var(--border-light)',
              background: 'var(--bg-light)'
            }}>
              {/* Dislike / Pass Button */}
              <button
                onClick={() => handleAction('dislike')}
                title="Passer au profil suivant"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '2px solid #FCA5A5',
                  background: '#FEF2F2',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <X size={22} strokeWidth={2.5} />
              </button>

              {/* Rewind Button */}
              <button
                onClick={handleRewind}
                title="Revenir au profil précédent"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-light)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: 0.8
                }}
              >
                <RotateCcw size={18} />
              </button>

              {/* Super Like Button */}
              <button
                onClick={() => handleAction('superlike')}
                title="Coup de cœur / Super Match"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: '2px solid #FDE68A',
                  background: '#FFFBEB',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                }}
              >
                <Star size={22} fill="#F59E0B" />
              </button>

              {/* Direct Match & Message Button */}
              <button
                onClick={() => handleAction('apply')}
                title="Matcher & envoyer un message"
                style={{
                  padding: '12px 22px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #0066FF 0%, #0044CC 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(0, 102, 255, 0.35)'
                }}
              >
                <MessageCircle size={18} /> Matcher
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State for Real Production */
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--card-bg)',
          borderRadius: '28px',
          border: '1px solid var(--border-light)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            color: '#0066FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
            boxShadow: '0 8px 20px rgba(0, 102, 255, 0.15)'
          }}>
            <Users size={32} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
            Aucun nouveau profil disponible
          </h3>

          <p style={{
            color: '#64748B',
            fontSize: '0.86rem',
            margin: 0,
            maxWidth: '380px',
            lineHeight: 1.4
          }}>
            Vous avez parcouru les profils artistiques réels actuels. Les nouveaux producteurs, musiciens et chanteurs inscrits sur StageLink apparaîtront ici automatiquement.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {onRefreshMatches && (
              <button
                onClick={onRefreshMatches}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  background: '#0066FF',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)'
                }}
              >
                <RefreshCw size={15} /> Actualiser les profils réels
              </button>
            )}

            <button
              onClick={() => {
                setActiveFilter('all');
                setCurrentIndex(0);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                background: 'var(--bg-light)',
                color: 'var(--text-dark)',
                border: '1px solid var(--border-light)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      {/* 4. Match Celebration Modal */}
      {showMatchSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '28px',
            padding: '28px 24px',
            textAlign: 'center',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0066FF 0%, #00C6FF 100%)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(0, 102, 255, 0.4)'
            }}>
              <Check size={38} strokeWidth={3} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
              C'est un Match ! 🎉
            </h2>

            <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '20px', lineHeight: 1.4 }}>
              Votre demande de collaboration avec <strong>{showMatchSuccess.title || showMatchSuccess.name}</strong> a été enregistrée et la discussion a été ouverte dans vos messages.
            </p>

            <button
              onClick={() => setShowMatchSuccess(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '20px',
                background: '#0066FF',
                color: '#FFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)'
              }}
            >
              Continuer l'exploration
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default SwipeMatching;
