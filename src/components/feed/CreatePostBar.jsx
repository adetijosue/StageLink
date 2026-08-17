import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Image, Send } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

export default function CreatePostBar({ onClickOpenModal }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();

  if (!currentUser) return null;

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : (language === 'en' ? 'you' : 'vous');

  return (
    <div
      onClick={onClickOpenModal}
      style={{
        background: 'var(--card-bg, #FFFFFF)',
        borderRadius: '16px',
        padding: '8px 12px',
        marginBottom: '12px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--border-light, #E2E8F0)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
      }}
      className="create-post-bar-hover"
    >
      {/* 1. User Avatar */}
      <UserAvatar
        user={currentUser}
        size={36}
        border="1.5px solid var(--border-light, #E2E8F0)"
      />

      {/* 2. Interactive Input Capsule */}
      <div
        style={{
          flex: 1,
          height: '36px',
          background: 'var(--input-bg, #F8FAFC)',
          borderRadius: '20px',
          padding: '0 14px',
          color: 'var(--text-secondary, #64748B)',
          fontSize: '0.84rem',
          border: '1px solid var(--border-light, #E2E8F0)',
          display: 'flex',
          alignItems: 'center',
          fontWeight: 500,
          minWidth: 0
        }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {language === 'en' ? `What's on your mind, ${firstName}?` : `Quoi de neuf, ${firstName} ?`}
        </span>
      </div>

      {/* 3. Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Photo Button */}
        <button
          type="button"
          title={language === 'en' ? 'Add photo or video' : 'Ajouter une photo ou vidéo'}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--input-bg, #F1F5F9)',
            border: 'none',
            color: '#0066FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s ease, transform 0.15s ease'
          }}
        >
          <Image size={17} strokeWidth={2.2} />
        </button>

        {/* Publish / Send Action Button */}
        <button
          type="button"
          title={t('btn_publish')}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 102, 255, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Send size={15} strokeWidth={2.4} style={{ marginLeft: '1px' }} />
        </button>
      </div>
    </div>
  );
}
