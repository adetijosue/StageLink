import React, { useState } from 'react';
import { X, CheckCircle, Download, ShieldCheck, FileAudio, FileText } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

export default function BuyWorkModal({ isOpen, onClose, work, onPurchaseComplete, isDarkMode }) {
  const { t, language } = useLanguage();
  const [selectedLicense, setSelectedLicense] = useState('non_exclusive');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !work) return null;

  const basePriceNum = parseInt(work.price?.replace(/[^0-9]/g, '') || '100', 10);
  const exclusivePrice = basePriceNum * 2;

  const handlePurchase = (e) => {
    e.preventDefault();
    soundEngine?.playPopSound?.();
    setIsSuccess(true);
    setTimeout(() => {
      if (onPurchaseComplete) {
        onPurchaseComplete({
          work,
          license: selectedLicense,
          price: selectedLicense === 'exclusive' ? `${exclusivePrice} €` : work.price
        });
      }
    }, 1200);
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
              <FileAudio size={20} color="#0066FF" /> {language === 'en' ? 'Acquire this Work' : 'Acquérir cette Œuvre'}
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0 0' }}>
              {language === 'en' ? 'Official commercial license & instant download' : 'Licence commerciale officielle & téléchargement instantané'}
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
            <div style={{ textAlign: 'center', padding: '24px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={36} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  {language === 'en' ? 'Purchase Confirmed!' : 'Acquisition Confirmée !'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5, margin: '6px 0 0 0' }}>
                  {language === 'en' ? `You now hold the commercial usage rights for ${work.title}.` : `Vous détenez désormais les droits d'exploitation commerciale pour ${work.title}.`}
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine?.playPopSound?.();
                    alert(language === 'en' ? `Download initiated for: ${work.title} (WAV 24-bit + Stems ZIP + Contract PDF)` : `Téléchargement lancé pour : ${work.title} (WAV 24-bit + Stems ZIP + Contrat PDF)`);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0, 102, 255, 0.3)'
                  }}
                >
                  <Download size={16} /> {language === 'en' ? 'Download HD Files + Stems (.ZIP)' : 'Télécharger Fichiers HD + Stems (.ZIP)'}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '14px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                    background: 'transparent',
                    color: isDarkMode ? '#94A3B8' : '#64748B',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('modal_close')}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Work Preview Card */}
              <div
                style={{
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderRadius: '18px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
                }}
              >
                <img
                  src={work.cover}
                  alt={work.title}
                  style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0066FF' }}>
                    {work.genre}
                  </span>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '2px 0', color: isDarkMode ? '#FFFFFF' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {work.title}
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: '#64748B', margin: 0 }}>
                    {language === 'en' ? 'By' : 'Par'} {work.author}
                  </p>
                </div>
              </div>

              {/* License Option Selector */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#CBD5E1' : '#475569', display: 'block', marginBottom: '8px' }}>
                  {language === 'en' ? 'Choose License Type' : 'Choisissez votre Type de Licence'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Non-Exclusive */}
                  <div
                    onClick={() => setSelectedLicense('non_exclusive')}
                    style={{
                      padding: '12px',
                      borderRadius: '16px',
                      border: selectedLicense === 'non_exclusive' ? '2px solid #0066FF' : isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                      background: selectedLicense === 'non_exclusive' ? (isDarkMode ? 'rgba(0,102,255,0.15)' : '#EFF6FF') : isDarkMode ? '#1E293B' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A', display: 'block' }}>
                        {language === 'en' ? 'Standard License (WAV + MP3)' : 'Licence Standard (WAV + MP3)'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {language === 'en' ? 'Spotify streaming, YouTube videos, up to 500,000 streams' : 'Streaming Spotify, clips YouTube, jusqu\'à 500 000 écoutes'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0066FF', flexShrink: 0 }}>
                      {work.price}
                    </span>
                  </div>

                  {/* Exclusive + Stems */}
                  <div
                    onClick={() => setSelectedLicense('exclusive')}
                    style={{
                      padding: '12px',
                      borderRadius: '16px',
                      border: selectedLicense === 'exclusive' ? '2px solid #10B981' : isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                      background: selectedLicense === 'exclusive' ? (isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5') : isDarkMode ? '#1E293B' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A', display: 'block' }}>
                        {language === 'en' ? 'Exclusive License + Separate Stems' : 'Licence Exclusive + Stems Séparés'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {language === 'en' ? 'Unlimited rights + separate multitrack stems + full buyout' : 'Droits illimités + pistes multipistes séparées + cession totale'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#10B981', flexShrink: 0 }}>
                      {exclusivePrice} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div
                style={{
                  background: isDarkMode ? 'rgba(0,102,255,0.08)' : '#EFF6FF',
                  borderRadius: '14px',
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
                {language === 'en' ? 'Copyright assignment contract automatically generated and digitally signed.' : 'Contrat de cession de droits d\'auteur généré automatiquement et signé numériquement.'}
              </div>

              {/* Purchase Button */}
              <button
                type="button"
                onClick={handlePurchase}
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
                  marginTop: '4px'
                }}
              >
                <Download size={16} /> {language === 'en' ? `Buy & Download (${selectedLicense === 'exclusive' ? `${exclusivePrice} €` : work.price})` : `Acheter & Télécharger (${selectedLicense === 'exclusive' ? `${exclusivePrice} €` : work.price})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
