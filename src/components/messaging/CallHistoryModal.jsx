import React, { useState } from 'react';
import { X, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Calendar, Play } from 'lucide-react';
import { soundEngine } from '../../services/audioService';

export default function CallHistoryModal({ isOpen, onClose, chats, onStartCallWithUser, isDarkMode }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'missed' | 'audio' | 'video'

  if (!isOpen) return null;

  // Extract all call entries from chats
  const allCalls = [];

  (chats || []).forEach((chat) => {
    (chat.messages || []).forEach((msg) => {
      const isCall = msg.isCallNotice || (msg.text && (msg.text.includes('Appel') || msg.text.includes('appel')));
      if (isCall) {
        const isAudioOnly = msg.isAudioOnly || (msg.text && msg.text.toLowerCase().includes('audio'));
        const isMissed = msg.callStatus === 'missed' || (msg.text && msg.text.toLowerCase().includes('manqué'));
        const isOutgoing = msg.sender === 'current' || (msg.text && (msg.text.includes('sans réponse') || msg.text.includes('émis')));

        allCalls.push({
          id: msg.id,
          chatId: chat.id,
          participant: chat.participant,
          isAudioOnly,
          isMissed,
          isOutgoing,
          text: msg.text,
          timestamp: msg.timestamp || 'Récemment',
          createdAtTimestamp: msg.createdAtTimestamp || Date.now()
        });
      }
    });
  });

  // Sort by date (newest first)
  allCalls.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);

  // Apply Filter
  const filteredCalls = allCalls.filter((call) => {
    if (filterType === 'missed') return call.isMissed;
    if (filterType === 'audio') return call.isAudioOnly;
    if (filterType === 'video') return !call.isAudioOnly;
    return true;
  });

  const handleCallback = (call, audioOnly) => {
    soundEngine.playPopSound();
    if (onStartCallWithUser) {
      onStartCallWithUser(call.participant, audioOnly);
    }
    onClose();
  };

  // Stats calculation
  const totalCalls = allCalls.length;
  const missedCount = allCalls.filter(c => c.isMissed).length;
  const outgoingCount = allCalls.filter(c => c.isOutgoing).length;
  const totalMinutes = Math.floor(totalCalls * 4.5); // Simulation of duration

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
    }}>
      <div className="animate-scale-in" style={{
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
        {/* Stats Bar */}
        <div style={{ display: 'flex', background: 'linear-gradient(135deg, #0066FF, #0047FF)', padding: '12px', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, justifyContent: 'space-around', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ textAlign: 'center' }}><div style={{ opacity: 0.8 }}>TOTAL</div><div>{totalCalls}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ opacity: 0.8 }}>MANQUÉS</div><div style={{ color: '#FCA5A5' }}>{missedCount}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ opacity: 0.8 }}>DURÉE</div><div>{totalMinutes} min</div></div>
        </div>

        {/* Fixed Top Header */}
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
              <Phone size={20} color="#0066FF" /> Historique des Appels
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Consultez vos appels récents Audio & Vidéo
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: isDarkMode ? '#1E293B' : '#F1F5F9',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              minWidth: '42px',
              minHeight: '42px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <X size={20} color={isDarkMode ? '#F8FAFC' : '#0F172A'} />
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '10px 18px',
          background: isDarkMode ? '#0F172A' : '#F8FAFC',
          borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0'
        }}>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'missed', label: 'Manqués' },
            { id: 'audio', label: 'Audio' },
            { id: 'video', label: 'Vidéo' }
          ].map((tab) => {
            const isSel = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isSel ? '#0066FF' : 'transparent',
                  color: isSel ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: isSel ? 700 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Call List Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '14px 18px 24px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {filteredCalls.length > 0 ? (
            filteredCalls.map((call) => (
              <div
                key={call.id}
                style={{
                  background: isDarkMode ? '#1E293B' : '#F8FAFC',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {/* Avatar */}
                <img
                  src={call.participant?.avatar}
                  alt={call.participant?.name}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                />

                {/* Call Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {call.participant?.name}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
                    {call.isMissed ? (
                      <span style={{ color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <PhoneMissed size={12} /> Appel manqué
                      </span>
                    ) : call.isOutgoing ? (
                      <span style={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <PhoneOutgoing size={12} color="#0066FF" /> Appel émis
                      </span>
                    ) : (
                      <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <PhoneIncoming size={12} color="#10B981" /> Appel reçu
                      </span>
                    )}
                    <span style={{ opacity: 0.6 }}>•</span>
                    <span style={{ opacity: 0.7, color: isDarkMode ? '#CBD5E1' : '#64748B' }}>{call.timestamp}</span>
                  </div>
                </div>

                {/* Quick Callback Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleCallback(call, true)}
                    title="Rappeler en Audio"
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#0066FF',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Phone size={16} />
                  </button>

                  <button
                    onClick={() => handleCallback(call, false)}
                    title="Rappeler en Vidéo"
                    style={{
                      background: '#0066FF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,102,255,0.25)'
                    }}
                  >
                    <Video size={16} />
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
              <Phone size={36} color="#CBD5E1" style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Aucun appel récen enregistré dans cette catégorie.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
