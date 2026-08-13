import React, { useState } from 'react';
import { ShoppingBag, GraduationCap, Calendar, Play, Pause, DollarSign, Plus, Crown, Sparkles, TrendingUp, Sliders } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import SellWorkModal from '../services/SellWorkModal';
import PublishCourseModal from '../services/PublishCourseModal';
import CreateEventModal from '../services/CreateEventModal';

export default function ProBusinessStudio({ onOpenPaywall, isDarkMode }) {
  const { currentUser } = useAuth();
  const isVip = currentUser?.badgeType === 'gold';

  const [activeSubTab, setActiveSubTab] = useState('marketplace'); // 'marketplace' | 'services' | 'courses' | 'events'
  const [playingId, setPlayingId] = useState(null);

  // Dedicated Action Modals State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Sample Published Works & Services Lists
  const [worksList, setWorksList] = useState([
    {
      id: 'work_1',
      title: 'Pack Beat Afrobeat & Stems Master',
      author: 'David Producer',
      price: '150 €',
      genre: 'Afrobeat Pro',
      type: 'Licence Exclusive + Stems',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'work_2',
      title: 'Composition Piano & Vocal Soul (Prêt à synchroniser)',
      author: 'Sarah Jenkins',
      price: '280 €',
      genre: 'RnB / Soul',
      type: 'Synchro TV & Film',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'work_3',
      title: 'Amapiano Groove Master Sample Pack + MIDI',
      author: 'Marcus Vance',
      price: '95 €',
      genre: 'Amapiano',
      type: 'Sample Pack & Drum Kits',
      cover: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80'
    }
  ]);

  const [servicesList, setServicesList] = useState([
    {
      id: 'srv_1',
      title: 'Mixage Stéréo & Spécialisation Dolby Atmos',
      provider: 'Alex Rivera (Ingénieur Son Certifié)',
      price: '250 € / titre',
      delivery: 'Livraison 48h (3 Révisions incluses)',
      rating: '5.0 ⭐ (38 avis)',
      icon: '🎚️'
    },
    {
      id: 'srv_2',
      title: 'Enregistrement Voix, Edit & Tuning Vocal Melodyne',
      provider: 'JABE PRODUCTION Studio',
      price: '180 € / session',
      delivery: 'Session Studio 4 heures',
      rating: '4.9 ⭐ (24 avis)',
      icon: '🎙️'
    }
  ]);

  const [coursesList, setCoursesList] = useState([
    {
      id: 'course_1',
      title: 'Masterclass : Mixing & Mastering Pro sur FL Studio & Logic',
      instructor: 'Alex Rivera (Ingénieur Son Certifié)',
      price: '49 €',
      duration: '4h 30min (12 Modules HD)',
      enrolled: '142 membres inscrits',
      rating: '4.9 ⭐',
      cover: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'course_2',
      title: 'Business Musical : Droits d\'Auteur, Édition & Vente de Prods',
      instructor: 'JABE PRODUCTION Academy',
      price: '79 €',
      duration: '6h (Certificat de fin d\'étude)',
      enrolled: '280 membres inscrits',
      rating: '5.0 ⭐',
      cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80'
    }
  ]);

  const [eventsList, setEventsList] = useState([
    {
      id: 'event_1',
      title: 'Session Live Listening & Pitch Pro prods devant Labels',
      organizer: 'JABE PRODUCTION & StageLink',
      date: 'Ce Vendredi à 20h00',
      price: 'Gratuit pour VIP Pro',
      type: 'Direct Stream HD',
      attendees: '86 réservations',
      cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80'
    }
  ]);

  const handleWorkCreated = (newWork) => {
    setWorksList([newWork, ...worksList]);
  };

  const toggleAudioPlay = (id) => {
    if (playingId === id) {
      soundEngine.stop();
      setPlayingId(null);
    } else {
      soundEngine.generateAndPlay(120, 'Afro-Gospel');
      setPlayingId(id);
    }
  };

  // ----------------------------------------------------
  // CASE 1: STANDARD USERS (Non-VIP) -> PRO CTA UPGRADE PAGE
  // ----------------------------------------------------
  if (!isVip) {
    return (
      <div style={{ padding: '16px 16px 85px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Modern Hero CTA Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #002B80 100%)',
          borderRadius: '26px',
          padding: '24px 20px',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0, 102, 255, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#FBBF24',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.74rem',
            fontWeight: 800,
            marginBottom: '12px'
          }}>
            <Crown size={14} /> EXCLUSIVITÉ MEMBRES PRO VIP
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.3, margin: '0 0 8px 0' }}>
            Services Pro & Distribution d'Œuvres Musicales
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 20px 0' }}>
            Mettez à disposition vos maquettes, beats, mixages et masterings en direct auprès de milliers d'artistes et labels sur StageLink.
          </p>

          <button
            onClick={() => {
              soundEngine.playPopSound();
              if (onOpenPaywall) onOpenPaywall();
            }}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
            }}
          >
            <Crown size={18} /> PASSER MEMBRE PRO VIP - DÉBLOQUER LES SERVICES
          </button>
        </div>

        {/* Value Proposition Cards Grid */}
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#0066FF" /> Ce que débloque l'Abonnement Pro :
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {[
            {
              icon: <ShoppingBag size={22} color="#0066FF" />,
              bg: '#EFF6FF',
              title: 'Mise à Disposition des Œuvres & Licences',
              desc: 'Proposez vos beats, sample packs et masters avec licences exclusives ou non-exclusives.'
            },
            {
              icon: <Sliders size={22} color="#10B981" />,
              bg: '#ECFDF5',
              title: 'Boutique de Prestations Studio',
              desc: 'Vendez vos services de Mixage, Mastering Dolby Atmos et arrangements avec devis en ligne.'
            },
            {
              icon: <GraduationCap size={22} color="#8B5CF6" />,
              bg: '#F5F3FF',
              title: 'Publication de Formations & Masterclasses',
              desc: 'Formez la communauté, distribuez vos cours vidéo et délivrez vos certificats.'
            },
            {
              icon: <DollarSign size={22} color="#F59E0B" />,
              bg: '#FFFBEB',
              title: '0% de Commission sur vos Revenus',
              desc: 'Conservez 100% du fruit de vos ventes et prestations directement sur votre compte bancaire.'
            }
          ].map((feat, idx) => (
            <div key={idx} style={{
              background: isDarkMode ? '#1E293B' : '#FFFFFF',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '16px',
                background: isDarkMode ? 'rgba(0,102,255,0.15)' : feat.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {feat.icon}
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: '0 0 4px 0' }}>
                  {feat.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: isDarkMode ? '#94A3B8' : '#64748B', lineHeight: 1.45, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Button */}
        <button
          onClick={() => {
            soundEngine.playPopSound();
            if (onOpenPaywall) onOpenPaywall();
          }}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '18px',
            border: 'none',
            background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0, 102, 255, 0.3)'
          }}
        >
          <Crown size={18} /> Rejoindre la Communauté Pro VIP
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 2: PREMIUM / VIP PRO USERS -> FULL PRO HUB
  // ----------------------------------------------------
  return (
    <div style={{ padding: '16px 16px 85px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Pro Financial & Business Dashboard Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '24px',
        padding: '18px 20px',
        color: '#FFFFFF',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFF', padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>
              VIP PRO CERTIFIÉ
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Espace Vente & Distribution</span>
          </div>

          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} /> 0% Commission
          </span>
        </div>

        {/* Dashboard Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '10px 6px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FBBF24', display: 'block' }}>1,450 €</span>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>Revenus Générés</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '10px 6px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38BDF8', display: 'block' }}>{worksList.length}</span>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>Œuvres Publiées</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '10px 6px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981', display: 'block' }}>5.0 ⭐</span>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>Note Pro Client</span>
          </div>
        </div>
      </div>

      {/* Studio Header Subtabs Switcher */}
      <div style={{
        display: 'flex',
        background: isDarkMode ? '#1E293B' : '#FFFFFF',
        borderRadius: '18px',
        padding: '4px',
        border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {[
          { id: 'marketplace', label: 'Vente d\'Œuvres', icon: <ShoppingBag size={14} /> },
          { id: 'services', label: 'Prestations', icon: <Sliders size={14} /> },
          { id: 'courses', label: 'Formations', icon: <GraduationCap size={14} /> },
          { id: 'events', label: 'Événements', icon: <Calendar size={14} /> }
        ].map((tab) => {
          const isSel = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 2px',
                borderRadius: '14px',
                border: 'none',
                background: isSel ? '#0066FF' : 'transparent',
                color: isSel ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: VENTE D'ŒUVRES & LICENCES */}
      {activeSubTab === 'marketplace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setIsSellModalOpen(true)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 102, 255, 0.3)'
            }}
          >
            <Plus size={18} /> Mettre à disposition une Nouvelle Œuvre / Beat
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {worksList.map((item) => (
              <div
                key={item.id}
                style={{
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '14px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                  <img
                    src={item.cover}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => toggleAudioPlay(item.id)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.45)',
                      borderRadius: '16px',
                      border: 'none',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {playingId === item.id ? <Pause size={20} fill="#FFF" /> : <Play size={20} fill="#FFF" style={{ marginLeft: '2px' }} />}
                  </button>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0066FF', background: isDarkMode ? 'rgba(0,102,255,0.2)' : '#EFF6FF', padding: '2px 8px', borderRadius: '8px' }}>
                    {item.genre}
                  </span>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: '4px 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94A3B8' : '#64748B', margin: 0 }}>
                    {item.type}
                  </p>
                </div>

                <button
                  style={{
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {item.price}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: PRESTATIONS STUDIO */}
      {activeSubTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setIsSellModalOpen(true)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={18} /> Proposer un Service Studio / Prestation
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {servicesList.map((srv) => (
              <div
                key={srv.id}
                style={{
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '16px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.2rem' }}>{srv.icon}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10B981', background: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5', padding: '4px 10px', borderRadius: '12px' }}>
                    {srv.price}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: 0 }}>
                  {srv.title}
                </h4>
                <div style={{ fontSize: '0.76rem', color: isDarkMode ? '#94A3B8' : '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{srv.delivery}</span>
                  <span style={{ fontWeight: 700, color: '#F59E0B' }}>{srv.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: FORMATIONS */}
      {activeSubTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setIsCourseModalOpen(true)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Publier une Nouvelle Formation
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {coursesList.map((course) => (
              <div key={course.id} style={{ background: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: '20px', padding: '14px', border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', display: 'flex', gap: '12px' }}>
                <img src={course.cover} alt={course.title} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: '0 0 4px 0' }}>{course.title}</h4>
                  <span style={{ fontSize: '0.74rem', color: '#0066FF', fontWeight: 700, display: 'block' }}>{course.instructor}</span>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>{course.duration} • {course.enrolled}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: ÉVÉNEMENTS */}
      {activeSubTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setIsEventModalOpen(true)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Organiser un Événement Pro / Live
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {eventsList.map((ev) => (
              <div key={ev.id} style={{ background: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: '20px', padding: '14px', border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', display: 'flex', gap: '12px' }}>
                <img src={ev.cover} alt={ev.title} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '8px' }}>{ev.date}</span>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: '4px 0 2px 0' }}>{ev.title}</h4>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>{ev.attendees}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEDICATED MODALS */}
      <SellWorkModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onWorkCreated={handleWorkCreated}
        isDarkMode={isDarkMode}
      />

      <PublishCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onCoursePublished={(c) => setCoursesList([c, ...coursesList])}
        isDarkMode={isDarkMode}
      />

      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onEventCreated={(e) => setEventsList([e, ...eventsList])}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
