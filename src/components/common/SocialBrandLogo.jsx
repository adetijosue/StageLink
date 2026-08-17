import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';

// Official High-Precision Brand SVG Vector Logos & Color Schemes
export const BRAND_CONFIGS = {
  spotify: {
    name: 'Spotify',
    brandColor: '#1DB954',
    bgColor: 'rgba(29, 185, 84, 0.12)',
    borderColor: 'rgba(29, 185, 84, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#1DB954"/>
        <path d="M16.896 17.062c-.19.31-.59.41-.9.22-2.47-1.51-5.58-1.85-9.24-.81-.35.1-.71-.11-.81-.46-.1-.35.11-.71.46-.81 4.02-1.14 7.46-.74 10.27.98.31.19.41.59.22.9zm1.27-2.83c-.24.39-.75.52-1.14.28-2.83-1.74-7.14-2.25-10.49-1.23-.44.13-.9-.12-1.03-.56-.13-.44.12-.9.56-1.03 3.82-1.16 8.57-.59 11.82 1.4.39.24.52.75.28 1.14zm.11-2.95c-3.39-2.01-8.99-2.2-12.22-1.22-.52.16-1.07-.14-1.23-.66-.16-.52.14-1.07.66-1.23 3.71-1.13 9.87-.9 13.78 1.42.47.28.62.89.34 1.36-.28.47-.89.62-1.33.33z" fill="#FFFFFF"/>
      </svg>
    )
  },
  appleMusic: {
    name: 'Apple Music',
    brandColor: '#FA243C',
    bgColor: 'rgba(250, 36, 60, 0.12)',
    borderColor: 'rgba(250, 36, 60, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="url(#apple_music_grad)"/>
        <defs>
          <linearGradient id="apple_music_grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FC3C44"/>
            <stop offset="1" stopColor="#F92353"/>
          </linearGradient>
        </defs>
        {/* Apple Music Official Double Eighth Note */}
        <path d="M16 6.5v7.6c-.35-.22-.8-.35-1.3-.35-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5V9.8l4-1.15V6.5L16 6.5zm-5 8.75c-.35-.22-.8-.35-1.3-.35-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5v-5.65l5-1.4v-2.1l-6 1.7v7.8z" fill="#FFFFFF"/>
      </svg>
    )
  },
  youtube: {
    name: 'YouTube',
    brandColor: '#FF0000',
    bgColor: 'rgba(255, 0, 0, 0.12)',
    borderColor: 'rgba(255, 0, 0, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#FF0000"/>
        <path d="M21.582 7.186a2.51 2.51 0 0 0-1.767-1.777C18.252 5 12 5 12 5s-6.252 0-7.815.409A2.51 2.51 0 0 0 2.418 7.186C2 8.76 2 12 2 12s0 3.24.418 4.814a2.51 2.51 0 0 0 1.767 1.777C5.748 19 12 19 12 19s6.252 0 7.815-.409a2.51 2.51 0 0 0 1.767-1.777C22 15.24 22 12 22 12s0-3.24-.418-4.814zM9.75 15.02V8.98L15 12l-5.25 3.02z" fill="#FFFFFF"/>
      </svg>
    )
  },
  soundcloud: {
    name: 'SoundCloud',
    brandColor: '#FF5500',
    bgColor: 'rgba(255, 85, 0, 0.12)',
    borderColor: 'rgba(255, 85, 0, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="url(#soundcloud_grad)"/>
        <defs>
          <linearGradient id="soundcloud_grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF7700"/>
            <stop offset="1" stopColor="#FF3300"/>
          </linearGradient>
        </defs>
        {/* Official SoundCloud Cloud + Soundwave Bars Logo in White */}
        <path d="M1.2 12.3c-.04 0-.08.01-.11.04a.17.17 0 0 0-.04.11v4.7c0 .04.01.08.04.11.03.03.07.04.11.04h.47c.04 0 .08-.01.11-.04a.17.17 0 0 0 .04-.11v-4.7a.17.17 0 0 0-.04-.11.15.15 0 0 0-.11-.04zm1.5-1.6c-.04 0-.08.01-.11.04a.17.17 0 0 0-.04.11v7.95c0 .04.01.08.04.11.03.03.07.04.11.04h.47c.04 0 .08-.01.11-.04a.17.17 0 0 0 .04-.11V10.8a.17.17 0 0 0-.04-.11.15.15 0 0 0-.11-.04zm1.5-1.6c-.04 0-.08.01-.11.04a.17.17 0 0 0-.04.11v11.1c0 .04.01.08.04.11.03.03.07.04.11.04h.47c.04 0 .08-.01.11-.04a.17.17 0 0 0 .04-.11V9.2a.17.17 0 0 0-.04-.11.15.15 0 0 0-.11-.04zm1.5-1.2c-.04 0-.08.01-.11.04a.17.17 0 0 0-.04.11v13.5c0 .04.01.08.04.11.03.03.07.04.11.04h.47c.04 0 .08-.01.11-.04a.17.17 0 0 0 .04-.11V8a.17.17 0 0 0-.04-.11.15.15 0 0 0-.11-.04zm1.5-.9c-.04 0-.08.01-.11.04a.17.17 0 0 0-.04.11v15.3c0 .04.01.08.04.11.03.03.07.04.11.04h.47c.04 0 .08-.01.11-.04a.17.17 0 0 0 .04-.11V7.1a.17.17 0 0 0-.04-.11.15.15 0 0 0-.11-.04zm1.5-.5c-.04 0-.08.01-.11.04a.17.17 0 0 0-.04.11v16.3c0 .04.01.08.04.11.03.03.07.04.11.04h.47c.04 0 .08-.01.11-.04a.17.17 0 0 0 .04-.11V6.6a.17.17 0 0 0-.04-.11.15.15 0 0 0-.11-.04zm18.4 2a5.2 5.2 0 0 0-4-1.9c-1 0-2 .3-2.8.8A5.2 5.2 0 0 0 11.2 8.8a.17.17 0 0 0-.04.11v11.2c0 .04.01.08.04.11.03.03.07.04.11.04h11.3c1.4 0 2.8-.6 3.8-1.6 1-1 1.6-2.3 1.6-3.8 0-2.9-2.4-5.3-5.3-5.3z" fill="#FFFFFF"/>
      </svg>
    )
  },
  instagram: {
    name: 'Instagram',
    brandColor: '#E4405F',
    bgColor: 'rgba(228, 64, 95, 0.12)',
    borderColor: 'rgba(228, 64, 95, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="url(#ig_grad)"/>
        <defs>
          <radialGradient id="ig_grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6 23) rotate(-44) scale(26)">
            <stop stopColor="#FEE440"/>
            <stop offset="0.3" stopColor="#F77737"/>
            <stop offset="0.6" stopColor="#E1306C"/>
            <stop offset="0.8" stopColor="#C13584"/>
            <stop offset="1" stopColor="#833AB4"/>
          </radialGradient>
        </defs>
        <path d="M12 6.865c-2.83 0-5.135 2.305-5.135 5.135S9.17 17.135 12 17.135 17.135 14.83 17.135 12 14.83 6.865 12 6.865zm0 8.468c-1.84 0-3.333-1.493-3.333-3.333s1.493-3.333 3.333-3.333 3.333 1.493 3.333 3.333-1.493 3.333-3.333 3.333zm4.538-8.54c-.655 0-1.185.53-1.185 1.185 0 .654.53 1.184 1.185 1.184.654 0 1.184-.53 1.184-1.184 0-.655-.53-1.185-1.184-1.185z" fill="#FFFFFF"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 4c2.607 0 2.917.01 3.946.057 1.027.047 1.583.219 1.954.363.49.19.84.418 1.208.785.367.368.595.717.785 1.208.144.37.316.927.363 1.954.047 1.029.057 1.339.057 3.946s-.01 2.917-.057 3.946c-.047 1.027-.219 1.583-.363 1.954-.19.49-.418.84-.785 1.208-.368.367-.717.595-1.208.785-.37.144-.927.316-1.954.363-1.029.047-1.339.057-3.946.057s-2.917-.01-3.946-.057c-1.027-.047-1.583-.219-1.954-.363-.49-.19-.84-.418-1.208-.785-.367-.368-.595-.717-.785-1.208-.144-.37-.316-.927-.363-1.954C4.01 14.917 4 14.607 4 12s.01-2.917.057-3.946c.047-1.027.219-1.583.363-1.954.19-.49.418-.84.785-1.208.368-.367.717-.595 1.208-.785.37-.144.927-.316 1.954-.363C9.083 4.01 9.393 4 12 4zm0-1.8c-2.651 0-2.984.011-4.025.059-1.039.047-1.748.212-2.368.453a5.277 5.277 0 00-1.908 1.242 5.277 5.277 0 00-1.242 1.908c-.241.62-.406 1.329-.453 2.368C1.961 9.266 1.95 9.599 1.95 12.25s.011 2.984.059 4.025c.047 1.039.212 1.748.453 2.368a5.277 5.277 0 001.242 1.908 5.277 5.277 0 001.908 1.242c.62.241 1.329.406 2.368.453 1.041.048 1.374.059 4.025.059s2.984-.011 4.025-.059c1.039-.047 1.748-.212 2.368-.453a5.277 5.277 0 001.908-1.242 5.277 5.277 0 001.242-1.908c.241-.62.406-1.329.453-2.368.048-1.041.059-1.374.059-4.025s-.011-2.984-.059-4.025c-.047-1.039-.212-1.748-.453-2.368a5.277 5.277 0 00-1.242-1.908 5.277 5.277 0 00-1.908-1.242c-.62-.241-1.329-.406-2.368-.453C14.984 2.211 14.651 2.2 12 2.2z" fill="#FFFFFF"/>
      </svg>
    )
  },
  tiktok: {
    name: 'TikTok',
    brandColor: '#00F2FE',
    bgColor: 'rgba(0, 242, 254, 0.12)',
    borderColor: 'rgba(0, 242, 254, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#000000"/>
        <path d="M16.6 8.2c-1.2-.8-2.1-2.1-2.3-3.6H12v11.2c0 1.5-1.2 2.7-2.7 2.7S6.6 17.3 6.6 15.8c0-1.5 1.2-2.7 2.7-2.7.3 0 .6.1.9.2V11c-.3 0-.6-.1-.9-.1-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7 4.7-2.1 4.7-4.7V9.7c1.1.8 2.5 1.3 4 1.3V8.2c-.3 0-.7 0-1-.3z" fill="#00F2FE"/>
        <path d="M16.6 7.9c-1.1 0-2.1-.5-2.8-1.3v7.9c0 2.4-1.9 4.3-4.3 4.3-.4 0-.8-.1-1.2-.2 1 .5 2.1.8 3.3.8 2.6 0 4.7-2.1 4.7-4.7V9.7c1.1.8 2.5 1.3 4 1.3V8.2c-.3 0-.7-.1-1-.3z" fill="#FE2C55"/>
      </svg>
    )
  },
  deezer: {
    name: 'Deezer',
    brandColor: '#FF0092',
    bgColor: 'rgba(255, 0, 146, 0.12)',
    borderColor: 'rgba(255, 0, 146, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#0F172A"/>
        <rect x="3" y="16" width="3.5" height="3" rx="0.8" fill="#FF0092"/>
        <rect x="8" y="16" width="3.5" height="3" rx="0.8" fill="#FF0092"/>
        <rect x="8" y="12" width="3.5" height="3" rx="0.8" fill="#FF0092"/>
        <rect x="13" y="16" width="3.5" height="3" rx="0.8" fill="#FF0092"/>
        <rect x="13" y="12" width="3.5" height="3" rx="0.8" fill="#00C7FF"/>
        <rect x="13" y="8" width="3.5" height="3" rx="0.8" fill="#00C7FF"/>
        <rect x="17.5" y="16" width="3.5" height="3" rx="0.8" fill="#FF0092"/>
        <rect x="17.5" y="12" width="3.5" height="3" rx="0.8" fill="#00C7FF"/>
        <rect x="17.5" y="8" width="3.5" height="3" rx="0.8" fill="#32D74B"/>
        <rect x="17.5" y="4" width="3.5" height="3" rx="0.8" fill="#FFD60A"/>
      </svg>
    )
  },
  audiomack: {
    name: 'Audiomack',
    brandColor: '#FFAA00',
    bgColor: 'rgba(255, 170, 0, 0.12)',
    borderColor: 'rgba(255, 170, 0, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#000000"/>
        <path d="M12 4L3 20h18L12 4zm0 5.2L16.2 18H7.8L12 9.2z" fill="#FFAA00"/>
      </svg>
    )
  },
  facebook: {
    name: 'Facebook',
    brandColor: '#1877F2',
    bgColor: 'rgba(24, 119, 242, 0.12)',
    borderColor: 'rgba(24, 119, 242, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#1877F2"/>
        <path d="M16 12.073c0-2.209-1.791-4-4-4s-4 1.791-4 4c0 1.997 1.462 3.651 3.375 3.938v-2.785H10.16v-1.153h1.215V11.2c0-1.2.713-1.863 1.808-1.863.525 0 1.074.094 1.074.094v1.181h-.605c-.595 0-.78.369-.78.748v.893h1.331l-.213 1.153h-1.118v2.785C14.538 15.724 16 14.07 16 12.073z" fill="#FFFFFF"/>
      </svg>
    )
  },
  twitter: {
    name: 'X (Twitter)',
    brandColor: '#000000',
    bgColor: 'rgba(15, 23, 42, 0.12)',
    borderColor: 'rgba(15, 23, 42, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#000000"/>
        <path d="M17.244 4.25h2.308l-5.027 5.746 5.902 7.824h-4.67l-3.614-4.726L7.99 17.82H5.68l5.33-6.095L5.254 4.25H10.08l3.28 4.336zm-.81 12.19h1.278L8.784 5.576H7.412z" fill="#FFFFFF"/>
      </svg>
    )
  },
  linkedin: {
    name: 'LinkedIn',
    brandColor: '#0A66C2',
    bgColor: 'rgba(10, 102, 194, 0.12)',
    borderColor: 'rgba(10, 102, 194, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#0A66C2"/>
        <path d="M19 19h-3v-4.74c0-1.42-.6-2.39-1.87-2.39-.97 0-1.55.65-1.8 1.28-.09.23-.11.55-.11.87V19h-3s.04-9.33 0-10.3h3v1.46c.4-.61 1.1-1.48 2.68-1.48 1.96 0 3.43 1.28 3.43 4.03V19zM6.5 7.37c1.02 0 1.66-.68 1.66-1.53-.02-.87-.64-1.53-1.64-1.53-1.01 0-1.66.66-1.66 1.53 0 .85.63 1.53 1.62 1.53h.02zM5 19h3V8.7H5V19z" fill="#FFFFFF"/>
      </svg>
    )
  },
  website: {
    name: 'Site Web / Portfolio',
    brandColor: '#0066FF',
    bgColor: 'rgba(0, 102, 255, 0.12)',
    borderColor: 'rgba(0, 102, 255, 0.35)',
    svg: (size = 24) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#0066FF"/>
        <path d="M12 4a8 8 0 100 16 8 8 0 000-16zM6 12a6 6 0 0110.84-3.5H7.16A6.002 6.002 0 006 12zm.16 1.5h9.68A6.002 6.002 0 0112 18a6 6 0 01-5.84-4.5z" fill="#FFFFFF"/>
      </svg>
    )
  }
};

