import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { ArrowRight, Check, Sparkles, MapPin, Music, Upload, SkipForward, Globe, X } from 'lucide-react';
import { COUNTRIES_AND_CITIES } from '../../services/locationData';
import confetti from 'canvas-confetti';

export default function OnboardingWizard({ isOpen, onClose }) {
  const { currentUser, updateUserProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef(null);

  // Form States
  const [bio, setBio] = useState(currentUser?.bio || 'Passionné de musique et de co-création sur StageLink.');
  const [selectedCountryObj, setSelectedCountryObj] = useState(COUNTRIES_AND_CITIES[0]); // France default
  const [selectedCity, setSelectedCity] = useState(COUNTRIES_AND_CITIES[0].cities[0]); // Paris default
  const [customCity, setCustomCity] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [selectedGenres, setSelectedGenres] = useState(['Afrobeat', 'Synthwave']);

  if (!isOpen || !currentUser) return null;

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'
  ];

  const availableGenres = [
    'Afrobeat', 'Gospel', 'Synthwave', 'RnB / Soul', 'Hip-Hop / Rap',
    'Jazz Fusion', 'Pop', 'Electronic', 'Rock', 'Amapiano'
  ];

  const handleCountryChange = (countryName) => {
    const found = COUNTRIES_AND_CITIES.find((c) => c.country === countryName);
    if (found) {
      setSelectedCountryObj(found);
      setSelectedCity(found.cities[0] || '');
      setCustomCity('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleFinish = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 }
    });

    const finalLocation = `${customCity || selectedCity}, ${selectedCountryObj.country}`;

    updateUserProfile({
      bio,
      location: finalLocation,
      avatar: selectedAvatar,
      genres: selectedGenres,
      isNewRegistration: false
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 130,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
      paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
      paddingLeft: '16px',
      paddingRight: '16px'
    }} onClick={onClose}>
      <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '420px',
        padding: '28px 24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Step Progress Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Logo size="small" variant="horizontal" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              Ignorer <SkipForward size={14} />
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#EF4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Fermer"
            >
              <X size={16} color="#EF4444" />
            </button>
          </div>
        </div>

        {/* Progress Bar Dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: currentStep >= step ? 'linear-gradient(135deg, #0066FF, #00C6FF)' : '#E2E8F0',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* STEP 1: Avatar & Bio */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Votre Photo d'Artiste 🎉
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                Importez votre propre photo ou choisissez un avatar.
              </p>
            </div>

            {/* Custom Upload Button + Preview */}
            <div style={{ textAlign: 'center', margin: '4px 0' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={selectedAvatar}
                  alt="Avatar Selected"
                  style={{
                    width: '94px',
                    height: '94px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #0066FF',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.25)',
                    margin: '0 auto 12px auto'
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '-4px',
                    background: '#0066FF',
                    color: '#FFF',
                    border: '2px solid #FFF',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0, 102, 255, 0.3)'
                  }}
                >
                  <Upload size={16} />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                {sampleAvatars.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Choice"
                    onClick={() => setSelectedAvatar(img)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: selectedAvatar === img ? '2px solid #0066FF' : '2px solid #E2E8F0',
                      transform: selectedAvatar === img ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Bio Input */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Présentation / Bio Artistique</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Décrivez votre style musical, vos projets ou ce que vous recherchez..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '16px' }}
            >
              Étape suivante <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: Country & City Selector */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Choisissez votre Pays & Ville 📍
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                Sélectionnez votre pays et votre ville dans les listes ci-dessous.
              </p>
            </div>

            {/* Country Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Pays</label>
              <div style={{ position: 'relative' }}>
                <Globe size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <select
                  value={selectedCountryObj.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '14px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                >
                  {COUNTRIES_AND_CITIES.map((c) => (
                    <option key={c.code} value={c.country}>
                      {c.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* City Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>Ville Principale</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <select
                  value={selectedCity}
                  onChange={(e) => { setSelectedCity(e.target.value); setCustomCity(''); }}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '14px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                >
                  {selectedCountryObj.cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom City fallback option */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94A3B8', marginBottom: '4px', display: 'block' }}>Autre ville (si non répertoriée)</label>
              <input
                type="text"
                placeholder="Entrez votre ville manuellement..."
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setCurrentStep(1)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '16px',
                  border: '1px solid #CBD5E1',
                  background: '#FFF',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Retour
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="btn-primary"
                style={{ flex: 2, padding: '12px', borderRadius: '16px' }}
              >
                Suivant <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Music Genres */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Styles & Genres Préférés 🎵
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                Calibrez vos suggestions de Match IA.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
              {availableGenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: isSelected ? '2px solid #0066FF' : '1px solid #CBD5E1',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      color: isSelected ? '#0066FF' : '#475569',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                    {genre}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleFinish}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0066FF, #00C6FF)',
                marginTop: '10px'
              }}
            >
              Terminer & Explorer StageLink <Sparkles size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
