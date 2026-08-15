import React from 'react';
import { Plus, Camera, Pencil, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';

export default function StoryBar({
  stories = [],
  onSelectStory,
  onAddStory,
  onAddTextStory,
  isUploadingStory = false
}) {
  const { currentUser } = useAuth();

  // Precise identification of current user stories (Strictly by userId to prevent name collision)
  const isCurrentUserStory = (s) => {
    if (!s || !currentUser) return false;
    const sUserId = s.userId || s.user_id || s.authorId || s.author_id;
    if (sUserId && currentUser.id) {
      return String(sUserId).toLowerCase().trim() === String(currentUser.id).toLowerCase().trim();
    }
    if (s.userName && currentUser.name && s.userName !== 'Artiste StageLink' && s.userName !== 'Artiste' && s.userName !== 'Moi') {
      return String(s.userName).toLowerCase().trim() === String(currentUser.name).toLowerCase().trim();
    }
    return false;
  };

  // 1. Separate current user's stories from other users
  const myStories = (stories || []).filter(isCurrentUserStory);
  const otherStories = (stories || []).filter(s => !isCurrentUserStory(s));
  const myLatestStory = myStories.length > 0 ? myStories[0] : null;

  // 2. Strict Per-Creator Grouping for other users' stories (1 card per creator with all their stories grouped)
  const creatorGroupsMap = new Map();

  otherStories.forEach(story => {
    const authorId = story.userId || story.user_id || story.authorId || story.author_id;
    const authorKey = authorId
      ? `uid_${String(authorId).toLowerCase().trim()}`
      : (story.userName && story.userName !== 'Artiste StageLink' ? `name_${String(story.userName).toLowerCase().trim()}` : `story_${story.id}`);

    if (!creatorGroupsMap.has(authorKey)) {
      creatorGroupsMap.set(authorKey, {
        ...story,
        groupId: authorKey,
        userStories: [story]
      });
    } else {
      const existingGroup = creatorGroupsMap.get(authorKey);
      existingGroup.userStories.push(story);
    }
  });

  // Convert map to grouped other stories array
  const groupedOtherStories = Array.from(creatorGroupsMap.values()).map(group => {
    const userStoriesList = group.userStories || [group];
    const latestStory = userStoriesList[0];
    const hasUnread = userStoriesList.some(s => s.hasUnread !== false);
    return {
      ...latestStory,
      groupId: group.groupId,
      storiesCount: userStoriesList.length,
      userStories: userStoriesList,
      hasUnread
    };
  });

  const renderCardMedia = (s) => {
    if (!s) return null;
    const media = s.storyMedia || s.mediaUrl || s.media || s.media_url || s.image || s.videoUrl || s.video_url || s.video || s.url || (s.mediaList && s.mediaList[0]?.url);
    
    // Text Status Card (Centered Text Preview with Gradient, exactly like WhatsApp)
    if (!media) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: s.bgGradient || 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 10px',
          color: '#FFFFFF',
          fontSize: '0.76rem',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: '1.35',
          wordBreak: 'break-word',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)'
        }}>
          {s.caption ? (s.caption.length > 55 ? s.caption.slice(0, 55) + '...' : s.caption) : 'Statut Texte'}
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
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-light)',
      paddingTop: '16px',
      paddingBottom: '14px'
    }}>
      {/* 1. TOP HEADER: 'Status' Title + Action Buttons (Camera & Pencil) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '18px',
        paddingRight: '18px',
        marginBottom: '14px'
      }}>
        <h3 style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          Status
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Camera Story Button */}
          <button
            onClick={() => onAddStory && onAddStory()}
            title="Prendre une photo / vidéo"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--input-bg, #F1F5F9)',
              border: '1px solid var(--border-light, #E2E8F0)',
              color: 'var(--text-primary, #0F172A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.15s ease, background 0.15s ease'
            }}
          >
            <Camera size={18} strokeWidth={2.2} />
          </button>

          {/* Text Story / Pencil Button */}
          <button
            onClick={() => {
              if (onAddTextStory) onAddTextStory();
              else if (onAddStory) onAddStory();
            }}
            title="Écrire un statut texte"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--input-bg, #F1F5F9)',
              border: '1px solid var(--border-light, #E2E8F0)',
              color: 'var(--text-primary, #0F172A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.15s ease, background 0.15s ease'
            }}
          >
            <Pencil size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 2. HORIZONTAL STATUS CARDS TRAY */}
      <div style={{
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        paddingLeft: '18px',
        paddingRight: '18px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* CARD 1: 'My status' (Mon statut) */}
        <div
          style={{
            width: '114px',
            height: '174px',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: 'pointer',
            background: myLatestStory ? '#1E293B' : 'linear-gradient(145deg, #1E293B, #0F172A)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
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
          {/* Card Media Preview (Image, Video, or Text) */}
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
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
            }} />
          )}

          {/* Top-Left Incrusted User Avatar with WhatsApp Green Ring & Black Plus Badge */}
          <div
            onClick={(e) => {
              if (myLatestStory) {
                e.stopPropagation();
                onAddStory();
              }
            }}
            title="Ajouter un statut"
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 3
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{
                padding: '2.5px',
                borderRadius: '50%',
                background: '#22C55E', // WhatsApp signature bright green ring
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserAvatar
                  user={currentUser}
                  size={42}
                  border="2px solid #FFFFFF"
                />
              </div>

              {/* Black Circular Badge with White Plus (Exact match from screenshot) */}
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#0F172A',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
              }}>
                <Plus size={12} strokeWidth={3.5} />
              </div>
            </div>
          </div>

          {/* Loading Spinner Overlay during Upload */}
          {isUploadingStory && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              zIndex: 4,
              color: '#FFFFFF'
            }}>
              <Loader2 size={24} className="animate-spin" style={{ color: '#22C55E' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>Envoi...</span>
            </div>
          )}

          {/* Dark Bottom Shadow Gradient with 'My status' Text */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '28px 10px 10px 10px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 65%, transparent 100%)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}>
            <span style={{
              fontSize: '0.84rem',
              fontWeight: 800,
              color: '#FFFFFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)'
            }}>
              My status
            </span>
          </div>
        </div>

        {/* CARDS 2+: OTHER USERS' STATUS CARDS */}
        {groupedOtherStories.map((story) => {
          const isUnread = story.hasUnread !== false;
          const authorStories = story.userStories && story.userStories.length > 0 ? story.userStories : [story];
          const cardKey = story.groupId || (authorStories[0] && authorStories[0].id) || story.id;

          return (
            <div
              key={cardKey}
              onClick={() => onSelectStory(authorStories[0] || story, authorStories)}
              style={{
                width: '114px',
                height: '174px',
                borderRadius: '20px',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                cursor: 'pointer',
                background: '#1E293B',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                userSelect: 'none'
              }}
            >
              {/* Background Story Thumbnail */}
              {renderCardMedia(story)}

              {/* Top-Left Incrusted Author Avatar with WhatsApp Green Ring */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 3
              }}>
                <div style={{
                  padding: '2.5px',
                  borderRadius: '50%',
                  background: isUnread ? '#22C55E' : 'rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserAvatar
                    user={{ name: story.userName, avatar: story.userAvatar || story.avatar, gender: story.gender }}
                    size={42}
                    border="2px solid #FFFFFF"
                  />
                </div>
              </div>

              {/* Dark Bottom Shadow Gradient with Author Full Name */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '32px 10px 10px 10px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: '1.2',
                  maxHeight: '2.4em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                }}>
                  {story.userName || 'Artiste'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
