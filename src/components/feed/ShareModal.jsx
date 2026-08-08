import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Send } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, post }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const shareUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async (platform) => {
    const text = `Découvrez cette publication de ${post.userName} sur StageLink : "${post.text.substring(0, 80)}..."`;

    if (navigator.share && platform === 'native') {
      try {
        await navigator.share({
          title: 'StageLink Music',
          text: text,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share canceled');
      }
      return;
    }

    // Direct Web Share URLs
    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div className="animate-slide-up" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '440px',
        background: '#FFFFFF',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        padding: '24px 20px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color="#0066FF" /> Partager sur les réseaux sociaux
          </h3>
          <button
            onClick={onClose}
            style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: '50%', width: '36px', height: '36px',
              color: '#EF4444', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Fermer"
          >
            <X size={18} color="#EF4444" />
          </button>
        </div>

        {/* Social Network Share Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px', textAlign: 'center' }}>
          {/* WhatsApp */}
          <button
            onClick={() => handleNativeShare('whatsapp')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '16px',
              padding: '12px 6px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>💬</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534' }}>WhatsApp</span>
          </button>

          {/* Twitter / X */}
          <button
            onClick={() => handleNativeShare('twitter')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '12px 6px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🐦</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A' }}>X (Twitter)</span>
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleNativeShare('facebook')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '16px',
              padding: '12px 6px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>📘</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E40AF' }}>Facebook</span>
          </button>

          {/* Native Mobile Share */}
          <button
            onClick={() => handleNativeShare('native')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              borderRadius: '16px',
              padding: '12px 6px',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>📲</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6D28D9' }}>Plus...</span>
          </button>
        </div>

        {/* Copy Link Section */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '16px',
          padding: '10px 14px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <input
            type="text"
            readOnly
            value={shareUrl}
            style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '0.82rem', color: '#64748B', outline: 'none' }}
          />
          <button
            onClick={handleCopyLink}
            style={{
              background: copied ? '#10B981' : '#0066FF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>
    </div>
  );
}
