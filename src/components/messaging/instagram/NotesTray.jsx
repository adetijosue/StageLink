import React, { useState } from 'react';
import UserAvatar from '../../common/UserAvatar';
import { Plus, Music, X, Sparkles } from 'lucide-react';
import { soundEngine } from '../../../services/audioService';

export default function NotesTray({ notes = [], currentUser, onPostNote }) {
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [musicTrack, setMusicTrack] = useState(null);

  const currentUserNote = notes.find((n) => n.user_id === currentUser?.id);
  const otherNotes = notes.filter((n) => n.user_id !== currentUser?.id);

  const handleSubmitNote = (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    soundEngine.playPopSound();
    onPostNote({
      content: noteContent.trim(),
      audioTrackTitle: musicTrack?.title,
      audioTrackArtist: musicTrack?.artist,
      audioTrackUrl: musicTrack?.url
    });

    setNoteContent('');
    setMusicTrack(null);
    setIsCreatingNote(false);
  };

  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-light)',
      background: 'var(--card-bg)'
    }}>
      {/* Horizontal Scrollable Notes Tray */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        paddingBottom: '4px'
      }}>
        {/* Current User Note Creator / Avatar */}
        <div
          onClick={() => {
            soundEngine.playPopSound();
            setIsCreatingNote(true);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            width: '72px'
          }}
        >
          <div style={{ position: 'relative', marginBottom: '6px' }}>
            {/* Floating Thought Bubble for Current User */}
            {currentUserNote ? (
              <div style={{
                position: 'absolute',
                top: '-26px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FFFFFF',
                color: '#0F172A',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.72rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
                maxWidth: '90px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 2,
                border: '1px solid #E2E8F0'
              }}>
                {currentUserNote.content}
              </div>
            ) : (
              <div style={{
                position: 'absolute',
                top: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 102, 255, 0.1)',
                color: '#0066FF',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.68rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                zIndex: 2
              }}>
                + Note
              </div>
            )}

            <UserAvatar
              user={{
                avatar: currentUser?.avatar || currentUser?.avatar_url,
                name: currentUser?.name || currentUser?.full_name || 'Moi'
              }}
              size={60}
            />

            <span style={{
              position: 'absolute',
              bottom: '0px',
              right: '0px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#0066FF',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--card-bg)'
            }}>
              <Plus size={12} strokeWidth={3} />
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Votre note
          </span>
        </div>

        {/* Other Users' Direct Notes */}
        {otherNotes.map((note) => (
          <div
            key={note.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              width: '72px'
            }}
          >
            <div style={{ position: 'relative', marginBottom: '6px' }}>
              {/* Thought Bubble */}
              <div style={{
                position: 'absolute',
                top: '-26px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FFFFFF',
                color: '#0F172A',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.72rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
                maxWidth: '96px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 2,
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {note.audio_track_title && <Music size={10} color="#0066FF" />}
                {note.content}
              </div>

              <UserAvatar
                user={{
                  avatar: note.user?.avatar_url,
                  name: note.user?.full_name || 'Artiste'
                }}
                size={60}
              />
            </div>

            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-dark)',
              fontWeight: 600,
              maxWidth: '68px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {note.user?.full_name?.split(' ')[0] || 'Artiste'}
            </span>
          </div>
        ))}
      </div>

      {/* Direct Note Creation Modal */}
      {isCreatingNote && (
        <div
          onClick={() => setIsCreatingNote(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Partager une note
              </h3>
              <button
                onClick={() => setIsCreatingNote(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '20px' }}>
              {/* Preview bubble */}
              <div style={{
                position: 'absolute',
                top: '-32px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#0066FF',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)',
                whiteSpace: 'nowrap',
                maxWidth: '220px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {noteContent.trim() || 'Partagez une pensée...'}
              </div>

              <UserAvatar
                user={{
                  avatar: currentUser?.avatar || currentUser?.avatar_url,
                  name: currentUser?.name || currentUser?.full_name || 'Moi'
                }}
                size={80}
              />
            </div>

            <input
              type="text"
              maxLength={60}
              placeholder="Partagez une pensée (60 car. max)..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '16px',
                border: '1.5px solid #E2E8F0',
                fontSize: '0.9rem',
                outline: 'none',
                marginBottom: '8px',
                textAlign: 'center'
              }}
            />

            <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '20px' }}>
              Visible par vos connexions pendant 24 heures.
            </span>

            <button
              onClick={handleSubmitNote}
              disabled={!noteContent.trim()}
              style={{
                width: '100%',
                background: noteContent.trim() ? '#0066FF' : '#CBD5E1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                padding: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: noteContent.trim() ? 'pointer' : 'default',
                boxShadow: noteContent.trim() ? '0 4px 12px rgba(0, 102, 255, 0.3)' : 'none'
              }}
            >
              Partager
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
