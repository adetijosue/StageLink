import React from 'react';
import { X, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function CommunityCharterPopup({ isOpen, onClose }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: '420px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderRadius: '28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px',
          borderBottom: '1px solid #F1F5F9',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={20} color="#D97706" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {isEn ? 'Community Guidelines' : 'Charte StageLink'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748B" /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#FFFBEB', padding: '15px', borderRadius: '16px', border: '1px solid #FDE68A' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#B45309', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> Règle 1 - Respect</h4>
              <p style={{ fontSize: '0.8rem', margin: 0, color: '#92400E' }}>La bienveillance est obligatoire entre artistes.</p>
            </div>
            <div style={{ background: '#FEF2F2', padding: '15px', borderRadius: '16px', border: '1px solid #FCA5A5' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991B1B', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={16} /> Règle 2 - Anti-Plagiat</h4>
              <p style={{ fontSize: '0.8rem', margin: 0, color: '#991B1B' }}>Ne publiez que des œuvres dont vous êtes l'auteur.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: '25px',
              padding: '14px',
              borderRadius: '16px',
              background: '#0066FF',
              color: '#FFF',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            J'accepte la charte
          </button>
        </div>
      </div>
    </div>
  );
}
