import React, { useState, useRef } from 'react';
import { 
  Crown, Heart, MessageSquare, Share2, UserPlus, UserCheck, 
  Play, Pause, MoreHorizontal, Send, Trash2, AlertTriangle,
  ShoppingBag, Sliders, GraduationCap, Calendar, ChevronRight, ExternalLink
} from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { haptics } from '../../services/hapticsService';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import confetti from 'canvas-confetti';
import UserAvatar from '../common/UserAvatar';

function FeedCard({ 
  post, 
  onLike, 
  onFollowUser, 
  onAddComment, 
  onDeletePost, 
  onOpenShare, 
  onOpenReport, 
  onOpenPublicProfile,
  onOpenProServiceAction,
  onStartChat
}) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
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
    haptics.selection();
    window.dispatchEvent(new CustomEvent('play_global_audio', {
      detail: {
        title: post.audioTitle || (post.content ? post.content.substring(0, 32) : 'Publication Vocale'),
        artist: post.userName || 'Artiste StageLink',
        genre: post.category || 'Afro-Gospel',
        coverUrl: post.userAvatar || post.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
        audioUrl: post.audioUrl || null,
        lyrics: post.content || null,
        bpm: 120
      }
    }));
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
    haptics.like();

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
    const DOUBLE_TAP_DELAY = 320;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      triggerLikeBurst(e);
    }
    lastTapRef.current = now;
  };

  const handleFollowClick = () => {
    haptics.success();
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
    haptics.medium();
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const pro = post.proServiceData;

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
                <span title={language === 'en' ? 'Official VIP Gold Member' : 'Membre VIP Gold Officiel'} style={{
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
                      <UserCheck size={13} /> {language === 'en' ? 'Following' : 'Suivi'}
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} /> {language === 'en' ? 'Follow' : 'Suivre'}
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
                  <Trash2 size={14} /> {language === 'en' ? 'Delete post' : 'Supprimer le post'}
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
                  <AlertTriangle size={14} /> {language === 'en' ? 'Report content' : 'Signaler le contenu'}
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

      {/* ------------------------------------------------------------------ */}
      {/* RICH PRO SERVICE EMBEDDED CARD (BEAT, SERVICE, COURSE, EVENT)      */}
      {/* ------------------------------------------------------------------ */}
      {pro && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginBottom: '14px',
            borderRadius: '18px',
            overflow: 'hidden',
            border: '1.5px solid rgba(0, 102, 255, 0.25)',
            background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)',
            boxShadow: '0 4px 16px rgba(0, 102, 255, 0.08)'
          }}
        >
          {/* Card Category Header Banner */}
          <div
            style={{
              padding: '6px 12px',
              background: pro.proType === 'work' ? 'linear-gradient(90deg, #0066FF, #0047FF)' :
                          pro.proType === 'service' ? 'linear-gradient(90deg, #10B981, #059669)' :
                          pro.proType === 'course' ? 'linear-gradient(90deg, #0066FF, #0284C7)' :
                          pro.proType === 'job' ? 'linear-gradient(90deg, #8B5CF6, #6D28D9)' :
                          'linear-gradient(90deg, #F59E0B, #D97706)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              fontWeight: 800
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {pro.proType === 'work' ? <ShoppingBag size={14} /> :
               pro.proType === 'service' ? <Sliders size={14} /> :
               pro.proType === 'course' ? <GraduationCap size={14} /> :
               pro.proType === 'job' ? <Award size={14} /> :
               <Calendar size={14} />}
              {pro.proType === 'work' ? (language === 'en' ? 'WORK & BEAT FOR SALE' : 'ŒUVRE & BEAT EN VENTE') :
               pro.proType === 'service' ? (language === 'en' ? 'STUDIO SERVICE & MIX' : 'PRESTATION STUDIO & MIX') :
               pro.proType === 'course' ? (language === 'en' ? 'COURSE & MASTERCLASS' : 'FORMATION & MASTERCLASS') :
               pro.proType === 'job' ? (language === 'en' ? 'JOB OFFER & CASTING' : 'OFFRE D\'EMPLOI & CASTING') :
               (language === 'en' ? 'PRO LIVE EVENT' : 'ÉVÉNEMENT LIVE PRO')}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>
              {language === 'en' ? 'Official StageLink Offer' : 'Offre Officielle StageLink'}
            </span>
          </div>

          {/* Card Content Details */}
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {pro.cover ? (
                <img
                  src={pro.cover}
                  alt={pro.title}
                  style={{ width: '70px', height: '70px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '14px',
                  background: 'rgba(0,102,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  flexShrink: 0
                }}>
                  {pro.icon || (pro.proType === 'job' ? '💼' : '🎵')}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 3px 0' }}>
                  {pro.title}
                </h4>
                <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '0 0 4px 0' }}>
                  {pro.author || pro.provider || pro.instructor || pro.organizer || pro.company}
                  {pro.genre ? ` • ${pro.genre}` : ''}
                  {pro.delivery ? ` • ${pro.delivery}` : ''}
                  {pro.duration ? ` • ${pro.duration}` : ''}
                  {pro.location ? ` • ${pro.location}` : ''}
                  {pro.date ? ` • ${pro.date}` : ''}
                </p>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#10B981' }}>
                  {pro.price}
                </span>
              </div>
            </div>

            {pro.description && (
              <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                {pro.description}
              </p>
            )}

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  soundEngine?.playPopSound?.();
                  if (pro.proType === 'job' && onStartChat) {
                    onStartChat(
                      { id: pro.userId, name: pro.author || pro.company || 'Recruteur', avatar: pro.authorAvatar || pro.cover },
                      `Bonjour, je souhaite postuler à votre offre de job : "${pro.title}". Voici mon profil et mes compétences.`
                    );
                  } else if (onOpenProServiceAction) {
                    onOpenProServiceAction(pro);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: pro.proType === 'work' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                              pro.proType === 'service' ? 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)' :
                              pro.proType === 'course' ? 'linear-gradient(135deg, #0066FF 0%, #0284C7 100%)' :
                              pro.proType === 'job' ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' :
                              'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                }}
              >
                {pro.proType === 'work' ? (language === 'en' ? `Buy Work (${pro.price})` : `Acheter l'Œuvre (${pro.price})`) :
                 pro.proType === 'service' ? (language === 'en' ? `Order (${pro.price})` : `Commander (${pro.price})`) :
                 pro.proType === 'course' ? (language === 'en' ? `Enroll (${pro.price})` : `S'inscrire (${pro.price})`) :
                 pro.proType === 'job' ? (language === 'en' ? `Apply to Job (${pro.price})` : `Postuler à l'offre (${pro.price})`) :
                 (language === 'en' ? `Book Ticket (${pro.price})` : `Réserver Billet (${pro.price})`)}
                <ChevronRight size={15} />
              </button>

              {!isAuthor && onStartChat && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine?.playPopSound?.();
                    onStartChat(
                      { id: pro.userId, name: pro.author || pro.provider || pro.instructor || pro.organizer, avatar: pro.authorAvatar || pro.providerAvatar || pro.cover },
                      `À propos de votre offre : ${pro.title}`
                    );
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #BFDBFE',
                    background: '#EFF6FF',
                    color: '#0066FF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MessageSquare size={14} /> {language === 'en' ? 'Contact' : 'Contacter'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Media List (Carousel-like vertical list) */}
      {!pro && post.mediaList && post.mediaList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {post.mediaList.map((m, i) => (
            <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', background: '#000', border: '1px solid #E2E8F0' }}>
              {m.type === 'video' ? (
                <video src={m.url} controls playsInline style={{ width: '100%', maxHeight: '420px', display: 'block', objectFit: 'contain' }} />
              ) : (
                <img src={m.url} alt={`Media ${i}`} loading="lazy" decoding="async" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
              )}
            </div>
          ))}
        </div>
      ) : !pro && (
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
              {post.audioTitle || (language === 'en' ? 'StageLink Voice Message' : 'Message Vocal StageLink')}
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
            haptics.like();
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
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '12px',
            transition: 'transform 0.12s ease'
          }}
          className="feed-action-btn"
        >
          <Heart size={19} fill={post.isLiked ? '#EF4444' : 'none'} />
          <span>{post.likesCount} {language === 'en' ? 'Likes' : 'J\'aime'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            haptics.light();
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
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '12px',
            transition: 'transform 0.12s ease'
          }}
          className="feed-action-btn"
        >
          <MessageSquare size={19} />
          <span>{post.commentsCount} {language === 'en' ? 'Comments' : 'Commentaires'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            haptics.medium();
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
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '12px',
            transition: 'transform 0.12s ease'
          }}
          className="feed-action-btn"
        >
          <Share2 size={19} />
          <span>{language === 'en' ? 'Share' : 'Partager'}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
          {post.comments && post.comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {post.comments.map((c) => (
                <div key={c.id} style={{ fontSize: '0.8rem', background: '#F8FAFC', padding: '8px 12px', borderRadius: '10px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)', marginRight: '6px' }}>{c.userName}:</span>
                  <span style={{ color: '#475569' }}>{c.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', textAlign: 'center', margin: '8px 0 12px' }}>
              {language === 'en' ? 'No comments yet. Be the first to comment!' : 'Aucun commentaire. Soyez le premier à commenter !'}
            </p>
          )}

          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={language === 'en' ? 'Write a comment...' : 'Écrire un commentaire...'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#0066FF',
                color: '#FFF',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Confirm Delete Post Modal */}
      {showConfirmDelete && (
        <ConfirmDeleteModal
          isOpen={showConfirmDelete}
          title={language === 'en' ? 'Delete Post' : 'Supprimer la publication'}
          message={language === 'en' ? 'Are you sure you want to delete this post? This action cannot be undone.' : 'Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.'}
          onConfirm={() => {
            setShowConfirmDelete(false);
            onDeletePost(post.id);
          }}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default React.memo(FeedCard);
