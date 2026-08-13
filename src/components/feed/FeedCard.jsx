import React, { useState, useRef } from 'react';
import { Crown, Heart, MessageSquare, Share2, UserPlus, UserCheck, Play, Pause, MoreHorizontal, Send, Trash2, AlertTriangle } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import confetti from 'canvas-confetti';
import UserAvatar from '../common/UserAvatar';

export default function FeedCard({ post, onLike, onFollowUser, onAddComment, onDeletePost, onOpenShare, onOpenReport, onOpenPublicProfile }) {
  const { currentUser } = useAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Double Click / Touch Tap Heart Burst Animation State
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef(0);

  const isAuthor = currentUser && (currentUser.id === post.userId || currentUser.name === post.userName);

  const audioInstanceRef = useRef(null);

  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
      }
      soundEngine.stop();
      setIsPlayingAudio(false);
    } else {
      if (post.audioUrl) {
        const audio = new Audio(post.audioUrl);
        audioInstanceRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          soundEngine.generateAndPlay(120, 'Afro-Gospel');
        };
        audio.play().catch(() => {
          soundEngine.generateAndPlay(120, 'Afro-Gospel');
        });
      } else {
        soundEngine.generateAndPlay(120, 'Afro-Gospel');
      }
      setIsPlayingAudio(true);
    }
  };

  // Double Click / Double Tap to Like Media & Card
  const isLikingRef = useRef(false);

  const triggerLikeBurst = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (isLikingRef.current) return;
    isLikingRef.current = true;

    setShowDoubleTapHeart(true);
    soundEngine.playPopSound();

    onLike(post.id);

    try {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.65 }
      });
    } catch (err) { console.error("Suppressed error", err); }

    setTimeout(() => {
      setShowDoubleTapHeart(false);
      isLikingRef.current = false;
    }, 600);
  };

  const handleCardTouchOrClick = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      triggerLikeBurst(e);
    }
    lastTapRef.current = now;
  };

  const handleFollowClick = () => {
    if (!isFollowing) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      setIsFollowing(true);
      if (onFollowUser) onFollowUser(post);
    } else {
      setIsFollowing(false);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  return (
    <div
      className="card"
      onClick={handleCardTouchOrClick}
      onDoubleClick={triggerLikeBurst}
      style={{ marginBottom: '16px', borderRadius: '18px', position: 'relative', overflow: 'hidden', userSelect: 'none' }}
    >
      {/* Double Tap Floating Heart Overlay */}
      {showDoubleTapHeart && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'scale(1.25)',
            animation: 'likeHeartPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <Heart
              size={96}
              fill="#EF4444"
              color="#EF4444"
              style={{
                filter: 'drop-shadow(0 12px 35px rgba(239, 68, 68, 0.9))'
              }}
            />
          </div>
        </div>
      )}

      {/* Post Header with Clickable Profile Avatar & Name */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserAvatar
            user={{ name: post.userName, avatar: post.userAvatar, gender: post.userGender || post.gender }}
            size={44}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenPublicProfile) onOpenPublicProfile(post);
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h4
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenPublicProfile) onOpenPublicProfile(post);
                }}
                style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer' }}
              >
                {post.userName}
              </h4>

              {/* VIP Gold Badge ONLY for VIP Gold Users */}
              {post.badgeType === 'gold' && (
                <span title="Membre VIP Gold Officiel" style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)'
                }}>
                  <Crown size={10} />
                </span>
              )}

              {/* Prominent Follow / Following Button */}
              {!isAuthor && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowClick();
                  }}
                  style={{
                    background: isFollowing ? '#ECFDF5' : '#EFF6FF',
                    color: isFollowing ? '#047857' : '#0066FF',
                    border: isFollowing ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
                    borderRadius: '16px',
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={13} /> Abonné
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} /> Suivre
                    </>
                  )}
                </button>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{post.userRole} • {post.timeAgo}</span>
          </div>
        </div>

        {/* Options Context Menu Trigger */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptionsMenu(!showOptionsMenu);
            }}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Options Dropdown Menu */}
          {showOptionsMenu && (
            <div style={{
              position: 'absolute',
              top: '28px',
              right: 0,
              zIndex: 30,
              background: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #E2E8F0',
              padding: '6px',
              minWidth: '160px'
            }}>
              {isAuthor ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(false);
                    setShowConfirmDelete(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#FEF2F2',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} /> Supprimer le post
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(false);
                    onOpenReport(post);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#FFFBEB',
                    color: '#D97706',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <AlertTriangle size={14} /> Signaler le contenu
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text */}
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--text-dark)',
        lineHeight: 1.5,
        marginBottom: '12px',
        whiteSpace: 'pre-line'
      }}>
        {post.text}
      </p>

      {/* Multi-Media List (Carousel-like vertical list) */}
      {post.mediaList && post.mediaList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {post.mediaList.map((m, i) => (
            <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', background: '#000', border: '1px solid #E2E8F0' }}>
              {m.type === 'video' ? (
                <video src={m.url} controls playsInline style={{ width: '100%', maxHeight: '420px', display: 'block', objectFit: 'contain' }} />
              ) : (
                <img src={m.url} alt={`Media ${i}`} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Legacy single media support */}
          {post.video && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '12px', background: '#000000', border: '1px solid #CBD5E1' }}
            >
              <video
                src={post.video}
                controls
                playsInline
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '420px', objectFit: 'contain' }}
              />
            </div>
          )}

          {post.image && (
            <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
              <img
                src={post.image}
                alt="Media Attachment"
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
              />
            </div>
          )}
        </>
      )}

      {/* Audio Playback Bar for Vocal Posts */}
      {post.hasAudio && (post.audioUrl || post.audioTitle) && (
        <div
          onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
          style={{
            background: isPlayingAudio ? 'linear-gradient(135deg, #0066FF, #0047FF)' : '#EFF6FF',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            border: isPlayingAudio ? 'none' : '1px solid #BFDBFE',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: isPlayingAudio ? '#FFF' : '#0066FF',
            color: isPlayingAudio ? '#0066FF' : '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isPlayingAudio ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isPlayingAudio ? '#FFF' : '#0066FF' }}>
              {post.audioTitle || 'Message Vocal StageLink'}
            </div>
            {isPlayingAudio && (
              <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} style={{ width: '3px', height: '10px', background: '#FFF', borderRadius: '2px', animation: 'bounce 0.8s infinite alternate' }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: '10px',
        borderTop: '1px solid #F1F5F9'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            soundEngine.playLikePopSound();
            if (!post.isLiked) {
              triggerLikeBurst();
            } else {
              onLike(post.id);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: post.isLiked ? '#EF4444' : '#64748B',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Heart size={18} fill={post.isLiked ? '#EF4444' : 'none'} />
          <span>{post.likesCount} J'aime</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(!showComments);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#64748B',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={18} />
          <span>{post.commentsCount || (post.comments ? post.comments.length : 0)} Commentaires</span>
        </button>

        {/* Social Share Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenShare(post);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#64748B',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Share2 size={18} />
          <span>Partager</span>
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}
        >
          {post.comments && post.comments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {post.comments.map((c) => (
                <div key={c.id} style={{ background: 'var(--bg-light)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)', marginRight: '6px' }}>{c.userName}:</span>
                  <span style={{ color: 'var(--text-dark)' }}>{c.text}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Écrire un commentaire..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '18px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#0066FF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Confirm Post Deletion Modal */}
      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => onDeletePost(post.id)}
        title="Supprimer cette publication ?"
        message="Êtes-vous sûr de vouloir supprimer cette publication de votre fil d'actualité ?"
        confirmText="Supprimer le post"
      />
    </div>
  );
}
