/**
 * StageLink Web Audio Synthesizer Engine & Native Phone Ringtone System
 * High-Fidelity Polyphonic Ringtone Generation, Haptic Vibration & Audio Routing
 * Powered by JABE PRODUCTION
 */

export const RINGTONE_STYLES = {
  MODERN_MARIMBA: 'modern_marimba',
  CLASSIC_BELL: 'classic_bell',
  STAGELINK_GROOVE: 'stagelink_groove',
  ELECTRONIC_CHIME: 'electronic_chime'
};

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.isRinging = false;
    this.activeNodes = [];
    this.bpm = 120;
    this.genre = 'Afro-Gospel';
    this.ringtoneTimer = null;
    this.vibrateTimer = null;
    this.testTimer = null;
    this.metronomeTimer = null;

    // Load saved preferences
    this.ringtoneStyle = typeof window !== 'undefined' 
      ? (localStorage.getItem('stagelink_ringtone_style') || RINGTONE_STYLES.MODERN_MARIMBA)
      : RINGTONE_STYLES.MODERN_MARIMBA;
      
    this.vibrationEnabled = typeof window !== 'undefined'
      ? (localStorage.getItem('stagelink_vibration_enabled') !== 'false')
      : true;

    // Auto-unlock AudioContext on first user interaction with window
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  initContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          
          // Master Limiter / Compressor Node to guarantee high loudness without clipping
          const compressor = this.ctx.createDynamicsCompressor();
          compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
          compressor.knee.setValueAtTime(30, this.ctx.currentTime);
          compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
          compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
          compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

          compressor.connect(this.ctx.destination);
          this.masterGain.connect(compressor);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('AudioContext init note:', e);
    }
  }

  getRingtoneStyle() {
    return this.ringtoneStyle;
  }

  setRingtoneStyle(style) {
    if (Object.values(RINGTONE_STYLES).includes(style)) {
      this.ringtoneStyle = style;
      if (typeof window !== 'undefined') {
        localStorage.setItem('stagelink_ringtone_style', style);
      }
    }
  }

  isVibrationEnabled() {
    return this.vibrationEnabled;
  }

  setVibrationEnabled(enabled) {
    this.vibrationEnabled = !!enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('stagelink_vibration_enabled', enabled ? 'true' : 'false');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UI MICRO-FEEDBACK SOUNDS
  // ══════════════════════════════════════════════════════════════════════════

  playPopSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([25, 35, 25]);
      }
    } catch (e) {}
  }

  playLikePopSound() {
    this.playPopSound();
  }

  playMessageSentSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playMessageReceivedSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const notes = [
        { f: 587.33, t: 0, d: 0.12 }, // D5
        { f: 880.00, t: 0.1, d: 0.18 } // A5
      ];

      notes.forEach(({ f, t, d }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.4, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d);
      });

      if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (e) {}
  }

  playMetronomeClick(isAccent = false) {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isAccent ? 1200 : 800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      gain.gain.setValueAtTime(isAccent ? 0.45 : 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALL SIGNALING & CONNECTIVITY CHIMES
  // ══════════════════════════════════════════════════════════════════════════

  playCallingRingtone() {
    try {
      this.initContext();
      this.stopRingtone();
      this.isRinging = true;

      const ringOnce = () => {
        if (!this.isRinging || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Standard European/French double telephone beep (440Hz + 480Hz)
        [440, 480].forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.setValueAtTime(0.15, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);
          osc.start(now);
          osc.stop(now + 1.25);
        });
      };

      ringOnce();
      this.ringtoneTimer = setInterval(ringOnce, 3500);
    } catch (e) {}
  }

  playCallConnectedChime() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.06));
        gain.gain.setValueAtTime(0, now + (idx * 0.06));
        gain.gain.linearRampToValueAtTime(0.3, now + (idx * 0.06) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.06) + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + (idx * 0.06));
        osc.stop(now + (idx * 0.06) + 0.35);
      });

      if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 50, 100]);
      }
    } catch (e) {}
  }

  playCallEndedChime() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Descending tone for call hang up
      [659.25, 523.25, 392.00].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
        gain.gain.setValueAtTime(0.25, now + (idx * 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.08) + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + (idx * 0.08));
        osc.stop(now + (idx * 0.08) + 0.22);
      });

      if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INCOMING CALL NATIVE RINGTONE SYNTHESIZERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Synthesize a single wooden bar marimba note with rich harmonics
   */
  _synthMarimbaNote(freq, startTime, duration = 0.35, gainLevel = 0.5) {
    if (!this.ctx) return;
    const now = startTime;

    // 1. Fundamental tone (Sine)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(gainLevel, now + 0.004); // Fast strike
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc1.connect(gain1);
    gain1.connect(this.masterGain || this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + duration);

    // 2. Harmonic overtone (Soft triangle bar resonance)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.0, now);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(gainLevel * 0.35, now + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + (duration * 0.5));
    osc2.connect(gain2);
    gain2.connect(this.masterGain || this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + (duration * 0.5));

    // 3. Ultra high chime click (Attack punch)
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 4.0, now);
    gain3.gain.setValueAtTime(gainLevel * 0.15, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc3.connect(gain3);
    gain3.connect(this.masterGain || this.ctx.destination);
    osc3.start(now);
    osc3.stop(now + 0.04);
  }

  /**
   * Synthesize classic rotary phone bell
   */
  _synthClassicBell(startTime, duration = 0.8) {
    if (!this.ctx) return;
    const now = startTime;
    
    // Dual bell gong frequencies (853Hz + 960Hz) modulated by a 24Hz clapper tremolo
    [853, 960].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const tremolo = this.ctx.createOscillator();
      const tremoloGain = this.ctx.createGain();

      tremolo.frequency.setValueAtTime(24, now);
      tremoloGain.gain.setValueAtTime(0.15, now);
      tremolo.connect(tremoloGain.gain);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gain.gain.setValueAtTime(0.35, now + duration - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      tremolo.start(now);
      tremolo.stop(now + duration);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Synthesize Afro-Gospel / StageLink Anthem Chord Ringtone
   */
  _synthStageLinkAnthem(startTime) {
    if (!this.ctx) return;
    const now = startTime;

    // StageLink Signature Melodic Motif (E4 -> G#4 -> B4 -> E5 -> D#5 -> B4 -> C#5)
    const melody = [
      { f: 329.63, t: 0.0, d: 0.25 }, // E4
      { f: 415.30, t: 0.12, d: 0.25 }, // G#4
      { f: 493.88, t: 0.24, d: 0.25 }, // B4
      { f: 659.25, t: 0.36, d: 0.35 }, // E5
      { f: 622.25, t: 0.52, d: 0.25 }, // D#5
      { f: 493.88, t: 0.64, d: 0.25 }, // B4
      { f: 554.37, t: 0.76, d: 0.45 }, // C#5
      // Second Phrase
      { f: 659.25, t: 1.10, d: 0.25 }, // E5
      { f: 739.99, t: 1.22, d: 0.25 }, // F#5
      { f: 830.61, t: 1.34, d: 0.45 }  // G#5
    ];

    melody.forEach(({ f, t, d }) => {
      this._synthMarimbaNote(f, now + t, d, 0.55);
    });

    // Warm sub bass pad underneath
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(164.81, now); // E3
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain || this.ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 1.8);
  }

  /**
   * Synthesize Electronic Chime Ringtone
   */
  _synthElectronicChime(startTime) {
    if (!this.ctx) return;
    const now = startTime;
    const notes = [784, 987.77, 1174.66, 1567.98, 1318.51, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.1));
      gain.gain.setValueAtTime(0, now + (idx * 0.1));
      gain.gain.linearRampToValueAtTime(0.3, now + (idx * 0.1) + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.1) + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now + (idx * 0.1));
      osc.stop(now + (idx * 0.1) + 0.3);
    });
  }

  /**
   * Main Ringtone Burst Generator
   */
  _triggerRingtoneBurst(style = this.ringtoneStyle) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (style) {
      case RINGTONE_STYLES.CLASSIC_BELL:
        // Double ring: Ring (0.7s) -> Gap (0.25s) -> Ring (0.7s)
        this._synthClassicBell(now, 0.7);
        this._synthClassicBell(now + 0.95, 0.7);
        break;

      case RINGTONE_STYLES.STAGELINK_GROOVE:
        this._synthStageLinkAnthem(now);
        break;

      case RINGTONE_STYLES.ELECTRONIC_CHIME:
        this._synthElectronicChime(now);
        this._synthElectronicChime(now + 0.9);
        break;

      case RINGTONE_STYLES.MODERN_MARIMBA:
      default:
        // Iconic Marimba phone ring cadence
        // Phrase 1
        const phrase1 = [
          { f: 659.25, t: 0.00 }, // E5
          { f: 830.61, t: 0.09 }, // G#5
          { f: 987.77, t: 0.18 }, // B5
          { f: 1318.51, t: 0.27 }, // E6
          { f: 1244.51, t: 0.40 }, // D#6
          { f: 987.77, t: 0.52 }, // B5
          { f: 1108.73, t: 0.64 }, // C#6
          { f: 830.61, t: 0.76 }  // G#5
        ];
        phrase1.forEach(n => this._synthMarimbaNote(n.f, now + n.t, 0.28, 0.55));

        // Phrase 2 (repeats with resolving interval)
        const phrase2 = [
          { f: 659.25, t: 1.05 }, // E5
          { f: 830.61, t: 1.14 }, // G#5
          { f: 987.77, t: 1.23 }, // B5
          { f: 1318.51, t: 1.32 }, // E6
          { f: 1479.98, t: 1.45 }, // F#6
          { f: 1318.51, t: 1.58 }, // E6
          { f: 987.77, t: 1.70 }  // B5
        ];
        phrase2.forEach(n => this._synthMarimbaNote(n.f, now + n.t, 0.32, 0.55));
        break;
    }

    // Trigger physical device vibration synchronized with the ringtone
    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([1000, 600, 1000, 800]);
      } catch (e) {}
    }
  }

  /**
   * Start looping the incoming call ringtone until answered or rejected
   */
  playIncomingRingtone(customStyle = null) {
    try {
      this.initContext();
      this.stopRingtone();
      this.isRinging = true;

      const styleToPlay = customStyle || this.ringtoneStyle;

      // Burst 1 immediately
      this._triggerRingtoneBurst(styleToPlay);

      // Repeat every 2.6 seconds
      this.ringtoneTimer = setInterval(() => {
        if (!this.isRinging) return;
        this._triggerRingtoneBurst(styleToPlay);
      }, 2600);

      // Dedicated vibration interval for continuous haptic feedback on mobile
      if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        this.vibrateTimer = setInterval(() => {
          if (!this.isRinging) return;
          try {
            navigator.vibrate([1000, 600, 1000, 800]);
          } catch (e) {}
        }, 2600);
      }
    } catch (e) {
      console.warn('playIncomingRingtone note:', e);
    }
  }

  /**
   * Stop ringtone and immediately silence phone vibration
   */
  stopRingtone() {
    this.isRinging = false;
    if (this.ringtoneTimer) {
      clearInterval(this.ringtoneTimer);
      this.ringtoneTimer = null;
    }
    if (this.vibrateTimer) {
      clearInterval(this.vibrateTimer);
      this.vibrateTimer = null;
    }
    if (this.testTimer) {
      clearTimeout(this.testTimer);
      this.testTimer = null;
    }

    // Cancel all physical vibration immediately
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }

  /**
   * Play a one-shot preview of a ringtone (for settings customizer)
   */
  testRingtone(style = this.ringtoneStyle) {
    this.stopRingtone();
    this.initContext();
    this._triggerRingtoneBurst(style);
    this.testTimer = setTimeout(() => {
      this.stopRingtone();
    }, 2800);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BACKGROUND STUDIO DEMO GENERATOR
  // ══════════════════════════════════════════════════════════════════════════

  generateAndPlay(bpm = 120, genre = 'Afro-Gospel') {
    this.initContext();
    this.stop();
    this.isPlaying = true;
    this.bpm = bpm;
    this.genre = genre;

    // Harmonic chord progression synthesis (F - C - Dm - Bb in Afro-Gospel style)
    const baseFreqs = genre === 'Afro-Gospel' ? [174.61, 261.63, 293.66, 233.08] : [220, 261.63, 329.63, 392];
    let noteIdx = 0;
    const intervalMs = (60 / bpm) * 1000 * 2;

    const playNextBar = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const root = baseFreqs[noteIdx % baseFreqs.length];
      noteIdx++;

      // Synth Chord Pad
      [root, root * 1.25, root * 1.5].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) * 0.9);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + (intervalMs / 1000) * 0.9);
        this.activeNodes.push(osc);
      });

      // Bass 808 note
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(root / 2, now);
      bassGain.gain.setValueAtTime(0.12, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain || this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.6);
      this.activeNodes.push(bassOsc);
    };

    playNextBar();
    this.ringtoneTimer = setInterval(playNextBar, intervalMs);
  }

  stop() {
    this.isPlaying = false;
    this.stopRingtone();
    this.activeNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this.activeNodes = [];
  }
}

export const soundEngine = new SoundSynthesizer();
