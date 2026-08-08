import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, Users } from 'lucide-react';
import { soundEngine } from '../../services/audioService';

export default function LiveJamWorkspace() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Track 1: Drums (Kick & Perc)', color: '#EF4444', muted: false, vol: 85 },
    { id: 2, name: 'Track 2: Bass (Synthwave 808)', color: '#0066FF', muted: false, vol: 90 },
    { id: 3, name: 'Track 3: Vocal (Alice Dubois Lead)', color: '#10B981', muted: false, vol: 100 },
    { id: 4, name: 'Track 4: Synth (Chords & Arp)', color: '#F59E0B', muted: false, vol: 75 }
  ]);

  const toggleTrackMute = (id) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, muted: !t.muted } : t));
  };

  const togglePlayback = () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      soundEngine.generateAndPlay(120, 'Afro-Gospel');
      setIsPlaying(true);
    }
  };

  return (
    <div className="card" style={{ padding: '16px' }}>
      {/* Session Title & Active Collaborators */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} className="pulsing-glow" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Session Jam en Direct</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Workspace Cloud Multi-Pistes (4-Tracks)</span>
        </div>

        {/* Collaborators Avatars */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', marginLeft: '-6px' }}>
            {[
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
            ].map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Collaborator"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '2px solid #FFFFFF',
                  objectFit: 'cover',
                  marginLeft: idx > 0 ? '-8px' : 0
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0066FF', marginLeft: '6px', background: '#EFF6FF', padding: '2px 6px', borderRadius: '10px' }}>
            +3 en direct
          </span>
        </div>
      </div>

      {/* Main Master Controls */}
      <div style={{
        background: '#F8FAFC',
        borderRadius: '14px',
        padding: '12px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid #E2E8F0'
      }}>
        <button
          onClick={togglePlayback}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {isPlaying ? <Pause size={16} fill="#FFF" /> : <Play size={16} fill="#FFF" />}
          {isPlaying ? 'Pause Session' : 'Lancer le Jam'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
          <Radio size={16} color="#EF4444" /> 120 BPM • 4/4 Time
        </div>
      </div>

      {/* 4-Track Recorder Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tracks.map((track) => (
          <div
            key={track.id}
            style={{
              background: track.muted ? '#F1F5F9' : '#FFFFFF',
              borderRadius: '12px',
              padding: '10px 12px',
              border: `1px solid ${track.muted ? '#CBD5E1' : '#E2E8F0'}`,
              opacity: track.muted ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: track.color }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{track.name}</span>
              </div>

              <button
                onClick={() => toggleTrackMute(track.id)}
                style={{
                  background: track.muted ? '#EF4444' : '#E2E8F0',
                  color: track.muted ? '#FFF' : '#475569',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                {track.muted ? 'MUTED' : 'MUTE'}
              </button>
            </div>

            {/* Simulated Track Waveform Line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '18px' }}>
              {[12, 18, 14, 22, 10, 24, 16, 20, 28, 14, 22, 18, 12, 26, 20, 16, 22, 14, 28, 18, 24, 12].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${isPlaying && !track.muted ? Math.max(6, (h + (i % 3) * 5) % 28) : (track.muted ? 4 : h * 0.7)}px`,
                    background: track.muted ? '#CBD5E1' : track.color,
                    borderRadius: '2px',
                    transition: 'all 0.15s'
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
