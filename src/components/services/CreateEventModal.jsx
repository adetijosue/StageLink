import React, { useState, useRef } from 'react';
import { X, Calendar, DollarSign, MapPin, Radio, Users, Image } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompressor';

export default function CreateEventModal({ isOpen, onClose, onEventCreated, isDarkMode }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [price, setPrice] = useState('0');
  const [eventType, setEventType] = useState('Direct Stream HD'); // 'Direct Stream HD' | 'Présentiel Studio' | 'Showcase'
  const [location, setLocation] = useState('En ligne (StageLink Live Stream)');
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
    if (!title.trim()) return;

    soundEngine?.playPopSound?.();

    const formattedDate = date ? `${date} à ${time}` : `Ce soir à ${time}`;
    const formattedPrice = price === '0' || !price ? 'Gratuit' : `${price} €`;

    const newEvent = {
      id: `event_${Date.now()}`,
      userId: currentUser?.id,
      title: title.trim(),
      organizer: currentUser?.name || 'Organisateur StageLink',
      organizerAvatar: currentUser?.avatar || '',
      date: formattedDate,
      price: formattedPrice,
      priceNum: parseFloat(price) || 0,
      type: eventType,
      location,
      description: description.trim(),
      attendees: '1er inscrit',
      cover: coverImage || currentUser?.avatar || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    onEventCreated(newEvent, shareToFeed);
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
              <Calendar size={20} color="#F59E0B" /> Organiser un Événement
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Créez des sessions live listening, masterclasses ou concerts
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
            {/* Title */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '6px' }}>
                Nom de l'Événement / Session *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Live Listening & Pitch Beats devant les Labels"
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

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Heure
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>

            {/* Type & Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Format
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
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
                  <option value="Direct Stream HD">Direct Stream HD</option>
                  <option value="Webinar Interactif">Webinar Interactif</option>
                  <option value="Présentiel Studio">Présentiel Studio</option>
                  <option value="Concert / Showcase">Concert / Showcase</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                  Billet (€ ou 0 = Gratuit)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
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
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Description & Déroulement
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Présentez les intervenants, le lien de diffusion ou les modalités d'accès..."
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

            {/* Cover Upload */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '4px' }}>
                Affiche / Visuel de l'Événement
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
                    <img src={coverImage} alt="Event" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>Affiche sélectionnée (Cliquer pour changer)</span>
                  </div>
                ) : (
                  <>
                    <Image size={20} color="#F59E0B" />
                    <span style={{ fontSize: '0.78rem', color: isDarkMode ? '#CBD5E1' : '#64748B' }}>
                      Ajouter une affiche / photo
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
              background: isDarkMode ? 'rgba(245,158,11,0.12)' : '#FEF3C7',
              padding: '10px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              border: '1px solid rgba(245,158,11,0.25)'
            }}>
              <input
                type="checkbox"
                checked={shareToFeed}
                onChange={(e) => setShareToFeed(e.target.checked)}
                style={{ accentColor: '#D97706', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706' }}>
                📢 Partager automatiquement dans le fil d'actualité (Feed)
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!title.trim()}
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                padding: '14px',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
                marginTop: '4px'
              }}
            >
              🚀 Publier l'Événement
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
