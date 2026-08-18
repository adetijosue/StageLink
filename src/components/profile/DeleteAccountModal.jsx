import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, CheckSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../services/audioService';

export default function DeleteAccountModal({ isOpen, onClose, isDarkMode }) {
  const { currentUser, deleteUserAccount } = useAuth();
  const [step, setStep] = useState(1); // 1: Warning & Checkboxes, 2: Security Word Input
  const [checkIrreversible, setCheckIrreversible] = useState(false);
  const [checkEraseData, setCheckEraseData] = useState(false);
  const [confirmWord, setConfirmWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleNextStep = () => {
    soundEngine.playPopSound();
    setStep(2);
  };

  const handleFinalDelete = async (e) => {
    e.preventDefault();
    if (confirmWord.trim().toUpperCase() !== 'SUPPRIMER') return;

    soundEngine.playPopSound();
    setIsDeleting(true);

    try {
      await deleteUserAccount();
    } catch (err) {
      console.error('Account deletion error:', err);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  const isStep1Valid = checkIrreversible && checkEraseData;
  const isStep2Valid = confirmWord.trim().toUpperCase() === 'SUPPRIMER';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }} onClick={onClose}>
      <div
        className="animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px',
          background: isDarkMode ? '#0F172A' : '#FFFFFF',
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          borderRadius: '28px',
          padding: '24px',
          border: '1.5px solid #FCA5A5',
          boxShadow: '0 25px 50px rgba(239, 68, 68, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#FEF2F2', color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Trash2 size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EF4444', margin: 0 }}>
                Supprimer mon compte
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>Étape {step} sur 2</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '50%', width: '36px', height: '36px',
              minWidth: '36px', minHeight: '36px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
            }}
            title="Fermer"
          >
            <X size={18} color="#EF4444" />
          </button>
        </div>

        {step === 1 ? (
          /* STEP 1: Warning & Checkboxes */
          <div>
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: '18px', padding: '14px', marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#B91C1C', fontWeight: 800, fontSize: '0.88rem' }}>
                <ShieldAlert size={18} /> Attention : Action Irréversible !
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#991B1B', lineHeight: 1.5 }}>
                <li>Vos publications, stories et démos audio seront supprimées.</li>
                <li>Votre profil sera retiré de l'annuaire d'artistes StageLink.</li>
                <li>Vos conversations privées et abonnements VIP seront révoqués.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checkIrreversible}
                  onChange={(e) => setCheckIrreversible(e.target.checked)}
                  style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#EF4444' }}
                />
                <span>Je comprends que cette suppression est <strong>définitive et irréversible</strong>.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checkEraseData}
                  onChange={(e) => setCheckEraseData(e.target.checked)}
                  style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#EF4444' }}
                />
                <span>Je confirme vouloir effacer l'intégralité de mes données de l'application.</span>
              </label>
            </div>

            <button
              onClick={handleNextStep}
              disabled={!isStep1Valid}
              style={{
                width: '100%', padding: '14px', borderRadius: '16px',
                border: 'none',
                background: isStep1Valid ? '#EF4444' : (isDarkMode ? '#1E293B' : '#E2E8F0'),
                color: isStep1Valid ? '#FFFFFF' : '#94A3B8',
                fontWeight: 800, fontSize: '0.88rem',
                cursor: isStep1Valid ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              Continuer vers la confirmation <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* STEP 2: Security Word Input Verification */
          <form onSubmit={handleFinalDelete}>
            <p style={{ fontSize: '0.85rem', color: isDarkMode ? '#CBD5E1' : '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
              Pour valider définitivement la suppression de votre compte (<strong>{currentUser.name}</strong>), veuillez saisir le mot de sécurité <strong>SUPPRIMER</strong> ci-dessous :
            </p>

            <div style={{ marginBottom: '18px' }}>
              <input
                type="text"
                placeholder="Tapez SUPPRIMER"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '14px',
                  border: isStep2Valid ? '2px solid #EF4444' : '1px solid #CBD5E1',
                  fontSize: '0.9rem', fontWeight: 700, outline: 'none',
                  textAlign: 'center', letterSpacing: '1px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  color: isDarkMode ? '#FFFFFF' : '#0F172A'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1, padding: '14px', borderRadius: '16px',
                  border: '1px solid #CBD5E1', background: 'transparent',
                  color: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Retour
              </button>

              <button
                type="submit"
                disabled={!isStep2Valid || isDeleting}
                style={{
                  flex: 2, padding: '14px', borderRadius: '16px', border: 'none',
                  background: isStep2Valid ? '#DC2626' : (isDarkMode ? '#1E293B' : '#E2E8F0'),
                  color: isStep2Valid ? '#FFFFFF' : '#94A3B8',
                  fontWeight: 800, fontSize: '0.85rem',
                  cursor: isStep2Valid && !isDeleting ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {isDeleting ? (
                  'Suppression...'
                ) : (
                  <>
                    <Trash2 size={16} /> Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
