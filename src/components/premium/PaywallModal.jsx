import React, { useState } from 'react';
import { X, Crown, Check, ShieldCheck, ArrowRight, Gift, Sparkles, DollarSign, GraduationCap, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

export default function PaywallModal({ isOpen, onClose, onUpgradeSuccess }) {
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('yearly'); // 'monthly' or 'yearly'
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (e) { console.error("Suppressed error", e); }
      if (onUpgradeSuccess) onUpgradeSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 450,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '680px',
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '28px 24px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
        position: 'relative'
      }}>
        {/* Sticky Header Bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#FFFFFF',
          paddingBottom: '12px',
          marginBottom: '16px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(245, 158, 11, 0.4)'
            }}>
              <Crown size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Pass Unique VIP Gold StageLink
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Accédez aux fonctionnalités professionnelles & devenez Membre VIP Officiel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#0F172A" />
          </button>
        </div>

        {/* Benefits Summary Grid */}
        <div style={{ background: '#FFFBEB', borderRadius: '20px', padding: '16px', border: '1px solid #FDE68A', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#D97706" /> Inclus dans votre Pass VIP Gold :
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', fontSize: '0.82rem', color: '#78350F' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} color="#D97706" />
              <span><strong>Vendre vos œuvres & beats</strong> sur la boutique</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={16} color="#D97706" />
              <span><strong>Vendre vos formations</strong> & masterclasses</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="#D97706" />
              <span><strong>Organiser des événements</strong> & concerts en direct</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crown size={16} color="#D97706" />
              <span><strong>Badge VIP Or Officiel</strong> visible devant votre nom</span>
            </div>
          </div>
        </div>

        {/* Billing Selection Options */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Mensuel Option */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            style={{
              borderRadius: '20px',
              padding: '20px',
              border: selectedPlan === 'monthly' ? '2.5px solid #D97706' : '1.5px solid #E2E8F0',
              background: selectedPlan === 'monthly' ? '#FFFBEB' : '#FFFFFF',
              boxShadow: selectedPlan === 'monthly' ? '0 10px 25px rgba(245, 158, 11, 0.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Formule Mensuelle</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: '4px 0 0 0' }}>
                  9,99 € <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>/ mois</span>
                </h3>
              </div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: selectedPlan === 'monthly' ? '6px solid #D97706' : '2px solid #CBD5E1', background: '#FFF' }} />
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>Sans engagement, annulation à tout moment.</p>
          </div>

          {/* Annuel Option - 25% Off */}
          <div
            onClick={() => setSelectedPlan('yearly')}
            style={{
              borderRadius: '20px',
              padding: '20px',
              border: selectedPlan === 'yearly' ? '2.5px solid #D97706' : '1.5px solid #FDE68A',
              background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
              boxShadow: selectedPlan === 'yearly' ? '0 12px 30px rgba(245, 158, 11, 0.3)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '16px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#FFF',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '10px'
            }}>
              ÉCONOMISEZ 25%
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Formule Annuelle (Meilleur Choix)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: '4px 0 0 0' }}>
                  89,99 € <span style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: 800 }}>/ an</span>
                </h3>
              </div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: selectedPlan === 'yearly' ? '6px solid #D97706' : '2px solid #CBD5E1', background: '#FFF' }} />
            </div>
            <p style={{ fontSize: '0.78rem', color: '#78350F', fontWeight: 600, margin: 0 }}>Soit 7,49 € / mois facturé annuellement.</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubscribe}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '20px',
            border: 'none',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: '#FFFFFF',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isProcessing ? 'Activation du Pass VIP Gold...' : <>Souscrire au Pass VIP Gold <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
