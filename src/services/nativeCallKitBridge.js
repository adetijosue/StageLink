/**
 * STAGELINK Native CallKit & Android ConnectionService Bridge
 * Provides system-level incoming call UI, lock screen controls, and OS call log integration.
 * Supports React Native CallKeep / Capacitor VoIP Plugin integration.
 */

class NativeCallKitBridge {
  constructor() {
    this.isNativeEnvironment = false;
    this.hasCallKeep = false;
    this.currentCallUuid = null;
    this.activeCallListeners = new Map();

    this.checkEnvironment();
  }

  checkEnvironment() {
    // Detect if running inside Capacitor, Cordova, or React Native WebView wrapper
    if (typeof window !== 'undefined') {
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        this.isNativeEnvironment = true;
      } else if (window.ReactNativeWebView) {
        this.isNativeEnvironment = true;
      }
    }
  }

  /**
   * Initializes CallKit / ConnectionService with StageLink branding
   */
  async setup() {
    if (!this.isNativeEnvironment) return;

    try {
      const options = {
        ios: {
          appName: 'StageLink',
          supportsVideo: true,
          maximumCallGroups: 1,
          maximumCallsPerCallGroup: 1,
          imageName: 'AppIcon'
        },
        android: {
          alertTitle: 'Permissions d\'appel requises',
          alertDescription: 'StageLink a besoin des autorisations téléphoniques pour gérer les appels vocaux et vidéo.',
          cancelButton: 'Annuler',
          okButton: 'Autoriser',
          imageName: 'ic_launcher',
          additionalPermissions: [],
          selfManaged: true
        }
      };

      if (window.RNCallKeep) {
        window.RNCallKeep.setup(options);
        this.hasCallKeep = true;
        this.bindEvents();
      }
    } catch (e) {
      console.warn('Native CallKit setup note:', e);
    }
  }

  /**
   * Binds OS-level CallKit Events
   */
  bindEvents() {
    if (!this.hasCallKeep || !window.RNCallKeep) return;

    // Answer call from Native Lock Screen
    window.RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
      this.emit('answer', { callUUID });
    });

    // End call from Native Lock Screen
    window.RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
      this.emit('end', { callUUID });
    });

    // Toggle mute from Native Call Screen
    window.RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted, callUUID }) => {
      this.emit('mute', { muted, callUUID });
    });
  }

  /**
   * Report Incoming VoIP Call to OS (Triggers full screen incoming call UI even when locked)
   */
  displayIncomingCall({ callId, callerName, callerAvatar, hasVideo = false }) {
    this.currentCallUuid = callId;
    if (this.hasCallKeep && window.RNCallKeep) {
      try {
        window.RNCallKeep.displayIncomingCall(
          callId,
          callerName || 'Artiste StageLink',
          callerName || 'Artiste StageLink',
          'generic',
          hasVideo
        );
      } catch (e) {
        console.warn('CallKeep display error:', e);
      }
    }
  }

  /**
   * Report Call Connected to OS
   */
  reportConnected(callId) {
    if (this.hasCallKeep && window.RNCallKeep && callId) {
      try {
        window.RNCallKeep.setCurrentCallActive(callId);
      } catch (e) {}
    }
  }

  /**
   * Report Call Ended to OS (Removes native call screen and updates phone logs)
   */
  endNativeCall(callId) {
    const targetId = callId || this.currentCallUuid;
    if (this.hasCallKeep && window.RNCallKeep && targetId) {
      try {
        window.RNCallKeep.endCall(targetId);
      } catch (e) {}
    }
    this.currentCallUuid = null;
  }

  on(event, callback) {
    if (!this.activeCallListeners.has(event)) {
      this.activeCallListeners.set(event, []);
    }
    this.activeCallListeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.activeCallListeners.get(event) || [];
    callbacks.forEach((cb) => cb(data));
  }
}

export const nativeCallKit = new NativeCallKitBridge();
