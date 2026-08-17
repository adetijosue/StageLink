import React, { useState, useRef } from 'react';
import { X, DollarSign, FileAudio, Image, Music, UploadCloud, CheckCircle } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { compressImage } from '../../utils/imageCompressor';

export default function SellWorkModal({ isOpen, onClose, onWorkCreated, isDarkMode }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('150');
  const [category, setCategory] = useState('Beatmaking'); // 'Beatmaking' | 'Master' | 'SamplePack' | 'Mixage'
  const [genre, setGenre] = useState('Afrobeat');
  const [licenseType, setLicenseType] = useState('Licence Exclusive + Stems');
  const [description, setDescription] = useState('');
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [agreeRights, setAgreeRights] = useState(true);
  const [shareToFeed, setShareToFeed] = useState(true);

  const fileAudioInputRef = useRef(null);
  const fileImageInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file, 800, 800, 0.8);
      setCoverImage(compressed);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEngine?.playPopSound?.();

    const newWork = {
      id: `work_${Date.now()}`,
      userId: currentUser?.id,
      title: title.trim(),
      author: currentUser?.name || (language === 'en' ? 'StageLink Artist' : 'Artiste StageLink'),
      authorAvatar: currentUser?.avatar || '',
      price: `${price} €`,
      priceNum: parseFloat(price) || 0,
      genre,
      category,
      type: licenseType,
      description: description.trim(),
      audioUrl: audioPreviewUrl || null,
      fileName: selectedAudioFile ? selectedAudioFile.name : null,
      cover: coverImage || currentUser?.avatar || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    onWorkCreated(newWork, shareToFeed);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      background: 'rgba(15, 23, 42, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'calc(14px + env(safe-area-inset-top, 14px)) 14px calc(20px + env(safe-area-inset-bottom, 20px)) 14px'
    }} onClick={onClose}>
      <div className="animate-scale-in" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '460px',
        maxHeight: 'calc(100dvh - max(48px, env(safe-area-inset-top, 16px) + env(safe-area-inset-bottom, 20px)))',
        display: 'flex',
        flexDirection: 'column',
        background: isDarkMode ? '#0F172A' : '#FFFFFF',
        color: isDarkMode ? '#FFFFFF' : '#0F172A',
        borderRadius: '24px',
        boxShadow: '0 25px 65px rgba(0,0,0,0.4)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          flexShrink: 0,
          padding: '14px 18px',
          borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9',
          background: isDarkMode ? '#151D2A' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music size={20} color="#0066FF" /> {language === 'en' ? 'Sell a Work / Beat' : 'Mettre en Vente une Œuvre'}
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0 0' }}>
              {language === 'en' ? 'Publish and sell your compositions, beats and masters' : 'Publiez et vendez vos compositions, beats et masters'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: isDarkMode ? '#1E293B' : '#F1F5F9',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} color={isDarkMode ? '#F8FAFC' : '#0F172A'} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 18px 24px 18px'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Title */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '6px' }}>
                {language === 'en' ? 'Work / Beat Title *' : "Titre de l'Œuvre / Beat *"}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'en' ? 'Ex: Afrobeat Summer Hit & Stems Master' : 'Ex: Afrobeat Summer Hit & Stems Master'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.84rem'
                }}
              />
            </div>

            {/* Category & Genre */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  {language === 'en' ? 'Category' : 'Catégorie'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="Beatmaking">{language === 'en' ? 'Beatmaking / Production' : 'Beatmaking / Prod'}</option>
                  <option value="Master">{language === 'en' ? 'Full Master' : 'Master Complet'}</option>
                  <option value="SamplePack">{language === 'en' ? 'Sample Pack & MIDI' : 'Sample Pack & MIDI'}</option>
                  <option value="Topline">{language === 'en' ? 'Topline & Vocals' : 'Topline & Voix'}</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  {language === 'en' ? 'Music Genre' : 'Genre Musical'}
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="Afrobeat">Afrobeat</option>
                  <option value="Gospel">Gospel / Worship</option>
                  <option value="Amapiano">Amapiano</option>
                  <option value="RnB / Soul">RnB / Soul</option>
                  <option value="Rap / Hip-Hop">Rap / Hip-Hop</option>
                  <option value="Pop / Variété">Pop / Variété</option>
                  <option value="Zouk / Kompa">Zouk / Kompa</option>
                  <option value="Cinematic">{language === 'en' ? 'Cinematic / Sync' : 'Cinématique / Synchro'}</option>
                </select>
              </div>
            </div>

            {/* Price & License */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  {language === 'en' ? 'Price (€)' : 'Prix (€)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 30px',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
                      background: isDarkMode ? '#1E293B' : '#FFFFFF',
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  />
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#10B981', fontWeight: 800 }}>€</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  {language === 'en' ? 'License Type' : 'Type de Licence'}
                </label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="Licence Exclusive + Stems">{language === 'en' ? 'Exclusive + Stems (WAV)' : 'Exclusive + Stems (WAV)'}</option>
                  <option value="Licence Commerciale MP3/WAV">{language === 'en' ? 'Commercial MP3 + WAV' : 'Commerciale MP3 + WAV'}</option>
                  <option value="Licence Non-Exclusive (MP3)">{language === 'en' ? 'Non-Exclusive (MP3)' : 'Non-Exclusive (MP3)'}</option>
                  <option value="Synchro TV & Film">{language === 'en' ? 'Media / Film Sync' : 'Synchro Média / Film'}</option>
                </select>
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                {language === 'en' ? 'Description & Details' : "Description & Détails de l'Œuvre"}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'en' ? 'Specify BPM, key, instruments used or conditions...' : 'Précisez le tempo (BPM), la tonalité, les instruments utilisés ou conditions...'}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.82rem',
                  resize: 'none'
                }}
              />
            </div>

            {/* Image / Cover Upload */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                {language === 'en' ? 'Cover / Artwork' : "Pochette / Visuel de l'Œuvre"}
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileImageInputRef}
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => fileImageInputRef.current?.click()}
                style={{
                  border: isDarkMode ? '2px dashed rgba(255,255,255,0.15)' : '2px dashed #CBD5E1',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {coverImage ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={coverImage} alt="Cover" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>{language === 'en' ? 'Artwork selected (Click to change)' : 'Visuel sélectionné (Cliquer pour changer)'}</span>
                  </div>
                ) : (
                  <>
                    <Image size={20} color="#0066FF" />
                    <span style={{ fontSize: '0.78rem', color: isDarkMode ? '#CBD5E1' : '#64748B' }}>
                      {language === 'en' ? 'Add a cover / photo' : 'Ajouter une pochette / photo'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Audio File Upload */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                {language === 'en' ? 'Audio File (Demo MP3 / WAV)' : 'Fichier Audio (Extrait Démo MP3 / WAV)'}
              </label>
              <input
                type="file"
                accept="audio/*"
                ref={fileAudioInputRef}
                onChange={handleAudioChange}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => fileAudioInputRef.current?.click()}
                style={{
                  border: isDarkMode ? '2px dashed rgba(255,255,255,0.15)' : '2px dashed #CBD5E1',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {selectedAudioFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileAudio size={20} color="#10B981" />
                    <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                      {selectedAudioFile.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={20} color="#0066FF" />
                    <span style={{ fontSize: '0.78rem', color: isDarkMode ? '#CBD5E1' : '#64748B' }}>
                      {language === 'en' ? 'Upload a demo audio track' : 'Importer un fichier audio démo'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Feed Share Toggle */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: isDarkMode ? 'rgba(0,102,255,0.12)' : '#EFF6FF',
              padding: '10px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              border: '1px solid rgba(0,102,255,0.2)'
            }}>
              <input
                type="checkbox"
                checked={shareToFeed}
                onChange={(e) => setShareToFeed(e.target.checked)}
                style={{ accentColor: '#0066FF', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0066FF' }}>
                {language === 'en' ? '📢 Automatically share in Feed' : '📢 Partager automatiquement dans le fil d\'actualité (Feed)'}
              </span>
            </label>

            {/* Rights Agreement */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                checked={agreeRights}
                onChange={(e) => setAgreeRights(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#0066FF' }}
              />
              <span style={{ fontSize: '0.72rem', color: isDarkMode ? '#94A3B8' : '#64748B', lineHeight: 1.35 }}>
                {language === 'en' ? 'I certify that I own 100% of the rights to this composition and authorize its listing on StageLink.' : 'Je certifie détenir 100% des droits sur cette composition et autorise sa mise à disposition sur StageLink.'}
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!agreeRights || !title.trim()}
              style={{
                background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: agreeRights && title.trim() ? 'pointer' : 'not-allowed',
                opacity: agreeRights && title.trim() ? 1 : 0.6,
                boxShadow: '0 8px 20px rgba(0, 102, 255, 0.3)',
                marginTop: '4px'
              }}
            >
              {language === 'en' ? `🚀 Publish Work (${price} €)` : `🚀 Publier mon Œuvre (${price} €)`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
