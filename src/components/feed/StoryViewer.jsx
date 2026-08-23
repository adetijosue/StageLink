import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, Repeat, Trash2, Eye, Check, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../services/audioService';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import UserAvatar from '../common/UserAvatar';
import confetti from 'canvas-confetti';
import { formatTimeAgo } from '../../utils/timeAgo';

export default function StoryViewer({
  story,
  userStories = [],
  allStories = [],
  onClose,
  onReplyToInbox,
  onSendReply,
  onReshareStory,
  onDeleteStory,
  initialShowViewers,
  onLikeStory,
  onViewStory
}) {
  const { currentUser } = useAuth();

  // Helper to extract keys for author matching (strictly by userId)
  const extractStoryKeys = (s) => {
    if (!s) return [];
    const keys = [];
    const uid = s.userId || s.user_id || s.authorId || s.author_id;
    if (uid) {
      keys.push(`id:${String(uid).toLowerCase().trim()}`);
    } else if (s.userName && s.userName !== 'Artiste StageLink' && s.userName !== 'Artiste' && s.userName !== 'Moi') {
      keys.push(`name:${String(s.userName).toLowerCase().trim()}`);
    } else if (s.id) {
      keys.push(`story:${String(s.id).toLowerCase().trim()}`);
    }
    return keys;
  };

  const activeStoryKeys = new Set(extractStoryKeys(story));

  const currentAuthorStories = (userStories && userStories.length > 0)
    ? userStories
    : (allStories || []).filter(s => {
        const sKeys = extractStoryKeys(s);
        return sKeys.some(k => activeStoryKeys.has(k));
      });

  const playlist = currentAuthorStories.length > 0 ? currentAuthorStories : (story ? [story] : []);

  // Find initial index
  const initialIndex = story ? Math.max(0, playlist.findIndex(s => s.id === story.id)) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [progress, setProgress] = useState(0);

  // Sync index when story prop changes
  useEffect(() => {
    if (story) {
      const idx = playlist.findIndex(s => s.id === story.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
        setProgress(0);
      }
    }
  }, [story?.id]);

  const currentStory = playlist[currentIndex] || story;

  const [isLiked, setIsLiked] = useState(currentStory?.isLiked || false);
  const [likesCount, setLikesCount] = useState(currentStory?.likesCount || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(initialShowViewers || false);
  const [showConfirmDeleteStory, setShowConfirmDeleteStory] = useState(false);
  const [isHoldingPress, setIsHoldingPress] = useState(false);
  const [isTypingReply, setIsTypingReply] = useState(false);

  const videoRef = useRef(null);

  // Sync likes and reset progress on story index change
  useEffect(() => {
    if (currentStory) {
      setIsLiked(currentStory.isLiked || false);
      setLikesCount(currentStory.likesCount || 0);
      setProgress(0);
      if (currentStory.id && onViewStory) {
        onViewStory(currentStory.id, currentStory.userId);
      }
    }
  }, [currentIndex, currentStory?.id]);

  const isOwner = currentUser && currentStory && (
    (currentStory.userId && String(currentUser.id).toLowerCase().trim() === String(currentStory.userId).toLowerCase().trim()) ||
    (currentStory.user_id && String(currentUser.id).toLowerCase().trim() === String(currentStory.user_id).toLowerCase().trim()) ||
    (currentStory.isOwner === true)
  );

  const activeMediaUrl = currentStory?.mediaUrl || currentStory?.storyMedia || currentStory?.media || currentStory?.media_url || currentStory?.image || currentStory?.videoUrl || currentStory?.video_url || currentStory?.video || currentStory?.url;
  const isVideoMedia = currentStory?.mediaType === 'video' || currentStory?.isVideo || currentStory?.is_video || (typeof activeMediaUrl === 'string' && (activeMediaUrl.includes('.mp4') || activeMediaUrl.includes('.webm') || activeMediaUrl.includes('.mov') || activeMediaUrl.startsWith('data:video')));
  const canReshare = currentStory?.allowReshare !== false;
  const viewersList = Array.isArray(currentStory?.viewers) ? currentStory.viewers : [];

  const isPaused = showViewersModal || showConfirmDeleteStory || isHoldingPress || isTypingReply || replyText.trim().length > 0;

  // Next and Previous Story Navigation using functional state updates
  const goToNextStory = () => {
    setCurrentIndex((prev) => {
      if (prev < playlist.length - 1) {
        setProgress(0);
        return prev + 1;
      } else {
        if (onClose) setTimeout(() => onClose(), 0);
        return prev;
      }
    });
  };

  const goToPrevStory = () => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        setProgress(0);
        return prev - 1;
      } else {
        setProgress(0);
        return 0;
      }
    });
  };

  // Progress Timer with auto-advance
  useEffect(() => {
    if (isPaused) {
      if (videoRef.current) videoRef.current.pause();
      return;
    }
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    const intervalStep = 50; // update every 50ms
    const totalDuration = isVideoMedia ? 8000 : 5000; // 5s for image, 8s for video
    const increment = (intervalStep / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          goToNextStory();
          return 100;
        }
        return next;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, isVideoMedia, playlist.length]);

  if (!currentStory) return null;

  const filtersList = [
    { id: 'none', css: 'none' },
    { id: 'grayscale', css: 'grayscale(1)' },
    { id: 'sepia', css: 'sepia(0.8)' },
    { id: 'vintage', css: 'brightness(1.1) contrast(1.1) saturate(0.8)' },
    { id: 'neon', css: 'hue-rotate(90deg) brightness(1.2)' }
  ];
  const filterCss = filtersList.find(f => f.id === currentStory.filter)?.css || 'none';

  const handleToggleLike = () => {
    soundEngine.playLikePopSound();
    let newIsLiked = !isLiked;
    if (newIsLiked) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });
      setLikesCount(prev => prev + 1);
      const replyHandler = onSendReply || onReplyToInbox;
      if (replyHandler && !isOwner) {
        replyHandler(currentStory, '❤️');
        setReplySent(true);
        setTimeout(() => setReplySent(false), 3000);
      }
    } else {
      setLikesCount(prev => Math.max(0, prev - 1));
    }
    setIsLiked(newIsLiked);
    if (onLikeStory) {
      onLikeStory(currentStory.id, currentStory.userId, newIsLiked);
    }
  };

  const handleSendReplyToInbox = (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    soundEngine.playPopSound();

    const replyHandler = onSendReply || onReplyToInbox;
    if (replyHandler) {
      replyHandler(currentStory, replyText.trim());
    }

    setReplySent(true);
    setReplyText('');
    setIsTypingReply(false);

    setTimeout(() => {
      setReplySent(false);
    }, 3500);
  };

  const handleReshare = () => {
    soundEngine.playPopSound();
    if (onReshareStory) {
      onReshareStory(currentStory);
    }
  };

  const handleDeleteCurrentStory = () => {
    if (onDeleteStory) {
      onDeleteStory(currentStory.id);
    }
    if (playlist.length <= 1) {
      if (onClose) onClose();
    } else {
      goToNextStory();
    }
  };

  return (
    <div
      onPointerDown={(e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && !e.target.closest('button') && !e.target.closest('form')) {
          setIsHoldingPress(true);
        }
      }}
      onPointerUp={() => setIsHoldingPress(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        height: '100%',
        background: currentStory.bgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px)',
        overflow: 'hidden'
      }}>
        {/* Background Media Render */}
        {activeMediaUrl ? (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isVideoMedia ? (
              <>
                {/* Blurred Video Backdrop */}
                <video
                  src={activeMediaUrl}
                  muted
                  playsInline
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', filter: 'blur(28px) brightness(0.4)', opacity: 0.75
                  }}
                />

                {/* Main Video */}
                <video
                  ref={videoRef}
                  src={activeMediaUrl}
                  autoPlay
                  playsInline
                  loop
                  muted={isMuted}
                  style={{
                    position: 'relative', zIndex: 2,
                    width: '100%', height: '100%',
                    objectFit: 'contain', filter: filterCss
                  }}
                />
              </>
            ) : (
              <>
                {/* Blurred Image Backdrop */}
                <img
                  src={activeMediaUrl}
                  alt="Story Backdrop"
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', filter: 'blur(28px) brightness(0.4)', opacity: 0.75
                  }}
                />

                {/* Main Image */}
                <img
                  src={activeMediaUrl}
                  alt="Story Content"
                  style={{
                    position: 'relative', zIndex: 2,
                    width: '100%', height: '100%',
                    objectFit: 'contain', filter: filterCss
                  }}
                />
              </>
            )}

            {/* Stickers Overlay */}
            {currentStory.stickers?.map(s => (
              <div key={s.id} style={{ position: 'absolute', zIndex: 5, left: s.x, top: s.y, color: s.color, fontSize: '1.5rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                {s.text}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#FFFFFF', fontSize: '1.4rem', fontWeight: 800, textShadow: '0 4px 15px rgba(0,0,0,0.5)', lineHeight: 1.4 }}>
              {currentStory.caption || 'Statut StageLink 🎵'}
            </p>
          </div>
        )}

        {/* Tap-To-Navigate Left & Right Touch Areas */}
        <div
          onClick={goToPrevStory}
          style={{
            position: 'absolute',
            top: '80px',
            bottom: '100px',
            left: 0,
            width: '35%',
            zIndex: 6,
            cursor: 'pointer'
          }}
          title="Statut précédent"
        />
        <div
          onClick={goToNextStory}
          style={{
            position: 'absolute',
            top: '80px',
            bottom: '100px',
            right: 0,
            width: '65%',
            zIndex: 6,
            cursor: 'pointer'
          }}
          title="Statut suivant"
        />

        {/* Dark Overlay Gradient for Legibility */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />

        {/* Toast Sent Reply Confirmation */}
        {replySent && (
          <div style={{
            position: 'absolute',
            top: '85px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(16, 185, 129, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '24px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <Check size={18} strokeWidth={3} />
            <span>Message envoyé à {currentStory.userName} dans son chat privé !</span>
          </div>
        )}

        {/* Top Header & Segmented WhatsApp Progress Indicators */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Segmented Progress Bars (1 segment per story of this author) */}
          <div style={{
            display: 'flex',
            gap: '4px',
            width: '100%',
            marginBottom: '12px'
          }}>
            {playlist.map((item, idx) => {
              let segmentWidth = '0%';
              if (idx < currentIndex) segmentWidth = '100%';
              else if (idx === currentIndex) segmentWidth = `${progress}%`;

              return (
                <div
                  key={item.id || idx}
                  style={{
                    flex: 1,
                    height: '3px',
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    width: segmentWidth,
                    height: '100%',
                    background: '#FFFFFF',
                    transition: (idx === currentIndex && !isPaused) ? 'width 0.05s linear' : 'none'
                  }} />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserAvatar user={{ name: currentStory.userName, avatar: currentStory.userAvatar || currentStory.avatar, gender: currentStory.gender }} size={38} border="2px solid #FFF" />
              <div>
                <h4 style={{ color: '#FFF', margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                  {currentStory.userName}
                  {playlist.length > 1 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: 0.8, marginLeft: '6px' }}>
                      ({currentIndex + 1}/{playlist.length})
                    </span>
                  )}
                </h4>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                  {formatTimeAgo(currentStory.created_at || currentStory.createdAt || currentStory.createdAtTimestamp || currentStory.time)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 12 }}>
              {isVideoMedia && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.25)',
                    color: '#FFF', width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                  title={isMuted ? 'Activer le son' : 'Désactiver le son'}
                >
                  {isMuted ? <VolumeX size={18} color="#FF4D4D" /> : <Volume2 size={18} color="#FFF" />}
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClose) onClose();
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #FCA5A5',
                  color: '#EF4444',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Fermer"
              >
                <X size={18} color="#EF4444" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Caption & Actions */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {currentStory.caption && activeMediaUrl && (
            <p style={{ color: '#FFF', fontWeight: 600, fontSize: '0.95rem', marginBottom: '16px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {currentStory.caption}
            </p>
          )}

          {isOwner ? (
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', padding: '12px 16px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setShowViewersModal(true)} style={{ background: '#0066FF', color: '#FFF', border: 'none', borderRadius: '14px', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <Eye size={16} /> {viewersList.length} Vues
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontSize: '0.82rem', fontWeight: 700 }}>
                <Heart size={16} fill="#EF4444" color="#EF4444" /> {likesCount} Likes
              </div>
              <button onClick={() => setShowConfirmDeleteStory(true)} style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#EF4444', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendReplyToInbox} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Quick Emoji Reactions */}
              {/* Quick Emoji Reactions */}
              {!isOwner && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  marginBottom: '10px'
                }}>
                  {['❤️', '🔥', '👏', '😂', '😮', '😢', '😍', '🙌'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const replyHandler = onSendReply || onReplyToInbox;
                        if (replyHandler) replyHandler(currentStory, emoji);
                        soundEngine.playPopSound();
                        confetti({
                          particleCount: 22,
                          spread: 50,
                          origin: { y: 0.85 },
                          scalar: 1.1
                        });
                        setReplySent(true);
                        setTimeout(() => setReplySent(false), 3000);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.22)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        fontSize: '1.4rem',
                        lineHeight: 1,
                        padding: '6px 8px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, background 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder={`Envoyer un message à ${currentStory.userName.split(' ')[0]}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onFocus={() => setIsTypingReply(true)}
                onBlur={() => setIsTypingReply(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '24px',
                  padding: '12px 16px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={!replyText.trim()}
                style={{
                  background: replyText.trim() ? '#0066FF' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: replyText.trim() ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease',
                  flexShrink: 0
                }}
              >
                <Send size={18} />
              </button>

              {/* Like Heart Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                style={{
                  background: isLiked ? '#EF4444' : 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(12px)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Heart size={20} fill={isLiked ? '#FFFFFF' : 'none'} />
              </button>

              {/* Repartager / Reshare Story Button */}
              {canReshare && (
                <button
                  type="button"
                  onClick={handleReshare}
                  title="Repartager cette story"
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(12px)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Repeat size={18} />
                </button>
              )}
            </form>
          )}
        </div>

        {/* Viewers List Modal */}
        {showViewersModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}>
            <div className="animate-slide-up" style={{ width: '100%', background: '#FFF', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#000' }}>Vues ({viewersList.length})</h3>
                <button onClick={() => setShowViewersModal(false)}><X size={20} /></button>
              </div>
              {viewersList.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '10px', background: '#F8FAFC', borderRadius: '12px' }}>
                  <UserAvatar user={{ avatar: v.avatar, name: v.name }} size={35} />
                  <div><h4 style={{ margin: 0, fontSize: '0.85rem', color: '#000' }}>{v.name}</h4><span style={{ fontSize: '0.7rem', color: '#64748B' }}>{v.role}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmDeleteModal
          isOpen={showConfirmDeleteStory}
          onClose={() => setShowConfirmDeleteStory(false)}
          onConfirm={() => {
            handleDeleteCurrentStory();
            setShowConfirmDeleteStory(false);
          }}
          title="Supprimer cette story ?"
          message="Cette action est irréversible."
        />
      </div>
    </div>
  );
}
