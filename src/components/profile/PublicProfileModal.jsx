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
  Cpu, 
  Play, 
  Pause, 
  Sparkles, 
  Globe, 
  Mail, 
  Phone, 
  ExternalLink, 
  QrCode, 
  Share2, 
  FileText, 
  Crown, 
  Award,
  Users,
  Flame,
  Radio,
  Sliders,
  Grid,
  Layers
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../services/audioService';
import confetti from 'canvas-confetti';
import ProfileQRCodeModal from './ProfileQRCodeModal';
import MusicalCVModal from './MusicalCVModal';
import SocialBrandLogo, { getBrandLogoSVG } from '../common/SocialBrandLogo';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';

export default function PublicProfileModal({ 
  isOpen = true, 
  onClose, 
  user, 
  onStartChat, 
  onConnectUser 
}) {
  const { currentUser } = useAuth();
  const [hydratedUser, setHydratedUser] = useState(user || {});
  const [isFollowing, setIsFollowing] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'works' | 'gear'

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

    // Fetch live posts by this artist
    try {
      const allPosts = JSON.parse(localStorage.getItem('stagelink_posts') || '[]');
      const filtered = allPosts.filter(p => p.userId === targetId || p.userName === (initial.name || initial.full_name));
      setUserPosts(filtered);
    } catch (e) {}

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

  if (isOpen === false || !user) return null;

  const profile = hydratedUser || user;

  // Normalized user fields
  const userName = profile.name || profile.full_name || profile.userName || profile.title || 'Artiste StageLink';
  const userAvatarUrl = profile.avatar || profile.avatar_url || profile.userAvatar || profile.image || '';
  const userRole = profile.role || profile.userRole || profile.category || 'Artiste';
  const userBio = profile.bio || profile.description || 'Membre vérifié de la communauté musicale StageLink.';
  const userLocation = profile.location || 'Studio & En ligne';
  const userCompany = profile.company || profile.studio || 'Artiste Indépendant';
  const userCover = profile.coverPhoto || profile.cover_url || profile.cover || profile.image || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800';
  const isVip = profile.badgeType === 'gold' || profile.badgeType === 'blue' || profile.verified === true;
  const targetUserId = profile.id || profile.userId;

  const isSelf = currentUser && (currentUser.id === targetUserId || currentUser.name === userName);

  const handleFollowClick = () => {
    soundEngine?.playPopSound?.();
    if (!isFollowing) {
      try {
        confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}
      setIsFollowing(true);
      if (onConnectUser && targetUserId) onConnectUser(targetUserId);
    } else {
      setIsFollowing(false);
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
    { id: 'ptr_1', title: 'Studio Production Demo 2026', genre: userRole || 'Afrobeat', duration: '03:20', plays: '1.8k' },
    { id: 'ptr_2', title: 'Acoustic Jam Session', genre: 'Live Production', duration: '02:45', plays: '1.2k' }
  ];

  const instrumentIcons = {
    'Piano': '🎹', 'Chanteur': '🎤', 'Chant': '🎤', 'Vocaliste': '🎤', 'Guitare': '🎸', 
    'Beatmaker': '💻', 'Producteur': '🎧', 'Ingénieur': '🎚️', 'Mix': '🎚️', 'Basse': '🎸', 
    'Batterie': '🥁', 'Saxophone': '🎷', 'Clavier': '🎹', 'Studio': '🎙️'
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
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(16px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '12px',
        animation: 'fadeIn 0.2s ease'
      }} 
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%', 
          maxWidth: '520px', 
          background: 'var(--card-bg, #FFFFFF)', 
          borderRadius: '28px',
          maxHeight: '94vh', 
          overflowY: 'auto', 
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)', 
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Floating App Bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              cursor: 'pointer'
            }}
            title="Retour"
          >
            <ArrowLeft size={18} />
          </button>

          <span style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            Profil Public • {userName}
          </span>

          <button
            onClick={() => setIsQrModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              cursor: 'pointer'
            }}
            title="Carte contact QR"
          >
            <QrCode size={18} />
          </button>
        </div>

        {/* 1. Header Hero (Cover + Avatar) */}
        <div style={{ position: 'relative', height: '190px', marginBottom: '52px' }}>
          <img
            src={userCover}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }}
            alt={`Couverture de ${userName}`}
          />
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(15, 23, 42, 0.9) 100%)' 
          }} />

          {/* Live Talent Indicator */}
          <div style={{
            position: 'absolute',
            top: 14,
            left: 16,
            background: 'rgba(16, 185, 129, 0.92)',
            color: '#FFF',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}>
            <Radio size={12} /> PROFIL VÉRIFIÉ
          </div>

          {/* Avatar & Hero Info */}
          <div style={{ 
            position: 'absolute', 
            bottom: '-44px', 
            left: '20px', 
            right: '20px',
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '14px' 
          }}>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowFullAvatar(true);
              }}
              style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}
              title="Agrandir l'avatar"
            >
              {userAvatarUrl ? (
                <img 
                  src={userAvatarUrl} 
                  alt={userName} 
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    background: '#1E293B'
                  }}
                />
              ) : (
                <UserAvatar 
                  user={{ avatar: userAvatarUrl, name: userName }} 
                  size={92} 
                  border="4px solid #FFFFFF" 
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} 
                />
              )}

              {isVip && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: '#F59E0B',
                  color: '#FFF',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFF',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)'
                }}>
                  <Award size={15} />
                </div>
              )}
            </div>

            <div style={{ paddingBottom: '48px', flex: 1, minWidth: 0 }}>
              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: 900, 
                color: '#FFFFFF', 
                textShadow: '0 2px 8px rgba(0,0,0,0.8)', 
                margin: 0, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {userName} {isVip && <Crown size={17} color="#F59E0B" fill="#F59E0B" />}
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontSize: '0.84rem', 
                fontWeight: 700,
                margin: '2px 0 0 0',
                textShadow: '0 1px 4px rgba(0,0,0,0.7)'
              }}>
                {userRole}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Main Profile Content Body */}
        <div style={{ padding: '0 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Action Bar (Follow & Chat) */}
          {!isSelf && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleFollowClick} 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '16px', 
                  border: isFollowing ? '1px solid #10B981' : 'none', 
                  background: isFollowing ? '#ECFDF5' : '#0066FF', 
                  color: isFollowing ? '#047857' : '#FFFFFF', 
                  fontWeight: 800, 
                  fontSize: '0.88rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: isFollowing ? 'none' : '0 4px 14px rgba(0, 102, 255, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isFollowing ? <><UserCheck size={18} /> Abonné</> : <><UserPlus size={18} /> S'abonner</>}
              </button>

              <button 
                onClick={() => { 
                  soundEngine?.playPopSound?.();
                  onClose(); 
                  if (onStartChat) {
                    onStartChat(profile, `Bonjour ${userName}, j'ai découvert votre profil complet sur StageLink et j'aimerais collaborer avec vous !`);
                  }
                }} 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '16px', 
                  border: '1.5px solid #0066FF', 
                  background: 'rgba(0, 102, 255, 0.05)', 
                  color: '#0066FF',
                  fontWeight: 800, 
                  fontSize: '0.88rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageSquare size={18} /> Message Direct
              </button>
            </div>
          )}

          {/* Location, Studio & Status Details */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px', 
            fontSize: '0.78rem', 
            color: '#64748B', 
            fontWeight: 600,
            background: 'rgba(0, 102, 255, 0.03)',
            padding: '10px 14px',
            borderRadius: '14px',
            border: '1px solid rgba(0, 102, 255, 0.1)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={14} color="#0066FF" /> {userLocation}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Briefcase size={14} color="#10B981" /> {userCompany}
            </span>
          </div>

          {/* Social Links Row if present */}
          {(profile.spotifyUrl || profile.instagramUrl || profile.youtubeUrl || profile.tiktokUrl) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {profile.spotifyUrl && (
                <a 
                  href={profile.spotifyUrl.startsWith('http') ? profile.spotifyUrl : `https://${profile.spotifyUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#F0FDF4',
                    color: '#16A34A',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid #BBF7D0'
                  }}
                >
                  <Music size={14} /> Spotify
                </a>
              )}

              {profile.instagramUrl && (
                <a 
                  href={profile.instagramUrl.startsWith('http') ? profile.instagramUrl : `https://${profile.instagramUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FDF2F8',
                    color: '#DB2777',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid #FBCFE8'
                  }}
                >
                  <Globe size={14} /> Instagram
                </a>
              )}

              {profile.youtubeUrl && (
                <a 
                  href={profile.youtubeUrl.startsWith('http') ? profile.youtubeUrl : `https://${profile.youtubeUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    border: '1px solid #FECACA'
                  }}
                >
                  <Play size={14} /> YouTube
                </a>
              )}
            </div>
          )}

          {/* Bio Description */}
          <div style={{ 
            background: 'var(--bg-light, #F8FAFC)', 
            border: '1px solid var(--border-light, #E2E8F0)', 
            padding: '14px 16px', 
            borderRadius: '18px' 
          }}>
            <h4 style={{ 
              fontSize: '0.74rem', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              color: '#0066FF', 
              margin: '0 0 6px 0',
              letterSpacing: '0.04em'
            }}>
              Biographie & Présentation
            </h4>
            <p style={{ 
              fontSize: '0.86rem', 
              color: 'var(--text-dark, #334155)', 
              lineHeight: 1.5, 
              margin: 0,
              whiteSpace: 'pre-line'
            }}>
              {userBio}
            </p>
          </div>

          {/* Specialties & Musical Skills */}
          <div>
            <h4 style={{ 
              fontSize: '0.76rem', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              color: '#64748B', 
              marginBottom: '8px',
              letterSpacing: '0.04em'
            }}>
              Spécialités & Instruments
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {specialtiesList.map((skill, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    background: 'rgba(0, 102, 255, 0.08)', 
                    color: '#0066FF', 
                    padding: '6px 12px', 
                    borderRadius: '12px', 
                    fontSize: '0.78rem', 
                    fontWeight: 700,
                    border: '1px solid rgba(0, 102, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {instrumentIcons[skill] || '🎵'} {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Musical Genres if available */}
          {Array.isArray(profile.genres) && profile.genres.length > 0 && (
            <div>
              <h4 style={{ 
                fontSize: '0.76rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                color: '#64748B', 
                marginBottom: '8px',
                letterSpacing: '0.04em'
              }}>
                Genres Musicaux
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.genres.map((genre, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      background: '#F1F5F9', 
                      color: '#475569', 
                      padding: '4px 10px', 
                      borderRadius: '10px', 
                      fontSize: '0.74rem', 
                      fontWeight: 700
                    }}
                  >
                    🎸 {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Audio Productions / Tracks */}
          <div>
            <h4 style={{ 
              fontSize: '0.76rem', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              color: '#64748B', 
              marginBottom: '8px',
              letterSpacing: '0.04em'
            }}>
              Extraits & Démo Studio
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sampleTracks.map(tr => (
                <div 
                  key={tr.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '10px 14px', 
                    background: 'var(--bg-light, #F8FAFC)', 
                    borderRadius: '14px', 
                    border: '1px solid var(--border-light, #E2E8F0)' 
                  }}
                >
                  <button 
                    onClick={() => toggleTrackPlay(tr.id)} 
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: playingTrackId === tr.id ? '#10B981' : '#0066FF', 
                      color: '#FFF', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0, 102, 255, 0.25)'
                    }}
                  >
                    {playingTrackId === tr.id ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" style={{ marginLeft: 2 }} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-dark, #0F172A)' }}>
                      {tr.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      {tr.genre} • {tr.duration}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10B981' }}>
                    {tr.plays} écoutes
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Links & Interactive Portfolios */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '16px', 
            paddingTop: '12px', 
            borderTop: '1px solid var(--border-light, #E2E8F0)' 
          }}>
            <button 
              onClick={() => setIsCvModalOpen(true)} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#0066FF', 
                fontSize: '0.82rem', 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <FileText size={16} /> VOIR EPK / CV MUSICAL
            </button>

            <button 
              onClick={() => setIsQrModalOpen(true)} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#64748B', 
                fontSize: '0.82rem', 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <QrCode size={16} /> CARTE CONTACT QR
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
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF', 
              cursor: 'pointer' 
            }}
          >
            <X size={24} />
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
            {userAvatarUrl ? (
              <img 
                src={userAvatarUrl} 
                alt={userName}
                style={{
                  maxWidth: '85vw',
                  maxHeight: '80vh',
                  borderRadius: '24px',
                  objectFit: 'contain',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                }}
              />
            ) : (
              <UserAvatar 
                user={{ avatar: userAvatarUrl, name: userName }} 
                size={300} 
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
