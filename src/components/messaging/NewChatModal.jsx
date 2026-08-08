import React, { useState } from 'react';
import { X, Search, MessageSquare, Check, MapPin, Music } from 'lucide-react';
import Logo from '../common/Logo';

export default function NewChatModal({ isOpen, onClose, onStartChatWithUser, onSelectUser, existingUsers, users }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  if (!isOpen) return null;

  const rawUsers = users || existingUsers || [];
  const safeUsers = Array.isArray(rawUsers) ? rawUsers : [];

  const handleSelectUser = (user) => {
    const fn = onSelectUser || onStartChatWithUser;
    if (fn) fn(user);
    onClose();
  };

  // Search & Role filtering logic
  const filteredUsers = safeUsers.filter((user) => {
    if (!user) return false;
    const name = user.name || user.userName || '';
    const role = user.role || user.userRole || '';
    const location = user.location || '';

    const matchesQuery =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'All' || role.includes(filterRole);

    return matchesQuery && matchesRole;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }}>
      <div className="animate-slide-up" style={{
        width: '100%',
        maxWidth: '440px',
        background: '#FFFFFF',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        paddingTop: '24px',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 24px))',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.25)'
      }}>
        {/* Modal Header */}
        {/* Sticky Modal Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#FFFFFF',
          paddingBottom: '12px',
          marginBottom: '14px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Nouvelle Discussion Musique
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Recherchez et contactez des artistes & producteurs.
            </p>
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

        {/* Real-Time User Search Field */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Rechercher par nom, rôle ou ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: '16px',
              border: '1px solid #CBD5E1',
              fontSize: '0.88rem',
              outline: 'none',
              background: '#F8FAFC'
            }}
          />
        </div>

        {/* Quick Role Filters */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px', scrollbarWidth: 'none' }}>
          {['All', 'Chanteur', 'Beatmaker', 'Directeur Artistique', 'Ingénieur du Son', 'Guitariste', 'Label'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: filterRole === role ? '2px solid #0066FF' : '1px solid #E2E8F0',
                background: filterRole === role ? '#EFF6FF' : '#FFFFFF',
                color: filterRole === role ? '#0066FF' : '#64748B',
                fontWeight: filterRole === role ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {role}
            </button>
          ))}
        </div>

        {/* User Search Results List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '18px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  {user.verified && (
                    <span style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#0066FF',
                      color: '#FFF',
                      fontSize: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #FFF'
                    }}>
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                    {user.name}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#0066FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Music size={12} /> {user.role}
                  </p>
                  {user.location && (
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <MapPin size={11} /> {user.location}
                    </span>
                  )}
                </div>

                {/* Send Chat Action */}
                <button
                  style={{
                    background: '#0066FF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0, 102, 255, 0.25)'
                  }}
                >
                  <MessageSquare size={14} /> Discuter
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8' }}>
              <p style={{ fontSize: '0.88rem' }}>Aucun utilisateur trouvé pour "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
