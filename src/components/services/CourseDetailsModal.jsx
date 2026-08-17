import React, { useState } from 'react';
import { X, GraduationCap, CheckCircle, Play, BookOpen, Clock, Award } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

export default function CourseDetailsModal({ isOpen, onClose, course, onEnroll, isDarkMode }) {
  const { t, language } = useLanguage();
  const [isEnrolled, setIsEnrolled] = useState(false);

  if (!isOpen || !course) return null;

  const handleEnroll = () => {
    soundEngine?.playPopSound?.();
    setIsEnrolled(true);
    if (onEnroll) onEnroll(course);
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
        {/* Cover Image Banner */}
        <div style={{ position: 'relative', height: '160px', flexShrink: 0 }}>
          <img
            src={course.cover}
            alt={course.title}
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
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.2)', padding: '2px 8px', borderRadius: '8px' }}>
              Masterclass HD
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0 0', lineHeight: 1.3 }}>
              {course.title}
            </h3>
          </div>
        </div>

        {/* Content Body */}
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
          {/* Metadata Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0066FF' }}>
              {language === 'en' ? 'By' : 'Par'} {course.instructor}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>
              {course.price}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: '12px', padding: '8px 4px' }}>
              <Clock size={16} color="#0066FF" style={{ margin: '0 auto 2px auto' }} />
              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>{language === 'en' ? 'Duration' : 'Durée'}</span>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#FFF' : '#0F172A' }}>{course.duration || (language === 'en' ? '4h 30m' : '4h 30m')}</span>
            </div>
            <div style={{ background: isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: '12px', padding: '8px 4px' }}>
              <BookOpen size={16} color="#10B981" style={{ margin: '0 auto 2px auto' }} />
              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>{language === 'en' ? 'Curriculum' : 'Programme'}</span>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#FFF' : '#0F172A' }}>{language === 'en' ? '12 Modules' : '12 Modules'}</span>
            </div>
            <div style={{ background: isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: '12px', padding: '8px 4px' }}>
              <Award size={16} color="#F59E0B" style={{ margin: '0 auto 2px auto' }} />
              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>{language === 'en' ? 'Certificate' : 'Certificat'}</span>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: isDarkMode ? '#FFF' : '#0F172A' }}>{language === 'en' ? 'Included' : 'Inclus'}</span>
            </div>
          </div>

          {/* Course Modules List */}
          <div>
            <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', marginBottom: '8px' }}>
              {language === 'en' ? 'What you will learn:' : 'Ce que vous allez apprendre :'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(language === 'en' ? [
                'Mix setup & bus grouping/calibration',
                'Surgical EQ and dynamic vocal processing',
                'Stereo imaging, pro reverbs & 3D soundstage placement',
                'Final mastering optimized for streaming services (LUFS)'
              ] : [
                'Configuration du mixage & calibration des bus',
                'Égalisation chirurgicale et traitement dynamique des voix',
                'Spatialisation stéréo, réverbes pro et placement 3D',
                'Mastering final adapté aux plateformes de streaming (LUFS)'
              ]).map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                  <CheckCircle size={14} color="#10B981" flexShrink={0} />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {isEnrolled ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '16px', padding: '14px', textAlign: 'center' }}>
              <span style={{ color: '#065F46', fontWeight: 800, fontSize: '0.88rem', display: 'block', marginBottom: '6px' }}>
                {language === 'en' ? '🎉 Enrollment Confirmed!' : '🎉 Inscription Validée !'}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEngine?.playPopSound?.();
                  alert(language === 'en' ? `Launching video player for Module 1 of: ${course.title}` : `Lancement du lecteur vidéo pour le Module 1 de : ${course.title}`);
                  onClose();
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Play size={15} fill="#FFF" /> {language === 'en' ? 'Start Masterclass' : 'Démarrer la Masterclass'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEnroll}
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
              <GraduationCap size={18} /> {language === 'en' ? `Enroll in Masterclass (${course.price})` : `S'inscrire à la Masterclass (${course.price})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
