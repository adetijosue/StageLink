import React, { useState } from 'react';
import { X, ShieldCheck, FileText, HelpCircle, ChevronLeft, Printer, Building, CheckCircle2, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LegalPagesModal({ isOpen, onClose, initialTab = 'cgu' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'cgu' | 'privacy' | 'charter'
  const { language } = useLanguage();

  if (!isOpen) return null;

  const isEn = language === 'en';

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
      {/* Sleek Clean Header */}
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
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              {isEn ? 'Legal & Compliance Center' : 'Mentions Légales & Conformité'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>StageLink • Powered by JABE PRODUCTION</span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          title={isEn ? 'Print or Save as PDF' : 'Imprimer ou enregistrer en PDF'}
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

      {/* Modern Minimalist Document Selector Tabs */}
      <div style={{
        display: 'flex',
        background: '#FFFFFF',
        padding: '8px 16px',
        borderBottom: '1px solid #E2E8F0',
        gap: '8px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('cgu')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: activeTab === 'cgu' ? '2px solid #0066FF' : '1px solid #E2E8F0',
            background: activeTab === 'cgu' ? '#EFF6FF' : '#F8FAFC',
            color: activeTab === 'cgu' ? '#0066FF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <FileText size={16} /> {isEn ? 'Terms of Service' : 'Conditions d\'Utilisation'}
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: activeTab === 'privacy' ? '2px solid #10B981' : '1px solid #E2E8F0',
            background: activeTab === 'privacy' ? '#ECFDF5' : '#F8FAFC',
            color: activeTab === 'privacy' ? '#10B981' : '#64748B',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <ShieldCheck size={16} /> {isEn ? 'Privacy Policy' : 'Confidentialité'}
        </button>

        <button
          onClick={() => setActiveTab('charter')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: activeTab === 'charter' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
            background: activeTab === 'charter' ? '#FFFBEB' : '#F8FAFC',
            color: activeTab === 'charter' ? '#D97706' : '#64748B',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <HelpCircle size={16} /> {isEn ? 'Community Guidelines' : 'Charte Communauté'}
        </button>
      </div>

      {/* Clean Scrollable Content Viewport */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px 60px 20px',
        maxWidth: '740px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* PAGE 1: DEDICATED TERMS OF SERVICE (CGU) */}
        {activeTab === 'cgu' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0066FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Document Officiel</span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', margin: '4px 0 8px 0' }}>
                {isEn ? 'Conditions of Service (ToS)' : 'Conditions Générales d\'Utilisation (CGU)'}
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                {isEn ? 'Effective date: July 2026 • JABE PRODUCTION Property' : 'En vigueur au 24 Juillet 2026 • Propriété de JABE PRODUCTION'}
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
          </div>
        )}

        {/* PAGE 2: DEDICATED PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protection des Données</span>
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
          </div>
        )}

        {/* PAGE 3: DEDICATED COMMUNITY CHARTER */}
        {activeTab === 'charter' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Éthique Artistique</span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', margin: '4px 0 8px 0' }}>
                {isEn ? 'Community Guidelines & Code of Conduct' : 'Charte de la Communauté Artistique StageLink'}
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                {isEn ? 'Respect, Integrity & Anti-Plagiarism Protocol' : 'Respect Mutuel, Intégrité & Anti-Plagiat • JABE PRODUCTION'}
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#D97706', marginBottom: '8px' }}>
                Règle 1 - Respect & Courtoisie entre Professionnels
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                StageLink favorise des échanges sains et des retours constructifs sur les projets musicaux. Tout harcèlement ou comportement irrespectueux conduira à la suspension du compte.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#D97706', marginBottom: '8px' }}>
                Règle 2 - Tolérance Zéro pour le Plagiat
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                Seules les créations dont vous possédez les droits ou autorisations peuvent être publiées ou vendues. Le vol d'œuvre est strictly banni.
              </p>
            </div>
          </div>
        )}

        {/* Clean Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>
          StageLink • Powered by <strong>JABE PRODUCTION</strong>
        </div>
      </div>
    </div>
  );
}
