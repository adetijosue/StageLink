import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Camera, Settings, Edit3, Music, Disc, Play, Pause,
  Users, QrCode, FileText, LogOut, MapPin, Briefcase, Crown, Sparkles,
  Save, X, Globe, Plus, ChevronDown, Check
} from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { INSTRUMENTS_LIST, GENRES_LIST } from '../../services/musicData';

import AppSettingsModal from '../profile/AppSettingsModal';
import ProfileQRCodeModal from '../profile/ProfileQRCodeModal';
import MusicalCVModal from '../profile/MusicalCVModal';
import AvatarCropModal from '../profile/AvatarCropModal';
import UserAvatar from '../common/UserAvatar';
import { getBrandLogoSVG } from '../common/SocialBrandLogo';

export default function ProfileView({ onOpenPaywall, isDarkMode, onToggleDarkMode, onSimulateIncomingCall }) {
  const { currentUser, logout, updateUserProfile } = useAuth();
  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  const [activeModal, setActiveModal] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [rawImageForCrop, setRawImageForCrop] = useState(null);

  const [formData, setFormData] = useState({
    name: '', role: '', bio: '', location: '', company: '',
    instruments: [], genres: [], gear: [],
    spotifyUrl: '', instagramUrl: '', tiktokUrl: '', youtubeUrl: ''
  });

  useEffect(() => {
    if (currentUser && activeModal === 'edit') {
      setFormData({
        name: currentUser.name || '',
        role: currentUser.role || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        company: currentUser.company || '',
        instruments: Array.isArray(currentUser.instruments) ? [...currentUser.instruments] : [],
        genres: Array.isArray(currentUser.genres) ? [...currentUser.genres] : [],
        gear: Array.isArray(currentUser.gear) ? [...currentUser.gear] : [],
        spotifyUrl: currentUser.spotifyUrl || '',
        instagramUrl: currentUser.instagramUrl || '',
        tiktokUrl: currentUser.tiktokUrl || '',
        youtubeUrl: currentUser.youtubeUrl || ''
      });
    }
  }, [currentUser, activeModal]);

  if (!currentUser) return <div style={{ padding: '60px', textAlign: 'center' }}>Chargement...</div>;

  const handleSaveAll = (e) => {
    if (e) e.preventDefault();
    updateUserProfile(formData);
    setActiveModal(null);
    soundEngine.playPopSound();
  };

  const toggleItem = (listKey, item) => {
    soundEngine.playPopSound();
    const currentList = [...formData[listKey]];
    const index = currentList.indexOf(item);
    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(item);
    }
    setFormData({ ...formData, [listKey]: currentList });
  };

  const handleFileAction = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'cover') {
        updateUserProfile({ coverPhoto: reader.result });
      } else {
        setRawImageForCrop(reader.result);
        setActiveModal('crop');
      }
    };
    reader.readAsDataURL(file);
  };

  const score = (() => {
    let s = 0;
    if (currentUser.name && currentUser.name !== 'Artiste StageLink') s += 15;
    if (currentUser.bio) s += 15;
    if (currentUser.avatar && !currentUser.avatar.includes('unsplash')) s += 20;
    if (currentUser.coverPhoto && !currentUser.coverPhoto.includes('unsplash')) s += 10;
    if (currentUser.instruments?.length > 0) s += 15;
    if (currentUser.genres?.length > 0) s += 15;
    if (currentUser.spotifyUrl || currentUser.instagramUrl) s += 10;
    return Math.min(100, s);
  })();

  const instrumentIcons = { 'Piano / Clavier': '🎹', 'Chanteur / Vocal': '🎤', 'Guitare Acoustique': '🎸', 'Guitare Électrique': '🎸', 'Beatmaker / Producer': '💻', 'Ingénieur Son': '🎚️', 'Basse Électrique': '🎸', 'Batterie': '🥁' };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: isDarkMode ? '#0B0F19' : '#F8FAFC', color: isDarkMode ? '#F8FAFC' : '#0F172A', paddingBottom: '120px', overflowY: 'auto' }}>

      {/* 1. EPK HEADER */}
      <div style={{ position: 'relative', height: '220px', background: '#1E293B', marginBottom: '60px' }}>
        <img src={currentUser.coverPhoto || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Banner" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))' }} />

        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
           <button onClick={() => coverRef.current?.click()} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '12px', padding: '10px', color: '#FFF', cursor: 'pointer' }}><Camera size={20} /></button>
           <button onClick={() => setActiveModal('settings')} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '12px', padding: '10px', color: '#FFF', cursor: 'pointer' }}><Settings size={20} /></button>
        </div>
        <input type="file" ref={coverRef} onChange={(e) => handleFileAction(e, 'cover')} style={{ display: 'none' }} accept="image/*" />

        <div style={{ position: 'absolute', bottom: '-45px', left: '20px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <UserAvatar user={currentUser} size={100} border={`4px solid ${isDarkMode ? '#0B0F19' : '#FFF'}`} style={{ boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }} />
            <button onClick={() => avatarRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, background: '#0066FF', color: '#FFF', borderRadius: '50%', padding: '7px', border: '3px solid #FFF', cursor: 'pointer' }}><Camera size={14} /></button>
            <input type="file" ref={avatarRef} onChange={(e) => handleFileAction(e, 'avatar')} style={{ display: 'none' }} accept="image/*" />
          </div>
          <div style={{ paddingBottom: '50px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFF', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>{currentUser.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>{currentUser.role}</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div className="card" style={{ padding: '14px 16px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Profil complété: {score}%</span>
             <Sparkles size={14} color="#F59E0B" />
          </div>
          <div style={{ width: '100%', height: '8px', background: isDarkMode ? '#1E293B' : '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${score}%`, height: '100%', background: '#0066FF', transition: 'width 0.8s ease' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '24px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#64748B' }}>BIO ARTISTIQUE</h3>
              <button onClick={() => setActiveModal('edit')} style={{ background: 'none', border: 'none', color: '#0066FF', cursor: 'pointer' }}><Edit3 size={18} /></button>
           </div>
           <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>"{currentUser.bio || 'Appuyez sur modifier...'}"</p>
        </div>

        <div className="card" style={{ padding: '18px', borderRadius: '22px' }}>
           <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#64748B', marginBottom: '12px' }}>INSTRUMENTS & GENRES</h3>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
             {(currentUser.instruments?.length > 0 ? currentUser.instruments : ['Artiste']).map(inst => (
               <span key={inst} style={{ background: '#EFF6FF', color: '#0066FF', padding: '6px 14px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid #BFDBFE' }}>{instrumentIcons[inst] || '🎵'} {inst}</span>
             ))}
           </div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
             {(currentUser.genres?.length > 0 ? currentUser.genres : ['Tous styles']).map(genre => (
               <span key={genre} style={{ background: isDarkMode ? '#1E293B' : '#F8FAFC', color: isDarkMode ? '#CBD5E1' : '#475569', padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--border-light)' }}>#{genre}</span>
             ))}
           </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
           <button onClick={() => setActiveModal('qr')} className="card" style={{ flex: 1, padding: '18px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
             <QrCode size={28} color="#0066FF" />
             <span style={{ fontSize: '0.72rem', fontWeight: 900 }}>CARTE QR</span>
           </button>
           <button onClick={() => setActiveModal('cv')} className="card" style={{ flex: 1, padding: '18px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
             <FileText size={28} color="#10B981" />
             <span style={{ fontSize: '0.72rem', fontWeight: 900 }}>EPK / CV</span>
           </button>
        </div>

        <button onClick={onSimulateIncomingCall} style={{ width: '100%', padding: '16px', borderRadius: '18px', background: '#ECFDF5', border: '1px solid #10B981', color: '#047857', fontWeight: 900 }}>SIMULER APPEL ENTRANT</button>
        <button onClick={logout} style={{ width: '100%', padding: '16px', borderRadius: '18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', fontWeight: 800 }}>SE DÉCONNECTER</button>
      </div>

      {/* 3. NEW COMPACT BOTTOM-SHEET MODAL FOR EDITING */}
      {activeModal === 'edit' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setActiveModal(null)}
        >
          <div className="animate-slide-up" style={{
            background: isDarkMode ? '#151D2A' : '#FFF',
            width: '100%',
            maxWidth: '500px',
            borderTopLeftRadius: '32px',
            borderTopRightRadius: '32px',
            padding: '12px 24px 40px 24px',
            maxHeight: '85vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Bar & Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
               <div style={{ width: '40px', height: '5px', background: isDarkMode ? '#1E293B' : '#E2E8F0', borderRadius: '3px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 style={{ margin: 0, fontWeight: 900 }}>Paramètres de Page</h3>
               <button onClick={() => setActiveModal(null)} style={{ background: isDarkMode ? '#1E293B' : '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'inherit' }}>
                  <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <div>
                 <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748B', display: 'block', marginBottom: '5px' }}>NOM D'ARTISTE</label>
                 <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'transparent', color: 'inherit', outline: 'none' }} />
               </div>

               <div>
                 <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748B', display: 'block', marginBottom: '5px' }}>BIO / PRÉSENTATION</label>
                 <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'transparent', color: 'inherit', height: '80px', resize: 'none', outline: 'none' }} />
               </div>

               <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '15px' }}>
                 <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0066FF', marginBottom: '10px' }}>INSTRUMENTS (SÉLECTION)</p>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {INSTRUMENTS_LIST.map(inst => {
                      const isSelected = formData.instruments.includes(inst);
                      return (
                        <button key={inst} type="button" onClick={() => toggleItem('instruments', inst)} style={{ padding: '6px 12px', borderRadius: '20px', border: isSelected ? '1.5px solid #0066FF' : '1.5px solid #E2E8F0', background: isSelected ? '#EFF6FF' : 'transparent', color: isSelected ? '#0066FF' : '#64748B', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isSelected && <Check size={12} />} {inst}
                        </button>
                      );
                    })}
                 </div>
               </div>

               <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '15px' }}>
                 <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10B981', marginBottom: '10px' }}>GENRES (SÉLECTION)</p>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {GENRES_LIST.map(genre => {
                      const isSelected = formData.genres.includes(genre);
                      return (
                        <button key={genre} type="button" onClick={() => toggleItem('genres', genre)} style={{ padding: '6px 12px', borderRadius: '20px', border: isSelected ? '1.5px solid #10B981' : '1.5px solid #E2E8F0', background: isSelected ? '#F0FDF4' : 'transparent', color: isSelected ? '#10B981' : '#64748B', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isSelected && <Check size={12} />} {genre}
                        </button>
                      );
                    })}
                 </div>
               </div>

               <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '15px' }}>
                 <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0066FF', marginBottom: '10px' }}>RÉSEAUX SOCIAUX (URL)</p>
                 {['spotify', 'instagram', 'tiktok'].map(p => (
                   <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '22px' }}>{getBrandLogoSVG(p, 20)}</div>
                      <input placeholder={`Lien ${p}`} value={formData[`${p}Url`]} onChange={e => setFormData({...formData, [`${p}Url`]: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'transparent', color: 'inherit', fontSize: '0.8rem', outline: 'none' }} />
                   </div>
                 ))}
               </div>

               <button type="submit" style={{ marginTop: '10px', padding: '16px', borderRadius: '16px', border: 'none', background: '#0066FF', color: '#FFF', fontWeight: 900, cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,102,255,0.4)' }}>
                 Enregistrer les modifications
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALS INTEGRATION */}
      <AppSettingsModal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} onOpenEditProfile={() => setActiveModal('edit')} isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />
      <ProfileQRCodeModal isOpen={activeModal === 'qr'} onClose={() => setActiveModal(null)} user={currentUser} isDarkMode={isDarkMode} />
      <MusicalCVModal isOpen={activeModal === 'cv'} onClose={() => setActiveModal(null)} user={currentUser} isOwnProfile={true} isDarkMode={isDarkMode} />
      <AvatarCropModal isOpen={activeModal === 'crop'} onClose={() => { setActiveModal(null); setRawImageForCrop(null); }} rawImageSrc={rawImageForCrop} onCropComplete={(img) => { updateUserProfile({ avatar: img }); setActiveModal(null); }} />

    </div>
  );
}
