/**
 * StageLink Web Audio Synthesizer Engine & Haptic Pop Feedback System
 * Powered by JABE PRODUCTION
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.activeNodes = [];
    this.bpm = 120;
    this.genre = 'Afro-Gospel';
    this.ringtoneTimer = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPopSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
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
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  playMessageReceivedSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // First tone
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(600, now);
      osc1.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      // Second tone (higher pitch, slightly delayed)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.25);

      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    } catch (e) {}
  }

  playCallingRingtone() {
    try {
      this.initContext();
      this.stopRingtone();
      this.isPlaying = true;
      const ringOnce = () => {
        if (!this.isPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
      };
      ringOnce();
      this.ringtoneTimer = setInterval(ringOnce, 2000);
    } catch (e) {}
  }

  playIncomingRingtone() {
    try {
      this.initContext();
      this.stopRingtone();
      this.isPlaying = true;
      const ringOnce = () => {
        if (!this.isPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Urgent dual-tone beep
        [660, 880].forEach((freq, i) => {
           const osc = this.ctx.createOscillator();
           const gain = this.ctx.createGain();
           osc.frequency.setValueAtTime(freq, now + (i * 0.1));
           gain.gain.setValueAtTime(0.15, now + (i * 0.1));
           gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.1) + 0.4);
           osc.connect(gain);
           gain.connect(this.ctx.destination);
           osc.start(now + (i * 0.1));
           osc.stop(now + (i * 0.1) + 0.4);
        });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      };
      ringOnce();
      this.ringtoneTimer = setInterval(ringOnce, 1000);
    } catch (e) {}
  }

  stopRingtone() {
    this.isPlaying = false;
    if (this.ringtoneTimer) {
      clearInterval(this.ringtoneTimer);
      this.ringtoneTimer = null;
    }
  }

  playCallConnectedChime() {
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playCallEndedChime() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  generateAndPlay() {
    this.initContext();
    this.isPlaying = true;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    this.activeNodes.push(osc);
  }

  stop() {
    this.isPlaying = false;
    this.stopRingtone();
    this.activeNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this.activeNodes = [];
  }
}

export const soundEngine = new SoundSynthesizer();
