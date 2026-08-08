import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, post, onReportSubmitted }) {
  const [reason, setReason] = useState('contenu_inapproprie');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      if (onReportSubmitted) onReportSubmitted(post.id, reason, details);
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="animate-fade-in" style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '400px',
        padding: '24px 20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Signaler cette publication
          </h3>
          <button
            onClick={onClose}
            style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: '50%', width: '36px', height: '36px',
              color: '#EF4444', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Fermer"
          >
            <X size={18} color="#EF4444" />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <CheckCircle size={48} color="#10B981" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Signalement Transmis</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '6px' }}>
              Merci d'avoir contribué à la sécurité de la communauté StageLink. Notre équipe va réviser ce contenu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>
              Pourquoi souhaitez-vous signaler ce post de <strong>{post.userName}</strong> ?
            </p>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>Motif du signalement</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  background: '#FFFFFF'
                }}
              >
                <option value="contenu_inapproprie">Contenu inapproprié / Injurieux</option>
                <option value="droit_auteur">Violation des droits d'auteur / Plagiat musical</option>
                <option value="spam_arnaque">Spam ou arnaque commerciale</option>
                <option value="non_respect_charte">Non-respect des règles légales de la plateforme</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>Détails complémentaires (optionnel)</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Fournissez des précisions pour notre équipe de modération..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  resize: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
              }}
            >
              Confirmer le signalement
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
