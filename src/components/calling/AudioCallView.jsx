import React, { useRef, useEffect } from 'react';
import UserAvatar from '../common/UserAvatar';
import { ShieldCheck, Zap, Activity } from 'lucide-react';

export default function AudioCallView({
  participant,
  callDuration,
  audioVolume,
  networkQuality,
  isMuted
}) {
  const canvasRef = useRef(null);

  const durationFormatted = `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`;

  // Draw real-time high-contrast audio waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 28;
      const barWidth = 3;
      const gap = 4;
      const startX = (width - (numBars * (barWidth + gap))) / 2;

      const volumeFactor = Math.max(0.12, (audioVolume.remote || 10) / 100);

      for (let i = 0; i < numBars; i++) {
        // Generate symmetric wave shape from center
        const distanceFromCenter = Math.abs(i - numBars / 2) / (numBars / 2);
        const waveHeight = (1 - distanceFromCenter * 0.7) * (height * 0.75) * volumeFactor * (0.6 + Math.sin(Date.now() * 0.008 + i) * 0.4);

        const x = startX + i * (barWidth + gap);
        const y = (height - waveHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + waveHeight);
        gradient.addColorStop(0, '#0066FF');
        gradient.addColorStop(0.5, '#60A5FA');
        gradient.addColorStop(1, '#93C5FD');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.max(4, waveHeight), 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [audioVolume]);

  const avatarScale = 1 + ((audioVolume.remote || 0) / 100) * 0.12;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      width: '100%',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Encryption & Quality Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '6px 14px',
        borderRadius: '20px',
        marginBottom: '32px',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <ShieldCheck size={14} color="#10B981" />
        <span style={{ fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 600 }}>Chiffré de bout en bout</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
        <Zap size={13} color={networkQuality.quality === 'excellent' ? '#10B981' : '#F59E0B'} />
        <span style={{ fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 600 }}>HD Voice</span>
      </div>

      {/* Pulsing Avatar Container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '28px'
      }}>
        {/* Outer glowing pulsing ring */}
        <div style={{
          position: 'absolute',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.35) 0%, rgba(0, 102, 255, 0) 70%)',
          transform: `scale(${avatarScale})`,
          transition: 'transform 0.08s ease-out'
        }} />

        {/* Second ring */}
        <div style={{
          position: 'absolute',
          width: '136px',
          height: '136px',
          borderRadius: '50%',
          border: '2px solid rgba(0, 102, 255, 0.5)',
          transform: `scale(${1 + ((audioVolume.remote || 0) / 100) * 0.08})`,
          transition: 'transform 0.08s ease-out'
        }} />

        <UserAvatar
          user={{
            avatar: participant?.avatar_url || participant?.avatar,
            name: participant?.full_name || participant?.name || 'Artiste'
          }}
          size={110}
        />
      </div>

      {/* Participant Identity */}
      <h2 style={{
        fontSize: '1.45rem',
        fontWeight: 800,
        color: '#FFFFFF',
        margin: '0 0 6px 0',
        textAlign: 'center',
        textShadow: '0 2px 8px rgba(0,0,0,0.5)'
      }}>
        {participant?.full_name || participant?.name || 'Artiste StageLink'}
      </h2>

      <p style={{
        fontSize: '0.88rem',
        color: '#93C5FD',
        margin: '0 0 18px 0',
        fontWeight: 600
      }}>
        {participant?.role || 'Artiste'}
      </p>

      {/* Call Timer */}
      <div style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        color: '#FFFFFF',
        letterSpacing: '1px',
        marginBottom: '28px'
      }}>
        {durationFormatted}
      </div>

      {/* Animated Waveform Visualizer Canvas */}
      <canvas
        ref={canvasRef}
        width={240}
        height={50}
        style={{
          width: '240px',
          height: '50px',
          marginBottom: '12px'
        }}
      />
    </div>
  );
}
