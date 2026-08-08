import React from 'react';
import { ChevronLeft, Printer, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function CGUPage({ isOpen, onClose }) {
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
              {isEn ? 'Terms of Service (ToS)' : 'Conditions Générales d\'Utilisation (CGU)'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>StageLink • Powered by JABE PRODUCTION</span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            background: '#0066FF',
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

      {/* Standalone CGU Page Content */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0066FF', marginBottom: '4px' }}>
            <FileText size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Document Officiel</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', margin: '4px 0 8px 0' }}>
            {isEn ? 'Terms & Conditions of Service' : 'Conditions Générales d\'Utilisation (CGU)'}
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            {isEn ? 'Effective date: July 2026 • JABE PRODUCTION Property' : 'En vigueur au 24 Juillet 2026 • Propriété exclusive de JABE PRODUCTION'}
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0066FF', marginBottom: '8px' }}>
            Article 1 - Objet & Propriété Exclusive JABE PRODUCTION
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            Les présentes Conditions Générales régissent l'accès et l'utilisation de la plateforme <strong>StageLink</strong>, réseau social et écosystème professionnel développé et exploité exclusivement par <strong>JABE PRODUCTION</strong>. Toute inscription implique l'acceptation irrévocable de ces conditions.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0066FF', marginBottom: '8px' }}>
            Article 2 - Propriété Intellectuelle & Droits des Créateurs
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            Chaque utilisateur (Artiste, Beatmaker, Producteur, Ingénieur son) demeure l'unique propriétaire légal de ses œuvres, maquettes, visuels et créations publiées sur StageLink. JABE PRODUCTION ne prétend à aucun droit de propriété sur vos morceaux.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0066FF', marginBottom: '8px' }}>
            Article 3 - Services Pro, Vente d'Œuvres & Formations
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            L'espace Services Pro permet la mise en vente de licences d'exploitation, de masterclasses et de billets d'événements. Les vendeurs sont seuls responsables de la conformité des droits cédés.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0066FF', marginBottom: '8px' }}>
            Article 4 - Inscription & Sécurité du Compte
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
            L'utilisateur s'engage à fournir des informations exactes lors de la création de son profil et à préserver la confidentialité de ses identifiants. Tout accès non autorisé doit être immédiatement signalé à JABE PRODUCTION.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>
          StageLink • Powered by <strong>JABE PRODUCTION</strong>
        </div>
      </div>
    </div>
  );
}
