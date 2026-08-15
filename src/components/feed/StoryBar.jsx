import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';

export default function StoryBar({ stories = [], onSelectStory, onAddStory, isUploadingStory = false }) {
  const { currentUser } = useAuth();

  const isCurrentUserStory = (s) => {
    if (!s || !currentUser) return false;
    return (
      (s.userId && currentUser.id && s.userId === currentUser.id) ||
      (s.user_id && currentUser.id && s.user_id === currentUser.id) ||
      (s.userName && currentUser.name && s.userName.toLowerCase() === currentUser.name.toLowerCase())
    );
  };

  // Separate current user's stories from other users
  const myStories = (stories || []).filter(isCurrentUserStory);
  const otherStories = (stories || []).filter(s => !isCurrentUserStory(s));
  const myLatestStory = myStories.length > 0 ? myStories[0] : null;

  // Group other users' stories by creator (1 card per user)
  const groupedOtherStories = [];
  const seenCreators = new Set();
  otherStories.forEach(s => {
    const creatorKey = s.userId || s.user_id || s.userName;
    if (creatorKey && !seenCreators.has(creatorKey)) {
      seenCreators.add(creatorKey);
      const userStoriesList = otherStories.filter(cs => (cs.userId || cs.user_id || cs.userName) === creatorKey);
      const hasUnread = userStoriesList.some(cs => cs.hasUnread !== false);
      groupedOtherStories.push({
        ...s,
        storiesCount: userStoriesList.length,
        hasUnread
      });
    }
  });

  const renderCardMedia = (s) => {
    if (!s) return null;
    const media = s.storyMedia || s.mediaUrl || s.media || s.media_url || s.image || s.videoUrl || s.video_url || s.video || s.url || (s.mediaList && s.mediaList[0]?.url);
    
    if (!media) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: s.bgGradient || 'linear-gradient(135deg, #0066FF 0%, #0038A8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: '1.3'
        }}>
          {s.caption ? (s.caption.length > 40 ? s.caption.slice(0, 40) + '...' : s.caption) : 'Statut Texte'}
        </div>
      );
    }

    const isVideo = s.mediaType === 'video' || s.isVideo || s.is_video || (typeof media === 'string' && (media.includes('.mp4') || media.includes('.webm') || media.includes('.mov') || media.includes('.3gp') || media.startsWith('data:video')));
    
    if (isVideo) {
      const videoSrc = (typeof media === 'string' && !media.startsWith('data:') && !media.includes('#t=')) ? `${media}#t=0.001` : media;
      return (
        <video
          src={videoSrc}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          muted
          playsInline
          preload="metadata"
        />
      );
    }
    return (
      <img
        src={media}
        alt={s.userName || 'Story'}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="lazy"
      />
    );
  };

  return (
    <div style={{
      padding: '14px 14px 12px 14px',
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-light)',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* 1. WHATSAPP BUSINESS STYLE: 'Mon Statut' Rectangular Card */}
      <div
        style={{
          width: '108px',
          height: '168px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          cursor: 'pointer',
          background: myLatestStory ? 'var(--input-bg)' : 'linear-gradient(145deg, rgba(0, 102, 255, 0.15), rgba(0, 71, 255, 0.05))',
          border: isUploadingStory ? '2px solid #0066FF' : '1px solid var(--border-light)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          userSelect: 'none'
        }}
        onClick={() => {
          if (myLatestStory) {
            onSelectStory(myLatestStory, myStories);
          } else {
            onAddStory();
          }
        }}
      >
        {/* Card Background: Story Thumbnail or Fallback Empty */}
        {myLatestStory ? (
          renderCardMedia(myLatestStory)
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px'
          }}>
            <UserAvatar user={currentUser} size={54} border="2px solid #0066FF" />
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#0066FF',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 102, 255, 0.4)'
            }}>
              <Plus size={16} strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Top-Left Incrusted Stacked User Avatar with '+' Badge */}
        {myLatestStory && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onAddStory();
            }}
            title="Ajouter un autre statut"
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ position: 'relative' }}>
              <UserAvatar
                user={currentUser}
                size={38}
                border="2px solid #0066FF"
              />
              {/* Plus Badge */}
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#0066FF',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}>
                <Plus size={10} strokeWidth={3.5} />
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner Overlay during Upload */}
        {isUploadingStory && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            zIndex: 4,
            color: '#FFFFFF'
          }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#00C6FF' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>Envoi...</span>
          </div>
        )}

        {/* Dark Bottom Shadow Gradient with Text */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 8px 8px 8px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#FFFFFF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            Mon statut
          </span>
          <span style={{
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 500
          }}>
            {myLatestStory ? (myStories.length > 1 ? `${myStories.length} statuts` : 'Afficher') : 'Ajouter'}
          </span>
        </div>
      </div>

      {/* 2. OTHER USERS' STORIES: WhatsApp Business Rectangular Cards */}
      {groupedOtherStories.map((story) => {
        const isUnread = story.hasUnread !== false;
        const authorStories = otherStories.filter(s => 
          (s.userId && story.userId && s.userId === story.userId) ||
          (s.user_id && story.user_id && s.user_id === story.user_id) ||
          (s.userName && story.userName && s.userName.toLowerCase() === story.userName.toLowerCase())
        );

        return (
          <div
            key={story.id}
            onClick={() => onSelectStory(story, authorStories.length > 0 ? authorStories : [story])}
            style={{
              width: '108px',
              height: '168px',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              background: 'var(--input-bg)',
              border: isUnread ? '2px solid #0066FF' : '1px solid var(--border-light)',
              boxShadow: isUnread ? '0 4px 14px rgba(0, 102, 255, 0.25)' : '0 4px 10px rgba(0, 0, 0, 0.05)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              userSelect: 'none'
            }}
          >
            {/* Background Story Thumbnail */}
            {renderCardMedia(story)}

            {/* Top-Left Incrusted Author Avatar with Unread Indicator Ring */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              zIndex: 3
            }}>
              <div style={{
                padding: '2px',
                borderRadius: '50%',
                background: isUnread
                  ? 'linear-gradient(135deg, #0066FF 0%, #00C6FF 100%)'
                  : 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                <UserAvatar
                  user={{ name: story.userName, avatar: story.userAvatar || story.avatar, gender: story.gender }}
                  size={36}
                  border="1.5px solid #FFFFFF"
                />
              </div>
            </div>

            {/* Dark Bottom Shadow Gradient with Author Name */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '28px 8px 8px 8px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 60%, transparent 100%)',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {story.userName ? story.userName.split(' ')[0] : 'Artiste'}
              </span>
              <span style={{
                fontSize: '0.65rem',
                color: isUnread ? '#38BDF8' : 'rgba(255, 255, 255, 0.75)',
                fontWeight: 600
              }}>
                {story.storiesCount > 1 ? `${story.storiesCount} statuts` : (isUnread ? 'Nouveau' : (story.time || 'Récent'))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
