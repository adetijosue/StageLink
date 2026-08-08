import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StoryBar({ stories, onSelectStory, onAddStory }) {
  const { currentUser } = useAuth();
  const userAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  return (
    <div style={{
      padding: '16px 16px 14px 16px',
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-light)',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {/* WhatsApp-Style 'Mon Statut' / Add My Story Circle */}
      <div
        onClick={onAddStory}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        <div style={{
          position: 'relative',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          padding: '2px',
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.2), rgba(0, 71, 255, 0.1))'
        }}>
          <img
            src={userAvatar}
            alt="Mon Statut"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--card-bg)'
            }}
          />
          {/* Plus Badge Icon on Bottom Right */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#0066FF',
            color: '#FFFFFF',
            border: '2.5px solid var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 102, 255, 0.4)'
          }}>
            <Plus size={14} strokeWidth={3} />
          </div>
        </div>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-dark)',
          textAlign: 'center'
        }}>
          Mon Statut
        </span>
      </div>

      {/* WhatsApp-Style Enlarged Stories List */}
      {stories.map((story) => {
        const isUnread = story.hasUnread !== false;

        return (
          <div
            key={story.id}
            onClick={() => onSelectStory(story)}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {/* Story Gradient Ring */}
            <div style={{
              width: '72px',
              height: '72px',
              padding: '3px',
              borderRadius: '50%',
              background: isUnread
                ? 'linear-gradient(135deg, #0066FF 0%, #00C6FF 100%)'
                : 'rgba(148, 163, 184, 0.35)',
              boxShadow: isUnread ? '0 4px 14px rgba(0, 102, 255, 0.3)' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={story.avatar}
                alt={story.userName}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2.5px solid var(--card-bg)'
                }}
              />
            </div>

            {/* Story User First Name */}
            <span style={{
              fontSize: '0.78rem',
              fontWeight: isUnread ? 800 : 600,
              color: isUnread ? 'var(--text-dark)' : 'var(--text-muted)',
              maxWidth: '72px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center'
            }}>
              {story.userName.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
