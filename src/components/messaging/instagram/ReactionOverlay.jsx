import React from 'react';
import { Plus, Reply, Copy, Trash2, Check } from 'lucide-react';
import { soundEngine } from '../../../services/audioService';
import { haptics } from '../../../services/hapticsService';

const TOP_REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '🙏', '👏', '💯'];

export default function ReactionOverlay({
  isOpen,
  position,
  message,
  isMine,
  onSelectEmoji,
  onReply,
  onCopy,
  onDelete,
  onClose,
  onOpenCustomPicker,
  isDarkMode = false
}) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleSelect = (emoji) => {
    haptics.selection();
    soundEngine.playPopSound();
    onSelectEmoji(emoji);
    onClose();
  };

  const handleCopyText = (e) => {
    e.stopPropagation();
    haptics.success();
    soundEngine.playPopSound();
    const textToCopy = message?.content || message?.text || '';
    if (textToCopy && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 600);
    } else {
      if (onCopy) onCopy(message);
      onClose();
    }
  };

  const handleReplyAction = (e) => {
    e.stopPropagation();
    haptics.light();
    soundEngine.playPopSound();
    if (onReply) onReply(message);
    onClose();
  };

  const handleDeleteAction = (e) => {
    e.stopPropagation();
    haptics.medium();
    soundEngine.playPopSound();
    if (onDelete) onDelete(message);
    onClose();
  };

  // Safe position calculations ensuring it never flows outside viewport
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 380;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

  const validY = (typeof position?.y === 'number' && !isNaN(position.y) && position.y > 0) ? position.y : (viewportHeight / 2);
  const validX = (typeof position?.x === 'number' && !isNaN(position.x) && position.x > 0) ? position.x : (viewportWidth / 2);

  // Height of overlay is ~200px. If message is in lower half of screen, position overlay cleanly above
  let topPos;
  if (validY > viewportHeight - 260) {
    topPos = Math.max(70, validY - 210);
  } else if (validY < 130) {
    topPos = validY + 50;
  } else {
    topPos = Math.max(70, validY - 75);
  }

  // Pill width is ~320px
  const pillWidth = 320;
  const leftPos = Math.max(12, Math.min(viewportWidth - pillWidth - 12, validX - pillWidth / 2));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeInOverlay 0.15s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: `${topPos}px`,
          left: `${leftPos}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10000,
          animation: 'popInScale 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* 1. Emoji Reaction Bar (WhatsApp / Instagram style) */}
        <div
          style={{
            background: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderRadius: '32px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: isDarkMode ? '0 16px 36px rgba(0, 0, 0, 0.6)' : '0 16px 36px rgba(0, 0, 0, 0.22)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E2E8F0'
          }}
        >
          {TOP_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.45rem',
                cursor: 'pointer',
                padding: '4px',
                transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}

          <button
            onClick={() => {
              haptics.selection();
              soundEngine.playPopSound();
              if (onOpenCustomPicker) onOpenCustomPicker();
            }}
            style={{
              background: isDarkMode ? '#334155' : '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isDarkMode ? '#CBD5E1' : '#64748B'
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* 2. WhatsApp Contextual Quick Action Menu */}
        <div
          style={{
            background: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderRadius: '18px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            width: '200px',
            boxShadow: isDarkMode ? '0 12px 28px rgba(0,0,0,0.5)' : '0 12px 28px rgba(0,0,0,0.15)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0'
          }}
        >
          <button
            onClick={handleReplyAction}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: 'none',
              borderRadius: '12px',
              background: 'transparent',
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span>Répondre</span>
            <Reply size={16} color="#0066FF" />
          </button>

          {(message?.content || message?.text) && (
            <button
              onClick={handleCopyText}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                border: 'none',
                borderRadius: '12px',
                background: 'transparent',
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>{copied ? 'Copié !' : 'Copier le texte'}</span>
              {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} color="#64748B" />}
            </button>
          )}

          {isMine && onDelete && (
            <button
              onClick={handleDeleteAction}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                border: 'none',
                borderRadius: '12px',
                background: 'transparent',
                color: '#EF4444',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>Supprimer</span>
              <Trash2 size={16} color="#EF4444" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popInScale {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
