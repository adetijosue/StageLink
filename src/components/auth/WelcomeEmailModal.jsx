import React from 'react';
import { Mail, Check, X, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import Logo from '../common/Logo';
import { soundEngine } from '../../services/audioService';

export default function WelcomeEmailModal({ isOpen, onClose, userName = 'Artiste', userRole = 'Beatmaker' }) {
  if (!isOpen) return null;

  const handleClose = () => {
    soundEngine.playPopSound();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      overflowY: 'auto'
    }} onClick={handleClose}>

      <div
        className="animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '520px',
          background: '#0B0F19',
          color: '#FFFFFF',
          borderRadius: '32px',
          border: '1.5px solid rgba(0, 102, 255, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 102, 255, 0.35)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Email Header Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>
            <Mail size={16} color="#0066FF" />
            <span>Message de bienvenue envoyé à votre boîte e-mail</span>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)', border: 'none',
              borderRadius: '50%', width: '32px', height: '32px',
              color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* HTML Email Template Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{
            background: '#151D2A',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            {/* Email Banner Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 50%, #1D4ED8 100%)',
              padding: '32px 24px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <Logo size="medium" variant="horizontal" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                Bienvenue sur StageLink ! 🎉
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.88rem', fontWeight: 600, marginTop: '6px', margin: 0 }}>
                La plateforme officielle de connexion & co-création musicale
              </p>
            </div>

            {/* Email Body Content */}
            <div style={{ padding: '28px 24px', color: '#E2E8F0', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                Bonjour <span style={{ color: '#38BDF8' }}>{userName}</span> 👋,
              </p>

              <p style={{ marginBottom: '16px', color: '#CBD5E1' }}>
                Toute l'équipe de <strong>StageLink</strong> est honorée de vous compter parmi nos membres en tant que <strong>{userRole}</strong> !
              </p>

              <p style={{ marginBottom: '20px', color: '#CBD5E1' }}>
                StageLink a été pensé pour propulser votre carrière musicale et faciliter la mise en relation directe entre artistes, beatmakers, ingénieurs du son et labels.
              </p>

              {/* Key Features List Box */}
              <div style={{
                background: 'rgba(0, 102, 255, 0.08)',
                border: '1px solid rgba(0, 102, 255, 0.25)',
                borderRadius: '18px',
                padding: '18px',
                marginBottom: '24px'
              }}>
                <h4 style={{ color: '#38BDF8', fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 0, marginBottom: '12px' }}>
                  ⚡ Ce que vous pouvez faire dès aujourd'hui :
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎧</span>
                    <span><strong>Compléter votre EPK :</strong> Ajoutez vos démos, instruments et biographie.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem' }}>📸</span>
                    <span><strong>Publier des Stories :</strong> Partagez vos coulisses et nouveautés.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem' }}>💬</span>
                    <span><strong>Discuter en Privé :</strong> Envoyez des extraits audio et collaborez en direct.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem' }}>💳</span>
                    <span><strong>Monétisation Moneroo :</strong> Vendez vos beats et services en toute sécurité.</span>
                  </div>
                </div>
              </div>

              {/* Call to Action Button */}
              <div style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
                <button
                  onClick={handleClose}
                  style={{
                    background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '14px 28px',
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(0, 102, 255, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Accéder à mon Espace StageLink <Sparkles size={16} />
                </button>
              </div>
            </div>

            {/* Email Footer */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '18px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#64748B'
            }}>
              <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#94A3B8' }}>
                StageLink • Propulsé par JABE PRODUCTION
              </p>
              <p style={{ margin: 0 }}>
                Vous recevez cet e-mail suite à votre inscription sur StageLink. © 2026 Tous droits réservés.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Button */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <button
            onClick={handleClose}
            className="btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '0.88rem' }}
          >
            Découvrir l'Application
          </button>
        </div>
      </div>
    </div>
  );
}
