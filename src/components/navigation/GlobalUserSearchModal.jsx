import React, { useState, useEffect } from 'react';
import { X, Search, Check, Sparkles, MapPin, Music, ChevronRight, UserPlus, UserCheck, User, MessageSquare } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { soundEngine } from '../../services/audioService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { presenceService } from '../../services/presenceService';

export default function GlobalUserSearchModal({ isOpen, onClose, users, onOpenPublicProfile, onStartChat, onConnectUser, isDarkMode }) {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [followedUsers, setFollowedUsers] = useState({});
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(() => presenceService.getOnlineUserIds());

  useEffect(() => {
    const unsubscribe = presenceService.subscribe((ids) => {
      setOnlineUserIds(ids);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured() || !searchQuery.trim()) {
      setRemoteUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const q = searchQuery.trim();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${q}%,role.ilike.%${q}%,location.ilike.%${q}%`)
          .limit(30);

        if (data && !error) {
          const mapped = data.map(p => ({
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
            location: p.location || ''
          }));
          setRemoteUsers(mapped);
        }
      } catch (e) {
        console.warn('Live profile search note:', e?.message || e);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  const safeLocalUsers = Array.isArray(users) ? users : [];
  const combinedUsers = [...safeLocalUsers];
  remoteUsers.forEach(ru => {
    if (!combinedUsers.some(u => u.id === ru.id)) {
      combinedUsers.push(ru);
    }
  });

  const filteredUsers = combinedUsers.filter((u) => {
    if (!u) return false;

    // Exclude current logged-in user from member search results
    if (currentUser) {
      if (u.id && currentUser.id && u.id === currentUser.id) return false;
      if (u.email && currentUser.email && String(u.email).toLowerCase() === String(currentUser.email).toLowerCase()) return false;
    }

    const name = String(u.name || u.userName || '');
    const role = String(u.role || u.userRole || '');
    const location = String(u.location || '');

    const matchesQuery =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'All' || String(role).toLowerCase().includes(String(filterRole).toLowerCase());

    return matchesQuery && matchesRole;
  });

  const handleUserClick = (usr) => {
    soundEngine.playPopSound();
    if (onOpenPublicProfile) onOpenPublicProfile(usr);
    onClose();
  };

  const handleStartChatClick = (e, usr) => {
    e.stopPropagation();
    soundEngine.playPopSound();
    if (onStartChat) onStartChat(usr);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      background: 'rgba(15, 23, 42, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'calc(14px + env(safe-area-inset-top, 14px)) 14px calc(20px + env(safe-area-inset-bottom, 20px)) 14px'
    }} onClick={onClose}>
      <div className="animate-scale-in" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '440px',
        maxHeight: 'calc(100dvh - max(48px, env(safe-area-inset-top, 16px) + env(safe-area-inset-bottom, 20px)))',
        display: 'flex',
        flexDirection: 'column',
        background: isDarkMode ? '#0F172A' : '#FFFFFF',
        color: isDarkMode ? '#FFFFFF' : '#0F172A',
        borderRadius: '24px',
        boxShadow: '0 25px 65px rgba(0,0,0,0.4)',
        overflow: 'hidden'
      }}>
        {/* Sticky Non-collapsible Header */}
        <div style={{
          flexShrink: 0,
          padding: '14px 18px',
          borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9',
          background: isDarkMode ? '#151D2A' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: isDarkMode ? '#FFFFFF' : '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} color="#0066FF" /> {t('search_modal_title')}
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '2px 0 0 0' }}>
              {language === 'en' ? 'Quickly find artists, beatmakers & producers' : 'Retrouvez rapidement artistes, beatmakers & producteurs'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              minWidth: '38px',
              minHeight: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
            }}
            title={t('btn_close')}
          >
            <X size={18} color="#EF4444" />
          </button>
        </div>

        {/* Live Search Input Input Area */}
        <div style={{ padding: '12px 18px 6px 18px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0066FF' }} />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_input_placeholder')}
              style={{
                width: '100%',
                padding: '12px 38px 12px 42px',
                borderRadius: '16px',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                background: isDarkMode ? '#1E293B' : '#F8FAFC',
                color: isDarkMode ? '#FFFFFF' : '#0F172A',
                fontSize: '0.88rem',
                outline: 'none',
                fontWeight: 600
              }}
            />
            {searchQuery && (
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
            )}
          </div>
        </div>

        {/* Role Filters Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 18px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { id: 'All', label: t('filter_all') },
            { id: 'Artiste', label: language === 'en' ? 'Artists' : 'Artistes' },
            { id: 'Beatmaker', label: 'Beatmakers' },
            { id: 'Producteur', label: language === 'en' ? 'Producers' : 'Producteurs' },
            { id: 'Ingénieur', label: language === 'en' ? 'Sound Engineers' : 'Ingénieurs Son' }
          ].map((role) => {
            const isSel = filterRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setFilterRole(role.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isSel ? '#0066FF' : isDarkMode ? '#1E293B' : '#F1F5F9',
                  color: isSel ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B',
                  fontSize: '0.76rem',
                  fontWeight: isSel ? 700 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {role.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Results Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '10px 18px 24px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((usr) => (
              <div
                key={usr.id}
                onClick={() => handleUserClick(usr)}
                style={{
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  borderRadius: '18px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Avatar with Verified Badge & Online Status Dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <UserAvatar user={{ avatar: usr.avatar || usr.userAvatar, name: usr.name || usr.userName }} size={48} />
                  
                  {/* Realtime Status Dot (Green = Online, Grey = Offline) */}
                  <span
                    title={isOnline ? t('online_status') : t('offline_status')}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isOnline ? '#10B981' : '#94A3B8',
                      border: `2px solid ${isDarkMode ? '#0F172A' : '#FFFFFF'}`,
                      boxShadow: isOnline ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
                      transition: 'all 0.25s ease',
                      zIndex: 2
                    }}
                  />

                  {usr.verified && (
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
                      border: '1.5px solid #FFF',
                      zIndex: 2
                    }}>
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>

                {/* User Information */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {usr.name || usr.userName}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#0066FF', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Music size={12} /> {usr.role || usr.userRole}
                  </p>
                  {usr.location && (
                    <span style={{ fontSize: '0.72rem', color: isDarkMode ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <MapPin size={11} /> {usr.location}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playPopSound();
                      setFollowedUsers(prev => ({ ...prev, [usr.id]: !prev[usr.id] }));
                      if (!followedUsers[usr.id] && onConnectUser) {
                        onConnectUser(usr.id);
                      }
                    }}
                    title={followedUsers[usr.id] ? t('unfollow') : t('follow')}
                    style={{
                      background: followedUsers[usr.id] ? '#ECFDF5' : '#F1F5F9',
                      color: followedUsers[usr.id] ? '#047857' : '#0F172A',
                      border: followedUsers[usr.id] ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                      borderRadius: '20px',
                      padding: '8px 12px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {followedUsers[usr.id] ? <><UserCheck size={14} color="#047857" /> {t('unfollow')}</> : <><UserPlus size={14} color="#0F172A" /> {t('follow')}</>}
                  </button>

                  <button
                    onClick={(e) => handleStartChatClick(e, usr)}
                    title={language === 'en' ? 'Start chat' : 'Démarrer une discussion'}
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
                    <MessageSquare size={14} /> {language === 'en' ? 'Chat' : 'Discuter'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '36px 16px',
              color: '#94A3B8',
              fontSize: '0.85rem'
            }}>
              <User size={36} color="#CBD5E1" style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>{language === 'en' ? `No users match your search "${searchQuery}".` : `Aucun utilisateur ne correspond à votre recherche "${searchQuery}".`}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
