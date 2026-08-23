import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft,
  Check, 
  MapPin, 
  Briefcase, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Music, 
  Disc, 
  Play, 
  Pause, 
  Sparkles, 
  Globe, 
  ExternalLink, 
  QrCode, 
  Share2, 
  FileText, 
  Crown, 
  Radio,
  Sliders,
  CheckCircle2,
  Mic
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../services/audioService';
import confetti from 'canvas-confetti';
import ProfileQRCodeModal from './ProfileQRCodeModal';
import MusicalCVModal from './MusicalCVModal';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { presenceService } from '../../services/presenceService';

export default function PublicProfileModal({ 
  isOpen = true, 
  onClose, 
  user, 
  onStartChat, 
  onConnectUser 
}) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [hydratedUser, setHydratedUser] = useState(user || {});
  const [isFollowing, setIsFollowing] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Subscribe to real-time online presence for this user
  useEffect(() => {
    const targetId = user?.id || user?.userId;
    if (!targetId) return;

    setIsOnline(presenceService.isUserOnline(targetId));

    const unsubscribe = presenceService.subscribe(() => {
      setIsOnline(presenceService.isUserOnline(targetId));
    });

    return unsubscribe;
  }, [user]);

  // Hydrate user with fresh localStorage / Supabase profile data
  useEffect(() => {
    if (!user) return;
    const targetId = user.id || user.userId;

    let initial = { ...user };
    try {
      const storedUsers = JSON.parse(localStorage.getItem('stagelink_users') || '[]');
      const matchedStored = storedUsers.find(u => u.id === targetId || u.userId === targetId);
      if (matchedStored) {
        initial = { ...matchedStored, ...initial };
      }
    } catch (e) {}

    setHydratedUser(initial);

    // Fetch live profile from Supabase
    if (isSupabaseConfigured() && targetId) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setHydratedUser(prev => ({
              ...prev,
              ...data,
              name: data.full_name || data.username || prev.name,
              full_name: data.full_name || data.username || prev.full_name,
              avatar: data.avatar_url || prev.avatar,
              avatar_url: data.avatar_url || prev.avatar_url,
              role: data.role || prev.role,
              bio: data.bio || prev.bio,
              location: data.location || prev.location,
              company: data.company || prev.company,
              instruments: Array.isArray(data.instruments) && data.instruments.length > 0 ? data.instruments : prev.instruments,
              genres: Array.isArray(data.genres) && data.genres.length > 0 ? data.genres : prev.genres,
              gear: Array.isArray(data.gear) && data.gear.length > 0 ? data.gear : prev.gear,
              spotifyUrl: data.spotify_url || data.spotifyUrl || prev.spotifyUrl,
              instagramUrl: data.instagram_url || data.instagramUrl || prev.instagramUrl,
              tiktokUrl: data.tiktok_url || data.tiktokUrl || prev.tiktokUrl,
              youtubeUrl: data.youtube_url || data.youtubeUrl || prev.youtubeUrl,
              verified: data.verified_badge === 'gold' || data.verified_badge === 'blue' || prev.verified,
              badgeType: data.verified_badge || prev.badgeType
            }));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const targetUserId = hydratedUser?.id || hydratedUser?.userId || user?.id || user?.userId;
  const isSelf = currentUser?.id === targetUserId;

  // Check if current user is already following this artist
  useEffect(() => {
    if (!currentUser?.id || !targetUserId) return;
    if (isSupabaseConfigured()) {
      supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetUserId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setIsFollowing(true);
        })
        .catch(() => {});
    }
  }, [currentUser, targetUserId]);

  if (isOpen === false || !user) return null;

  const profile = hydratedUser || user;

  // Normalized user fields
  const userName = profile.name || profile.full_name || profile.userName || profile.title || (profile.email ? profile.email.split('@')[0] : 'Artiste');
  const userAvatarUrl = profile.avatar || profile.avatar_url || profile.userAvatar || profile.image || '';
  const userRole = profile.role || profile.userRole || profile.category || 'Artiste Musicien';
  const userBio = profile.bio || profile.description || 'Artiste passionné et créateur sur le réseau musical StageLink. Prêt pour de nouvelles collaborations et projets de scène ou de studio.';
  const userLocation = profile.location || 'Studio & En ligne';
  const userCompany = profile.company || profile.studio || 'Artiste Indépendant';
  const userCover = profile.coverPhoto || profile.cover_url || profile.cover || profile.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800';
  const isVip = profile.badgeType === 'gold' || profile.badgeType === 'blue' || profile.verified === true;

  const handleFollowClick = async () => {
    soundEngine?.playPopSound?.();
    if (!isFollowing) {
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
      setIsFollowing(true);
      if (onConnectUser && targetUserId) onConnectUser(targetUserId);

      if (isSupabaseConfigured() && currentUser?.id && targetUserId) {
        try {
          await supabase.from('followers').insert({
            follower_id: currentUser.id,
            following_id: targetUserId
          });

          await supabase.from('notifications').insert({
            user_id: targetUserId,
            actor_id: currentUser.id,
            type: 'follow',
            content: `${currentUser.name || 'Un artiste'} s'est abonné à votre profil !`,
            is_read: false
          });
        } catch (e) {
          console.warn('Follow sync note:', e);
        }
      }
    } else {
      setIsFollowing(false);
      if (isSupabaseConfigured() && currentUser?.id && targetUserId) {
        try {
          await supabase
            .from('followers')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', targetUserId);
        } catch (e) {
          console.warn('Unfollow sync note:', e);
        }
      }
    }
  };

  const toggleTrackPlay = (trackId) => {
    if (playingTrackId === trackId) {
      soundEngine.stop();
      setPlayingTrackId(null);
    } else {
      soundEngine.generateAndPlay(120, 'Afro-Gospel');
      setPlayingTrackId(trackId);
    }
  };

  const sampleTracks = [
    { id: 'ptr_1', title: 'Session Studio & Démo', genre: userRole || 'Afrobeat', duration: '03:20', plays: '2.4k' },
    { id: 'ptr_2', title: 'Live Performance / Instrumental', genre: 'Live Production', duration: '02:45', plays: '1.8k' }
  ];

  const renderSkillIcon = (skillName) => {
    const s = 13;
    const lower = (skillName || '').toLowerCase();
    if (lower.includes('chant') || lower.includes('vocal')) return <Mic size={s} />;
    if (lower.includes('beatmaker') || lower.includes('producer') || lower.includes('ingénieur') || lower.includes('mix') || lower.includes('studio')) return <Sliders size={s} />;
    if (lower.includes('basse') || lower.includes('guitare')) return <Radio size={s} />;
    if (lower.includes('batterie') || lower.includes('percussion') || lower.includes('dj')) return <Disc size={s} />;
    return <Music size={s} />;
  };

  const specialtiesList = Array.isArray(profile.skills) && profile.skills.length > 0
    ? profile.skills
    : Array.isArray(profile.instruments) && profile.instruments.length > 0
    ? profile.instruments
    : [userRole];

  return (
    <div 
      style={{
        position: 'fixed', 
        inset: 0, 
        zIndex: 1050, 
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(10px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '16px 12px',
        animation: 'fadeIn 0.2s ease',
        boxSizing: 'border-box'
      }} 
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%', 
          maxWidth: '460px', 
          background: 'var(--card-bg, #FFFFFF)', 
          borderRadius: '24px',
          maxHeight: 'calc(90vh - 20px)', 
          overflowY: 'auto', 
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.4)', 
          position: 'relative',
          border: '1px solid var(--border-light, #E2E8F0)',
          animation: 'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* 1. Header Cover Hero with Sleek Glass Controls */}
        <div style={{ 
          position: 'relative', 
          height: '150px', 
          background: '#0F172A', 
          overflow: 'hidden', 
          borderTopLeftRadius: '24px', 
          borderTopRightRadius: '24px',
          flexShrink: 0
        }}>
          <img
            src={userCover}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              filter: 'brightness(0.85)'
            }}
            alt={language === 'en' ? `${userName}'s Cover` : `Couverture de ${userName}`}
          />
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, transparent 40%, rgba(15, 23, 42, 0.8) 100%)' 
          }} />

          {/* Floating Top Left: Back / Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              zIndex: 10
            }}
            title={language === 'en' ? 'Back' : 'Retour'}
          >
            <ArrowLeft size={18} />
          </button>

          {/* Floating Top Center: Official Artist Tag */}
          <div style={{
            position: 'absolute',
            top: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.75)',
            color: '#38BDF8',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '3px 10px',
            borderRadius: '16px',
            fontSize: '0.68rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
            zIndex: 10
          }}>
            <Sparkles size={11} color="#38BDF8" /> {language === 'en' ? 'ARTIST PROFILE' : 'PROFIL ARTISTE'}
          </div>

          {/* Floating Top Right: Share & QR Code */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsQrModalOpen(true);
            }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0, 102, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.35)',
              zIndex: 10
            }}
            title={language === 'en' ? 'Share Profile & QR' : 'Partager Profil & QR'}
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* 2. Identity Row (Avatar + Name & Status) */}
        <div style={{ padding: '0 16px', marginTop: '-42px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px' }}>
            {/* Avatar with Presence Indicator */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowFullAvatar(true);
              }}
              style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}
              title={language === 'en' ? 'Expand avatar' : "Agrandir l'avatar"}
            >
              {userAvatarUrl ? (
                <img 
                  src={userAvatarUrl} 
                  alt={userName} 
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3.5px solid var(--card-bg, #FFFFFF)',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                    background: '#1E293B'
                  }}
                />
              ) : (
                <UserAvatar 
                  user={{ avatar: userAvatarUrl, name: userName }} 
                  size={84} 
                  border="3.5px solid var(--card-bg, #FFFFFF)" 
                  style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }} 
                />
              )}

              {/* Online Presence Indicator */}
              <span
                title={isOnline ? (language === 'en' ? 'Online' : 'En ligne') : (language === 'en' ? 'Offline' : 'Hors ligne')}
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: isOnline ? '#10B981' : '#94A3B8',
                  border: '2.5px solid var(--card-bg, #FFFFFF)',
                  boxShadow: isOnline ? '0 0 8px rgba(16, 185, 129, 0.7)' : 'none',
                  transition: 'all 0.25s ease',
                  zIndex: 10
                }}
              />

              {isVip && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#FFF',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFF',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)'
                }}>
                  <Crown size={12} />
                </div>
              )}
            </div>

            {/* Online Status Pill */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.12)',
                color: isOnline ? '#059669' : '#64748B',
                border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(148, 163, 184, 0.2)'}`,
                borderRadius: '12px',
                padding: '3px 9px',
                fontSize: '0.70rem',
                fontWeight: 700
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isOnline ? '#10B981' : '#94A3B8'
                }} />
                {isOnline ? (language === 'en' ? 'Online' : 'En ligne') : (language === 'en' ? 'Offline' : 'Hors ligne')}
              </span>
            </div>
          </div>

          {/* Artist Name & Role Header */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 900, 
                color: 'var(--text-dark, #0F172A)', 
                margin: 0, 
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                {userName}
              </h2>
              {isVip && <CheckCircle2 size={18} color="#0066FF" fill="#0066FF" />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(0, 102, 255, 0.08)',
                color: '#0066FF',
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1px solid rgba(0, 102, 255, 0.15)'
              }}>
                {userRole}
              </span>

              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <MapPin size={12} color="#64748B" /> {userLocation}
              </span>
            </div>
          </div>

          {/* 3-Column Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginTop: '12px',
            background: 'var(--bg-light, #F8FAFC)',
            padding: '8px 10px',
            borderRadius: '14px',
            border: '1px solid var(--border-light, #E2E8F0)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.90rem', fontWeight: 900, color: 'var(--text-dark, #0F172A)' }}>
                {isFollowing ? '143' : '142'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                {language === 'en' ? 'Followers' : 'Abonnés'}
              </div>
            </div>

            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light, #E2E8F0)', borderRight: '1px solid var(--border-light, #E2E8F0)' }}>
              <div style={{ fontSize: '0.90rem', fontWeight: 900, color: '#0066FF' }}>
                4.2k
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                {language === 'en' ? 'Plays' : 'Écoutes'}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.90rem', fontWeight: 900, color: '#10B981' }}>
                98%
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Match Pro
              </div>
            </div>
          </div>
        </div>

        {/* 3. Action Toolbar (Suivre, Message, QR) */}
        <div style={{ padding: '14px 16px 0 16px' }}>
          {!isSelf ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleFollowClick} 
                style={{ 
                  flex: 1.2, 
                  padding: '10px 12px', 
                  borderRadius: '14px', 
                  border: isFollowing ? '1.5px solid #10B981' : 'none', 
                  background: isFollowing ? '#ECFDF5' : '#0066FF', 
                  color: isFollowing ? '#047857' : '#FFFFFF', 
                  fontWeight: 800, 
                  fontSize: '0.84rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: isFollowing ? 'none' : '0 4px 12px rgba(0, 102, 255, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isFollowing ? <><UserCheck size={16} /> {language === 'en' ? 'Following' : 'Suivi'}</> : <><UserPlus size={16} /> {language === 'en' ? 'Follow' : 'Suivre'}</>}
              </button>

              <button 
                onClick={() => { 
                  soundEngine?.playPopSound?.();
                  onClose(); 
                  if (onStartChat) {
                    onStartChat(profile, language === 'en' ? `Hello ${userName}, I discovered your profile on StageLink and would love to collaborate with you!` : `Bonjour ${userName}, j'ai découvert votre profil complet sur StageLink et j'aimerais collaborer avec vous !`);
                  }
                }} 
                style={{ 
                  flex: 1.2, 
                  padding: '10px 12px', 
                  borderRadius: '14px', 
                  border: '1.5px solid #0066FF', 
                  background: 'rgba(0, 102, 255, 0.05)', 
                  color: '#0066FF', 
                  fontWeight: 800, 
                  fontSize: '0.84rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageSquare size={16} /> {language === 'en' ? 'Message' : 'Message'}
              </button>

              <button
                onClick={() => {
                  soundEngine?.playPopSound?.();
                  setIsQrModalOpen(true);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light, #CBD5E1)',
                  background: 'var(--bg-light, #F8FAFC)',
                  color: 'var(--text-dark, #0F172A)',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={language === 'en' ? 'Share Profile' : 'Partager le Profil'}
              >
                <QrCode size={16} color="#0066FF" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                soundEngine?.playPopSound?.();
                setIsQrModalOpen(true);
              }}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #0066FF, #0047FF)',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)'
              }}
            >
              <Share2 size={16} /> {language === 'en' ? 'Share My Profile & QR Code' : 'Partager Mon Profil & QR Code'}
            </button>
          )}
        </div>

        {/* 4. Structured Main Body Content */}
        <div style={{ padding: '14px 16px 20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Location & Studio Card */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px', 
            fontSize: '0.76rem', 
            color: '#64748B', 
            fontWeight: 600,
            background: 'rgba(0, 102, 255, 0.03)',
            padding: '8px 12px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 102, 255, 0.08)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#0066FF" /> {userLocation}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Briefcase size={13} color="#10B981" /> {userCompany}
            </span>
          </div>

          {/* Social Links Row if present */}
          {(profile.spotifyUrl || profile.instagramUrl || profile.youtubeUrl || profile.tiktokUrl) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {profile.spotifyUrl && !profile.spotifyUrl.startsWith('javascript:') && (
                <a 
                  href={profile.spotifyUrl.startsWith('http') ? profile.spotifyUrl : `https://${profile.spotifyUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#F0FDF4',
                    color: '#16A34A',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid #BBF7D0'
                  }}
                >
                  <Music size={13} /> Spotify
                </a>
              )}

              {profile.instagramUrl && !profile.instagramUrl.startsWith('javascript:') && (
                <a 
                  href={profile.instagramUrl.startsWith('http') ? profile.instagramUrl : `https://${profile.instagramUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#FDF2F8',
                    color: '#DB2777',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid #FBCFE8'
                  }}
                >
                  <Globe size={13} /> Instagram
                </a>
              )}

              {profile.youtubeUrl && !profile.youtubeUrl.startsWith('javascript:') && (
                <a 
                  href={profile.youtubeUrl.startsWith('http') ? profile.youtubeUrl : `https://${profile.youtubeUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid #FECACA'
                  }}
                >
                  <Play size={13} /> YouTube
                </a>
              )}
            </div>
          )}

          {/* Bio Box */}
          <div style={{ 
            background: 'var(--bg-light, #F8FAFC)', 
            border: '1px solid var(--border-light, #E2E8F0)', 
            padding: '12px 14px', 
            borderRadius: '16px' 
          }}>
            <h4 style={{ 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              color: '#0066FF', 
              margin: '0 0 5px 0',
              letterSpacing: '0.04em'
            }}>
              {language === 'en' ? 'Biography & Presentation' : 'Biographie & Présentation'}
            </h4>
            <p style={{ 
              fontSize: '0.84rem', 
              color: 'var(--text-dark, #334155)', 
              lineHeight: 1.45, 
              margin: 0,
              wordBreak: 'break-word'
            }}>
              {userBio}
            </p>
          </div>

          {/* Specialties & Musical Skills */}
          <div>
            <h4 style={{ 
              fontSize: '0.74rem', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              color: '#64748B', 
              marginBottom: '6px',
              letterSpacing: '0.04em'
            }}>
              {language === 'en' ? 'Specialties & Instruments' : 'Spécialités & Instruments'}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {specialtiesList.map((skill, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    background: 'rgba(0, 102, 255, 0.08)', 
                    color: '#0066FF', 
                    padding: '5px 10px', 
                    borderRadius: '10px', 
                    fontSize: '0.76rem', 
                    fontWeight: 700,
                    border: '1px solid rgba(0, 102, 255, 0.18)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {renderSkillIcon(skill)}
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Musical Genres */}
          {Array.isArray(profile.genres) && profile.genres.length > 0 && (
            <div>
              <h4 style={{ 
                fontSize: '0.74rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                color: '#64748B', 
                marginBottom: '6px',
                letterSpacing: '0.04em'
              }}>
                {language === 'en' ? 'Musical Genres' : 'Genres Musicaux'}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {profile.genres.map((genre, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      background: '#F1F5F9', 
                      color: '#475569', 
                      padding: '4px 9px', 
                      borderRadius: '8px', 
                      fontSize: '0.72rem', 
                      fontWeight: 700
                    }}
                  >
                    #{genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Audio Tracks / Demo Studio */}
          <div>
            <h4 style={{ 
              fontSize: '0.74rem', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              color: '#64748B', 
              marginBottom: '6px',
              letterSpacing: '0.04em'
            }}>
              {language === 'en' ? 'Studio Demos & Tracks' : 'Extraits & Démo Studio'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sampleTracks.map(tr => (
                <div 
                  key={tr.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '8px 12px', 
                    background: 'var(--bg-light, #F8FAFC)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-light, #E2E8F0)' 
                  }}
                >
                  <button 
                    onClick={() => toggleTrackPlay(tr.id)} 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: playingTrackId === tr.id ? '#10B981' : '#0066FF', 
                      color: '#FFF', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      boxShadow: '0 3px 8px rgba(0, 102, 255, 0.2)',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    {playingTrackId === tr.id ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" style={{ marginLeft: 1.5 }} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--text-dark, #0F172A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tr.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                      {tr.genre} • {tr.duration}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981', flexShrink: 0 }}>
                    {tr.plays} {language === 'en' ? 'plays' : 'écoutes'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Resume & QR Buttons Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            gap: '12px', 
            paddingTop: '10px', 
            borderTop: '1px solid var(--border-light, #E2E8F0)' 
          }}>
            <button 
              onClick={() => setIsCvModalOpen(true)} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#0066FF', 
                fontSize: '0.78rem', 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                cursor: 'pointer',
                padding: '6px 8px'
              }}
            >
              <FileText size={15} /> {language === 'en' ? 'VIEW MUSICAL EPK' : 'VOIR EPK / CV MUSICAL'}
            </button>

            <button 
              onClick={() => setIsQrModalOpen(true)} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#64748B', 
                fontSize: '0.78rem', 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                cursor: 'pointer',
                padding: '6px 8px'
              }}
            >
              <QrCode size={15} /> {language === 'en' ? 'QR CONTACT CARD' : 'CARTE CONTACT QR'}
            </button>
          </div>

        </div>
      </div>

      {/* Full Screen Avatar Modal */}
      {showFullAvatar && (
        <div 
          onClick={(e) => { e.stopPropagation(); setShowFullAvatar(false); }}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 9999, 
            background: 'rgba(0,0,0,0.92)', 
            backdropFilter: 'blur(10px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <button 
            onClick={() => setShowFullAvatar(false)}
            style={{ 
              position: 'absolute', 
              top: 20, 
              right: 20, 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#FFF', 
              cursor: 'pointer' 
            }}
          >
            <X size={22} />
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
            {userAvatarUrl ? (
              <img 
                src={userAvatarUrl} 
                alt={userName} 
                loading="lazy"
                decoding="async"
                style={{
                  maxWidth: '85vw',
                  maxHeight: '80vh',
                  borderRadius: '20px',
                  objectFit: 'contain',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                }}
              />
            ) : (
              <UserAvatar 
                user={{ avatar: userAvatarUrl, name: userName }} 
                size={260} 
                style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} 
              />
            )}
          </div>
        </div>
      )}

      <ProfileQRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} user={profile} isDarkMode={false} />
      <MusicalCVModal isOpen={isCvModalOpen} onClose={() => setIsCvModalOpen(false)} user={profile} isOwnProfile={isSelf} isDarkMode={false} />
    </div>
  );
}