// Helper function to render raw SVG icon by platform type key
export const getBrandLogoSVG = (type, size = 24) => {
  const config = BRAND_CONFIGS[type] || BRAND_CONFIGS.website;
  return config.svg(size);
};

export default function SocialBrandLogo({ type, url, showName = true }) {
  if (!url) return null;

  const config = BRAND_CONFIGS[type] || BRAND_CONFIGS.website;

  const handleClick = (e) => {
    e.preventDefault();
    if (url && typeof url === 'string') {
      const trimmed = url.trim();
      if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) return;
      const fullUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const safeHref = url && typeof url === 'string' && !url.trim().startsWith('javascript:') && !url.trim().startsWith('data:')
    ? (url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`)
    : '#';

  return (
    <a
      href={safeHref}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      title={`Ouvrir la page ${config.name}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: config.bgColor,
        border: `1.5px solid ${config.borderColor}`,
        borderRadius: '16px',
        padding: showName ? '8px 14px' : '8px',
        minWidth: '44px',
        minHeight: '44px',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
        e.currentTarget.style.boxShadow = `0 8px 20px ${config.borderColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {config.svg(26)}
      </span>

      {showName && (
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: config.brandColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {config.name} <ExternalLink size={12} opacity={0.7} />
        </span>
      )}
    </a>
  );
}
