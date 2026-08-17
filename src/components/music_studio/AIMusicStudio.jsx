import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, GraduationCap, Calendar, Play, Pause, 
  DollarSign, Plus, TrendingUp, Sliders, Search, 
  ShieldCheck, CheckCircle, Disc, Headphones, Sparkles, Filter, ChevronRight, Music
} from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import SellWorkModal from '../services/SellWorkModal';
import OfferServiceModal from '../services/OfferServiceModal';
import PublishCourseModal from '../services/PublishCourseModal';
import CreateEventModal from '../services/CreateEventModal';
import BuyWorkModal from '../services/BuyWorkModal';
import OrderServiceModal from '../services/OrderServiceModal';
import CourseDetailsModal from '../services/CourseDetailsModal';
import EventTicketModal from '../services/EventTicketModal';

const INITIAL_WORKS = [
  {
    id: 'work_1',
    title: 'Pack Beat Afrobeat & Stems Master',
    author: 'David Producer',
    price: '150 €',
    genre: 'Afrobeat Pro',
    category: 'Beatmaking',
    type: 'Licence Exclusive + Stems',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'work_2',
    title: 'Composition Piano & Vocal Soul (Prêt à synchroniser)',
    author: 'Sarah Jenkins',
    price: '280 €',
    genre: 'RnB / Soul',
    category: 'Master',
    type: 'Synchro TV & Film',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'work_3',
    title: 'Amapiano Groove Master Sample Pack + MIDI',
    author: 'Marcus Vance',
    price: '95 €',
    genre: 'Amapiano',
    category: 'SamplePack',
    type: 'Sample Pack & Drum Kits',
    cover: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'work_4',
    title: 'Gospel Worship & Strings Live Arrangement',
    author: 'Grace Harmony',
    price: '190 €',
    genre: 'Gospel',
    category: 'Master',
    type: 'Licence Complète WAV + MP3',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
  }
];

const INITIAL_SERVICES = [
  {
    id: 'srv_1',
    title: 'Mixage Stéréo & Spécialisation Dolby Atmos',
    provider: 'Alex Rivera (Ingénieur Son Certifié)',
    price: '250 € / titre',
    delivery: 'Livraison 48h (3 Révisions incluses)',
    rating: '5.0 ⭐ (38 avis)',
    description: 'Mixage de haute précision avec calibration analogique et spatialisation Dolby Atmos pour plateformes Apple Music et Spotify.',
    icon: '🎚️'
  },
  {
    id: 'srv_2',
    title: 'Enregistrement Voix, Edit & Tuning Vocal Melodyne',
    provider: 'JABE PRODUCTION Studio',
    price: '180 € / session',
    delivery: 'Session Studio 4 heures',
    rating: '4.9 ⭐ (24 avis)',
    description: 'Enregistrement avec micros à lampes Neumann/Sony, correction de pitch chirurgicale et harmonisation vocale complète.',
    icon: '🎙️'
  },
  {
    id: 'srv_3',
    title: 'Mastering Analogique Haute Définition (DDP + Streaming)',
    provider: 'Mastering Lab Paris',
    price: '120 € / titre',
    delivery: 'Livraison 24h Express',
    rating: '5.0 ⭐ (62 avis)',
    description: 'Passage sur chaîne analogique Manley/SSL pour une présence, une clarté et un niveau sonore percutant aux normes commerciales.',
    icon: '🎧'
  }
];

const INITIAL_COURSES = [
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
];

const INITIAL_EVENTS = [
  {
    id: 'event_1',
    title: 'Session Live Listening & Pitch Pro prods devant Labels',
    organizer: 'JABE PRODUCTION & StageLink',
    date: 'Ce Vendredi à 20h00',
    price: 'Gratuit',
    type: 'Direct Stream HD',
    attendees: '86 réservations',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'event_2',
    title: 'Atelier Mixage Vocaux en Direct avec Questions & Réponses',
    organizer: 'Studio MasterClass Live',
    date: 'Dimanche à 18h00',
    price: '15 €',
    type: 'Webinar Interactif',
    attendees: '45 réservations',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
  }
];

