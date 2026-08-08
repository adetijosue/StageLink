import React from 'react';

export default function UserAvatar({
  user,
  avatarUrl,
  gender,
  size = 40,
  style = {},
  className = '',
  onClick,
  border = 'none'
}) {
  const finalUrl = avatarUrl || user?.avatar || user?.avatar_url || user?.userAvatar;
  const userGender = (gender || user?.gender || user?.sex || 'male').toLowerCase();

  const isFemale = userGender === 'female' || userGender === 'femme' || userGender === 'f';

  if (finalUrl && typeof finalUrl === 'string' && finalUrl.trim() !== '') {
    return (
      <img
        src={finalUrl}
        alt={user?.name || user?.userName || 'Avatar'}
        onClick={onClick}
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: border,
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  // Default Fallback Avatars: Boy (Masculin) vs Girl (Féminin)
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: isFemale
          ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
          : 'linear-gradient(135deg, #0066FF, #3B82F6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        boxShadow: isFemale ? '0 4px 12px rgba(236, 72, 153, 0.35)' : '0 4px 12px rgba(0, 102, 255, 0.35)',
        border: border,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {isFemale ? (
        /* Girl / Female Silhouette Icon */
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.24 2 7 4.24 7 7c0 2.05 1.23 3.81 3 4.58V13c-3.87.27-7 2.22-7 6v2h18v-2c0-3.78-3.13-5.73-7-6v-1.42c1.77-.77 3-2.53 3-4.58 0-2.76-2.24-5-5-5zM7.5 7c0-2.48 2.02-4.5 4.5-4.5s4.5 2.02 4.5 4.5c0 1.25-.51 2.38-1.34 3.19-.24.23-.46.48-.66.75C13.62 11.23 12.85 11.5 12 11.5s-1.62-.27-2.5-.56c-.2-.27-.42-.52-.66-.75C8.01 9.38 7.5 8.25 7.5 7z" />
          <circle cx="12" cy="7" r="3.2" fill="currentColor" opacity="0.9" />
          <path d="M9 14.5c-2.5.8-4.5 2.5-5 4.5h16c-.5-2-2.5-3.7-5-4.5-.6.3-1.3.5-2 .5s-1.4-.2-2-.5z" />
        </svg>
      ) : (
        /* Boy / Male Silhouette Icon */
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a5 5 0 0 0-5 5c0 2.11 1.31 3.91 3.16 4.63C6.42 12.37 3.5 14.88 3.5 18.5V21h17v-2.5c0-3.62-2.92-6.13-6.66-6.87A5.002 5.002 0 0 0 17 7a5 5 0 0 0-5-5zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 8c3.87 0 6.5 2.13 6.5 4.5V19h-13v-2.5c0-2.37 2.63-4.5 6.5-4.5z" />
        </svg>
      )}
    </div>
  );
}
