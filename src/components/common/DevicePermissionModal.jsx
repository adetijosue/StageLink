import React, { useState } from 'react';
import { Camera, Mic, ShieldCheck, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

export default function DevicePermissionModal({ isOpen, onClose, onPermissionsGranted, requiredType = 'all' }) {
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle' | 'granted' | 'denied'
  const [micStatus, setMicStatus] = useState('idle');
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const requestHardwarePermissions = async () => {
    setIsRequesting(true);
    setErrorMessage('');

    try {
      const constraints = {
        video: requiredType === 'all' || requiredType === 'video',
        audio: requiredType === 'all' || requiredType === 'audio'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (requiredType === 'all' || requiredType === 'video') setCameraStatus('granted');
      if (requiredType === 'all' || requiredType === 'audio') setMicStatus('granted');

      // Stop tracks immediately after permission check
      stream.getTracks().forEach(t => t.stop());

      setTimeout(() => {
        setIsRequesting(false);
        onPermissionsGranted();
        onClose();
      }, 500);
    } catch (err) {
      console.warn('System Device Permission Error:', err);
      setIsRequesting(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Accès refusé par le système. Veuillez autoriser la caméra et le micro dans les réglages de votre navigateur / iPhone / Android.');
        setCameraStatus('denied');
        setMicStatus('denied');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('Aucun périphérique caméra/micro détecté sur cet appareil.');
      } else {
        // Fallback for HTTP environments or simulators
        setCameraStatus('granted');
        setMicStatus('granted');
        onPermissionsGranted();
        onClose();
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: '380px',
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        {/* Header Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          color: '#0066FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 8px 20px rgba(0, 102, 255, 0.2)'
        }}>
          <ShieldCheck size={32} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Autorisations Périphériques
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
          StageLink a besoin de votre autorisation pour accéder à la <strong>Caméra</strong> et au <strong>Microphone</strong> pour les appels HD, les stories et les messages vocaux.
        </p>

        {/* Status Indicators List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', textAlign: 'left' }}>
          {(requiredType === 'all' || requiredType === 'video') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '12px 14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={20} color="#0066FF" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Caméra Vidéo HD</span>
              </div>
              {cameraStatus === 'granted' ? (
                <CheckCircle2 size={18} color="#10B981" />
              ) : cameraStatus === 'denied' ? (
                <AlertCircle size={18} color="#EF4444" />
              ) : (
                <Lock size={16} color="#94A3B8" />
              )}
            </div>
          )}

          {(requiredType === 'all' || requiredType === 'audio') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '12px 14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mic size={20} color="#0066FF" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Microphone & Voix</span>
              </div>
              {micStatus === 'granted' ? (
                <CheckCircle2 size={18} color="#10B981" />
              ) : micStatus === 'denied' ? (
                <AlertCircle size={18} color="#EF4444" />
              ) : (
                <Lock size={16} color="#94A3B8" />
              )}
            </div>
          )}
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 12px', borderRadius: '12px', fontSize: '0.78rem', marginBottom: '16px', textAlign: 'left', lineHeight: 1.4 }}>
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '16px', border: '1px solid #CBD5E1', background: '#FFF', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}
          >
            Refuser
          </button>

          <button
            onClick={requestHardwarePermissions}
            disabled={isRequesting}
            style={{
              flex: 1.5,
              padding: '12px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF, #0047FF)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 102, 255, 0.35)'
            }}
          >
            {isRequesting ? 'Vérification...' : 'Autoriser Accès'}
          </button>
        </div>
      </div>
    </div>
  );
}
