import React, { useState, useRef } from 'react';
import { X, FileText, Download, Share2, Music, Edit3, Check, MapPin, Upload, Trash2 } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import Logo from '../common/Logo';

/**
 * MusicalCVModal - Ergonomic Bottom Sheet Version
 */
export default function MusicalCVModal({ isOpen, onClose, user, isOwnProfile = true, isDarkMode }) {
  const [activeTab, setActiveTab] = useState('interactive');
  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      soundEngine.playPopSound();
      // Logic would normally go here to store file
      setActiveTab('file');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>

      <div
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '500px', maxHeight: '88vh',
          background: isDarkMode ? '#151D2A' : '#FFFFFF',
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
          padding: '12px 20px 40px 20px', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: '40px', height: '5px', background: isDarkMode ? '#1E293B' : '#E2E8F0', borderRadius: '3px', alignSelf: 'center', marginBottom: '15px' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} color="#0066FF" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>CV Musical & Press Kit</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '50%', width: '38px', height: '38px',
              minWidth: '38px', minHeight: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
            }}
            title="Fermer"
          >
            <X size={20} color="#EF4444" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: isDarkMode ? '#1E293B' : '#F1F5F9', padding: 4, borderRadius: '14px', marginBottom: '20px' }}>
          <button onClick={() => setActiveTab('interactive')} style={{ flex: 1, padding: '10px', borderRadius: '11px', border: 'none', background: activeTab === 'interactive' ? '#0066FF' : 'transparent', color: activeTab === 'interactive' ? '#FFF' : '#64748B', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Fiche Artiste</button>
          <button onClick={() => setActiveTab('file')} style={{ flex: 1, padding: '10px', borderRadius: '11px', border: 'none', background: activeTab === 'file' ? '#0066FF' : 'transparent', color: activeTab === 'file' ? '#FFF' : '#64748B', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Fichier PDF</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'interactive' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '12px', borderRadius: '16px' }}>
                  <img src={user.avatar} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#0066FF', fontWeight: 700 }}>{user.role}</div>
                  </div>
               </div>

               <div style={{ background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '15px', borderRadius: '16px' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748B', marginBottom: '8px' }}>INSTRUMENTS & SKILLS</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(Array.isArray(user.instruments) ? user.instruments : ['Piano']).map(i => (
                      <span key={i} style={{ background: '#FFF', color: '#0066FF', padding: '5px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #E2E8F0' }}>{i}</span>
                    ))}
                  </div>
               </div>

               <div style={{ background: isDarkMode ? '#1E293B' : '#F8FAFC', padding: '15px', borderRadius: '16px' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748B', marginBottom: '8px' }}>BIOGRAPHIE</h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{user.bio || 'Non renseignée.'}</p>
               </div>
            </div>
          ) : (
            <div
              onClick={() => isOwnProfile && fileInputRef.current?.click()}
              style={{ border: '2px dashed #CBD5E1', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', background: isDarkMode ? '#1E293B' : '#F8FAFC', cursor: 'pointer' }}
            >
              <Upload size={32} color="#0066FF" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{isOwnProfile ? 'Importer mon CV Musical' : 'Aucun fichier'}</div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '5px' }}>Accepte les fichiers PDF, DOCX et JPG</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          style={{ width: '100%', marginTop: '20px', padding: '16px', borderRadius: '18px', border: 'none', background: '#0066FF', color: '#FFF', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0, 102, 255, 0.3)' }}
        >
          <Download size={18} style={{ marginRight: 8 }} /> Télécharger en PDF
        </button>
      </div>
    </div>
  );
}
