import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, Share2, Check, Eye, Trash2, Sparkles, MessageCircle, User, Play, Pause, Mic, Music, Repeat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../services/audioService';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import confetti from 'canvas-confetti';

export default function StoryViewer({ story, onClose, onReplyToInbox, onReshareStory, onShareStory, onDeleteStory, initialShowViewers }) {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(story?.likesCount || 12);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(initialShowViewers || false);
  const [showConfirmDeleteStory, setShowConfirmDeleteStory] = useState(false);
  const [isHoldingPress, setIsHoldingPress] = useState(false);
  const [isTypingReply, setIsTypingReply] = useState(false);

  const videoRef = useRef(null);

  const isOwner = currentUser && (
    currentUser.id === story?.userId ||
    currentUser.name === story?.userName ||
    story?.isOwner === true
  );

  const viewersList = [
    { id: 'vw_1', name: 'Sarah Jenkins', role: 'Artiste Chanteuse', timeAgo: '2m', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    { id: 'vw_2', name: 'Alex Rivera', role: 'Ingénieur Mixage', timeAgo: '8m', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
  ];

  const isPaused = showViewersModal || showConfirmDeleteStory || isHoldingPress || isTypingReply || replyText.trim().length > 0;

  useEffect(() => {
    if (isPaused) {
      if (videoRef.current) videoRef.current.pause();
      return;
    }
    if (videoRef.current) videoRef.current.play();

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onClose && onClose(), 0);
          return 100;
        }
        return prev + (story.mediaType === 'video' ? 0.8 : 1.5);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onClose, isPaused, story.mediaType]);

  if (!story) return null;

  const filtersList = [
    { id: 'none', css: 'none' },
    { id: 'grayscale', css: 'grayscale(1)' },
    { id: 'sepia', css: 'sepia(0.8)' },
    { id: 'vintage', css: 'brightness(1.1) contrast(1.1) saturate(0.8)' },
    { id: 'neon', css: 'hue-rotate(90deg) brightness(1.2)' }
  ];
  const filterCss = filtersList.find(f => f.id === story.filter)?.css || 'none';

  return (
    <div
      onPointerDown={(e) => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') setIsHoldingPress(true); }}
      onPointerUp={() => setIsHoldingPress(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{
        position: 'relative', width: '100%', maxWidth: '480px', height: '100%',
        background: story.bgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px)'
      }}>
        {/* Background Media */}
        {story.mediaUrl && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {story.mediaType === 'video' ? (
              <video ref={videoRef} src={story.mediaUrl} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterCss }} />
            ) : (
              <img src={story.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterCss }} />
            )}

            {/* Stickers Overlay */}
            {story.stickers?.map(s => (
              <div key={s.id} style={{ position: 'absolute', left: s.x, top: s.y, color: s.color, fontSize: '1.5rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {s.text}
              </div>
            ))}
          </div>
        )}

        {/* Gradient Overlay for legibility */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />

        {/* Top Progress & User Info */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#FFF', transition: isPaused ? 'none' : 'width 0.1s linear' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={story.userAvatar || story.avatar} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #FFF' }} />
              <div>
                <h4 style={{ color: '#FFF', margin: 0, fontSize: '0.9rem' }}>{story.userName}</h4>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>{story.time}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#FFF' }}><X size={24} /></button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {story.caption && <p style={{ color: '#FFF', fontWeight: 600, marginBottom: '16px' }}>{story.caption}</p>}

          {isOwner ? (
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setShowViewersModal(true)} style={{ background: '#0066FF', color: '#FFF', border: 'none', borderRadius: '10px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800 }}>👁️ {viewersList.length} vues</button>
              <button onClick={() => setShowConfirmDeleteStory(true)} style={{ background: 'transparent', border: 'none', color: '#EF4444' }}><Trash2 size={20} /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text" placeholder="Répondre..."
                value={replyText} onChange={e => setReplyText(e.target.value)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', padding: '10px 15px', color: '#FFF', outline: 'none' }}
              />
              <button style={{ background: '#0066FF', border: 'none', color: '#FFF', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={18} /></button>
              <button onClick={() => setIsLiked(!isLiked)} style={{ background: isLiked ? '#EF4444' : 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={20} fill={isLiked ? '#FFF' : 'none'} /></button>
            </div>
          )}
        </div>

        {/* Viewers Modal */}
        {showViewersModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}>
            <div className="animate-slide-up" style={{ width: '100%', background: '#FFF', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#000' }}>Vues ({viewersList.length})</h3>
                <button onClick={() => setShowViewersModal(false)}><X size={20} /></button>
              </div>
              {viewersList.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '10px', background: '#F8FAFC', borderRadius: '12px' }}>
                  <img src={v.avatar} style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
                  <div><h4 style={{ margin: 0, fontSize: '0.85rem', color: '#000' }}>{v.name}</h4><span style={{ fontSize: '0.7rem', color: '#64748B' }}>{v.role}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmDeleteModal isOpen={showConfirmDeleteStory} onClose={() => setShowConfirmDeleteStory(false)} onConfirm={() => { onDeleteStory(story.id); onClose(); }} title="Supprimer ?" message="Voulez-vous supprimer cette story ?" />
      </div>
    </div>
  );
}
