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

  // Helper to extract all identifier keys from a story
  const extractStoryKeys = (s) => {
    if (!s) return [];
    const keys = [];
    if (s.userId) keys.push(`id:${String(s.userId).toLowerCase().trim()}`);
    if (s.user_id) keys.push(`id:${String(s.user_id).toLowerCase().trim()}`);
    if (s.authorId) keys.push(`id:${String(s.authorId).toLowerCase().trim()}`);
    if (s.author_id) keys.push(`id:${String(s.author_id).toLowerCase().trim()}`);
    if (s.userName) keys.push(`name:${String(s.userName).toLowerCase().trim()}`);
    if (s.user_name) keys.push(`name:${String(s.user_name).toLowerCase().trim()}`);
    if (s.authorName) keys.push(`name:${String(s.authorName).toLowerCase().trim()}`);
    if (s.author_name) keys.push(`name:${String(s.author_name).toLowerCase().trim()}`);
    return keys;
  };

  const isCurrentUserStory = (s) => {
    if (!s || !currentUser) return false;
    const currentKeys = new Set();
    if (currentUser.id) currentKeys.add(`id:${String(currentUser.id).toLowerCase().trim()}`);
    if (currentUser.name) currentKeys.add(`name:${String(currentUser.name).toLowerCase().trim()}`);

    const storyKeys = extractStoryKeys(s);
    return storyKeys.some(k => currentKeys.has(k));
  };

  // 1. Separate current user's stories from other users
  const myStories = (stories || []).filter(isCurrentUserStory);
  const otherStories = (stories || []).filter(s => !isCurrentUserStory(s));
  const myLatestStory = myStories.length > 0 ? myStories[0] : null;

  // 2. Strict Union-Find Grouping for other users' stories (1 card per creator)
  // If Story A and Story B share ANY key (same userId OR same userName), they merge into the SAME group!
  const creatorGroups = []; // Array of { keys: Set, stories: [] }

  otherStories.forEach(story => {
    const sKeys = extractStoryKeys(story);
    if (sKeys.length === 0) {
      sKeys.push(`story:${story.id}`);
    }

    // Find all existing groups that match at least one key of this story
    const matchingGroupIndices = [];
    creatorGroups.forEach((group, idx) => {
      const hasMatch = sKeys.some(k => group.keys.has(k));
      if (hasMatch) {
        matchingGroupIndices.push(idx);
      }
    });

    if (matchingGroupIndices.length === 0) {
      // Create new group
      creatorGroups.push({
        keys: new Set(sKeys),
        stories: [story]
      });
    } else {
      // Merge all matching groups into the first matching group
      const firstIdx = matchingGroupIndices[0];
      const targetGroup = creatorGroups[firstIdx];

      // Add story to target group
      targetGroup.stories.push(story);
      sKeys.forEach(k => targetGroup.keys.add(k));

      // If multiple groups matched (e.g. one had name, one had id), merge them into target
      for (let i = matchingGroupIndices.length - 1; i > 0; i--) {
        const mergeIdx = matchingGroupIndices[i];
        const otherGroup = creatorGroups[mergeIdx];
        otherGroup.stories.forEach(st => targetGroup.stories.push(st));
        otherGroup.keys.forEach(k => targetGroup.keys.add(k));
        creatorGroups.splice(mergeIdx, 1);
      }
    }
  });

  // Convert merged groups to final card items
  const groupedOtherStories = creatorGroups.map(group => {
    const userStoriesList = group.stories;
    const latestStory = userStoriesList[0];
    const hasUnread = userStoriesList.some(s => s.hasUnread !== false);
    return {
      ...latestStory,
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

          return (
            <div
              key={getCreatorKey(story) || story.id}
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
