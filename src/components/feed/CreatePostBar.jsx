import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Image, Send, PlusCircle } from 'lucide-react';

export default function CreatePostBar({ onClickOpenModal }) {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div
      onClick={onClickOpenModal}
      style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '16px',
        marginBottom: '18px',
        boxShadow: '0 8px 24px rgba(0, 102, 255, 0.08)',
        border: '1.5px solid #E2E8F0',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
    >
      {/* Top Row: User Avatar & Input Prompt */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #0066FF',
            boxShadow: '0 4px 12px rgba(0, 102, 255, 0.15)'
          }}
        />
        <div style={{
          flex: 1,
          background: '#F8FAFC',
          borderRadius: '24px',
          padding: '12px 18px',
          color: '#64748B',
          fontSize: '0.88rem',
          border: '1px solid #CBD5E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 500
        }}>
          <span>Partager un projet, une musique ou une opportunité...</span>
          <PlusCircle size={20} color="#0066FF" />
        </div>
      </div>

      {/* Bottom Row: Clean Photo Pill & Primary Publish Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '10px',
        borderTop: '1px solid #F1F5F9'
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#EFF6FF',
          color: '#0066FF',
          padding: '6px 14px',
          borderRadius: '16px',
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          <Image size={16} /> Photo / Visuel
        </span>

        <button
          type="button"
          style={{
            background: 'linear-gradient(135deg, #0066FF, #0047FF)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '16px',
            padding: '8px 18px',
            fontSize: '0.84rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
            cursor: 'pointer'
          }}
        >
          <Send size={15} /> Publier
        </button>
      </div>
    </div>
  );
}
