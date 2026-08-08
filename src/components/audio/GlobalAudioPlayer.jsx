import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Music, Volume2, ShieldCheck, FastForward } from 'lucide-react';
import { soundEngine } from '../../services/audioService';

export default function GlobalAudioPlayer({ currentTrack, onClose, isDarkMode }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    soundEngine.generateAndPlay(120, currentTrack?.genre || 'Afro-Gospel');
    setIsPlaying(true);

    const progressTimer = setInterval(() => {
      setPlaybackProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 400);

    return () => {
      soundEngine.stop();
      clearInterval(progressTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentTrack]);

  // Live Canvas Frequency Spectrum Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let phase = 0;
    const drawSpectrum = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 18;
      const barWidth = canvas.width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const height = isPlaying ? Math.sin(phase + i * 0.4) * (canvas.height * 0.45) + (canvas.height * 0.45) : 4;
        const x = i * (barWidth + 2);
        const y = canvas.height - height;

        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, '#0066FF');
        gradient.addColorStop(1, '#00F0FF');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, height, 2);
        } else {
          ctx.rect(x, y, barWidth, height);
        }
        ctx.fill();
      }

      phase += 0.12;
      animFrameRef.current = requestAnimationFrame(drawSpectrum);
    };

    drawSpectrum();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      soundEngine.generateAndPlay(120, currentTrack?.genre || 'Afro-Gospel');
      setIsPlaying(true);
    }
  };

  const toggleSpeed = () => {
    const newSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(newSpeed);
  };

  if (!currentTrack) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(58px + env(safe-area-inset-bottom, 6px))',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '460px',
      zIndex: 90,
      background: isDarkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(16px)',
      borderRadius: '20px',
      padding: '10px 14px',
      boxShadow: '0 12px 36px rgba(0, 102, 255, 0.22), 0 2px 10px rgba(0,0,0,0.1)',
      border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,102,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      {/* Vinyl / Cover Thumbnail with Spin Animation */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80'}
          alt="Audio Cover"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #0066FF',
            animation: isPlaying ? 'spin 6s linear infinite' : 'none'
          }}
        />
        <span style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          background: '#0066FF',
          color: '#FFF',
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Volume2 size={10} />
        </span>
      </div>

      {/* Info & Spectrum Canvas */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h4 style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentTrack.title || 'Maquette Studio Demo'}
          </h4>
          <span title="Watermark Droits d'Auteur Actif" style={{
            fontSize: '0.62rem',
            background: '#FEF3C7',
            color: '#D97706',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <ShieldCheck size={10} /> Protected
          </span>
        </div>

        <span style={{
          fontSize: '0.72rem',
          color: isDarkMode ? '#94A3B8' : '#64748B',
          display: 'block',
          marginBottom: '4px'
        }}>
          {currentTrack.artist || 'StageLink Audio Studio'}
        </span>

        {/* Real-time Spectrum Canvas */}
        <canvas ref={canvasRef} width={140} height={14} style={{ display: 'block' }} />
      </div>

      {/* Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={toggleSpeed}
          title="Vitesse de lecture"
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
            border: 'none',
            borderRadius: '10px',
            padding: '4px 8px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#0066FF',
            cursor: 'pointer'
          }}
        >
          {playbackSpeed}x
        </button>

        <button
          onClick={togglePlay}
          style={{
            width: '38px',
            height: '38px',
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
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
        </button>
      </div>
    </div>
  );
}
