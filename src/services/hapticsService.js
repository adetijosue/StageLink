/**
 * Universal Haptic Feedback Service for StageLink
 * Supports Web Vibration API & Mobile PWA / WebKit / Android.
 */

class HapticsService {
  constructor() {
    this.isEnabled = true;
    try {
      const stored = localStorage.getItem('stagelink_haptics_enabled');
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    } catch (_) {}
  }

  setHapticsEnabled(enabled) {
    this.isEnabled = Boolean(enabled);
    try {
      localStorage.setItem('stagelink_haptics_enabled', String(this.isEnabled));
    } catch (_) {}
  }

  isAvailable() {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  vibrate(pattern) {
    if (!this.isEnabled || !this.isAvailable()) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Vibration might be blocked by user gesture policy on some browsers
    }
  }

  /**
   * Subtle click for navigation, tabs, toggle switches
   */
  light() {
    this.vibrate(10);
  }

  /**
   * Pronounced click for buttons, cards, actions
   */
  medium() {
    this.vibrate(22);
  }

  /**
   * Heavy feedback for primary submissions, modal opens
   */
  heavy() {
    this.vibrate(40);
  }

  /**
   * Heartbeat rhythm on double-tap like or heart press
   */
  like() {
    this.vibrate([15, 40, 25]);
  }

  /**
   * Celebratory pattern on new Match, post shared, order completed
   */
  success() {
    this.vibrate([18, 30, 25, 40, 35]);
  }

  /**
   * Alert or deletion warning pattern
   */
  warning() {
    this.vibrate([35, 25, 40]);
  }

  /**
   * Micro-tick for carousels, scrubbers, lists
   */
  selection() {
    this.vibrate(8);
  }
}

export const haptics = new HapticsService();
