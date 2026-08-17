import React, { useState, useRef } from 'react';
import { X, Sliders, DollarSign, Clock, ShieldCheck, Image, Headphones, Mic, Radio, Music } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompressor';

const SERVICE_CATEGORIES = [
  { id: 'mix', name: 'Mixage Audio Stéréo / Dolby Atmos', icon: '🎚️', defaultPrice: '200' },
  { id: 'master', name: 'Mastering Analogique Haute Définition', icon: '🎧', defaultPrice: '100' },
  { id: 'recording', name: 'Session Studio & Enregistrement Voix', icon: '🎙️', defaultPrice: '150' },
  { id: 'beatmaking', name: 'Composition & Beatmaking sur Mesure', icon: '🎹', defaultPrice: '250' },
  { id: 'vocal_edit', name: 'Édition Vocale, Melodyne & Harmonies', icon: '✨', defaultPrice: '80' },
  { id: 'coaching', name: 'Coaching Vocal & Direction Artistique', icon: '🎯', defaultPrice: '120' }
];

export default function OfferServiceModal({ isOpen, onClose, onServiceCreated, isDarkMode }) {
  const { currentUser } = useAuth();
  const [selectedCat, setSelectedCat] = useState(SERVICE_CATEGORIES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [price, setPrice] = useState('200');
  const [priceUnit, setPriceUnit] = useState('titre'); // 'titre' | 'session' | 'heure' | 'projet'
  const [deliveryTime, setDeliveryTime] = useState('Livraison 48h (2 Révisions incluses)');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [shareToFeed, setShareToFeed] = useState(true);

  const fileImageInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file, 800, 800, 0.8);
      setCoverImage(compressed);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalTitle = customTitle.trim() || selectedCat.name;

    soundEngine?.playPopSound?.();

    const newService = {
      id: `srv_${Date.now()}`,
      userId: currentUser?.id,
      title: finalTitle,
      category: selectedCat.id,
      provider: currentUser?.name || 'Studio Partenaire',
      providerAvatar: currentUser?.avatar || '',
      price: `${price} € / ${priceUnit}`,
      priceNum: parseFloat(price) || 0,
      delivery: deliveryTime,
      rating: 'Nouveau ⭐',
      icon: selectedCat.icon,
      description: description.trim() || `Prestation professionnelle proposée par ${currentUser?.name || 'Artiste / Ingénieur'}. Équipement de pointe et qualité garantie.`,
      cover: coverImage || currentUser?.avatar || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    onServiceCreated(newService, shareToFeed);
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
              <Sliders size={20} color="#10B981" /> Proposer un Service Studio
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Offrez vos prestations aux artistes et labels de la communauté
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
            {/* Quick Category Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '6px' }}>
                Type de Prestation
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {SERVICE_CATEGORIES.map((cat) => {
                  const isSel = selectedCat.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCat(cat);
                        setPrice(cat.defaultPrice);
                        if (!customTitle) setCustomTitle(cat.name);
                      }}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '14px',
                        border: isSel ? '2px solid #10B981' : isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                        background: isSel ? (isDarkMode ? 'rgba(16,185,129,0.18)' : '#ECFDF5') : (isDarkMode ? '#1E293B' : '#F8FAFC'),
                        color: isDarkMode ? '#FFFFFF' : '#0F172A',
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.2 }}>{cat.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Title */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '6px' }}>
                Intitulé Exact de l'Offre *
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex: Mixage Stéréo Hybride & Dolby Atmos Spatialisé"
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

            {/* Price & Billing Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Tarif (€)
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
                  Par
                </label>
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
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
                  <option value="titre">Par Titre / Piste</option>
                  <option value="session">Par Session (4h)</option>
                  <option value="heure">Par Heure</option>
                  <option value="projet">Par Projet / EP</option>
                </select>
              </div>
            </div>

            {/* Delivery Time & Revisions */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Délai de Réalisation & Révisions
              </label>
              <select
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
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
                <option value="Livraison Express 24h (2 Révisions)">Livraison Express 24h (2 Révisions)</option>
                <option value="Livraison 48h (3 Révisions incluses)">Livraison 48h (3 Révisions incluses)</option>
                <option value="Livraison 3 à 5 jours ouvrés">Livraison 3 à 5 jours ouvrés</option>
                <option value="Sur Rendez-vous en Studio">Sur Rendez-vous en Studio</option>
              </select>
            </div>

            {/* Detailed Description */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Description de la Prestation & Matériel
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre expérience, chaîne analogique, plugins utilisés (UAD, FabFilter, SSL), format de livraison..."
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

            {/* Visual / Studio Image Upload */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Photo du Studio / Visuel du Service
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
                    <img src={coverImage} alt="Studio" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>Photo sélectionnée (Cliquer pour changer)</span>
                  </div>
                ) : (
                  <>
                    <Image size={20} color="#10B981" />
                    <span style={{ fontSize: '0.78rem', color: isDarkMode ? '#CBD5E1' : '#64748B' }}>
                      Ajouter une photo de studio ou visuel
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
              background: isDarkMode ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
              padding: '10px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              border: '1px solid rgba(16,185,129,0.2)'
            }}>
              <input
                type="checkbox"
                checked={shareToFeed}
                onChange={(e) => setShareToFeed(e.target.checked)}
                style={{ accentColor: '#10B981', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                📢 Partager automatiquement dans le fil d'actualité (Feed)
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                marginTop: '4px'
              }}
            >
              🚀 Mettre en Ligne la Prestation ({price} € / {priceUnit})
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
