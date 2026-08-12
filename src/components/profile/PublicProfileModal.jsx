import React, { useState } from 'react';
import { X, Check, MapPin, Briefcase, UserPlus, UserCheck, MessageSquare, Music, Disc, Cpu, Play, Pause, Sparkles, Globe, Mail, Phone, ExternalLink, QrCode, Share2, FileText, Crown, Users } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../services/audioService';
import confetti from 'canvas-confetti';
import ProfileQRCodeModal from './ProfileQRCodeModal';
import MusicalCVModal from './MusicalCVModal';
import SocialBrandLogo from '../common/SocialBrandLogo';

export default function PublicProfileModal({ isOpen, onClose, user, onStartChat, onFollowUser }) {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);

  if (!isOpen || !user) return null;

  const isSelf = currentUser && (currentUser.id === user.id || currentUser.name === user.name);
  const isVip = user.badgeType === 'gold';

  const handleFollowClick = () => {
    if (!isFollowing) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setIsFollowing(true);
      if (onFollowUser) onFollowUser(user);
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
    { id: 'ptr_1', title: 'Studio Release 2026', genre: 'Afrobeat', duration: '03:20', plays: '1.2k' },
    { id: 'ptr_2', title: 'Jam Session Demo', genre: 'Gospel', duration: '02:50', plays: '850' }
  ];

  const instrumentIcons = {
    'Piano': '🎹', 'Chanteur': '🎤', 'Guitare': '🎸', 'Beatmaker': '💻', 'Ingénieur': '🎚️', 'Basse': '🎸', 'Batterie': '🥁', 'Saxophone': '🎷'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }} onClick={onClose}>
      <div className="animate-scale-in" onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: '440px', background: '#F8FAFC', borderRadius: '28px',
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', position: 'relative'
      }}>

        {/* 1. Header Hero (Cover + Avatar) */}
        <div style={{ position: 'relative', height: '180px', marginBottom: '50px' }}>
          <img
            src={user.coverPhoto || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: '28px', borderTopRightRadius: '28px' }}
            alt="Couverture"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px' }} />

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              background: '#FEF2F2', border: '1.5px solid #FCA5A5',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#EF4444', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            title="Fermer"
          >
            <X size={20} color="#EF4444" />
          </button>

          <div style={{ position: 'absolute', bottom: '-40px', left: '20px', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            <UserAvatar 
              user={{ avatar: user.userAvatar || user.avatar, name: user.userName || user.name }} 
              size={85} 
              border="4px solid #F8FAFC" 
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer' }} 
              onClick={(e) => {
                e.stopPropagation();
                setShowFullAvatar(true);
              }}
            />
            <div style={{ paddingBottom: '45px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFF', textShadow: '0 2px 6px rgba(0,0,0,0.5)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {user.userName || user.name} {isVip && <Crown size={15} color="#F59E0B" fill="#F59E0B" />}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', fontWeight: 700 }}>{user.userRole || user.role}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 18px 24px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Action Bar */}
          {!isSelf && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleFollowClick} style={{ flex: 1, padding: '10px', borderRadius: '14px', border: 'none', background: isFollowing ? '#ECFDF5' : '#0066FF', color: isFollowing ? '#047857' : '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {isFollowing ? <><UserCheck size={16} /> Suivi</> : <><UserPlus size={16} /> Suivre</>}
              </button>
              <button onClick={() => { onClose(); onStartChat(user); }} style={{ flex: 1, padding: '10px', borderRadius: '14px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <MessageSquare size={16} color="#0066FF" /> Chat
              </button>
            </div>
          )}

          {/* Location & Bio */}
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {user.location || 'Studio & En ligne'}</span>
             <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={13} /> {user.company || 'Artiste Indépendant'}</span>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '18px' }}>
            <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>"{user.bio || 'Membre passionné de la communauté StageLink.'}"</p>
          </div>

          {/* Portfolio */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Top Morceaux</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sampleTracks.map(tr => (
                <div key={tr.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <button onClick={() => toggleTrackPlay(tr.id)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0066FF', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {playingTrackId === tr.id ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" style={{ marginLeft: 2 }} />}
                  </button>
                  <div style={{ flex: 1 }}><div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{tr.title}</div><div style={{ fontSize: '0.65rem', color: '#64748B' }}>{tr.genre}</div></div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981' }}>{tr.plays} écoutes</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instruments */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Spécialités</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(Array.isArray(user.instruments) && user.instruments.length > 0 ? user.instruments : [user.role || 'Artiste']).map(inst => (
                <span key={inst} style={{ background: '#EFF6FF', color: '#0066FF', padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {instrumentIcons[inst] || '🎵'} {inst}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
            <button onClick={() => setIsCvModalOpen(true)} style={{ background: 'transparent', border: 'none', color: '#0066FF', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> VOIR EPK / CV</button>
            <button onClick={() => setIsQrModalOpen(true)} style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}><QrCode size={16} /> CARTE CONTACT</button>
          </div>

        </div>
      </div>

      {/* Full Screen Avatar Modal */}
      {showFullAvatar && (
        <div 
          onClick={(e) => { e.stopPropagation(); setShowFullAvatar(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <button 
            onClick={() => setShowFullAvatar(false)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '10px', color: '#FFF', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
            <UserAvatar 
              user={{ avatar: user.userAvatar || user.avatar, name: user.userName || user.name }} 
              size={typeof window !== 'undefined' && window.innerWidth * 0.8 > 400 ? 400 : 300} 
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} 
            />
          </div>
        </div>
      )}

      <ProfileQRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} user={user} isDarkMode={false} />
      <MusicalCVModal isOpen={isCvModalOpen} onClose={() => setIsCvModalOpen(false)} user={user} isOwnProfile={isSelf} isDarkMode={false} />
    </div>
  );
}
