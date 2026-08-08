import React, { useState } from 'react';
import { X, GraduationCap, DollarSign, BookOpen } from 'lucide-react';

export default function PublishCourseModal({ isOpen, onClose, onCourseCreated }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('59');
  const [duration, setDuration] = useState('4h (8 Modules HD)');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCourseCreated({
      id: `course_${Date.now()}`,
      title,
      instructor: 'Vous (Formateur VIP)',
      price: `${price} €`,
      duration,
      enrolled: '1 inscrit',
      rating: '5.0 ⭐',
      cover: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80'
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div className="animate-scale-in" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '440px',
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Sticky Header */}
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <GraduationCap size={20} color="#0066FF" /> Publier une Formation Pro
          </h3>
          <button
            type="button"
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Titre de la Formation / Masterclass</label>
            <input
              type="text"
              required
              placeholder="Ex: Masterclass : Techniques de Mixage Vocaux Pro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '14px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Prix (€)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '14px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Durée & Format</label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '14px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: '#0066FF',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginTop: '6px'
            }}
          >
            Mettre en Ligne la Formation
          </button>
        </form>
      </div>
    </div>
  );
}
