import React, { useState } from 'react';
import { X, Sliders, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';

export default function OfferServiceModal({ isOpen, onClose, onServiceCreated, isDarkMode }) {
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mixage');
  const [price, setPrice] = useState('180');
  const [priceUnit, setPriceUnit] = useState('titre'); // 'titre' | 'session' | 'heure' | 'projet'
  const [delivery, setDelivery] = useState('48h (3 révisions incluses)');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎚️');

  if (!isOpen) return null;

  const categoryIcons = {
    'Mixage': '🎚️',
    'Mastering': '🎧',
    'Enregistrement': '🎙️',
    'Beatmaking': '🎹',
    'Coaching': '🎓',
    'Arrangement': '🎼'
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setIcon(categoryIcons[cat] || '🎚️');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEngine?.playPopSound?.();

    onServiceCreated({
      id: `srv_${Date.now()}`,
      title,
      category,
      provider: currentUser?.name || 'Artiste Prestataire Pro',
      providerAvatar: currentUser?.avatar || null,
      price: `${price} € / ${priceUnit}`,
      delivery,
      description: description || 'Prestation professionnelle réalisée avec matériel haut de gamme et écoute attentive de vos besoins artistiques.',
      rating: '5.0 ⭐ (Nouveau)',
      icon: icon || '🎚️'
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(14px + env(safe-area-inset-top, 14px)) 14px calc(20px + env(safe-area-inset-bottom, 20px)) 14px'
      }}
      onClick={onClose}
    >
      <div
        className="animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
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
        }}
      >
        {/* Top Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 18px',
            borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9',
            background: isDarkMode ? '#151D2A' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: isDarkMode ? '#FFFFFF' : '#0F172A',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sliders size={20} color="#10B981" /> Proposer un Service Studio
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Offrez vos prestations aux artistes et producteurs de StageLink
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
              minWidth: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} color={isDarkMode ? '#F8FAFC' : '#0F172A'} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 18px 24px 18px'
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Category Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '6px' }}>
                Domaine de Prestation
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {Object.keys(categoryIcons).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '12px',
                      border: category === cat ? '2px solid #10B981' : isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                      background: category === cat ? (isDarkMode ? 'rgba(16,185,129,0.2)' : '#ECFDF5') : isDarkMode ? '#1E293B' : '#F8FAFC',
                      color: category === cat ? '#10B981' : isDarkMode ? '#F8FAFC' : '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{categoryIcons[cat]}</span> {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Intitulé de la Prestation *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Mixage Stéréo & Spécialisation Dolby Atmos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Pricing & Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Tarif (€) *
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.86rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Unité de Facturation
                </label>
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="titre">Par Titre / Track</option>
                  <option value="session">Par Session Studio</option>
                  <option value="heure">Par Heure</option>
                  <option value="projet">Par Projet / EP</option>
                </select>
              </div>
            </div>

            {/* Delivery & Revisions */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Délai & Conditions de Révision
              </label>
              <input
                type="text"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                placeholder="Ex: Livraison 48h (3 révisions incluses)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Description détaillée de votre savoir-faire
              </label>
              <textarea
                rows={3}
                placeholder="Décrivez votre expérience, votre équipement (plugins UAD, convertisseurs, micros...) et ce qui est inclus dans votre formule."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.84rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                marginTop: '4px'
              }}
            >
              🚀 Mettre en Ligne mon Service Studio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
