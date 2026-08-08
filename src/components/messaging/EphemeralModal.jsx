import React, { useState } from 'react';
import { X, Clock, Check } from 'lucide-react';

export default function EphemeralModal({ isOpen, onClose, participantName = 'Sarah' }) {
  const [duration, setDuration] = useState('24h');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="animate-fade-in" style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '360px',
        padding: '24px 20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Discussions: {participantName}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Big Clock Graphic matching mockup 3 screen 3 */}
        <div style={{
          margin: '20px auto',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: '#F1F5F9',
          color: '#94A3B8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid #E2E8F0'
        }}>
          <Clock size={52} strokeWidth={1.5} />
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>
          Définir la durée de conservation des messages éphémères dans cette discussion.
        </p>

        {/* Options Row matching mockup 3 screen 3 */}
        <div style={{
          display: 'flex',
          background: '#F8FAFC',
          borderRadius: '16px',
          padding: '4px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px'
        }}>
          {[
            { id: '24h', label: '24h' },
            { id: '1h', label: '1h' },
            { id: 'read', label: 'après lecture' }
          ].map((opt) => {
            const isSel = duration === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setDuration(opt.id)}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isSel ? '#FFFFFF' : 'transparent',
                  color: isSel ? '#0066FF' : '#64748B',
                  fontWeight: isSel ? 700 : 500,
                  fontSize: '0.8rem',
                  boxShadow: isSel ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', borderRadius: '16px' }}
        >
          Enregistrer le délai <Check size={18} />
        </button>
      </div>
    </div>
  );
}