export default function ProBusinessStudio({ onOpenPaywall, isDarkMode }) {
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('marketplace'); // 'marketplace' | 'services' | 'courses' | 'events'
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState(null);

  // Lists state with localStorage persistence
  const [worksList, setWorksList] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_services_works');
      return saved ? JSON.parse(saved) : INITIAL_WORKS;
    } catch {
      return INITIAL_WORKS;
    }
  });

  const [servicesList, setServicesList] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_services_list');
      return saved ? JSON.parse(saved) : INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [coursesList, setCoursesList] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_services_courses');
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [eventsList, setEventsList] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_services_events');
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stagelink_services_works', JSON.stringify(worksList));
    } catch (e) { console.error(e); }
  }, [worksList]);

  useEffect(() => {
    try {
      localStorage.setItem('stagelink_services_list', JSON.stringify(servicesList));
    } catch (e) { console.error(e); }
  }, [servicesList]);

  useEffect(() => {
    try {
      localStorage.setItem('stagelink_services_courses', JSON.stringify(coursesList));
    } catch (e) { console.error(e); }
  }, [coursesList]);

  useEffect(() => {
    try {
      localStorage.setItem('stagelink_services_events', JSON.stringify(eventsList));
    } catch (e) { console.error(e); }
  }, [eventsList]);

  // Modals state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isOfferServiceModalOpen, setIsOfferServiceModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Client Action Modals
  const [selectedWorkForBuy, setSelectedWorkForBuy] = useState(null);
  const [selectedServiceForOrder, setSelectedServiceForOrder] = useState(null);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState(null);
  const [selectedEventForTicket, setSelectedEventForTicket] = useState(null);

  const toggleAudioPlay = (id) => {
    if (playingId === id) {
      soundEngine?.stop?.();
      setPlayingId(null);
    } else {
      soundEngine?.playPopSound?.();
      soundEngine?.generateAndPlay?.(120, 'Afro-Gospel');
      setPlayingId(id);
    }
  };

  const handleWorkCreated = (newWork) => {
    setWorksList([newWork, ...worksList]);
  };

  const handleServiceCreated = (newSrv) => {
    setServicesList([newSrv, ...servicesList]);
  };

  const handleCourseCreated = (newCourse) => {
    setCoursesList([newCourse, ...coursesList]);
  };

  const handleEventCreated = (newEvent) => {
    setEventsList([newEvent, ...eventsList]);
  };

  // Filtered lists based on search query
  const q = searchQuery.toLowerCase().trim();

  const filteredWorks = worksList.filter(
    (w) => !q || w.title?.toLowerCase().includes(q) || w.genre?.toLowerCase().includes(q) || w.author?.toLowerCase().includes(q)
  );

  const filteredServices = servicesList.filter(
    (s) => !q || s.title?.toLowerCase().includes(q) || s.provider?.toLowerCase().includes(q) || s.delivery?.toLowerCase().includes(q)
  );

  const filteredCourses = coursesList.filter(
    (c) => !q || c.title?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q)
  );

  const filteredEvents = eventsList.filter(
    (e) => !q || e.title?.toLowerCase().includes(q) || e.organizer?.toLowerCase().includes(q) || e.date?.toLowerCase().includes(q)
  );

  return (
    <div style={{ padding: '14px 14px 85px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Hub Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #0B3A82 100%)',
          borderRadius: '24px',
          padding: '18px 18px',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 102, 255, 0.18)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                color: '#FFF',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.3px',
                boxShadow: '0 2px 8px rgba(0,102,255,0.4)'
              }}
            >
              SERVICES PRO & MARKETPLACE
            </span>
          </div>

          <span style={{ fontSize: '0.76rem', color: '#34D399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} /> 0% Commission
          </span>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
          Espace Vente, Prestations & Masterclasses
        </h2>
        <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 14px 0', lineHeight: 1.4 }}>
          Accédez librement aux prestations des professionnels, achetez des œuvres avec licences certifiées ou proposez vos propres services.
        </p>

        {/* Dashboard Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '8px 4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#38BDF8', display: 'block' }}>{worksList.length}</span>
            <span style={{ fontSize: '0.66rem', color: '#94A3B8', fontWeight: 600 }}>Œuvres & Beats</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '8px 4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#34D399', display: 'block' }}>{servicesList.length}</span>
            <span style={{ fontSize: '0.66rem', color: '#94A3B8', fontWeight: 600 }}>Prestations Studio</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '8px 4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#FBBF24', display: 'block' }}>{coursesList.length + eventsList.length}</span>
            <span style={{ fontSize: '0.66rem', color: '#94A3B8', fontWeight: 600 }}>Formations & Lives</span>
          </div>
        </div>
      </div>

      {/* 2. Subtabs Switcher */}
      <div
        style={{
          display: 'flex',
          background: isDarkMode ? '#1E293B' : '#FFFFFF',
          borderRadius: '18px',
          padding: '4px',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        {[
          { id: 'marketplace', label: "Œuvres & Beats", icon: <ShoppingBag size={14} /> },
          { id: 'services', label: 'Prestations', icon: <Sliders size={14} /> },
          { id: 'courses', label: 'Formations', icon: <GraduationCap size={14} /> },
          { id: 'events', label: 'Événements', icon: <Calendar size={14} /> }
        ].map((tab) => {
          const isSel = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine?.playPopSound?.();
                setActiveSubTab(tab.id);
              }}
              style={{
                flex: 1,
                padding: '9px 2px',
                borderRadius: '14px',
                border: 'none',
                background: isSel ? 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)' : 'transparent',
                color: isSel ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon} <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Filter Bar */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Search
          size={16}
          color="#94A3B8"
          style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
        />
        <input
          type="text"
          placeholder={
            activeSubTab === 'marketplace'
              ? 'Rechercher un beat, genre (Afrobeat, Gospel, Amapiano)...'
              : activeSubTab === 'services'
              ? 'Rechercher un service de mixage, mastering, studio...'
              : activeSubTab === 'courses'
              ? 'Rechercher une masterclass, formateur...'
              : 'Rechercher un événement live, showcase...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 14px 11px 38px',
            borderRadius: '16px',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
            background: isDarkMode ? '#1E293B' : '#FFFFFF',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            fontSize: '0.84rem',
            outline: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 800
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUBTAB 1: VENTE D'ŒUVRES & LICENCES                  */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'marketplace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsSellModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 102, 255, 0.28)'
            }}
          >
            <Plus size={18} /> Vendre une Œuvre / Beat / Sample Pack
          </button>

          {/* Works List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredWorks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: '0.86rem' }}>
                Aucune œuvre trouvée pour cette recherche.
              </div>
            ) : (
              filteredWorks.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    padding: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Cover & Audio Play Preview */}
                  <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                    <img
                      src={item.cover}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleAudioPlay(item.id)}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: playingId === item.id ? 'rgba(0,102,255,0.7)' : 'rgba(0,0,0,0.42)',
                        borderRadius: '16px',
                        border: 'none',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      title="Écouter la démo"
                    >
                      {playingId === item.id ? (
                        <Pause size={22} fill="#FFF" />
                      ) : (
                        <Play size={20} fill="#FFF" style={{ marginLeft: '2px' }} />
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#0066FF',
                          background: isDarkMode ? 'rgba(0,102,255,0.2)' : '#EFF6FF',
                          padding: '2px 8px',
                          borderRadius: '8px'
                        }}
                      >
                        {item.genre}
                      </span>
                      {playingId === item.id && (
                        <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 800, animation: 'pulse 1.5s infinite' }}>
                          ● Lecture démo
                        </span>
                      )}
                    </div>

                    <h4
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: isDarkMode ? '#F8FAFC' : '#0F172A',
                        margin: '0 0 2px 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.title}
                    </h4>

                    <p style={{ fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B', margin: 0 }}>
                      {item.type} • {item.author}
                    </p>
                  </div>

                  {/* Buy Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine?.playPopSound?.();
                      setSelectedWorkForBuy(item);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {item.price}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUBTAB 2: PRESTATIONS STUDIO & SERVICES PRO          */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsOfferServiceModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.28)'
            }}
          >
            <Plus size={18} /> Proposer un Service Studio / Prestation
          </button>

          {/* Services List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: '0.86rem' }}>
                Aucune prestation trouvée pour cette recherche.
              </div>
            ) : (
              filteredServices.map((srv) => (
                <div
                  key={srv.id}
                  style={{
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    padding: '14px 16px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>{srv.icon}</span>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: 0 }}>
                          {srv.title}
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: '#0066FF', fontWeight: 600 }}>
                          {srv.provider}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 900,
                        color: '#10B981',
                        background: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        flexShrink: 0
                      }}
                    >
                      {srv.price}
                    </span>
                  </div>

                  {srv.description && (
                    <p style={{ fontSize: '0.78rem', color: isDarkMode ? '#94A3B8' : '#64748B', lineHeight: 1.45, margin: 0 }}>
                      {srv.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                      ⏱️ {srv.delivery}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine?.playPopSound?.();
                        setSelectedServiceForOrder(srv);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Commander <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUBTAB 3: FORMATIONS & MASTERCLASSES                 */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsCourseModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 102, 255, 0.28)'
            }}
          >
            <Plus size={18} /> Publier une Nouvelle Formation
          </button>

          {/* Courses List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: '0.86rem' }}>
                Aucune formation trouvée pour cette recherche.
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => {
                    soundEngine?.playPopSound?.();
                    setSelectedCourseForDetails(course);
                  }}
                  style={{
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    padding: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <img
                    src={course.cover}
                    alt={course.title}
                    style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: isDarkMode ? '#F8FAFC' : '#0F172A',
                          margin: '0 0 2px 0',
                          lineHeight: 1.3
                        }}
                      >
                        {course.title}
                      </h4>
                      <span style={{ fontSize: '0.74rem', color: '#0066FF', fontWeight: 700 }}>
                        {course.instructor}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {course.duration}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#10B981' }}>
                        {course.price}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUBTAB 4: ÉVÉNEMENTS & WORKSHOPS                     */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsEventModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 102, 255, 0.28)'
            }}
          >
            <Plus size={18} /> Organiser un Événement Pro / Live
          </button>

          {/* Events List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: '0.86rem' }}>
                Aucun événement trouvé pour cette recherche.
              </div>
            ) : (
              filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    soundEngine?.playPopSound?.();
                    setSelectedEventForTicket(ev);
                  }}
                  style={{
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    padding: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <img
                    src={ev.cover}
                    alt={ev.title}
                    style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#D97706',
                          background: isDarkMode ? 'rgba(217,119,6,0.18)' : '#FEF3C7',
                          padding: '2px 8px',
                          borderRadius: '8px'
                        }}
                      >
                        {ev.date}
                      </span>
                      <h4
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: isDarkMode ? '#F8FAFC' : '#0F172A',
                          margin: '3px 0 0 0',
                          lineHeight: 1.3
                        }}
                      >
                        {ev.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {ev.attendees}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0066FF' }}>
                        {ev.price}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CREATION MODALS                                      */}
      {/* ---------------------------------------------------- */}
      <SellWorkModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onWorkCreated={handleWorkCreated}
        isDarkMode={isDarkMode}
      />

      <OfferServiceModal
        isOpen={isOfferServiceModalOpen}
        onClose={() => setIsOfferServiceModalOpen(false)}
        onServiceCreated={handleServiceCreated}
        isDarkMode={isDarkMode}
      />

      <PublishCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onCourseCreated={handleCourseCreated}
        isDarkMode={isDarkMode}
      />

      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onEventCreated={handleEventCreated}
        isDarkMode={isDarkMode}
      />

      {/* ---------------------------------------------------- */}
      {/* CLIENT INTERACTION & PURCHASE MODALS                 */}
      {/* ---------------------------------------------------- */}
      <BuyWorkModal
        isOpen={!!selectedWorkForBuy}
        work={selectedWorkForBuy}
        onClose={() => setSelectedWorkForBuy(null)}
        isDarkMode={isDarkMode}
      />

      <OrderServiceModal
        isOpen={!!selectedServiceForOrder}
        service={selectedServiceForOrder}
        onClose={() => setSelectedServiceForOrder(null)}
        isDarkMode={isDarkMode}
      />

      <CourseDetailsModal
        isOpen={!!selectedCourseForDetails}
        course={selectedCourseForDetails}
        onClose={() => setSelectedCourseForDetails(null)}
        isDarkMode={isDarkMode}
      />

      <EventTicketModal
        isOpen={!!selectedEventForTicket}
        event={selectedEventForTicket}
        onClose={() => setSelectedEventForTicket(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
