import React, { useState } from 'react';
import { 
  X, 
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
  Radio
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../services/audioService';
import confetti from 'canvas-confetti';
import ProfileQRCodeModal from './ProfileQRCodeModal';
import MusicalCVModal from './MusicalCVModal';
import SocialBrandLogo from '../common/SocialBrandLogo';

export default function PublicProfileModal({ 
  isOpen = true, 
  onClose, 
  user, 
  onStartChat, 
  onConnectUser 
}) {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);

  if (isOpen === false || !user) return null;

  // Normalized user fields
  const userName = user.name || user.full_name || user.userName || user.title || 'Artiste StageLink';
  const userAvatarUrl = user.avatar || user.avatar_url || user.userAvatar || user.image || '';
  const userRole = user.role || user.userRole || user.category || 'Artiste';
  const userBio = user.bio || user.description || 'Membre vérifié de la communauté musicale StageLink.';
  const userLocation = user.location || 'Studio & En ligne';
  const userCompany = user.company || user.studio || 'Artiste Indépendant';
  const userCover = user.coverPhoto || user.cover_url || user.cover || user.image || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800';
  const isVip = user.badgeType === 'gold' || user.badgeType === 'blue' || user.verified === true;
  const targetUserId = user.id || user.userId;

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
    { id: 'ptr_1', title: 'Studio Session 2026', genre: userRole || 'Afrobeat', duration: '03:20', plays: '1.4k' },
    { id: 'ptr_2', title: 'Acoustic Jam Demo', genre: 'Live Production', duration: '02:45', plays: '920' }
  ];

  const instrumentIcons = {
    'Piano': '🎹', 'Chanteur': '🎤', 'Chant': '🎤', 'Vocaliste': '🎤', 'Guitare': '🎸', 
    'Beatmaker': '💻', 'Producteur': '🎧', 'Ingénieur': '🎚️', 'Mix': '🎚️', 'Basse': '🎸', 
    'Batterie': '🥁', 'Saxophone': '🎷', 'Clavier': '🎹', 'Studio': '🎙️'
  };

  const specialtiesList = Array.isArray(user.skills) && user.skills.length > 0
    ? user.skills
    : Array.isArray(user.instruments) && user.instruments.length > 0
    ? user.instruments
    : [userRole];

  return (
    <div 
      style={{
        position: 'fixed', 
        inset: 0, 
        zIndex: 1050, 
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '16px',
        animation: 'fadeIn 0.2s ease'
      }} 
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%', 
          maxWidth: '460px', 
          background: 'var(--card-bg, #FFFFFF)', 
          borderRadius: '28px',
          maxHeight: '92vh', 
          overflowY: 'auto', 
          boxShadow: '0 25px 60px rgba(0,0,0,0.45)', 
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* 1. Header Hero (Cover + Avatar + Close Button) */}
        <div style={{ position: 'relative', height: '190px', marginBottom: '50px' }}>
          <img
            src={userCover}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              borderTopLeftRadius: '28px', 
              borderTopRightRadius: '28px' 
            }}
            alt={`Couverture de ${userName}`}
          />
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(15, 23, 42, 0.85) 100%)', 
            borderTopLeftRadius: '28px', 
            borderTopRightRadius: '28px' 
          }} />

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', 
              top: 14, 
              right: 14, 
              zIndex: 20,
              background: 'rgba(15, 23, 42, 0.75)', 
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%', 
              width: '38px', 
              height: '38px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#FFFFFF', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.15s ease'
            }}
            title="Fermer le profil"
          >
            <X size={20} />
          </button>

          {/* Live Talent Indicator */}
          <div style={{
            position: 'absolute',
            top: 14,
            left: 14,
            background: 'rgba(16, 185, 129, 0.9)',
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
            bottom: '-42px', 
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
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    background: '#1E293B'
                  }}
                />
              ) : (
                <UserAvatar 
                  user={{ avatar: userAvatarUrl, name: userName }} 
                  size={90} 
                  border="4px solid #FFFFFF" 
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }} 
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
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFF',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)'
                }}>
                  <Award size={14} />
                </div>
              )}
            </div>

            <div style={{ paddingBottom: '46px', flex: 1, minWidth: 0 }}>
              <h3 style={{ 
                fontSize: '1.28rem', 
                fontWeight: 900, 
                color: '#FFFFFF', 
                textShadow: '0 2px 8px rgba(0,0,0,0.7)', 
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
                fontSize: '0.82rem', 
                fontWeight: 700,
                margin: '2px 0 0 0',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)'
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
                  fontSize: '0.86rem', 
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
                    onStartChat(user, `Bonjour ${userName}, j'ai découvert votre profil complet sur StageLink et j'aimerais collaborer avec vous !`);
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
                  fontSize: '0.86rem', 
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
            padding: '8px 12px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 102, 255, 0.1)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={14} color="#0066FF" /> {userLocation}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Briefcase size={14} color="#10B981" /> {userCompany}
            </span>
          </div>

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
              À Propos & Bio
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
              Spécialités & Compétences
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
              <FileText size={16} /> VOIR EPK / CV
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

      <ProfileQRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} user={user} isDarkMode={false} />
      <MusicalCVModal isOpen={isCvModalOpen} onClose={() => setIsCvModalOpen(false)} user={user} isOwnProfile={isSelf} isDarkMode={false} />
    </div>
  );
}
