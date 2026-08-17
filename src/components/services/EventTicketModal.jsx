import React, { useState } from 'react';
import { X, Calendar, Ticket, CheckCircle, Video, Users, Clock, Share2 } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

export default function EventTicketModal({ isOpen, onClose, event, onBookTicket, isDarkMode }) {
  const { t, language } = useLanguage();
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen || !event) return null;

  const handleBook = () => {
    soundEngine?.playPopSound?.();
    setIsBooked(true);
    if (onBookTicket) onBookTicket(event);
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
        {/* Cover Header */}
        <div style={{ position: 'relative', height: '160px', flexShrink: 0 }}>
          <img
            src={event.cover}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 60%)' }} />

          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FBBF24', background: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '8px' }}>
              {event.date}
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0 0', lineHeight: 1.3 }}>
              {event.title}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 18px 24px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0066FF' }}>
              {language === 'en' ? 'Hosted by' : 'Organisé par'} {event.organizer}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>
              {event.price}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ background: isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} color="#0066FF" />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>{language === 'en' ? 'Format' : 'Format'}</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#FFF' : '#0F172A' }}>{event.type || 'Live Stream HD'}</span>
              </div>
            </div>

            <div style={{ background: isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#10B981" />
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>{language === 'en' ? 'Attendees' : 'Participants'}</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#FFF' : '#0F172A' }}>{event.attendees || (language === 'en' ? '86 attendees' : '86 participants')}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', marginBottom: '6px' }}>
              {language === 'en' ? 'About this session:' : 'À propos de la session :'}
            </h4>
            <p style={{ fontSize: '0.8rem', color: isDarkMode ? '#94A3B8' : '#64748B', lineHeight: 1.5, margin: 0 }}>
              {language === 'en' ? 'Join this exclusive live session to network with industry pros, pitch your latest productions and receive personalized live feedback.' : 'Participez à cette session live exclusive pour échanger avec des professionnels de l\'industrie, faire écouter vos dernières productions et obtenir des retours personnalisés en direct.'}
            </p>
          </div>

          {isBooked ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
              <CheckCircle size={28} color="#10B981" style={{ margin: '0 auto 6px auto' }} />
              <span style={{ color: '#065F46', fontWeight: 800, fontSize: '0.88rem', display: 'block' }}>
                {language === 'en' ? 'Digital Ticket Confirmed!' : 'Billet Numérique Confirmé !'}
              </span>
              <span style={{ color: '#047857', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                {language === 'en' ? `Pass ID: SL-${Math.floor(100000 + Math.random() * 900000)} • Live link active 15 min prior` : `Pass ID: SL-${Math.floor(100000 + Math.random() * 900000)} • Lien du live actif 15 min avant`}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEngine?.playPopSound?.();
                  alert(`Lien du Live Studio : https://live.stagelink.pro/session/${event.id}`);
                }}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {language === 'en' ? 'Access Live Stream' : 'Accéder au Live Stream'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleBook}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
                marginTop: '6px'
              }}
            >
              <Ticket size={18} /> {language === 'en' ? `Book my Ticket (${event.price})` : `Réserver mon Billet (${event.price})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
