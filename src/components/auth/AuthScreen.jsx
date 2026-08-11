import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { Mail, Lock, User, Music, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(false); // Default to Sign Up registration

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Beatmaker / Compositeur');
  const [gender, setGender] = useState('male');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre e-mail professionnel.');
      return;
    }
    setError('');
    setResetMessage('');
    try {
      if (isSupabaseConfigured()) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (resetErr) {
          setError(resetErr.message);
        } else {
          setResetMessage('Un lien de réinitialisation a été envoyé à votre e-mail.');
        }
      } else {
        setResetMessage('Lien de réinitialisation envoyé.');
      }
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'envoi.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.trim().length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const res = await login(email.trim(), password.trim());
        if (!res.success) {
          let errText = typeof res.error === 'string' ? res.error : res.error?.message;
          if (!errText || errText === '{}' || errText.includes('{')) {
            errText = 'Identifiants ou mot de passe incorrect.';
          }
          setError(errText);
        }
      } else {
        if (!name.trim()) {
          setError('Veuillez entrer votre nom ou pseudonyme d\'artiste.');
          setIsSubmitting(false);
          return;
        }

        const res = await signup({ email: email.trim(), password: password.trim(), name: name.trim(), role, gender });
        if (!res.success) {
          let errText = typeof res.error === 'string' ? res.error : res.error?.message;
          if (!errText || errText === '{}' || errText.includes('{')) {
            errText = 'Erreur lors de l’inscription. Veuillez réessayer.';
          }
          setError(errText);
        }
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      setError(err?.message || 'Erreur lors du traitement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 'calc(16px + env(safe-area-inset-top, 16px))',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 24px))',
      paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
      paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        margin: 'auto 0'
      }}>
        {/* Brand Hero Box - Ultra-Prominent & Imposing Full-Size Logo */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            display: 'inline-block',
            padding: '16px 28px',
            background: '#FFFFFF',
            borderRadius: '28px',
            boxShadow: '0 16px 40px rgba(0, 102, 255, 0.22)',
            border: '1px solid #E2E8F0',
            marginBottom: '8px'
          }}>
            <Logo size="xlarge" variant="vertical" />
          </div>
          <p style={{ color: '#64748B', fontSize: '0.82rem', marginTop: '4px', fontWeight: 600 }}>
            Réseau social & opportunités 100% musique
          </p>
        </div>

        {/* Auth Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(148, 163, 184, 0.12)',
          border: '1px solid #E2E8F0'
        }}>
          {/* Toggle Mode Header */}
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            borderRadius: '12px',
            padding: '3px',
            marginBottom: '12px'
          }}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: isLogin ? '#FFFFFF' : 'transparent',
                color: isLogin ? '#0066FF' : '#64748B',
                boxShadow: isLogin ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Se Connecter
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: !isLogin ? '#FFFFFF' : 'transparent',
                color: !isLogin ? '#0066FF' : '#64748B',
                boxShadow: !isLogin ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Créer un Compte
            </button>
          </div>

          {error && error !== '{}' && (
            <div style={{
              background: '#FEF2F2',
              color: '#EF4444',
              padding: '10px 14px',
              borderRadius: '14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '12px',
              border: '1px solid #FCA5A5',
              textAlign: 'center'
            }}>
              {typeof error === 'string' && error !== '{}' && !error.includes('{')
                ? error
                : 'Erreur lors du traitement. Veuillez vérifier vos identifiants.'}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!isLogin && (
              <>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '3px', display: 'block' }}>
                    Nom d'artiste / Pseudonyme
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="ex: StageLink ou Jean Dupont"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem',
                        outline: 'none',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                    💡 Entrez votre prénom, nom ou nom de scène d'artiste.
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '3px', display: 'block' }}>
                    Rôle ou Métier Musical
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Music size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem',
                        outline: 'none',
                        background: '#FFFFFF'
                      }}
                    >
                      <option value="Artiste / Chanteur">Artiste / Chanteur</option>
                      <option value="Rappeur / MC">Rappeur / MC</option>
                      <option value="Beatmaker / Compositeur">Beatmaker / Compositeur</option>
                      <option value="Producteur Musical">Producteur Musical</option>
                      <option value="Ingénieur du Son">Ingénieur du Son</option>
                      <option value="Guitariste">Guitariste</option>
                      <option value="Pianiste / Claviériste">Pianiste / Claviériste</option>
                      <option value="Bassiste">Bassiste</option>
                      <option value="Batteur / Percussionniste">Batteur / Percussionniste</option>
                      <option value="DJ / Performer">DJ / Performer</option>
                      <option value="Auteur-Compositeur">Auteur-Compositeur</option>
                      <option value="Directeur Artistique">Directeur Artistique</option>
                      <option value="Label / Manager">Label / Manager</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '3px', display: 'block' }}>
                    Civilité / Sexe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem',
                        outline: 'none',
                        background: '#FFFFFF'
                      }}
                    >
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '3px', display: 'block' }}>
                E-mail Professionnel
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  placeholder="votre@musique.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '3px', display: 'block' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {resetMessage && (
              <div style={{ padding: '8px 12px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600 }}>
                {resetMessage}
              </div>
            )}

            {isLogin && (
              <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: '#0066FF', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', marginTop: '4px', padding: '11px', fontSize: '0.86rem' }}
            >
              {isSubmitting ? 'Traitement...' : isLogin ? 'Se Connecter' : 'Rejoindre StageLink'} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
