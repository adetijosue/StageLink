import React, { useState } from 'react';
import { X, GraduationCap, Clock, Award, BookOpen } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';

export default function PublishCourseModal({ isOpen, onClose, onCourseCreated, isDarkMode }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('49');
  const [duration, setDuration] = useState('4h 30min (12 Modules HD)');
  const [level, setLevel] = useState('Tous niveaux');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEngine?.playPopSound?.();

    onCourseCreated({
      id: `course_${Date.now()}`,
      title,
      instructor: currentUser?.name || 'Formateur Pro',
      price: `${price} €`,
      duration,
      level,
      enrolled: '1 membre inscrit',
      rating: '5.0 ⭐ (Nouveau)',
      cover: coverUrl
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
          maxWidth: '440px',
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
        {/* Sticky Header */}
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
              <GraduationCap size={20} color="#0066FF" /> Publier une Formation Pro
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Partagez votre expertise et formez la communauté
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

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 18px 24px 18px'
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Titre de la Formation / Masterclass *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Masterclass : Mixing & Mastering Pro sur FL Studio"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Prix d'accès (€) *
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
                  Niveau Requis
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
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
                  <option value="Tous niveaux">Tous niveaux</option>
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé / Pro">Avancé / Pro</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Durée & Nombre de Modules
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 4h 30min (12 Modules HD)"
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

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
                marginTop: '6px'
              }}
            >
              🚀 Mettre en Ligne la Masterclass
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
