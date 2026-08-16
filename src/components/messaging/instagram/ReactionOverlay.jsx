import React from 'react';
import { Plus } from 'lucide-react';
import { soundEngine } from '../../../services/audioService';

const TOP_REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '👏', '🙏', '💯'];

export default function ReactionOverlay({
  isOpen,
  position,
  onSelectEmoji,
  onClose,
  onOpenCustomPicker
}) {
  if (!isOpen) return null;

  const handleSelect = (emoji) => {
    soundEngine.playPopSound();
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(2px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: `${Math.max(60, (position?.y || 200) - 55)}px`,
          left: `${Math.min(window.innerWidth - 280, Math.max(16, (position?.x || 100) - 130))}px`,
          background: '#FFFFFF',
          borderRadius: '30px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          animation: 'scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {TOP_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSelect(emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '4px',
              transition: 'transform 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {emoji}
          </button>
        ))}

        <button
          onClick={() => {
            soundEngine.playPopSound();
            if (onOpenCustomPicker) onOpenCustomPicker();
          }}
          style={{
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B'
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
