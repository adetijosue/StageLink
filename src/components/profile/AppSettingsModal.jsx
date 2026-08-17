import React, { useState } from 'react';
import { X, Settings, User, Bell, Moon, Sun, Globe, ShieldCheck, FileText, HelpCircle, ChevronRight, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { soundEngine } from '../../services/audioService';
import CGUPage from '../legal/CGUPage';
import PrivacyPage from '../legal/PrivacyPage';
import CommunityCharterPopup from '../legal/CommunityCharterPopup';
import DeleteAccountModal from './DeleteAccountModal';

/**
 * AppSettingsModal - Ergonomic Bottom Sheet Version
 */
export default function AppSettingsModal({ isOpen, onClose, onOpenEditProfile, isDarkMode, onToggleDarkMode }) {
  const { logout } = useAuth();
  const { language, deviceLanguage, isAuto, changeLanguage, t } = useLanguage();

  const [activeView, setActiveModal] = useState(null); // 'cgu' | 'privacy' | 'charter'
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }} onClick={onClose}>

        <div
          className="animate-slide-up"
          style={{
            width: '100%', maxWidth: '500px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            background: isDarkMode ? '#0F172A' : '#FFFFFF',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bottom Sheet Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px 0' }}>
            <div style={{ width: '40px', height: '5px', background: isDarkMode ? '#1E293B' : '#E2E8F0', borderRadius: '3px' }} />
          </div>

          {/* Header */}
          <div style={{
            padding: '12px 20px 16px 20px',
            borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Settings size={20} color="#0066FF" /> {t('settings_title')}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '50%', width: '38px', height: '38px',
                minWidth: '38px', minHeight: '38px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
              }}
              title={t('btn_close')}
            >
              <X size={20} color="#EF4444" />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px 20px' }}>

            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('account_section')}</span>
              <button
                onClick={() => { onClose(); onOpenEditProfile(); }}
                style={{ width: '100%', marginTop: '10px', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', background: isDarkMode ? '#1E293B' : '#F8FAFC', display: 'flex', justifyContent: 'space-between', color: 'inherit', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={18} color="#0066FF" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t('edit_profile')}</span>
                </div>
                <ChevronRight size={16} color="#94A3B8" />
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('appearance_theme')}</span>
              <div
                onClick={() => { soundEngine.playPopSound(); onToggleDarkMode(); }}
                style={{ marginTop: '10px', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', background: isDarkMode ? '#1E293B' : '#F8FAFC' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isDarkMode ? <Moon size={18} color="#F59E0B" /> : <Sun size={18} color="#0066FF" />}
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{isDarkMode ? t('theme_dark') : t('theme_light')}</span>
                </div>
                <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: isDarkMode ? '#0066FF' : '#CBD5E1', position: 'relative', transition: 'all 0.3s' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FFF', position: 'absolute', top: 2, left: isDarkMode ? 22 : 2, transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Globe size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  {t('desired_language')}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B', background: isDarkMode ? '#1E293B' : '#F1F5F9', padding: '2px 8px', borderRadius: '8px' }}>
                  {deviceLanguage === 'en' ? 'Appareil: EN 🇬🇧' : 'Appareil: FR 🇫🇷'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
                <button
                  onClick={() => { soundEngine.playPopSound(); changeLanguage('auto', true); }}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '14px',
                    border: isAuto ? '2px solid #0066FF' : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0'),
                    background: isAuto ? (isDarkMode ? 'rgba(0,102,255,0.15)' : '#EFF6FF') : (isDarkMode ? '#1E293B' : '#FFFFFF'),
                    color: isAuto ? '#0066FF' : 'inherit',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px'
                  }}
                  title={t('language_auto_desc')}
                >
                  <span>⚡ Auto</span>
                  <span style={{ fontSize: '0.64rem', opacity: 0.8 }}>({deviceLanguage.toUpperCase()})</span>
                </button>

                <button
                  onClick={() => { soundEngine.playPopSound(); changeLanguage('fr'); }}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '14px',
                    border: !isAuto && language === 'fr' ? '2px solid #0066FF' : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0'),
                    background: !isAuto && language === 'fr' ? (isDarkMode ? 'rgba(0,102,255,0.15)' : '#EFF6FF') : (isDarkMode ? '#1E293B' : '#FFFFFF'),
                    color: !isAuto && language === 'fr' ? '#0066FF' : 'inherit',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px'
                  }}
                >
                  <span>Français</span>
                  <span style={{ fontSize: '0.68rem' }}>🇫🇷</span>
                </button>

                <button
                  onClick={() => { soundEngine.playPopSound(); changeLanguage('en'); }}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '14px',
                    border: !isAuto && language === 'en' ? '2px solid #0066FF' : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0'),
                    background: !isAuto && language === 'en' ? (isDarkMode ? 'rgba(0,102,255,0.15)' : '#EFF6FF') : (isDarkMode ? '#1E293B' : '#FFFFFF'),
                    color: !isAuto && language === 'en' ? '#0066FF' : 'inherit',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px'
                  }}
                >
                  <span>English</span>
                  <span style={{ fontSize: '0.68rem' }}>🇬🇧</span>
                </button>
              </div>

              <p style={{ fontSize: '0.68rem', color: isDarkMode ? '#94A3B8' : '#64748B', margin: '6px 0 0 2px' }}>
                {isAuto ? `✨ ${t('language_auto_desc')}` : (language === 'en' ? '🔒 Fixed to English' : '🔒 Fixé en Français')}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('legal_section')}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => setActiveModal('cgu')} style={{ padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'transparent', display: 'flex', justifyContent: 'space-between', color: 'inherit', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={18} color="#0066FF" /> {t('cgu')}</span>
                  <ChevronRight size={16} color="#94A3B8" />
                </button>
                <button onClick={() => setActiveModal('privacy')} style={{ padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'transparent', display: 'flex', justifyContent: 'space-between', color: 'inherit', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck size={18} color="#10B981" /> {t('privacy')}</span>
                  <ChevronRight size={16} color="#94A3B8" />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={logout} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#FEF2F2', color: '#EF4444', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogOut size={20} /> {t('logout')}
              </button>

              <button
                onClick={() => { soundEngine.playPopSound(); setShowDeleteModal(true); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: '14px',
                  border: '1px dashed #FCA5A5', background: 'transparent',
                  color: '#EF4444', fontWeight: 700, fontSize: '0.8rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Trash2 size={16} /> {t('danger_zone')}
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', marginTop: '20px', fontWeight: 600 }}>{t('powered_by')}</p>
          </div>
        </div>
      </div>

      {/* Sub-modals maintained outside to prevent z-index issues */}
      <CGUPage isOpen={activeView === 'cgu'} onClose={() => setActiveModal(null)} />
      <PrivacyPage isOpen={activeView === 'privacy'} onClose={() => setActiveModal(null)} />
      <CommunityCharterPopup isOpen={activeView === 'charter'} onClose={() => setActiveModal(null)} />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
