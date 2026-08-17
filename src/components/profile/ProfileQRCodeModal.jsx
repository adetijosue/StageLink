import React, { useState, useRef } from 'react';
import { 
  X, 
  Copy, 
  Share2, 
  Check, 
  QrCode, 
  ExternalLink, 
  Download, 
  MessageCircle, 
  Send, 
  Sparkles, 
  Crown, 
  Award, 
  Music, 
  Camera,
  CheckCircle2
} from 'lucide-react';
import Logo from '../common/Logo';
import { soundEngine } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ProfileQRCodeModal - Ultra-Modern Personalized Artist QR Card
 * Features:
 * - Profile photo embedded in the center of the QR Code (ECC Level H for 100% scan reliability)
 * - Deep-link directly to public profile for instant viewing and following (?profile=USER_ID)
 * - High-definition 1080p Canvas Card Generator for PNG Download
 * - Web Share API, WhatsApp, Telegram, and Direct Copy
 */
export default function ProfileQRCodeModal({ isOpen, onClose, user, isDarkMode }) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  if (!isOpen || !user) return null;

  const baseUrl = window.location.origin || 'https://stagelink.app';
  const targetId = user.id || user.userId || 'usr_unknown';
  const userName = user.name || user.full_name || user.userName || 'Artiste StageLink';
  const userAvatar = user.avatar || user.avatar_url || user.image || '';
  const userRole = user.role || user.userRole || 'Artiste Musique';
  const userLocation = user.location || 'Studio & En ligne';
  const isVerified = user.verified === true || user.badgeType === 'gold' || user.badgeType === 'blue';
  const handleSlug = userName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Direct Public Profile Link (Deep Link)
  const profileUrl = `${baseUrl}/?profile=${encodeURIComponent(targetId)}`;
  const displayUrl = `stagelink.app/?profile=${handleSlug}`;

  // QR API with ECC=H (High Error Correction: 30% tolerance to embed center avatar reliably)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(profileUrl)}&color=0055FF&bgcolor=FFFFFF&margin=2&ecc=H`;

  const ctaText = language === 'en'
    ? `🎵 Discover & follow ${userName}'s official artist profile on StageLink!\nListen to demos, beats & connect: ${profileUrl}`
    : `🎵 Découvrez et abonnez-vous au profil officiel de ${userName} sur StageLink !\nÉcoutez ses maquettes, beats & contactez-le : ${profileUrl}`;

  const handleCopyLink = () => {
    soundEngine.playPopSound();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ctaText);
      } else {
        const el = document.createElement('textarea');
        el.value = ctaText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch (e) {
      console.warn("Copy error:", e);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    soundEngine.playPopSound();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName} - StageLink Artist Profile`,
          text: ctaText,
          url: profileUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // HD Canvas Poster Generator for instant PNG Download
  const handleDownloadHDCard = async () => {
    soundEngine.playPopSound();
    setIsGeneratingCard(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 1080;
      const height = 1380;
      canvas.width = width;
      canvas.height = height;

      // 1. Background Gradient (Sleek Studio Dark Theme)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0B0F19');
      bgGrad.addColorStop(0.5, '#0F172A');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Neon Aura Glows
      const glow1 = ctx.createRadialGradient(width * 0.2, 200, 20, width * 0.2, 200, 450);
      glow1.addColorStop(0, 'rgba(0, 102, 255, 0.25)');
      glow1.addColorStop(1, 'rgba(0, 102, 255, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(width * 0.8, height - 300, 20, width * 0.8, height - 300, 400);
      glow2.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
      glow2.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // 2. Outer Card Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // 3. StageLink Official Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STAGE LINK', width / 2, 120);

      ctx.fillStyle = '#0066FF';
      ctx.font = '800 20px Inter, sans-serif';
      ctx.fillText(language === 'en' ? '• OFFICIAL ARTIST CARD •' : '• CARTE OFFICIELLE ARTISTE •', width / 2, 160);

      // 4. Artist Name & Role
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '900 48px Inter, sans-serif';
      ctx.fillText(userName, width / 2, 250);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 26px Inter, sans-serif';
      ctx.fillText(`${userRole} • ${userLocation}`, width / 2, 295);

      // 5. White Box for QR Code
      const qrBoxX = (width - 620) / 2;
      const qrBoxY = 360;
      const qrBoxSize = 620;
      
      // Rounded White Box
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 40);
      ctx.fill();

      // Soft Blue Border for QR container
      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Load & Draw QR Code
      const qrImage = new Image();
      qrImage.crossOrigin = 'Anonymous';
      qrImage.src = qrApiUrl;

      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
      });

      // Draw QR image inside the box
      const qrMargin = 40;
      ctx.drawImage(qrImage, qrBoxX + qrMargin, qrBoxY + qrMargin, qrBoxSize - (qrMargin * 2), qrBoxSize - (qrMargin * 2));

      // 6. Draw Centered Profile Photo inside QR Code
      const avatarSize = 140;
      const avatarX = width / 2 - avatarSize / 2;
      const avatarY = qrBoxY + qrBoxSize / 2 - avatarSize / 2;

      // Draw white circular background shield
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(width / 2, qrBoxY + qrBoxSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();

      // Draw user avatar or initial
      if (userAvatar && !imageLoadError) {
        try {
          const userImg = new Image();
          userImg.crossOrigin = 'Anonymous';
          userImg.src = userAvatar;
          await new Promise((res, rej) => {
            userImg.onload = res;
            userImg.onerror = rej;
          });

          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, qrBoxY + qrBoxSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(userImg, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();
        } catch (e) {
          // Fallback avatar with initial
          drawFallbackAvatar(ctx, width / 2, qrBoxY + qrBoxSize / 2, avatarSize / 2, userName);
        }
      } else {
        drawFallbackAvatar(ctx, width / 2, qrBoxY + qrBoxSize / 2, avatarSize / 2, userName);
      }

      // 7. Scan Instruction Footer
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 30px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        language === 'en' ? '📷 Scan with any camera to follow & listen' : '📷 Scannez pour écouter & vous abonner',
        width / 2,
        1070
      );

      ctx.fillStyle = '#64748B';
      ctx.font = '600 22px Inter, sans-serif';
      ctx.fillText(displayUrl, width / 2, 1115);

      // 8. Bottom Brand Slogan
      ctx.fillStyle = '#0066FF';
      ctx.font = '900 24px Inter, sans-serif';
      ctx.fillText('STAGELINK • THE MUSIC COLLABORATION NETWORK', width / 2, 1260);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `StageLink-${handleSlug}-Card.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Canvas poster export error:', err);
      // Fallback: open QR direct URL
      window.open(qrApiUrl, '_blank');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const drawFallbackAvatar = (ctx, cx, cy, radius, name) => {
    ctx.save();
    const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    grad.addColorStop(0, '#0066FF');
    grad.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${radius * 0.9}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), cx, cy);
    ctx.restore();
  };

  return (
    <div 
      style={{
        position: 'fixed', 
        inset: 0, 
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.88)', 
        backdropFilter: 'blur(12px)',
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'center'
      }} 
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', 
          maxWidth: '500px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: isDarkMode ? '#0F172A' : '#FFFFFF',
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          borderTopLeftRadius: '36px', 
          borderTopRightRadius: '36px',
          padding: '16px 20px 36px 20px', 
          boxShadow: '0 -10px 50px rgba(0, 0, 0, 0.5)',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Handle */}
        <div style={{ width: '44px', height: '5px', background: isDarkMode ? '#334155' : '#E2E8F0', borderRadius: '3px', marginBottom: '14px' }} />

        {/* Top Header with Close Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Logo size="small" variant="horizontal" />
          
          <button
            onClick={onClose}
            style={{
              background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '50%', 
              width: '38px', 
              height: '38px',
              minWidth: '38px', 
              minHeight: '38px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
            }}
            title={t('modal_close')}
          >
            <X size={20} color="#EF4444" />
          </button>
        </div>

        {/* Artist Profile Header Card */}
        <div style={{
          width: '100%',
          background: isDarkMode ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' : 'linear-gradient(135deg, #F8FAFC, #EFF6FF)',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          borderRadius: '24px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <div style={{ position: 'relative' }}>
            {userAvatar && !imageLoadError ? (
              <img 
                src={userAvatar} 
                alt={userName}
                onError={() => setImageLoadError(true)}
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0066FF' }} 
              />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #0066FF, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 900, fontSize: '1.4rem' }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            {isVerified && (
              <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#0066FF', borderRadius: '50%', padding: '2px', border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={13} color="#FFF" />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </h4>
              {isVerified && <Crown size={15} color="#EAB308" />}
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
              {userRole}
            </p>
            <span style={{ fontSize: '0.72rem', color: '#0066FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              📍 {userLocation}
            </span>
          </div>
        </div>

        {/* Personalized QR Code Container with Central Profile Picture */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div 
            style={{ 
              padding: '16px', 
              background: '#FFFFFF', 
              borderRadius: '28px', 
              border: '3px solid #0066FF', 
              boxShadow: '0 12px 35px rgba(0, 102, 255, 0.25)',
              position: 'relative',
              display: 'inline-block'
            }}
          >
            {/* The QR Image */}
            <img 
              src={qrApiUrl} 
              alt={`QR Code ${userName}`} 
              style={{ width: '220px', height: '220px', borderRadius: '14px', display: 'block' }} 
            />

            {/* Centered Profile Avatar Badge */}
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#FFFFFF',
                padding: '4px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5
              }}
            >
              {userAvatar && !imageLoadError ? (
                <img 
                  src={userAvatar} 
                  alt={userName} 
                  onError={() => setImageLoadError(true)}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #0066FF'
                  }}
                />
              ) : (
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0066FF, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    fontWeight: 900,
                    fontSize: '1.1rem'
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Verified Mini Badge on center Avatar */}
              {isVerified && (
                <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#0066FF', borderRadius: '50%', padding: '1px', border: '1.5px solid #FFF', display: 'flex' }}>
                  <Check size={9} color="#FFF" strokeWidth={3} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scan Call to Action & Link Preview */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isDarkMode ? 'rgba(0,102,255,0.15)' : '#EFF6FF', color: '#0066FF', padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
            <Camera size={14} />
            <span>{language === 'en' ? 'Scan with any smartphone camera' : 'Scannez avec votre appareil photo'}</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: isDarkMode ? '#94A3B8' : '#64748B', margin: '8px 0 0 0', maxWidth: '340px' }}>
            {language === 'en'
              ? 'Lands directly on your public profile to listen, follow & contact.'
              : 'Ouvre directement votre profil public pour écouter, s\'abonner & collaborer.'}
          </p>
        </div>

        {/* Action Grid (WhatsApp, Telegram, Copier) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', marginBottom: '14px' }}>
          <button 
            onClick={() => { soundEngine.playPopSound(); window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(ctaText)}`, '_blank'); }} 
            style={{ 
              padding: '12px 8px', 
              borderRadius: '16px', 
              background: '#25D366', 
              color: '#FFF', 
              border: 'none', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '4px', 
              cursor: 'pointer',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
            }}
          >
            <MessageCircle size={20} /> 
            <span style={{ fontSize: '0.72rem' }}>WhatsApp</span>
          </button>

          <button 
            onClick={() => { soundEngine.playPopSound(); window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(ctaText)}`, '_blank'); }} 
            style={{ 
              padding: '12px 8px', 
              borderRadius: '16px', 
              background: '#229ED9', 
              color: '#FFF', 
              border: 'none', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '4px', 
              cursor: 'pointer',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(34, 158, 217, 0.25)'
            }}
          >
            <Send size={20} /> 
            <span style={{ fontSize: '0.72rem' }}>Telegram</span>
          </button>

          <button 
            onClick={handleCopyLink} 
            style={{ 
              padding: '12px 8px', 
              borderRadius: '16px', 
              background: isDarkMode ? '#1E293B' : '#F1F5F9', 
              color: isDarkMode ? '#F8FAFC' : '#0F172A', 
              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '4px', 
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            {copied ? <Check size={20} color="#10B981" /> : <Copy size={20} color="#0066FF" />} 
            <span style={{ fontSize: '0.72rem', color: copied ? '#10B981' : 'inherit' }}>
              {copied ? (language === 'en' ? 'Copied !' : 'Copié !') : (language === 'en' ? 'Copy Link' : 'Copier Lien')}
            </span>
          </button>
        </div>

        {/* Action Buttons: Download Poster HD & Native Share */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <button
            onClick={handleDownloadHDCard}
            disabled={isGeneratingCard}
            style={{
              width: '100%', 
              padding: '14px', 
              borderRadius: '18px', 
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
              color: '#FFFFFF', 
              fontWeight: 900, 
              fontSize: '0.88rem', 
              cursor: isGeneratingCard ? 'wait' : 'pointer',
              boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Download size={18} />
            <span>
              {isGeneratingCard 
                ? (language === 'en' ? 'Generating HD Card...' : 'Génération de la Carte HD...') 
                : (language === 'en' ? 'Download HD Artist Poster (PNG)' : 'Télécharger la Carte Contact HD (PNG)')}
            </span>
          </button>

          <button
            onClick={handleNativeShare}
            style={{
              width: '100%', 
              padding: '12px', 
              borderRadius: '18px', 
              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
              background: 'transparent',
              color: isDarkMode ? '#94A3B8' : '#64748B', 
              fontWeight: 800, 
              fontSize: '0.82rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Share2 size={16} />
            <span>{language === 'en' ? 'More Sharing Options' : 'Plus d\'options de partage'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
