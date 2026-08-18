import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Radio, Users, Mic, MicOff,
  Sliders, Music, Disc, Copy, Check, Share2, Plus, Sparkles, Send
} from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import { haptics } from '../../services/hapticsService';
import { gamification } from '../../services/gamificationService';

export default function LiveJamWorkspace({ isDarkMode, onShareToChat, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  // Audio Recording on Track 3 State
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recordedVocalUrl, setRecordedVocalUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Multi-tracks Data
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Piste 1: Drums (Kick, Snare & Shaker)', color: '#EF4444', icon: '🥁', muted: false, solo: false, vol: 85 },
    { id: 2, name: 'Piste 2: Basse (Synthwave 808 Sub)', color: '#0066FF', icon: '🎸', muted: false, solo: false, vol: 90 },
    { id: 3, name: 'Piste 3: Lead Vocal (Micro Studio)', color: '#10B981', icon: '🎤', muted: false, solo: false, vol: 100, hasCustomAudio: false },
    { id: 4, name: 'Piste 4: Claviers & Nappes Synth', color: '#F59E0B', icon: '🎹', muted: false, solo: false, vol: 75 }
  ]);

  // Live Lyrics & Chords Collaborative Notebook
  const [lyricsContent, setLyricsContent] = useState(
    `[Intro]\n(Batterie & Synth)\n\n[Couplet 1 - C#m / A]\nSous les projecteurs de la scène,\nNos voix s'élèvent et s'enchaînent...\n\n[Refrain - E / B]\nStageLink allume la flamme,\nL'harmonie touche nos âmes !`
  );

  // Synchronized Metronome Beat Counter
  useEffect(() => {
    let beatTimer = null;
    if (isPlaying || isMetronomeActive) {
      const beatInterval = (60 / bpm) * 1000;
      beatTimer = setInterval(() => {
        setCurrentBeat((prev) => {
          const next = prev >= 4 ? 1 : prev + 1;
          if (isMetronomeActive) {
            soundEngine.playMetronomeClick(next === 1);
          }
          return next;
        });
      }, beatInterval);
    } else {
      setCurrentBeat(1);
    }
    return () => {
      if (beatTimer) clearInterval(beatTimer);
    };
  }, [isPlaying, isMetronomeActive, bpm]);

  // Toggle Master Playback
  const togglePlayback = () => {
    haptics.selection();
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      soundEngine.generateAndPlay(bpm, 'Afro-Gospel');
      setIsPlaying(true);
      gamification.trackAction('audio_play');
    }
  };

  // Track Mute Toggle
  const toggleTrackMute = (id) => {
    haptics.light();
    setTracks(tracks.map(t => t.id === id ? { ...t, muted: !t.muted, solo: false } : t));
  };

  // Track Solo Toggle
  const toggleTrackSolo = (id) => {
    haptics.medium();
    setTracks(tracks.map(t => {
      if (t.id === id) {
        return { ...t, solo: !t.solo, muted: false };
      }
      return { ...t, muted: !t.solo ? true : false, solo: false };
    }));
  };

  // Track Volume Change
  const handleVolumeChange = (id, newVol) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, vol: newVol } : t));
  };

  // Microphone Recording
  const startMicRecording = async () => {
    try {
      haptics.warning();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedVocalUrl(audioUrl);
        setTracks(tracks.map(t => t.id === 3 ? { ...t, hasCustomAudio: true } : t));
        haptics.success();
      };

      mediaRecorderRef.current.start();
      setIsRecordingMic(true);
    } catch (err) {
      console.warn('Microphone permission error:', err);
      alert('Veuillez autoriser l\'accès au microphone pour enregistrer votre piste vocale.');
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  // Copy lyrics & chords to clipboard
  const handleCopyLyrics = () => {
    haptics.success();
    navigator.clipboard.writeText(lyricsContent);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2500);
  };

  // Insert Chord Marker
  const handleInsertChord = (chord) => {
    haptics.light();
    setLyricsContent(prev => prev + ` [${chord}] `);
  };

  return (
    <div
      style={{
        background: isDarkMode ? '#0F172A' : '#FFFFFF',
        borderRadius: '24px',
        padding: '20px',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
        boxShadow: isDarkMode ? '0 12px 36px rgba(0, 0, 0, 0.4)' : '0 8px 30px rgba(0, 102, 255, 0.08)'
      }}
    >
      {/* 1. Header & Live Collaborators */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 10px #10B981'
              }}
            />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
              Studio Jam Collaboratif en Direct
            </h3>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
            DAW Web Multi-Pistes Synchronisé en Temps Réel
          </p>
        </div>

        {/* Live Collaborators Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', marginLeft: '-6px' }}>
            {[
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
            ].map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Artist"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: isDarkMode ? '2px solid #0F172A' : '2px solid #FFFFFF',
                  objectFit: 'cover',
                  marginLeft: idx > 0 ? '-8px' : 0
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: '0.70rem',
              fontWeight: 700,
              color: '#0066FF',
              background: isDarkMode ? 'rgba(0, 102, 255, 0.2)' : '#EFF6FF',
              padding: '2px 8px',
              borderRadius: '12px'
            }}
          >
            3 Artistes connectés
          </span>
        </div>
      </div>

      {/* 2. Master Deck Controls & Metronome */}
      <div
        style={{
          background: isDarkMode ? '#1E293B' : '#F8FAFC',
          borderRadius: '18px',
          padding: '14px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={togglePlayback}
            className="btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '14px'
            }}
          >
            {isPlaying ? <Pause size={16} fill="#FFF" /> : <Play size={16} fill="#FFF" />}
            {isPlaying ? 'Pause Session' : 'Lancer le Jam'}
          </button>

          {/* Metronome Toggle */}
          <button
            onClick={() => {
              haptics.selection();
              setIsMetronomeActive(!isMetronomeActive);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: isMetronomeActive ? '1px solid #0066FF' : '1px solid #CBD5E1',
              background: isMetronomeActive ? '#0066FF' : 'transparent',
              color: isMetronomeActive ? '#FFFFFF' : isDarkMode ? '#CBD5E1' : '#475569',
              fontSize: '0.80rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Radio size={14} color={isMetronomeActive ? '#FFF' : '#EF4444'} />
            Métronome {isMetronomeActive ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* BPM & Visual Beat Pulser */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Visual 1-2-3-4 Beat Counter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4].map((b) => (
              <div
                key={b}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: currentBeat === b
                    ? (b === 1 ? '#EF4444' : '#0066FF')
                    : (isDarkMode ? '#334155' : '#E2E8F0'),
                  transform: currentBeat === b ? 'scale(1.3)' : 'scale(1)',
                  transition: 'all 0.08s ease'
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
              {bpm} BPM
            </span>
            <select
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              style={{
                background: isDarkMode ? '#0F172A' : '#FFFFFF',
                color: isDarkMode ? '#FFFFFF' : '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '4px 6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value={80}>80 (R&B / Soul)</option>
              <option value={105}>105 (Afrobeat)</option>
              <option value={120}>120 (Afro-Gospel / Pop)</option>
              <option value={140}>140 (Trap / Drill)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. 4-Track Audio DAW Channels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
        {tracks.map((track) => (
          <div
            key={track.id}
            style={{
              background: track.muted
                ? (isDarkMode ? 'rgba(30, 41, 59, 0.4)' : '#F1F5F9')
                : (isDarkMode ? '#1E293B' : '#FFFFFF'),
              borderRadius: '16px',
              padding: '12px 14px',
              border: track.solo
                ? '2px solid #F59E0B'
                : (isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0'),
              boxShadow: track.solo ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
              opacity: track.muted ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>{track.icon}</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                    {track.name}
                  </h4>
                  {track.id === 3 && track.hasCustomAudio && (
                    <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700 }}>
                      ✓ Piste voix micro enregistrée
                    </span>
                  )}
                </div>
              </div>

              {/* Track Actions (Solo, Mute, Record Mic) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {track.id === 3 && (
                  <button
                    onClick={isRecordingMic ? stopMicRecording : startMicRecording}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isRecordingMic ? '#EF4444' : '#10B981',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      animation: isRecordingMic ? 'pulse 1s infinite' : 'none'
                    }}
                  >
                    {isRecordingMic ? <MicOff size={12} /> : <Mic size={12} />}
                    {isRecordingMic ? 'STOP REC' : 'REC MICRO'}
                  </button>
                )}

                <button
                  onClick={() => toggleTrackSolo(track.id)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: track.solo ? '#F59E0B' : (isDarkMode ? '#334155' : '#E2E8F0'),
                    color: track.solo ? '#000' : (isDarkMode ? '#CBD5E1' : '#475569'),
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  SOLO
                </button>

                <button
                  onClick={() => toggleTrackMute(track.id)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: track.muted ? '#EF4444' : (isDarkMode ? '#334155' : '#E2E8F0'),
                    color: track.muted ? '#FFF' : (isDarkMode ? '#CBD5E1' : '#475569'),
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  {track.muted ? 'MUTE' : 'VOL'}
                </button>
              </div>
            </div>

            {/* Volume Slider & Animated Waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={track.vol}
                onChange={(e) => handleVolumeChange(track.id, Number(e.target.value))}
                style={{ width: '80px', accentColor: track.color }}
              />

              {/* Dynamic VU Meter & Waveform Bars */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: '16px' }}>
                {[10, 16, 12, 24, 8, 20, 14, 18, 26, 12, 22, 16, 10, 24, 18, 14, 20, 12, 26, 16].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${isPlaying && !track.muted ? Math.max(4, ((h * (track.vol / 100)) + ((i + currentBeat) % 3) * 4) % 24) : 3}px`,
                      background: track.muted ? '#94A3B8' : track.color,
                      borderRadius: '2px',
                      transition: 'height 0.08s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Live Collaborative Lyrics & Chords Notepad */}
      <div
        style={{
          background: isDarkMode ? '#1E293B' : '#F8FAFC',
          borderRadius: '18px',
          padding: '16px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#0066FF" />
            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
              Paroles & Grille d'Accords Collaboratives
            </h4>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleCopyLyrics}
              style={{
                background: copiedLyrics ? '#10B981' : (isDarkMode ? '#334155' : '#FFFFFF'),
                color: copiedLyrics ? '#FFF' : (isDarkMode ? '#FFF' : '#0F172A'),
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copiedLyrics ? <Check size={12} /> : <Copy size={12} />}
              {copiedLyrics ? 'Copié !' : 'Copier'}
            </button>

            {onShareToChat && (
              <button
                onClick={() => onShareToChat(lyricsContent)}
                className="btn-primary"
                style={{
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Send size={12} /> Envoyer au chat
              </button>
            )}
          </div>
        </div>

        {/* Quick Chords Inserter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748B', alignSelf: 'center' }}>Ajouter un accord :</span>
          {['C#m', 'A', 'E', 'B', 'F#m', 'G#m', 'D', 'G'].map((chord) => (
            <button
              key={chord}
              onClick={() => handleInsertChord(chord)}
              style={{
                background: isDarkMode ? '#0F172A' : '#FFFFFF',
                color: '#0066FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {chord}
            </button>
          ))}
        </div>

        <textarea
          value={lyricsContent}
          onChange={(e) => setLyricsContent(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            background: isDarkMode ? '#0F172A' : '#FFFFFF',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '10px',
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
}
