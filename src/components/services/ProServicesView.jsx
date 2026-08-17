import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, GraduationCap, Calendar, Play, Pause, 
  DollarSign, Plus, TrendingUp, Sliders, Search, 
  Share2, MessageSquare, ChevronRight, Music, User,
  CheckCircle, Shield, Clock, Award, Layers, Volume2
} from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import SellWorkModal from './SellWorkModal';
import OfferServiceModal from './OfferServiceModal';
import PublishCourseModal from './PublishCourseModal';
import CreateEventModal from './CreateEventModal';
import BuyWorkModal from './BuyWorkModal';
import OrderServiceModal from './OrderServiceModal';
import CourseDetailsModal from './CourseDetailsModal';
import EventTicketModal from './EventTicketModal';

export default function ProServicesView({ onShareToFeed, onStartChat, onOpenProfile, isDarkMode }) {
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('marketplace'); // 'marketplace' | 'services' | 'courses' | 'events'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Tous');
  const [playingId, setPlayingId] = useState(null);

  // Clean Virgin state: only retain authentic items created by real users
  const sanitizeList = (key, prefix) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Eliminate any legacy mock items
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

  // Reset selected category filter when switching subtabs
  useEffect(() => {
    setSelectedTag('Tous');
  }, [activeSubTab]);

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

  // Filtered lists based on search query & active tag
  const q = searchQuery.toLowerCase().trim();

  const filteredWorks = worksList.filter((w) => {
    const matchesSearch = !q || w.title?.toLowerCase().includes(q) || w.genre?.toLowerCase().includes(q) || w.author?.toLowerCase().includes(q);
    const matchesTag = selectedTag === 'Tous' || w.genre === selectedTag;
    return matchesSearch && matchesTag;
  });

  const filteredServices = servicesList.filter((s) => {
    const matchesSearch = !q || s.title?.toLowerCase().includes(q) || s.provider?.toLowerCase().includes(q) || s.delivery?.toLowerCase().includes(q);
    const matchesTag = selectedTag === 'Tous' || s.category === selectedTag || (s.title && s.title.toLowerCase().includes(selectedTag.toLowerCase()));
    return matchesSearch && matchesTag;
  });

  const filteredCourses = coursesList.filter((c) => {
    const matchesSearch = !q || c.title?.toLowerCase().includes(c) || c.instructor?.toLowerCase().includes(q);
    const matchesTag = selectedTag === 'Tous' || c.level === selectedTag;
    return matchesSearch && matchesTag;
  });

  const filteredEvents = eventsList.filter((e) => {
    const matchesSearch = !q || e.title?.toLowerCase().includes(q) || e.organizer?.toLowerCase().includes(q) || e.date?.toLowerCase().includes(q);
    const matchesTag = selectedTag === 'Tous' || e.type === selectedTag;
    return matchesSearch && matchesTag;
  });

  // Tag categories for quick filtering
  const tagsMap = {
    marketplace: ['Tous', 'Afrobeat', 'Trap', 'Gospel', 'Amapiano', 'R&B / Soul', 'Drill', 'Pop'],
    services: ['Tous', 'Mixage & Mastering', 'Enregistrement', 'Arrangements', 'Direction Artistique'],
    courses: ['Tous', 'Débutant', 'Intermédiaire', 'Avancé', 'Masterclass Pro'],
    events: ['Tous', 'Concerts', 'Showcases', 'Workshops', 'Listening Parties']
  };

  return (
    <div style={{ padding: '14px 14px 85px 14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* ==================================================== */}
      {/* 1. HERO BANNER - ULTRA PREMIUM PRO HUB               */}
      {/* ==================================================== */}
      <div
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0B132B 0%, #1C2541 60%, #0047FF 100%)' 
            : 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0066FF 100%)',
          borderRadius: '26px',
          padding: '22px 20px',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 16px 36px rgba(0, 102, 255, 0.22)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow accent sphere */}
        <div 
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 102, 255, 0.45) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                color: '#FFF',
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.5px',
                boxShadow: '0 4px 12px rgba(0,102,255,0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Award size={13} /> ESPACE SERVICES PRO
            </span>
          </div>

          <span 
            style={{ 
              fontSize: '0.76rem', 
              color: '#34D399', 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: 'rgba(52, 211, 153, 0.12)',
              padding: '3px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(52, 211, 153, 0.25)'
            }}
          >
            <TrendingUp size={13} /> 0% Commission
          </span>
        </div>

        <h2 style={{ fontSize: '1.28rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.4px', lineHeight: 1.25 }}>
          Hub des Prestations, Ventes & Formations
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#CBD5E1', margin: '0 0 16px 0', lineHeight: 1.45 }}>
          Mettez en vente vos œuvres, proposez vos prestations studio professionnelles, animez des masterclasses et développez votre activité musicale en direct.
        </p>

        {/* Dynamic Activity Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
          <div 
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              borderRadius: '16px', 
              padding: '10px 6px', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)' 
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38BDF8', display: 'block' }}>
              {worksList.length}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>Œuvres & Beats</span>
          </div>

          <div 
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              borderRadius: '16px', 
              padding: '10px 6px', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)' 
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34D399', display: 'block' }}>
              {servicesList.length}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>Prestations Studio</span>
          </div>

          <div 
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              borderRadius: '16px', 
              padding: '10px 6px', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)' 
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FBBF24', display: 'block' }}>
              {coursesList.length + eventsList.length}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>Formations & Lives</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. SUBTABS SEGMENTED SELECTOR                        */}
      {/* ==================================================== */}
      <div
        style={{
          display: 'flex',
          background: isDarkMode ? '#1E293B' : '#FFFFFF',
          borderRadius: '20px',
          padding: '5px',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          boxShadow: isDarkMode ? '0 4px 15px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.04)',
          gap: '4px'
        }}
      >
        {[
          { id: 'marketplace', label: "Œuvres", fullLabel: "Œuvres & Beats", icon: <ShoppingBag size={15} />, count: worksList.length },
          { id: 'services', label: 'Prestations', fullLabel: "Prestations Studio", icon: <Sliders size={15} />, count: servicesList.length },
          { id: 'courses', label: 'Formations', fullLabel: "Formations", icon: <GraduationCap size={15} />, count: coursesList.length },
          { id: 'events', label: 'Événements', fullLabel: "Événements", icon: <Calendar size={15} />, count: eventsList.length }
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
                padding: '10px 4px',
                borderRadius: '16px',
                border: 'none',
                background: isSel 
                  ? 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)' 
                  : 'transparent',
                color: isSel ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B',
                fontWeight: isSel ? 800 : 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSel ? '0 4px 12px rgba(0, 102, 255, 0.35)' : 'none'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    background: isSel ? 'rgba(255,255,255,0.25)' : isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                    color: isSel ? '#FFFFFF' : isDarkMode ? '#CBD5E1' : '#475569',
                    fontWeight: 800
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* 3. SEARCH & QUICK CATEGORY CHIPS                     */}
      {/* ==================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={17}
            color="#94A3B8"
            style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder={
              activeSubTab === 'marketplace'
                ? 'Rechercher un beat, un artiste, une prod...'
                : activeSubTab === 'services'
                ? 'Rechercher mixage, mastering, enregistrement...'
                : activeSubTab === 'courses'
                ? 'Rechercher une masterclass, un formateur...'
                : 'Rechercher un live, concert, workshop...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 40px',
              borderRadius: '18px',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
              background: isDarkMode ? '#1E293B' : '#FFFFFF',
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
              fontSize: '0.85rem',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'border-color 0.2s ease'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                background: isDarkMode ? '#334155' : '#E2E8F0',
                border: 'none',
                color: isDarkMode ? '#CBD5E1' : '#64748B',
                cursor: 'pointer',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 800
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        {tagsMap[activeSubTab] && (
          <div 
            style={{ 
              display: 'flex', 
              gap: '6px', 
              overflowX: 'auto', 
              paddingBottom: '2px',
              scrollbarWidth: 'none'
            }}
          >
            {tagsMap[activeSubTab].map((tag) => {
              const isTagSel = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    soundEngine?.playPopSound?.();
                    setSelectedTag(tag);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '12px',
                    border: isTagSel 
                      ? 'none' 
                      : isDarkMode 
                      ? '1px solid rgba(255,255,255,0.08)' 
                      : '1px solid #E2E8F0',
                    background: isTagSel 
                      ? 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)' 
                      : isDarkMode 
                      ? '#1E293B' 
                      : '#FFFFFF',
                    color: isTagSel ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B',
                    fontSize: '0.72rem',
                    fontWeight: isTagSel ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isTagSel ? '0 2px 8px rgba(0,102,255,0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 4. CONTENT SECTIONS BY SUBTAB                        */}
      {/* ==================================================== */}

      {/* ---------------------------------------------------- */}
      {/* SUBTAB 1: VENTE D'ŒUVRES & LICENCES                  */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'marketplace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsSellModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '20px',
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
              boxShadow: '0 8px 22px rgba(0, 102, 255, 0.32)'
            }}
          >
            <Plus size={19} /> Mettre en vente une Œuvre / Beat
          </button>

          {/* Works List / Clean Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredWorks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '42px 20px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '24px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(0,102,255,0.18)' : '#EFF6FF',
                    color: '#0066FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    boxShadow: '0 4px 12px rgba(0,102,255,0.2)'
                  }}
                >
                  <Music size={30} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 6px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Aucune œuvre en vente pour le moment
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '340px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  Soyez le premier à mettre en vente vos compositions, beats ou packs audio et faites-vous découvrir par toute la communauté d'artistes !
                </p>
                <button
                  onClick={() => setIsSellModalOpen(true)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,102,255,0.3)'
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
                    borderRadius: '22px',
                    padding: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: isDarkMode ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Cover & Audio Play Preview */}
                    <div style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
                      <img
                        src={item.cover}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleAudioPlay(item)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: playingId === item.id ? 'rgba(0,102,255,0.75)' : 'rgba(0,0,0,0.45)',
                          borderRadius: '18px',
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
                          <Pause size={24} fill="#FFF" />
                        ) : (
                          <Play size={22} fill="#FFF" style={{ marginLeft: '2px' }} />
                        )}
                      </button>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
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
                          <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Volume2 size={12} /> Démo en cours
                          </span>
                        )}
                      </div>

                      <h4
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: isDarkMode ? '#F8FAFC' : '#0F172A',
                          margin: '0 0 3px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.title}
                      </h4>

                      <p style={{ fontSize: '0.76rem', color: isDarkMode ? '#94A3B8' : '#64748B', margin: 0 }}>
                        {item.type} • <strong style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>{item.author}</strong>
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
                        borderRadius: '16px',
                        padding: '9px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
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
                      paddingTop: '8px',
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
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Share2 size={14} /> Partager dans le Feed
                    </button>

                    <button
                      type="button"
                      onClick={() => handleContactAuthor({ id: item.userId, name: item.author, avatar: item.authorAvatar }, `Œuvre : ${item.title}`)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDarkMode ? '#94A3B8' : '#64748B',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <MessageSquare size={14} /> Contacter l'artiste
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsOfferServiceModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '20px',
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
              boxShadow: '0 8px 22px rgba(16, 185, 129, 0.32)'
            }}
          >
            <Plus size={19} /> Proposer une Prestation Studio
          </button>

          {/* Services List / Clean Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredServices.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '42px 20px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '24px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(16,185,129,0.18)' : '#ECFDF5',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <Sliders size={30} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 6px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Aucune prestation studio disponible
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '340px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  Proposez vos compétences professionnelles en mixage, mastering, enregistrement ou direction artistique et recevez vos premières commandes !
                </p>
                <button
                  onClick={() => setIsOfferServiceModalOpen(true)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
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
                    borderRadius: '22px',
                    padding: '16px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: isDarkMode ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '14px',
                          background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem'
                        }}
                      >
                        {srv.icon || '🎚️'}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: 0 }}>
                          {srv.title}
                        </h4>
                        <span style={{ fontSize: '0.76rem', color: '#0066FF', fontWeight: 700 }}>
                          {srv.provider}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        color: '#10B981',
                        background: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                        padding: '5px 12px',
                        borderRadius: '14px',
                        flexShrink: 0
                      }}
                    >
                      {srv.price}
                    </span>
                  </div>

                  {srv.description && (
                    <p style={{ fontSize: '0.8rem', color: isDarkMode ? '#94A3B8' : '#64748B', lineHeight: 1.5, margin: 0 }}>
                      {srv.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.76rem', color: isDarkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {srv.delivery}
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleShareItemToFeed(srv, 'service')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '12px',
                          border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                          background: 'transparent',
                          color: '#0066FF',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Share2 size={13} /> Feed
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine?.playPopSound?.();
                          setSelectedServiceForOrder(srv);
                        }}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 4px 10px rgba(0, 102, 255, 0.25)'
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsCourseModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '20px',
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
              boxShadow: '0 8px 22px rgba(0, 102, 255, 0.32)'
            }}
          >
            <Plus size={19} /> Publier une Nouvelle Formation
          </button>

          {/* Courses List / Clean Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredCourses.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '42px 20px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '24px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(0,102,255,0.18)' : '#EFF6FF',
                    color: '#0066FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    boxShadow: '0 4px 12px rgba(0,102,255,0.2)'
                  }}
                >
                  <GraduationCap size={30} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 6px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Aucune formation publiée actuellement
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '340px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  Transmettez votre expertise musicale en créant une masterclass vidéo ou un atelier thématique pour les talents de la plateforme !
                </p>
                <button
                  onClick={() => setIsCourseModalOpen(true)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,102,255,0.3)'
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
                    borderRadius: '22px',
                    padding: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: isDarkMode ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.04)'
                  }}
                >
                  <div
                    onClick={() => {
                      soundEngine?.playPopSound?.();
                      setSelectedCourseForDetails(course);
                    }}
                    style={{ display: 'flex', gap: '14px', cursor: 'pointer' }}
                  >
                    <img
                      src={course.cover}
                      alt={course.title}
                      style={{ width: '84px', height: '84px', borderRadius: '18px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            color: isDarkMode ? '#F8FAFC' : '#0F172A',
                            margin: '0 0 3px 0',
                            lineHeight: 1.3
                          }}
                        >
                          {course.title}
                        </h4>
                        <span style={{ fontSize: '0.76rem', color: '#0066FF', fontWeight: 700 }}>
                          {course.instructor}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          {course.duration}
                        </span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#10B981' }}>
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
                      paddingTop: '8px',
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
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Share2 size={14} /> Partager dans le Feed
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
                        fontSize: '0.76rem',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              soundEngine?.playPopSound?.();
              setIsEventModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '20px',
              border: 'none',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(245, 158, 11, 0.32)'
            }}
          >
            <Plus size={19} /> Organiser un Événement Pro / Live
          </button>

          {/* Events List / Clean Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredEvents.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '42px 20px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '24px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(245,158,11,0.18)' : '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <Calendar size={30} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 6px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Aucun événement planifié
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '340px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  Organisez une session d'écoute live, un showcase ou un atelier interactif pour rassembler les musiciens et le public !
                </p>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
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
                    borderRadius: '22px',
                    padding: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: isDarkMode ? '0 4px 18px rgba(0,0,0,0.25)' : '0 4px 16px rgba(0,0,0,0.04)'
                  }}
                >
                  <div
                    onClick={() => {
                      soundEngine?.playPopSound?.();
                      setSelectedEventForTicket(ev);
                    }}
                    style={{ display: 'flex', gap: '14px', cursor: 'pointer' }}
                  >
                    <img
                      src={ev.cover}
                      alt={ev.title}
                      style={{ width: '84px', height: '84px', borderRadius: '18px', objectFit: 'cover', flexShrink: 0 }}
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
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            color: isDarkMode ? '#F8FAFC' : '#0F172A',
                            margin: '4px 0 0 0',
                            lineHeight: 1.3
                          }}
                        >
                          {ev.title}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          {ev.attendees}
                        </span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0066FF' }}>
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
                      paddingTop: '8px',
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
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Share2 size={14} /> Partager dans le Feed
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
                        fontSize: '0.76rem',
                        fontWeight: 900,
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

      {/* ==================================================== */}
      {/* CREATION MODALS                                      */}
      {/* ==================================================== */}
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

      {/* ==================================================== */}
      {/* CLIENT INTERACTION & PURCHASE MODALS                 */}
      {/* ==================================================== */}
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
