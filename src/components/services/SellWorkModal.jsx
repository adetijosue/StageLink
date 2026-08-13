import React, { useState } from 'react';
import { X, DollarSign, FileAudio } from 'lucide-react';
import { soundEngine } from '../../services/audioService';

export default function SellWorkModal({ isOpen, onClose, onWorkCreated, isDarkMode }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('150');
  const [category, setCategory] = useState('Beatmaking'); // 'Beatmaking' | 'Master' | 'SamplePack' | 'Mixage'
  const [genre, setGenre] = useState('Afrobeat');
  const [licenseType, setLicenseType] = useState('Licence Exclusive + Stems');
  const [selectedFile, setSelectedFile] = useState(null);
  const [agreeRights, setAgreeRights] = useState(true);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEngine.playPopSound();

    onWorkCreated({
      id: `work_${Date.now()}`,
      title,
      author: 'Vous (Artiste VIP Pro)',
      price: `${price} €`,
      genre,
      category,
      type: licenseType,
      fileName: selectedFile ? selectedFile.name : 'Maquette_Master_Preview.mp3',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
    });
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
        maxWidth: '440px',
        maxHeight: 'calc(100dvh - max(48px, env(safe-area-inset-top, 16px) + env(safe-area-inset-bottom, 20px)))',
        display: 'flex',
        flexDirection: 'column',
        background: isDarkMode ? '#0F172A' : '#FFFFFF',
        color: isDarkMode ? '#FFFFFF' : '#0F172A',
        borderRadius: '24px',
        boxShadow: '0 25px 65px rgba(0,0,0,0.4)',
        overflow: 'hidden'
      }}>
        {/* Sticky Non-collapsible Top Header */}
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} color="#0066FF" /> Mettre à disposition une Œuvre
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Publiez et monétisez vos prods & masters sur StageLink
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: isDarkMode ? '#1E293B' : '#F1F5F9',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              minWidth: '42px',
              minHeight: '42px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <X size={20} color={isDarkMode ? '#F8FAFC' : '#0F172A'} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 18px 24px 18px'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Category Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '6px' }}>
                Catégorie de l'Œuvre
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'Beatmaking', label: '🎛️ Beat & Prod' },
                  { id: 'Master', label: '💿 Master Pro' },
                  { id: 'SamplePack', label: '🎧 Sample Pack' },
                  { id: 'Mixage', label: '🎚️ Service Mix' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '12px',
                      border: category === cat.id ? '2px solid #0066FF' : isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
                      background: category === cat.id ? (isDarkMode ? 'rgba(0,102,255,0.2)' : '#EFF6FF') : isDarkMode ? '#1E293B' : '#F8FAFC',
                      color: category === cat.id ? '#0066FF' : isDarkMode ? '#F8FAFC' : '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Titre de l'Œuvre / Maquette *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Pack Beat Afrobeat Gold & Stems Master"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '14px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Price & Genre Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Prix (€) *
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Genre Musical
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Afrobeat">Afrobeat</option>
                  <option value="Gospel">Gospel</option>
                  <option value="Amapiano">Amapiano</option>
                  <option value="Synthwave">Synthwave</option>
                  <option value="RnB / Soul">RnB / Soul</option>
                  <option value="Trap / HipHop">Trap / HipHop</option>
                </select>
              </div>
            </div>

            {/* License Type */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Conditions de Licence & Droits
              </label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '14px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Licence Exclusive + Stems">Licence Exclusive + Stems (Transfert intégral)</option>
                <option value="Licence Non-Exclusive (WAV)">Licence Non-Exclusive (Droits d'exploitation MP3/WAV)</option>
                <option value="Synchro TV & Film">Licence Synchro TV, Film & Publicité</option>
              </select>
            </div>

            {/* Audio File Selection Dropzone */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Fichier Audio / Extrait de Démo (MP3/WAV/ZIP)
              </label>
              <label style={{
                border: isDarkMode ? '2px dashed rgba(0, 102, 255, 0.4)' : '2px dashed #0066FF',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDarkMode ? '#1E293B' : '#EFF6FF',
                cursor: 'pointer',
                textAlign: 'center'
              }}>
                <FileAudio size={24} color="#0066FF" style={{ marginBottom: '6px' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0066FF' }}>
                  {selectedFile ? selectedFile.name : 'Sélectionner le Fichier Audio MP3/WAV'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                  Aperçu de démo protégé par Watermark Audio automatique
                </span>
                <input type="file" accept="audio/*,.zip" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Rights Guarantee Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="rightsCheck"
                checked={agreeRights}
                onChange={(e) => setAgreeRights(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0066FF' }}
              />
              <label htmlFor="rightsCheck" style={{ fontSize: '0.75rem', color: isDarkMode ? '#CBD5E1' : '#64748B', fontWeight: 600 }}>
                Je certifie être l'auteur/détenteur original des droits sur cette œuvre.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!agreeRights}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: agreeRights ? 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)' : '#94A3B8',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: agreeRights ? 'pointer' : 'not-allowed',
                boxShadow: agreeRights ? '0 4px 14px rgba(0, 102, 255, 0.35)' : 'none',
                marginTop: '4px'
              }}
            >
              🚀 Mettre à disposition sur le Catalogue VIP Pro
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
