import React from 'react';
import { ChevronLeft, Printer, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PrivacyPage({ isOpen, onClose }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 400,
      background: '#F8FAFC',
      color: '#0F172A',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '16px 20px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              minWidth: '42px',
              minHeight: '42px',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              {isEn ? 'Privacy Policy' : 'Politique de Confidentialité'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>StageLink • Powered by JABE PRODUCTION</span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            background: '#10B981',
            color: '#FFF',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Printer size={15} /> {isEn ? 'Print / PDF' : 'Imprimer / PDF'}
        </button>
      </div>

      {/* Standalone Privacy Page Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px 60px 20px',
        maxWidth: '740px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', marginBottom: '4px' }}>
            <ShieldCheck size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protection des Données</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', margin: '4px 0 8px 0' }}>
            {isEn ? 'Privacy & Security Policy' : 'Politique de Confidentialité & Protection Média'}
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            {isEn ? 'GDPR Compliance & Bank-grade Audio Encryption' : 'Conformité RGPD & Chiffrement Audio • JABE PRODUCTION'}
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>
            1. Données Collectées & Transparence
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            Nous collectons uniquement les informations nécessaires au réseau social professionnel : nom d'artiste, rôle, ville/pays, matériel studio, ainsi que les flux vidéo/audio pour le système d'appel.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>
            2. Protection des Maquettes Audio & Zéro Revente
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            Vos extraits musicaux et maquettes sont strictement confidentiels. JABE PRODUCTION ne vend pas vos données à des tiers et n'utilise pas vos œuvres pour l'entraînement d'algorithmes externes.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>
            3. Vos Droits (Accès, Rectification, Suppression)
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            Conformément aux réglementations internationales et au RGPD, vous disposez d'un droit permanent d'accès, de rectification et de suppression totale de l'ensemble des données associées à votre compte.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>
          StageLink • Powered by <strong>JABE PRODUCTION</strong>
        </div>
      </div>
    </div>
  );
}
