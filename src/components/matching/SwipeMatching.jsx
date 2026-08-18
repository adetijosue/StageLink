import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Star, 
  Check, 
  MapPin, 
  RotateCcw, 
  MessageCircle, 
  Users, 
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
import { soundEngine } from '../../services/audioService';
import { presenceService } from '../../services/presenceService';
import { useLanguage } from '../../context/LanguageContext';

const SwipeMatching = React.memo(function SwipeMatching({ 
  matches = [], 
  onApplyMatch, 
  onRefreshMatches, 
  onOpenProfile, 
  onStartChat,
  currentUser 
}) {
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchSuccess, setShowMatchSuccess] = useState(null);
  const [favoriteToast, setFavoriteToast] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(() => presenceService.getOnlineUserIds());

  useEffect(() => {
    const unsubscribe = presenceService.subscribe((ids) => {
      setOnlineUserIds(ids);
    });
    return unsubscribe;
  }, []);

  // Stored Match IDs
  const [matchedIds, setMatchedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_applied_matches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Storage read error (applied matches):", e);
      return [];
    }
  });

  // Stored Favorite Artist IDs
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_favorite_artists');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Storage read error (favorite artists):", e);
      return [];
    }
  });

  // Touch & Mouse Drag Gesture States
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // Filter real user match cards based on musical categories
  const filteredMatches = useMemo(() => {
    return (matches || []).filter(card => {
      // Exclude logged in user
      if (currentUser && (card.userId === currentUser.id || card.id === `match_${currentUser.id}` || card.id === currentUser.id)) {
        return false;
      }

      const isAlreadyMatched = 
        matchedIds.includes(card.id) || 
        (card.userId && matchedIds.includes(card.userId)) ||
        (card.rawUser?.id && matchedIds.includes(card.rawUser.id)) ||
        (typeof card.id === 'string' && card.id.startsWith('match_') && matchedIds.includes(card.id.replace('match_', '')));

      if (activeFilter === 'matched') {
        return isAlreadyMatched;
      }

      // In discovery tabs ('all', 'producers', 'singers', 'engineers'), NEVER show already matched artists again!
      if (activeFilter !== 'favorites' && isAlreadyMatched) {
        return false;
      }

      if (activeFilter === 'favorites') {
        return favoriteIds.includes(card.id) || (card.userId && favoriteIds.includes(card.userId));
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
  }, [matches, activeFilter, matchedIds, favoriteIds, currentUser]);

  const safeIndex = (filteredMatches.length > 0 && currentIndex >= filteredMatches.length) ? 0 : currentIndex;
  const currentCard = filteredMatches[safeIndex] || filteredMatches[0];
  const isCurrentFavorite = currentCard && (favoriteIds.includes(currentCard.id) || (currentCard.userId && favoriteIds.includes(currentCard.userId)));

  // Save matched IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stagelink_applied_matches', JSON.stringify(matchedIds));
    } catch (e) {
      console.warn("Storage write error (applied matches):", e);
    }
  }, [matchedIds]);

  // Save favorite IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stagelink_favorite_artists', JSON.stringify(favoriteIds));
    } catch (e) {
      console.warn("Storage write error (favorite artists):", e);
    }
  }, [favoriteIds]);

  // Confetti trigger
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn("Error triggering confetti:", e);
    }
  };

  // Perform Match, Cancel, or Favorite Action
  const handleAction = (type) => {
    if (!currentCard) return;

    const targetId = currentCard.id;
    const targetUserId = currentCard.userId || (typeof currentCard.id === 'string' && currentCard.id.startsWith('match_') ? currentCard.id.replace('match_', '') : null);
    const rawId = currentCard.rawUser?.id;

    if (type === 'match') {
      soundEngine?.playPopSound?.();
      triggerConfetti();
      setShowMatchSuccess(currentCard);

      const idsToAdd = [targetId, targetUserId, rawId].filter(Boolean);
      setMatchedIds(prev => {
        const next = [...prev];
        idsToAdd.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });

      if (onApplyMatch) onApplyMatch(currentCard);
    } else if (type === 'favorite') {
      soundEngine?.playPopSound?.();
      const favKey = targetUserId || targetId;
      const isFav = favoriteIds.includes(favKey) || (targetId && favoriteIds.includes(targetId));
      if (isFav) {
        setFavoriteIds(prev => prev.filter(id => id !== favKey && id !== targetId));
        setFavoriteToast(`Retiré des favoris`);
      } else {
        setFavoriteIds(prev => [...prev, favKey]);
        setFavoriteToast(`⭐ ${currentCard.title || currentCard.name} ajouté aux favoris !`);
      }
      setTimeout(() => setFavoriteToast(null), 2000);
      return; // Keep on current card when toggling favorite
    } else if (type === 'cancel' || type === 'pass') {
      soundEngine?.playPopSound?.();
    }

    // Move to next card
    if (currentIndex < filteredMatches.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setDragOffset({ x: 0, y: 0 });
  };

  const handleOpenFullProfile = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!currentCard || !onOpenProfile) return;
    soundEngine?.playPopSound?.();

    const raw = currentCard.rawUser || {};
    const fullProfileData = {
      ...raw,
      ...currentCard,
      id: currentCard.userId || currentCard.id?.replace('match_', '') || raw.id,
      userId: currentCard.userId || currentCard.id?.replace('match_', '') || raw.id,
      name: currentCard.name || currentCard.title || raw.name || raw.full_name || 'Artiste',
      full_name: currentCard.name || currentCard.title || raw.full_name || raw.name || 'Artiste',
      userName: currentCard.name || currentCard.title || raw.name || raw.full_name || 'Artiste',
      avatar: currentCard.avatar || currentCard.image || raw.avatar || raw.avatar_url || '',
      avatar_url: currentCard.avatar || currentCard.image || raw.avatar_url || raw.avatar || '',
      userAvatar: currentCard.avatar || currentCard.image || raw.avatar || raw.avatar_url || '',
      role: currentCard.role || currentCard.category || raw.role || 'Artiste',
      userRole: currentCard.role || currentCard.category || raw.role || 'Artiste',
      location: currentCard.location || raw.location || 'Studio & En ligne',
      company: currentCard.company || raw.company || 'Artiste Indépendant',
      bio: currentCard.bio || currentCard.description || raw.bio || 'Membre vérifié de la communauté musicale StageLink.',
      skills: currentCard.skills || raw.skills || [currentCard.role || 'Artiste'],
      instruments: currentCard.instruments || raw.instruments || currentCard.skills || [currentCard.role || 'Artiste'],
      coverPhoto: currentCard.cover_url || currentCard.image || raw.cover_url || raw.coverPhoto || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800',
      cover_url: currentCard.cover_url || currentCard.image || raw.cover_url || raw.coverPhoto || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800',
      verified: currentCard.verified || raw.verified || raw.badgeType === 'gold' || raw.badgeType === 'blue' || false,
      badgeType: currentCard.badgeType || raw.badgeType || (currentCard.verified ? 'gold' : 'none')
    };

    onOpenProfile(fullProfileData);
  };

  const handleRewind = () => {
    soundEngine?.playPopSound?.();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (filteredMatches.length > 0) {
      setCurrentIndex(filteredMatches.length - 1);
    }
  };

  // -------------------------------------------------------------
  // Touch & Mouse Drag Handlers for Native Swiping
  // -------------------------------------------------------------
  const handleStartDrag = (clientX, clientY) => {
    dragStartRef.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  const handleMoveDrag = (clientX, clientY) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEndDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset.x > 75) {
      // Swiped Right -> MATCHER
      handleAction('match');
    } else if (dragOffset.x < -75) {
      // Swiped Left -> ANNULER / PASSER
      handleAction('cancel');
    } else if (dragOffset.y < -80) {
      // Swiped Up -> FAVORIS / SAUVEGARDER
      handleAction('favorite');
      setDragOffset({ x: 0, y: 0 });
    } else {
      // Reset position
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Touch Events
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    handleStartDrag(t.clientX, t.clientY);
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    handleMoveDrag(t.clientX, t.clientY);
  };
  const handleTouchEnd = () => handleEndDrag();

  // Mouse Events (Desktop)
  const handleMouseDown = (e) => {
    handleStartDrag(e.clientX, e.clientY);
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMoveDrag(e.clientX, e.clientY);
  };
  const handleMouseUp = () => handleEndDrag();
  const handleMouseLeave = () => {
    if (isDragging) handleEndDrag();
  };

  // Dynamic card transforms & stamp opacities
  const rotation = dragOffset.x * 0.08;
  const matchOpacity = Math.min(1, Math.max(0, dragOffset.x / 65));
  const cancelOpacity = Math.min(1, Math.max(0, -dragOffset.x / 65));
  const favoriteOpacity = Math.min(1, Math.max(0, -dragOffset.y / 70));

  const filterTabs = [
    { id: 'all', label: t('filter_all'), icon: <Users size={14} /> },
    { id: 'producers', label: language === 'en' ? 'Producers' : 'Producteurs', icon: <Disc size={14} /> },
    { id: 'singers', label: language === 'en' ? 'Singers & Musicians' : 'Chanteurs & Musiciens', icon: <Mic size={14} /> },
    { id: 'engineers', label: language === 'en' ? 'Sound Engineers & Studios' : 'Ingénieurs & Studios', icon: <Headphones size={14} /> },
    { id: 'matched', label: language === 'en' ? 'My Matches' : 'Mes Matchs', icon: <Flame size={14} /> },
    { id: 'favorites', label: language === 'en' ? 'Favorites' : 'Favoris', icon: <Star size={14} /> }
  ];

  return (
    <div style={{
      padding: '16px 16px 90px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      maxWidth: '600px',
      margin: '0 auto',
      width: '100%',
      position: 'relative'
    }}>
      {/* Favorite Toast Notification */}
      {favoriteToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          color: '#FACC15',
          padding: '10px 20px',
          borderRadius: '24px',
          fontSize: '0.86rem',
          fontWeight: 800,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          border: '1px solid rgba(250, 204, 21, 0.5)',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease'
        }}>
          {favoriteToast}
        </div>
      )}

      {/* 1. Header Banner */}
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
              <Radio size={12} color="#10B981" /> {t('match_live_talents')}
            </span>
          </div>

          {onRefreshMatches && (
            <button
              onClick={onRefreshMatches}
              title={t('no_matches_refresh')}
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
          {t('match_title')}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.3 }}>
          {language === 'en' ? (
            <>Swipe right to <strong>Match</strong> or left to <strong>Skip</strong>.</>
          ) : (
            <>Glissez vers la droite pour <strong>Matcher</strong> ou vers la gauche pour <strong>Annuler</strong>.</>
          )}
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
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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
                borderRadius: '14px',
                padding: '6px 14px',
                fontSize: '1.25rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                transform: 'rotate(-15deg)',
                opacity: matchOpacity,
                zIndex: 20,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
              }}>
                {t('btn_match')} 🤝
              </div>
            )}

            {cancelOpacity > 0.1 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                border: '4px solid #EF4444',
                color: '#EF4444',
                borderRadius: '14px',
                padding: '6px 14px',
                fontSize: '1.25rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                transform: 'rotate(15deg)',
                opacity: cancelOpacity,
                zIndex: 20,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
              }}>
                {t('btn_skip')} ✕
              </div>
            )}

            {favoriteOpacity > 0.15 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                border: '4px solid #F59E0B',
                color: '#F59E0B',
                borderRadius: '14px',
                padding: '6px 16px',
                fontSize: '1.25rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                opacity: favoriteOpacity,
                zIndex: 20,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
              }}>
                {t('btn_favorite')} ⭐
              </div>
            )}

            {/* Profile Banner Area */}
            <div style={{
              position: 'relative',
              height: '240px',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              overflow: 'hidden'
            }}>
              {currentCard.coverUrl || currentCard.banner ? (
                <img
                  src={currentCard.coverUrl || currentCard.banner}
                  alt="Cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
                  opacity: 0.9
                }} />
              )}

              {/* Gradient overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%)'
              }} />

              {/* Synergy Score Badge */}
              {currentCard.synergy && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0, 102, 255, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)'
                }}>
                  <Flame size={14} color="#FACC15" /> {currentCard.synergy}% {t('match_synergy')}
                </div>
              )}

              {/* Artist Details on Banner Bottom */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '20px',
                right: '20px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '14px'
              }}>
                <UserAvatar
                  user={{
                    avatar: currentCard.avatar || currentCard.userAvatar || currentCard.avatar_url,
                    name: currentCard.title || currentCard.name
                  }}
                  size={64}
                  border="3px solid #FFFFFF"
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#FFF' }}>
                      {currentCard.title || currentCard.name || (language === 'en' ? 'Artist' : 'Artiste')}
                    </h3>
                    {currentCard.verified && (
                      <Award size={18} color="#FACC15" />
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', opacity: 0.95, flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {currentCard.role || currentCard.category || (language === 'en' ? 'Artist' : 'Artiste')}
                    </span>

                    {/* Realtime Status Badge (Green = Online, Grey = Offline) */}
                    {(() => {
                      const cardUserId = currentCard.userId || currentCard.id;
                      const isCardUserOnline = Boolean(cardUserId && onlineUserIds.includes(String(cardUserId)));
                      return (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: isCardUserOnline ? 'rgba(16, 185, 129, 0.35)' : 'rgba(148, 163, 184, 0.3)',
                          color: isCardUserOnline ? '#34D399' : '#E2E8F0',
                          border: `1px solid ${isCardUserOnline ? 'rgba(16, 185, 129, 0.6)' : 'rgba(148, 163, 184, 0.4)'}`,
                          borderRadius: '8px',
                          padding: '2px 7px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backdropFilter: 'blur(4px)'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isCardUserOnline ? '#10B981' : '#94A3B8',
                            boxShadow: isCardUserOnline ? '0 0 6px #10B981' : 'none'
                          }} />
                          {isCardUserOnline ? t('online_status') : t('offline_status')}
                        </span>
                      );
                    })()}

                    {currentCard.location && (
                      <span style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={12} color="#60A5FA" /> {currentCard.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Bio & Skills Info Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-dark)',
                lineHeight: 1.45,
                margin: 0,
                opacity: 0.9
              }}>
                {currentCard.bio || currentCard.description || (language === 'en' ? 'Verified member on StageLink looking for music co-creations.' : 'Membre vérifié sur StageLink à la recherche de collaborations artistiques.')}
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
                  type="button"
                  onClick={handleOpenFullProfile}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0066FF',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '4px 0',
                    marginTop: '4px'
                  }}
                >
                  <ExternalLink size={15} /> {language === 'en' ? 'View full artist profile' : 'Voir le profil complet de l\'artiste'}
                </button>
              )}
            </div>

            {/* Action Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '14px 20px',
              borderTop: '1px solid var(--border-light)',
              background: 'var(--bg-light)'
            }}>
              <button
                onClick={() => handleAction('cancel')}
                title={t('btn_skip')}
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
                <X size={24} strokeWidth={2.5} />
              </button>

              <button
                onClick={handleRewind}
                title={language === 'en' ? 'Rewind to previous profile' : 'Revenir au profil précédent'}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-light)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: 0.85
                }}
              >
                <RotateCcw size={18} />
              </button>

              <button
                id="btn-action-favorite"
                onClick={() => handleAction('favorite')}
                title={isCurrentFavorite ? (language === 'en' ? 'Remove from favorites' : 'Retirer des favoris') : (language === 'en' ? 'Add to favorites' : 'Sauvegarder dans les favoris')}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: isCurrentFavorite ? '2px solid #F59E0B' : '1.5px solid #FDE68A',
                  background: isCurrentFavorite ? '#FEF3C7' : '#FFFBEB',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Star size={22} fill={isCurrentFavorite ? '#F59E0B' : 'none'} color="#F59E0B" strokeWidth={2.2} />
              </button>

              <button
                id="btn-action-match"
                onClick={() => handleAction('match')}
                title={t('btn_match')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #0066FF 0%, #0044CC 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(0, 102, 255, 0.35)'
                }}
              >
                <Check size={20} strokeWidth={3} /> {t('btn_match')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
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
            {t('no_matches_left')}
          </h3>

          <p style={{
            color: '#64748B',
            fontSize: '0.86rem',
            margin: 0,
            maxWidth: '380px',
            lineHeight: 1.4
          }}>
            {language === 'en' ? 'You have browsed all current artist profiles. New producers, musicians and singers on StageLink will appear here automatically.' : 'Vous avez parcouru les profils artistiques actuels. Les nouveaux producteurs, musiciens et artistes inscrits sur StageLink apparaîtront ici automatiquement.'}
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
                <RefreshCw size={15} /> {t('no_matches_refresh')}
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
              {language === 'en' ? 'Reset filters' : 'Réinitialiser les filtres'}
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
              {t('match_success_title') || 'C\'est un Match !'} 🎉
            </h2>

            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '22px', lineHeight: 1.45 }}>
              {language === 'en' ? (
                <>You matched with <strong>{showMatchSuccess.title || showMatchSuccess.name}</strong> and are now following each other! Continue exploring or send a message when you want.</>
              ) : (
                <>Vous avez matché avec <strong>{showMatchSuccess.title || showMatchSuccess.name}</strong> et vous vous suivez désormais ! Continuez à explorer ou écrivez-lui quand vous le souhaitez.</>
              )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                id="btn-match-continue-exploring"
                onClick={() => setShowMatchSuccess(null)}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '20px',
                  background: '#0066FF',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>✨</span>
                <span>{language === 'en' ? 'Continue Exploring' : 'Continuer à explorer'}</span>
              </button>

              {onStartChat && (
                <button
                  id="btn-match-send-message"
                  onClick={() => {
                    const target = showMatchSuccess;
                    setShowMatchSuccess(null);
                    const raw = target.rawUser || {};
                    onStartChat({
                      id: target.userId || (typeof target.id === 'string' ? target.id.replace('match_', '') : target.id) || raw.id,
                      name: target.name || target.title || target.creator || raw.full_name || 'Artiste',
                      full_name: target.name || target.title || target.creator || raw.full_name || 'Artiste',
                      avatar: target.avatar || target.creatorAvatar || target.image || raw.avatar_url || '',
                      avatar_url: target.avatar || target.creatorAvatar || target.image || raw.avatar_url || '',
                      role: target.role || target.category || raw.role || 'Artiste'
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '20px',
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #E2E8F0',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageCircle size={16} />
                  <span>{language === 'en' ? 'Send a message' : 'Envoyer un message'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SwipeMatching;
