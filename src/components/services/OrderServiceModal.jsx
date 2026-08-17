import React, { useState } from 'react';
import { X, CheckCircle, Send, MessageSquare, ShieldCheck, Clock, Sliders } from 'lucide-react';
import { soundEngine } from '../../services/audioService';

export default function OrderServiceModal({ isOpen, onClose, service, onConfirmOrder, isDarkMode }) {
  const [projectTitle, setProjectTitle] = useState('');
  const [stemsCount, setStemsCount] = useState('8-16');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !service) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    soundEngine?.playPopSound?.();
    setIsSuccess(true);
    setTimeout(() => {
      if (onConfirmOrder) {
        onConfirmOrder({
          service,
          projectTitle: projectTitle || 'Projet Studio',
          stemsCount,
          notes
        });
      }
      setIsSuccess(false);
      onClose();
    }, 1600);
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
        {/* Header */}
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
              <span>{service.icon || '🎚️'}</span> Commander la Prestation
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Direct avec {service.provider}
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

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 18px 24px 18px'
          }}
        >
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={36} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                Demande de Prestation Envoyée !
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                {service.provider} a reçu les détails de votre projet. Une discussion directe a été ouverte dans vos messages.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Service Summary Card */}
              <div
                style={{
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    {service.title}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10B981' }}>
                    {service.price}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={12} /> {service.delivery}
                </div>
              </div>

              {/* Project Title */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Nom de votre Morceau / Projet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mon Nouveau Single - Version Finale"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
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

              {/* Number of Tracks/Stems */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Nombre de Pistes / Stems
                </label>
                <select
                  value={stemsCount}
                  onChange={(e) => setStemsCount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#F8FAFC',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.84rem'
                  }}
                >
                  <option value="1-4">1 à 4 pistes (Voix + Prod Stéréo)</option>
                  <option value="5-16">5 à 16 pistes (Standard)</option>
                  <option value="17-32">17 à 32 pistes (Pro Session)</option>
                  <option value="32+">Plus de 32 pistes (Session Complète)</option>
                </select>
              </div>

              {/* Brief & Artistic References */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Instructions & Références artistiques
                </label>
                <textarea
                  rows={3}
                  placeholder="Partagez vos liens de références (YouTube/Spotify), vos attentes sonores (brillant, spatial, chaud, basses percutantes...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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

              {/* Safety Badge */}
              <div
                style={{
                  background: isDarkMode ? 'rgba(0,102,255,0.1)' : '#EFF6FF',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#0066FF',
                  fontSize: '0.74rem',
                  fontWeight: 600
                }}
              >
                <ShieldCheck size={16} flexShrink={0} />
                Paiement sous séquestre sécurisé. Le prestataire n'est payé qu'après validation de votre commande.
              </div>

              {/* Order Button */}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  marginTop: '4px'
                }}
              >
                <Send size={16} /> Confirmer la Commande ({service.price})
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
