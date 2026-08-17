import React, { useState } from 'react';
import { X, Copy, Share2, Check, QrCode, ExternalLink, Download, MessageCircle, Send, Smartphone } from 'lucide-react';
import Logo from '../common/Logo';
import { soundEngine } from '../../services/audioService';

/**
 * ProfileQRCodeModal - Ergonomic Bottom Sheet Version
 */
export default function ProfileQRCodeModal({ isOpen, onClose, user, isDarkMode }) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !user) return null;

  const baseUrl = window.location.origin || 'https://stagelink.app';
  const handleSlug = user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : user.id;
  const profileUrl = `${baseUrl}/?profile=${user.id}`;
  const displayUrl = `stagelink.app/artist/${handleSlug}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(profileUrl)}&color=0066FF&bgcolor=FFFFFF&margin=2`;
  const ctaText = `🎵 Découvrez le profil d'artiste de ${user.name} sur StageLink !\n\n${profileUrl}`;

  const handleCopyLink = () => {
    soundEngine.playPopSound();
    try {
      navigator.clipboard.writeText(ctaText);
    } catch (e) {
      const el = document.createElement('textarea');
      el.value = ctaText; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>

      <div
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '500px',
          background: isDarkMode ? '#151D2A' : '#FFFFFF',
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
          padding: '12px 20px 40px 20px', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
        }}
      >
        {/* Handle */}
        <div style={{ width: '40px', height: '5px', background: isDarkMode ? '#1E293B' : '#E2E8F0', borderRadius: '3px', marginBottom: '15px' }} />

        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Logo size="small" variant="horizontal" />
          <button
            onClick={onClose}
            style={{
              background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '50%', width: '38px', height: '38px',
              minWidth: '38px', minHeight: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
            }}
            title="Fermer"
          >
            <X size={20} color="#EF4444" />
          </button>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 16px 0' }}>Votre Carte Contact QR</h3>

        {/* QR Frame */}
        <div style={{ padding: '15px', background: '#FFF', borderRadius: '24px', border: '3px solid #0066FF', boxShadow: '0 10px 30px rgba(0, 102, 255, 0.15)', marginBottom: '20px' }}>
          <img src={qrApiUrl} alt="QR" style={{ width: '180px', height: '180px', borderRadius: '12px' }} />
        </div>

        {/* Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', marginBottom: '20px' }}>
          <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(ctaText)}`, '_blank')} style={{ padding: '12px', borderRadius: '16px', background: '#25D366', color: '#FFF', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <MessageCircle size={20} /> <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>WhatsApp</span>
          </button>
          <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}`, '_blank')} style={{ padding: '12px', borderRadius: '16px', background: '#229ED9', color: '#FFF', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <Send size={20} /> <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>Telegram</span>
          </button>
          <button onClick={handleCopyLink} style={{ padding: '12px', borderRadius: '16px', background: '#0066FF', color: '#FFF', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            {copied ? <Check size={20} /> : <Copy size={20} />} <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{copied ? 'Copié' : 'Lien'}</span>
          </button>
        </div>

        <button
          onClick={handleCopyLink}
          style={{
            width: '100%', padding: '16px', borderRadius: '18px', border: 'none',
            background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
            color: '#FFFFFF', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)'
          }}
        >
          <Share2 size={20} style={{ marginRight: 8 }} /> Partager ma Carte Contact
        </button>
      </div>
    </div>
  );
}
