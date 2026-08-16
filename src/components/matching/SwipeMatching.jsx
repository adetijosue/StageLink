import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Star, Check, Sparkles, MapPin, Calendar, DollarSign, Briefcase } from 'lucide-react';
import Logo from '../common/Logo';

const SwipeMatching = React.memo(function SwipeMatching({ matches, onApplyMatch }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchSuccess, setShowMatchSuccess] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);

  const filteredMatches = (matches || []).filter(card => {
    if (activeFilter === 'Applied') {
      return appliedIds.includes(card.id);
    }
    if (activeFilter === 'Recommended') {
      return (card.matchPercentage || 90) >= 90;
    }
    return true;
  });

  const currentCard = filteredMatches[currentIndex] || filteredMatches[0];

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleAction = (type) => {
    if (!currentCard) return;

    if (type === 'apply' || type === 'like') {
      triggerConfetti();
      setShowMatchSuccess(currentCard);
      if (currentCard.id && !appliedIds.includes(currentCard.id)) {
        setAppliedIds(prev => [...prev, currentCard.id]);
      }
      if (onApplyMatch) onApplyMatch(currentCard);
    }

    // Move to next card
    if (currentIndex < filteredMatches.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back
    }
  };

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Tabs matching mockup 1 screen 2 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #E2E8F0'
      }}>
        {['All', 'Recommended', 'Applied'].map((filter) => {
          const isSel = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '12px',
                border: 'none',
                background: isSel ? '#0066FF' : 'transparent',
                color: isSel ? '#FFFFFF' : '#64748B',
                fontWeight: isSel ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Main Swipe Card Stack */}
      {currentCard ? (
        <div style={{ position: 'relative', minHeight: '460px' }}>
          <div className="card animate-fade-in" style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: '24px',
            boxShadow: '0 12px 32px rgba(0, 102, 255, 0.12)',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF'
          }}>
            {/* Banner Image with Match Percentage Badge */}
            <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
              <img
                src={currentCard.image}
                alt={currentCard.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'linear-gradient(135deg, #0066FF, #00C6FF)',
                color: '#FFFFFF',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4)'
              }}>
                <Sparkles size={14} /> {currentCard.matchPercentage}% Compatibilité
              </div>
            </div>

            {/* Card Info Body */}
            <div style={{ padding: '16px 20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                {currentCard.title}
              </h3>
              {currentCard.company && (
                <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '12px' }}>
                  {currentCard.company}
                </p>
              )}

              {/* Location & Deadline metadata */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px', fontSize: '0.8rem', color: '#475569' }}>
                {currentCard.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} color="#0066FF" /> {currentCard.location}
                  </span>
                )}
                {currentCard.deadline && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} color="#0066FF" /> {currentCard.deadline}
                  </span>
                )}
                {currentCard.rate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DollarSign size={14} color="#10B981" /> {currentCard.rate}
                  </span>
                )}
              </div>

              {/* Summary / Description */}
              {(currentCard.summary || currentCard.description) && (
                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4, marginBottom: '14px' }}>
                  {currentCard.summary || currentCard.description}
                </p>
              )}

              {/* Skills Tags Pills */}
              {Array.isArray(currentCard.skills) && currentCard.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {currentCard.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#EFF6FF',
                        color: '#0066FF',
                        borderRadius: '12px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid #BFDBFE'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Category badge for dynamic cards without skills */}
              {(!Array.isArray(currentCard.skills) || currentCard.skills.length === 0) && currentCard.category && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  <span style={{
                    background: '#EFF6FF',
                    color: '#0066FF',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid #BFDBFE'
                  }}>
                    {currentCard.category}
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar matching mockups: Dislike (Red X), Super Like (Amber Star), Direct Apply (#0066FF) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '12px 20px',
              borderTop: '1px solid #F1F5F9',
              background: '#F8FAFC'
            }}>
              {/* Dislike button */}
              <button
                onClick={() => handleAction('dislike')}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '2px solid #FCA5A5',
                  background: '#FEF2F2',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
                }}
              >
                <X size={24} strokeWidth={2.5} />
              </button>

              {/* Super Like button */}
              <button
                onClick={() => handleAction('superlike')}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: '2px solid #FDE68A',
                  background: '#FFFBEB',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                }}
              >
                <Star size={22} fill="#F59E0B" />
              </button>

              {/* Direct Apply / Connect button */}
              <button
                onClick={() => handleAction('apply')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #0066FF, #0044CC)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(0, 102, 255, 0.35)'
                }}
              >
                <Check size={20} strokeWidth={3} /> Postuler / Match
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFF', borderRadius: '20px' }}>
          <Logo size="medium" variant="vertical" />
          <p style={{ marginTop: '14px', color: '#64748B', fontSize: '0.9rem' }}>
            Vous avez parcouru toutes les suggestions de Match IA actuelles !
          </p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="btn-primary"
            style={{ marginTop: '16px' }}
          >
            Recharger les opportunités
          </button>
        </div>
      )}

      {/* Match Success Modal */}
      {showMatchSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="animate-fade-in" style={{
            background: '#FFFFFF',
            borderRadius: '28px',
            padding: '28px 24px',
            textAlign: 'center',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0066FF, #00C6FF)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(0, 102, 255, 0.4)'
            }}>
              <Sparkles size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              C'est un Match ! 🎉
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '20px' }}>
              Votre candidature pour <strong>{showMatchSuccess.title}</strong> a été transmise directement aux recruteurs.
            </p>

            <button
              onClick={() => setShowMatchSuccess(null)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              Continuer l'exploration
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default SwipeMatching;
