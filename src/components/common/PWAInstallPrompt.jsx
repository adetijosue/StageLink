import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Monitor, Check, Sparkles, Globe, AppWindow } from 'lucide-react';
import { soundEngine } from '../../services/audioService';

export default function PWAInstallPrompt({ isDarkMode }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [deviceType, setDeviceType] = useState('android'); // 'ios' | 'android' | 'desktop'
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1. Detect if application is ALREADY running in Standalone App mode
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith('android-app://');

    setIsStandalone(isAppStandalone);

    // If app is ALREADY running as an installed native app, DO NOT show banner
    if (isAppStandalone) {
      setShowBanner(false);
      setShowModal(false);
      return;
    }

    // 2. Advanced Device & OS Detection
    const ua = window.navigator.userAgent || '';
    const platform = window.navigator.platform || '';
    const maxTouchPoints = window.navigator.maxTouchPoints || 0;

    const isIos = /iphone|ipad|ipod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);

    if (isIos) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // 3. Native Browser Install Event Listener (Android / Chrome / Edge / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    // 4. Listen to appinstalled event when user completes installation
    const handleAppInstalled = () => {
      localStorage.setItem('stagelink_app_installed', 'true');
      setIsStandalone(true);
      setShowBanner(false);
      setShowModal(false);
    };

    // 5. Custom Event Listener for manual trigger from Profile or Settings
    const handleManualOpen = () => {
      const isCurrentlyStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

      if (isCurrentlyStandalone) {
        alert("L'application StageLink est déjà installée sur votre appareil !");
        return;
      }

      soundEngine.playPopSound();
      setShowModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('openPWAInstallPrompt', handleManualOpen);

    // Check if prompt was ALREADY shown or dismissed in this session
    const isDismissedInSession = sessionStorage.getItem('stagelink_pwa_dismissed') === 'true';

    // Auto-show BRIEF banner after 2 seconds on app opening (ONLY IF not already installed & not dismissed in session)
    let autoHideTimer = null;
    const showTimer = setTimeout(() => {
      if (!isAppStandalone && !isDismissedInSession) {
        setShowBanner(true);
        // Automatically hide after 6 seconds so it NEVER blocks user navigation
        autoHideTimer = setTimeout(() => {
          setShowBanner(false);
          sessionStorage.setItem('stagelink_pwa_dismissed', 'true');
        }, 6000);
      }
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      if (autoHideTimer) clearTimeout(autoHideTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('openPWAInstallPrompt', handleManualOpen);
    };
  }, []);

  const handleBannerAction = async () => {
    soundEngine.playPopSound();
    sessionStorage.setItem('stagelink_pwa_dismissed', 'true');
    setShowBanner(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('stagelink_app_installed', 'true');
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  const handleDismissBanner = () => {
    soundEngine.playPopSound();
    sessionStorage.setItem('stagelink_pwa_dismissed', 'true');
    setShowBanner(false);
  };

  // If application is ALREADY running in standalone app mode, DO NOT RENDER ANYTHING
  if (isStandalone) return null;

  return (
    <>
      {/* Smart Brief Floating Bottom Banner */}
      {showBanner && (
        <div style={{
          position: 'fixed',
          bottom: '84px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '430px',
          zIndex: 85,
          background: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '22px',
          padding: '12px 16px',
          boxShadow: '0 16px 40px rgba(0, 102, 255, 0.3), 0 4px 12px rgba(0,0,0,0.15)',
          border: isDarkMode ? '1px solid rgba(0, 102, 255, 0.4)' : '1.5px solid rgba(0, 102, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          {/* Logo Icon */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0066FF, #0047FF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,102,255,0.4)',
            overflow: 'hidden',
            padding: '2px'
          }}>
            <img src="/stagelink-logo.png" alt="StageLink" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }} />
          </div>

          {/* Device Specific Brief Text Instructions */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              fontSize: '0.88rem',
              fontWeight: 800,
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Installer StageLink <Sparkles size={14} color="#0066FF" />
            </h4>
            <p style={{
              fontSize: '0.74rem',
              color: isDarkMode ? '#94A3B8' : '#64748B',
              margin: '2px 0 0 0',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {deviceType === 'ios' && '📱 Sur iPhone / iPad (Safari)'}
              {deviceType === 'android' && '🤖 Sur Smartphone Android'}
              {deviceType === 'desktop' && '💻 Sur cet Ordinateur'}
            </p>
          </div>

          {/* Install Button */}
          <button
            onClick={handleBannerAction}
            style={{
              background: 'linear-gradient(135deg, #0066FF, #0047FF)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 102, 255, 0.4)',
              flexShrink: 0
            }}
          >
            <Download size={14} /> Installer
          </button>

          {/* Close Button */}
          <button
            onClick={handleDismissBanner}
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          </button>
        </div>
      )}

      {/* Tailored Device Installation Guide Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 300,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="animate-scale-in" style={{
            width: '100%',
            maxWidth: '400px',
            background: isDarkMode ? '#0F172A' : '#FFFFFF',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}>
            {/* Prominent Official StageLink Logo Header Badge */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #0066FF, #0047FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 10px 28px rgba(0, 102, 255, 0.45)',
              overflow: 'hidden',
              padding: '3px'
            }}>
              <img
                src="/stagelink-logo.png"
                alt="StageLink Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '18px' }}
              />
            </div>

            {/* Title & Device Type Badge */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>
              Installer l'Application StageLink
            </h3>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              background: '#EFF6FF',
              color: '#0066FF',
              padding: '3px 10px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '16px'
            }}>
              {deviceType === 'ios' && ' Détecté : iPhone / iPad (iOS Safari)'}
              {deviceType === 'android' && '🤖 Détecté : Smartphone Android'}
              {deviceType === 'desktop' && '💻 Détecté : Ordinateur (Mac / Windows / Linux)'}
            </span>

            {/* --- TAILORED GUIDE FOR IOS (IPHONE / IPAD) --- */}
            {deviceType === 'ios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textTransform: 'none' }}>
                <p style={{ fontSize: '0.82rem', color: isDarkMode ? '#94A3B8' : '#64748B', margin: '0 0 6px 0' }}>
                  Sur Safari iOS, suivez ces 3 étapes pour ajouter l'icône StageLink à votre écran d'accueil :
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '12px 14px', borderRadius: '16px', textAlign: 'left' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0066FF', color: '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    Appuyez sur le bouton <strong>Partager <Share size={14} style={{ verticalAlign: 'middle' }} /></strong> en bas de Safari.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '12px 14px', borderRadius: '16px', textAlign: 'left' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0066FF', color: '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    Défilez et appuyez sur <strong>"Sur l'écran d'accueil <PlusSquare size={14} style={{ verticalAlign: 'middle' }} />"</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '12px 14px', borderRadius: '16px', textAlign: 'left' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10B981', color: '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    Appuyez sur <strong>"Ajouter"</strong>. L'application est installée !
                  </div>
                </div>
              </div>
            )}

            {/* --- TAILORED GUIDE FOR ANDROID --- */}
            {deviceType === 'android' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.82rem', color: isDarkMode ? '#94A3B8' : '#64748B', margin: '0 0 6px 0' }}>
                  Sur Android (Chrome / Samsung Internet), vous pouvez installer directement l'application :
                </p>

                {deferredPrompt ? (
                  <button
                    onClick={async () => {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      if (outcome === 'accepted') {
                        localStorage.setItem('stagelink_app_installed', 'true');
                        setIsStandalone(true);
                        setShowModal(false);
                      }
                      setDeferredPrompt(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '16px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0066FF, #0047FF)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 20px rgba(0, 102, 255, 0.4)'
                    }}
                  >
                    <Download size={18} /> Déclencher l'Installation Android
                  </button>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '12px 14px', borderRadius: '16px', textAlign: 'left' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0066FF', color: '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                        Appuyez sur le <strong>Menu (⋮ ou ☰)</strong> en haut ou en bas du navigateur.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '12px 14px', borderRadius: '16px', textAlign: 'left' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10B981', color: '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                        Sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* --- TAILORED GUIDE FOR DESKTOP (WINDOWS / MAC) --- */}
            {deviceType === 'desktop' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.82rem', color: isDarkMode ? '#94A3B8' : '#64748B', margin: '0 0 6px 0' }}>
                  Sur votre ordinateur (Chrome, Edge ou Brave), installez StageLink comme application de bureau :
                </p>

                {deferredPrompt ? (
                  <button
                    onClick={async () => {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      if (outcome === 'accepted') {
                        localStorage.setItem('stagelink_app_installed', 'true');
                        setIsStandalone(true);
                        setShowModal(false);
                      }
                      setDeferredPrompt(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '16px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0066FF, #0047FF)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 20px rgba(0, 102, 255, 0.4)'
                    }}
                  >
                    <AppWindow size={18} /> Installer l'App sur cet Ordinateur
                  </button>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '12px 14px', borderRadius: '16px', textAlign: 'left' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0066FF', color: '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                        Regardez à droite de la barre d'adresse et cliquez sur <strong>l'icône d'installation <Download size={14} style={{ verticalAlign: 'middle' }} /></strong>.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '12px 14px', borderRadius: '16px', textAlign: 'left' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10B981', color: '#FFF', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                        Ou ouvrez le <strong>Menu (⋮)</strong> du navigateur ➔ <strong>"Installer StageLink..."</strong>.
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Close Modal Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                background: isDarkMode ? '#1E293B' : '#F1F5F9',
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
