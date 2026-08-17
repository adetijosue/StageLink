import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, GraduationCap, Calendar, Play, Pause, 
  DollarSign, Plus, TrendingUp, Sliders, Search, 
  Share2, MessageSquare, ChevronRight, Music, Sparkles, User
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

export default function ProBusinessStudio({ onShareToFeed, onStartChat, onOpenProfile, isDarkMode }) {
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('marketplace'); // 'marketplace' | 'services' | 'courses' | 'events'
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState(null);

  // Clean Virgin state: only retain authentic items created by real users
  const sanitizeList = (key, prefix) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Eliminate any legacy mock items (like 'w1', 'w2', 's1', 'c1', 'e1')
      const authentic = parsed.filter(
        item => item && item.id && String(item.id).startsWith(prefix) && item.createdAt
      );
      return authentic;
    } catch {
      return [];
    }
  };

  const [worksList, setWorksList] = useState(() => sanitizeList('stagelink_services_works', 'work_'));
  const [servicesList, setServicesList] = useState(() => sanitizeList('stagelink_services_list', 'service_'));
  const [coursesList, setCoursesList] = useState(() => sanitizeList('stagelink_services_courses', 'course_'));
  const [eventsList, setEventsList] = useState(() => sanitizeList('stagelink_services_events', 'event_'));

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

  const toggleAudioPlay = (item) => {
    if (playingId === item.id) {
      soundEngine?.stop?.();
      setPlayingId(null);
    } else {
      soundEngine?.playPopSound?.();
      if (item.audioUrl) {
        const audio = new Audio(item.audioUrl);
        audio.play().catch(() => soundEngine?.generateAndPlay?.(120, 'Afro-Gospel'));
        audio.onended = () => setPlayingId(null);
      } else {
        soundEngine?.generateAndPlay?.(120, 'Afro-Gospel');
      }
      setPlayingId(item.id);
    }
  };

  const handleWorkCreated = (newWork, shareFeed) => {
    const updated = [newWork, ...worksList];
    setWorksList(updated);
    if (shareFeed && onShareToFeed) {
      onShareToFeed({
        ...newWork,
        proType: 'work',
        shareText: `🎵 Nouvelle œuvre disponible : "${newWork.title}" (${newWork.genre}) à ${newWork.price}. Licence : ${newWork.type}`
      });
    }
  };

  const handleServiceCreated = (newSrv, shareFeed) => {
    const updated = [newSrv, ...servicesList];
    setServicesList(updated);
    if (shareFeed && onShareToFeed) {
      onShareToFeed({
        ...newSrv,
        proType: 'service',
        shareText: `🎚️ Nouvelle prestation studio disponible : "${newSrv.title}" (${newSrv.price}). Délai : ${newSrv.delivery}`
      });
    }
  };

  const handleCourseCreated = (newCourse, shareFeed) => {
    const updated = [newCourse, ...coursesList];
    setCoursesList(updated);
    if (shareFeed && onShareToFeed) {
      onShareToFeed({
        ...newCourse,
        proType: 'course',
        shareText: `🎓 Nouvelle masterclass disponible : "${newCourse.title}" (${newCourse.duration}) à ${newCourse.price}.`
      });
    }
  };

  const handleEventCreated = (newEvent, shareFeed) => {
    const updated = [newEvent, ...eventsList];
    setEventsList(updated);
    if (shareFeed && onShareToFeed) {
      onShareToFeed({
        ...newEvent,
        proType: 'event',
        shareText: `🎟️ Nouvel événement musical : "${newEvent.title}" (${newEvent.date}) - Format : ${newEvent.type} (${newEvent.price}).`
      });
    }
  };

  const handleShareItemToFeed = (item, type) => {
    soundEngine?.playPopSound?.();
    if (onShareToFeed) {
      let defaultText = '';
      if (type === 'work') defaultText = `🎵 Découvrez mon œuvre "${item.title}" (${item.genre}) disponible à ${item.price} sur StageLink !`;
      else if (type === 'service') defaultText = `🎚️ Prestation Studio disponible : "${item.title}" (${item.price}) par ${item.provider}.`;
      else if (type === 'course') defaultText = `🎓 Masterclass disponible : "${item.title}" (${item.price}) dispensée par ${item.instructor}.`;
      else if (type === 'event') defaultText = `🎟️ Rejoignez l'événement "${item.title}" le ${item.date} !`;

      onShareToFeed({
        ...item,
        proType: type,
        shareText: defaultText
      });
    }
  };

  const handleContactAuthor = (targetUser, subject) => {
    soundEngine?.playPopSound?.();
    if (onStartChat) {
      onStartChat(targetUser, subject);
    }
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

        <h2 style={{ fontSize: '1.22rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
          Hub des Prestations, Ventes & Formations
        </h2>
        <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 14px 0', lineHeight: 1.4 }}>
          Publiez librement vos services réels, vendez vos prods, ou commandez auprès des membres et partagez vos offres directement dans le feed.
        </p>

        {/* Real Dynamic Stats */}
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

          {/* Works List / Clean Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredWorks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '20px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(0,102,255,0.15)' : '#EFF6FF',
                    color: '#0066FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}
                >
                  <Music size={26} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Aucune œuvre en vente pour le moment
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: '320px', margin: '0 auto 14px auto', lineHeight: 1.4 }}>
                  Soyez le premier à mettre en vente vos beats, compositions ou sample packs et faites-vous découvrir par les artistes !
                </p>
                <button
                  onClick={() => setIsSellModalOpen(true)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  + Déposer ma première œuvre
                </button>
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
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Cover & Audio Play Preview */}
                    <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                      <img
                        src={item.cover}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleAudioPlay(item)}
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
                          <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 800 }}>
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

                  {/* Actions bar: Share to Feed & Contact Author */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleShareItemToFeed(item, 'work')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0066FF',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Share2 size={13} /> Partager dans le Feed
                    </button>

                    <button
                      type="button"
                      onClick={() => handleContactAuthor({ id: item.userId, name: item.author, avatar: item.authorAvatar }, `Œuvre : ${item.title}`)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDarkMode ? '#94A3B8' : '#64748B',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MessageSquare size={13} /> Contacter l'artiste
                    </button>
                  </div>
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

          {/* Services List / Clean Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredServices.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '20px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}
                >
                  <Sliders size={26} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Aucune prestation studio disponible
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: '320px', margin: '0 auto 14px auto', lineHeight: 1.4 }}>
                  Proposez vos compétences en mixage, mastering, enregistrement ou direction artistique et recevez des commandes !
                </p>
                <button
                  onClick={() => setIsOfferServiceModalOpen(true)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  + Proposer mon premier service
                </button>
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
                      <span style={{ fontSize: '1.3rem' }}>{srv.icon || '🎚️'}</span>
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

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleShareItemToFeed(srv, 'service')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '10px',
                          border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                          background: 'transparent',
                          color: '#0066FF',
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Share2 size={12} /> Feed
                      </button>

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

          {/* Courses List / Clean Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCourses.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '20px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(0,102,255,0.15)' : '#EFF6FF',
                    color: '#0066FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}
                >
                  <GraduationCap size={26} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Aucune formation publiée actuellement
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: '320px', margin: '0 auto 14px auto', lineHeight: 1.4 }}>
                  Transmettez votre expérience musicale en créant une masterclass vidéo ou un atelier pour la communauté !
                </p>
                <button
                  onClick={() => setIsCourseModalOpen(true)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  + Créer ma première formation
                </button>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    padding: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div
                    onClick={() => {
                      soundEngine?.playPopSound?.();
                      setSelectedCourseForDetails(course);
                    }}
                    style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}
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

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleShareItemToFeed(course, 'course')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0066FF',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Share2 size={13} /> Partager dans le Feed
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine?.playPopSound?.();
                        setSelectedCourseForDetails(course);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#10B981',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Voir le programme →
                    </button>
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
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(245, 158, 11, 0.28)'
            }}
          >
            <Plus size={18} /> Organiser un Événement Pro / Live
          </button>

          {/* Events List / Clean Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredEvents.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '20px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}
                >
                  <Calendar size={26} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 6px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Aucun événement planifié
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: '320px', margin: '0 auto 14px auto', lineHeight: 1.4 }}>
                  Planifiez une session d'écoute live, un showcase ou un webinaire interactif pour rassembler les musiciens !
                </p>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  + Créer mon premier événement
                </button>
              </div>
            ) : (
              filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    padding: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div
                    onClick={() => {
                      soundEngine?.playPopSound?.();
                      setSelectedEventForTicket(ev);
                    }}
                    style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}
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

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleShareItemToFeed(ev, 'event')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#D97706',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Share2 size={13} /> Partager dans le Feed
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine?.playPopSound?.();
                        setSelectedEventForTicket(ev);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0066FF',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Réserver mon Billet →
                    </button>
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
