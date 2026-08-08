import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message, confirmText }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 350,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="animate-scale-up" style={{
        width: '100%',
        maxWidth: '400px',
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: '#FEF2F2', border: '1px solid #FCA5A5',
            borderRadius: '50%', width: '32px', height: '32px',
            color: '#EF4444', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Fermer"
        >
          <X size={18} color="#EF4444" />
        </button>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#FEF2F2',
          color: '#EF4444',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          border: '1px solid #FCA5A5'
        }}>
          <AlertTriangle size={28} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          {title || 'Confirmation de suppression'}
        </h3>

        <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
          {message || 'Voulez-vous vraiment supprimer cet élément ? Cette action est définitive et irréversible.'}
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '16px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#64748B',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1.2,
              padding: '12px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 6px 18px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Trash2 size={16} /> {confirmText || 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}
