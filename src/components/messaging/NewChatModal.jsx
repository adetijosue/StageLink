import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, MapPin, Music, MessageSquare, Loader2 } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';

const normalizeStr = (str) => {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export default function NewChatModal({ isOpen, onClose, onStartChatWithUser, onSelectUser, existingUsers, users }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  // Fetch initial profiles on modal open so all artists are immediately accessible
  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured()) return;

    let isMounted = true;
    const fetchInitialProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (data && !error && isMounted) {
          const mapped = data
            .filter(p => {
              const name = (p.full_name || p.username || '').toLowerCase();
              const email = (p.email || '').toLowerCase();
              const id = String(p.id || '').toLowerCase();
              return !name.includes('test subagent') && !name.includes('subagent') && !email.includes('subagent') && !id.includes('subagent');
            })
            .map(p => ({
            id: p.id,
            name: p.full_name || p.username || 'Artiste',
            userName: p.username || p.full_name || 'Artiste',
            full_name: p.full_name || p.username || 'Artiste',
            username: p.username || '',
            role: p.role || 'Artiste',
            userRole: p.role || 'Artiste',
            avatar: p.avatar_url || '',
            avatar_url: p.avatar_url || '',
            userAvatar: p.avatar_url || '',
            verified: p.verified_badge === 'gold' || p.verified_badge === 'blue',
            location: p.location || '',
            email: p.email || ''
          }));
          setRemoteUsers(mapped);
        }
      } catch (e) {
        console.warn('Initial profiles load note for chat modal:', e?.message || e);
      }
    };

    fetchInitialProfiles();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Live remote search when user types in searchQuery
  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured() || !searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const q = searchQuery.trim().replace(/[,()"]/g, ' ');
        if (!q) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${q}%,role.ilike.%${q}%,location.ilike.%${q}%`)
          .limit(30);

        if (data && !error) {
          const mapped = data
            .filter(p => {
              const name = (p.full_name || p.username || '').toLowerCase();
              const email = (p.email || '').toLowerCase();
              const id = String(p.id || '').toLowerCase();
              return !name.includes('test subagent') && !name.includes('subagent') && !email.includes('subagent') && !id.includes('subagent');
            })
            .map(p => ({
            id: p.id,
            name: p.full_name || p.username || 'Artiste',
            userName: p.username || p.full_name || 'Artiste',
            full_name: p.full_name || p.username || 'Artiste',
            username: p.username || '',
            role: p.role || 'Artiste',
            userRole: p.role || 'Artiste',
            avatar: p.avatar_url || '',
            avatar_url: p.avatar_url || '',
            userAvatar: p.avatar_url || '',
            verified: p.verified_badge === 'gold' || p.verified_badge === 'blue',
            location: p.location || '',
            email: p.email || ''
          }));

          setRemoteUsers(prev => {
            const combined = [...mapped];
            (prev || []).forEach(existing => {
              if (!combined.some(u => u.id === existing.id)) {
                combined.push(existing);
              }
            });
            return combined;
          });
        }
      } catch (e) {
        console.warn('Live chat user search note:', e?.message || e);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  const rawUsers = users || existingUsers || [];
  const safeUsers = Array.isArray(rawUsers) ? rawUsers : [];
  const combinedUsers = useMemo(() => {
    const list = [...safeUsers];
    remoteUsers.forEach(ru => {
      if (!list.some(u => u.id === ru.id)) {
        list.push(ru);
      }
    });
    return list;
  }, [safeUsers, remoteUsers]);

  const handleSelectUser = (user) => {
    const fn = onSelectUser || onStartChatWithUser;
    if (fn) fn(user);
    onClose();
  };

  // Search & Role filtering logic
  const filteredUsers = useMemo(() => {
    const normQuery = normalizeStr(searchQuery);

    return combinedUsers.filter((user) => {
      if (!user) return false;

      // Exclude current logged-in user from new chat contact list
      if (currentUser) {
        if (user.id && currentUser.id && String(user.id) === String(currentUser.id)) return false;
        if (user.email && currentUser.email && String(user.email).toLowerCase() === String(currentUser.email).toLowerCase()) return false;
      }

      const name = normalizeStr(user.name || user.userName || user.full_name || '');
      const role = normalizeStr(user.role || user.userRole || '');
      const location = normalizeStr(user.location || '');

      const matchesQuery = !normQuery ||
        name.includes(normQuery) ||
        role.includes(normQuery) ||
        location.includes(normQuery);

      const matchesRole = filterRole === 'All' || role.includes(normalizeStr(filterRole));

      return matchesQuery && matchesRole;
    });
  }, [combinedUsers, currentUser, searchQuery, filterRole]);

  if (!isOpen) return null;

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
    }} onClick={onClose}>
      <div className="animate-slide-up" onClick={(e) => e.stopPropagation()} style={{
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
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
            }}
            title="Fermer"
          >
            <X size={20} color="#EF4444" />
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
              padding: '12px 38px 12px 42px',
              borderRadius: '16px',
              border: '1px solid #CBD5E1',
              fontSize: '0.88rem',
              outline: 'none',
              background: '#F8FAFC'
            }}
          />
          {isSearchingRemote ? (
            <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0066FF' }} />
          ) : searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* Quick Role Filters */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px', scrollbarWidth: 'none' }}>
          {['All', 'Chanteur', 'Beatmaker', 'Directeur Artistique', 'Ingénieur du Son', 'Guitariste', 'Label', 'Batteur', 'Producteur'].map((role) => (
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
                  <UserAvatar user={{ avatar: user.avatar, name: user.name }} size={48} />
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
              <p style={{ fontSize: '0.88rem' }}>
                {searchQuery
                  ? `Aucun utilisateur trouvé pour "${searchQuery}"`
                  : 'Aucun utilisateur disponible.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
