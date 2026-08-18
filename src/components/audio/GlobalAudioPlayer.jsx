import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, X, Music, Volume2, VolumeX, ShieldCheck, FastForward,
  Rewind, Repeat, ChevronDown, Maximize2, Heart, Share2, Download,
  Sparkles, Disc, ListMusic
} from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { haptics } from '../../services/hapticsService';
import { gamification } from '../../services/gamificationService';

export default function GlobalAudioPlayer({ currentTrack, onClose, isDarkMode }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'lyrics'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(214); // 3:34 default
  const [isLiked, setIsLiked] = useState(false);

  const canvasRef = useRef(null);
  const fullCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize track and Media Session API
  useEffect(() => {
    if (!currentTrack) return;

    soundEngine.generateAndPlay(currentTrack.bpm || 120, currentTrack.genre || 'Afro-Gospel');
    setIsPlaying(true);
    setCurrentTime(0);
    gamification.trackAction('audio_play');

    // Register Media Session API for smartphone lock screens & headphones
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || 'Maquette Studio Demo',
          artist: currentTrack.artist || 'StageLink Artist',
          album: currentTrack.album || 'StageLink Exclusive',
          artwork: [
            {
              src: currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=512',
              sizes: '512x512',
              type: 'image/jpeg'
            }
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
          setIsPlaying(true);
          soundEngine.generateAndPlay(currentTrack.bpm || 120, currentTrack.genre || 'Afro-Gospel');
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          setIsPlaying(false);
          soundEngine.stop();
        });

        navigator.mediaSession.setActionHandler('seekbackward', () => {
          seekRelative(-15);
        });

        navigator.mediaSession.setActionHandler('seekforward', () => {
          seekRelative(15);
        });
      } catch (err) {
        console.warn('MediaSession note:', err);
      }
    }

    return () => {
      soundEngine.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentTrack]);

  // Audio Playhead Progression Timer
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            if (isLooping) return 0;
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, duration, isLooping]);

  // Real-Time Canvas Spectrum Visualizer (Mini & Fullscreen)
  useEffect(() => {
    let phase = 0;

    const draw = () => {
      // Mini Player Canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        ctx.clearRect(0, 0, w, h);

        const barCount = 16;
        const barWidth = w / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const barH = isPlaying ? Math.sin(phase + i * 0.45) * (h * 0.45) + (h * 0.45) : 3;
          const x = i * (barWidth + 2);
          const y = h - barH;

          const grad = ctx.createLinearGradient(0, y, 0, h);
          grad.addColorStop(0, '#0066FF');
          grad.addColorStop(1, '#00F0FF');

          ctx.fillStyle = grad;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barH, 2);
          else ctx.rect(x, y, barWidth, barH);
          ctx.fill();
        }
      }

      // Fullscreen Immersive Canvas
      if (fullCanvasRef.current && isExpanded) {
        const fctx = fullCanvasRef.current.getContext('2d');
        const fw = fullCanvasRef.current.width;
        const fh = fullCanvasRef.current.height;
        fctx.clearRect(0, 0, fw, fh);

        const fBarCount = 32;
        const fBarW = fw / fBarCount - 3;

        for (let i = 0; i < fBarCount; i++) {
          const fBarH = isPlaying ? Math.sin(phase + i * 0.3) * (fh * 0.48) + (fh * 0.48) : 4;
          const x = i * (fBarW + 3);
          const y = fh - fBarH;

          const grad = fctx.createLinearGradient(0, y, 0, fh);
          grad.addColorStop(0, '#38BDF8');
          grad.addColorStop(0.5, '#0066FF');
          grad.addColorStop(1, '#00F0FF');

          fctx.fillStyle = grad;
          fctx.beginPath();
          if (fctx.roundRect) fctx.roundRect(x, y, fBarW, fBarH, 4);
          else fctx.rect(x, y, fBarW, fBarH);
          fctx.fill();
        }
      }

      phase += 0.14 * playbackSpeed;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isExpanded, playbackSpeed]);

  const togglePlay = () => {
    haptics.selection();
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      soundEngine.generateAndPlay(currentTrack?.bpm || 120, currentTrack?.genre || 'Afro-Gospel');
      setIsPlaying(true);
    }
  };

  const seekRelative = (seconds) => {
    haptics.light();
    setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + seconds)));
  };

  const handleSeek = (e) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    haptics.light();
  };

  const toggleSpeed = () => {
    haptics.selection();
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const toggleLoop = () => {
    haptics.selection();
    setIsLooping(!isLooping);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* 1. FLOATING MINI AUDIO BAR */}
      {!isExpanded && (
        <div
          onClick={() => {
            haptics.light();
            setIsExpanded(true);
          }}
          style={{
            position: 'fixed',
            bottom: 'calc(62px + env(safe-area-inset-bottom, 8px))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 24px)',
            maxWidth: '460px',
            zIndex: 90,
            background: isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '22px',
            padding: '8px 12px 10px 12px',
            boxShadow: '0 14px 38px rgba(0, 102, 255, 0.25), 0 4px 12px rgba(0,0,0,0.12)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,102,255,0.22)',
            cursor: 'pointer',
            animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {/* Top Mini Scrubber Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              height: '3px',
              width: '100%',
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
              borderRadius: '2px',
              marginBottom: '8px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(currentTime / duration) * 100}%`,
                background: 'linear-gradient(90deg, #0066FF, #00F0FF)',
                transition: 'width 0.2s linear'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Spinning Vinyl Disc Thumbnail */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80'}
                alt="Audio Cover"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #0066FF',
                  animation: isPlaying ? 'spin 6s linear infinite' : 'none'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: '#0066FF',
                  color: '#FFF',
                  borderRadius: '50%',
                  width: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Volume2 size={9} />
              </span>
            </div>

            {/* Track Info & Real-Time Spectrum Canvas */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4
                  style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentTrack.title || 'Maquette Studio Demo'}
                </h4>
                <span
                  style={{
                    fontSize: '0.60rem',
                    background: '#FEF3C7',
                    color: '#D97706',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {currentTrack.genre || 'Afro-Gospel'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
                  {currentTrack.artist || 'StageLink Studio'} • {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                {/* Micro Spectrum Visualizer */}
                <canvas ref={canvasRef} width={90} height={12} style={{ display: 'block' }} />
              </div>
            </div>

            {/* Mini Action Controls */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
            >
              <button
                onClick={togglePlay}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0066FF, #0047FF)',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4)'
                }}
              >
                {isPlaying ? <Pause size={16} fill="#FFF" /> : <Play size={16} fill="#FFF" style={{ marginLeft: '2px' }} />}
              </button>

              <button
                onClick={onClose}
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULL-SCREEN IMMERSIVE VINYL & LYRICS PLAYER MODAL */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: isDarkMode
              ? 'linear-gradient(180deg, #0F172A 0%, #020617 100%)'
              : 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'calc(env(safe-area-inset-top, 16px) + 12px) 20px calc(env(safe-area-inset-bottom, 20px) + 16px)',
            animation: 'slideUpModal 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => {
                haptics.light();
                setIsExpanded(false);
              }}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDarkMode ? '#FFF' : '#0F172A',
                cursor: 'pointer'
              }}
            >
              <ChevronDown size={22} />
            </button>

            {/* Tab Selector (Lecteur / Paroles) */}
            <div
              style={{
                display: 'flex',
                background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                borderRadius: '20px',
                padding: '3px'
              }}
            >
              <button
                onClick={() => setActiveTab('player')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: activeTab === 'player' ? '#0066FF' : 'transparent',
                  color: activeTab === 'player' ? '#FFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Lecteur Vinyle
              </button>
              <button
                onClick={() => setActiveTab('lyrics')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: activeTab === 'lyrics' ? '#0066FF' : 'transparent',
                  color: activeTab === 'lyrics' ? '#FFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Paroles & Notes
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDarkMode ? '#FFF' : '#0F172A',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Center Content (Vinyl Disc OR Lyrics) */}
          {activeTab === 'player' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
              {/* 33T Vinyl Disc with Groove Reflection */}
              <div
                style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #2D3748 10%, #1A202C 40%, #0F172A 80%, #000000 100%)',
                  padding: '12px',
                  boxShadow: '0 20px 50px rgba(0, 102, 255, 0.35), 0 0 0 6px rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: isPlaying ? 'spin 10s linear infinite' : 'none',
                  position: 'relative'
                }}
              >
                {/* Center Vinyl Label Image */}
                <img
                  src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
                  alt="Track Cover"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #0066FF'
                  }}
                />
                {/* Center Vinyl Spindle Hole */}
                <div
                  style={{
                    position: 'absolute',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#0F172A',
                    border: '2px solid #FFF'
                  }}
                />
              </div>

              {/* Real-time Spectrum Waves Canvas */}
              <canvas
                ref={fullCanvasRef}
                width={280}
                height={36}
                style={{ marginTop: '24px', display: 'block' }}
              />
            </div>
          ) : (
            /* Synchronized Lyrics & Notes Tab */
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                margin: '20px 0',
                padding: '16px',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
                borderRadius: '24px',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
                <Sparkles size={16} color="#0066FF" />
                <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#0066FF' }}>
                  Paroles & Structure Musicale
                </span>
              </div>
              <p style={{ fontSize: '0.90rem', lineHeight: 1.8, whiteSpace: 'pre-line', color: isDarkMode ? '#CBD5E1' : '#334155' }}>
                {currentTrack.lyrics ||
                  `[Intro]\n(Synth Pad & Claps)\n\n[Refrain]\nQuand la musique élève les cœurs,\nStageLink efface toutes les peurs.\nCréateurs, musiciens, chanteurs,\nEnsemble au sommet des hauteurs !\n\n[Couplet]\nChaque note est une passerelle,\nChaque accord une étincelle.\nPartageons notre passion,\nDans cette grande création !`}
              </p>
            </div>
          )}

          {/* Track Metadata & Action Buttons */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                  {currentTrack.title || 'Maquette Studio Demo'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  {currentTrack.artist || 'StageLink Studio'} • {currentTrack.bpm || 120} BPM
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    haptics.like();
                    setIsLiked(!isLiked);
                  }}
                  style={{
                    background: isLiked ? '#FEE2E2' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'),
                    color: isLiked ? '#EF4444' : '#64748B',
                    border: 'none',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Heart size={18} fill={isLiked ? '#EF4444' : 'none'} />
                </button>
              </div>
            </div>

            {/* Interactive Progress Seekbar */}
            <div style={{ marginBottom: '18px' }}>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  width: '100%',
                  accentColor: '#0066FF',
                  cursor: 'pointer',
                  height: '6px',
                  borderRadius: '4px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Playback Control Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: '14px' }}>
              <button
                onClick={toggleSpeed}
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                  color: '#0066FF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '6px 12px',
                  fontSize: '0.80rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {playbackSpeed}x
              </button>

              <button
                onClick={() => seekRelative(-15)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDarkMode ? '#FFF' : '#0F172A',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <Rewind size={26} />
              </button>

              {/* Central Play/Pause Button */}
              <button
                onClick={togglePlay}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0066FF 0%, #0047FF 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 10px 28px rgba(0, 102, 255, 0.5)'
                }}
              >
                {isPlaying ? <Pause size={28} fill="#FFF" /> : <Play size={28} fill="#FFF" style={{ marginLeft: '4px' }} />}
              </button>

              <button
                onClick={() => seekRelative(15)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDarkMode ? '#FFF' : '#0F172A',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <FastForward size={26} />
              </button>

              <button
                onClick={toggleLoop}
                style={{
                  background: isLooping ? '#0066FF' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'),
                  color: isLooping ? '#FFF' : '#64748B',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px',
                  cursor: 'pointer'
                }}
              >
                <Repeat size={18} />
              </button>
            </div>
          </div>

          <style>{`
            @keyframes slideUpModal {
              0% { transform: translateY(100%); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
