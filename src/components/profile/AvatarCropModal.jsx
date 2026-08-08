import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';

export default function AvatarCropModal({ isOpen, onClose, rawImageSrc, onCropComplete }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loadedImage, setLoadedImage] = useState(null);

  const previewCanvasRef = useRef(null);

  // Load image object when rawImageSrc changes
  useEffect(() => {
    if (rawImageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedImage(img);
        setScale(1);
        setPosition({ x: 0, y: 0 });
      };
      img.src = rawImageSrc;
    } else {
      setLoadedImage(null);
    }
  }, [rawImageSrc]);

  // Render live preview on canvas preserving 1:1 aspect ratio
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !loadedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 220;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw circular clip mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, size, size);

    // Calculate aspect ratio covering
    const nw = loadedImage.naturalWidth || loadedImage.width;
    const nh = loadedImage.naturalHeight || loadedImage.height;

    let drawW, drawH;
    if (nw > nh) {
      drawH = size * scale;
      drawW = (nw / nh) * size * scale;
    } else {
      drawW = size * scale;
      drawH = (nh / nw) * size * scale;
    }

    const drawX = (size / 2) - (drawW / 2) + position.x;
    const drawY = (size / 2) - (drawH / 2) + position.y;

    ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);
    ctx.restore();
  }, [loadedImage, scale, position]);

  useEffect(() => {
    if (loadedImage) {
      drawPreview();
    }
  }, [loadedImage, scale, position, drawPreview]);

  if (!isOpen || !rawImageSrc) return null;

  // Touch & Mouse Drag Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Perform High-Res 400x400 Square Avatar Export
  const handleApplyCrop = () => {
    if (!loadedImage) return;

    const exportSize = 400;
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw circular clip path
    ctx.beginPath();
    ctx.arc(exportSize / 2, exportSize / 2, exportSize / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    const nw = loadedImage.naturalWidth || loadedImage.width;
    const nh = loadedImage.naturalHeight || loadedImage.height;

    let drawW, drawH;
    if (nw > nh) {
      drawH = exportSize * scale;
      drawW = (nw / nh) * exportSize * scale;
    } else {
      drawW = exportSize * scale;
      drawH = (nh / nw) * exportSize * scale;
    }

    const ratio = exportSize / 220; // Ratio from preview viewport (220px) to export (400px)
    const drawX = (exportSize / 2) - (drawW / 2) + (position.x * ratio);
    const drawY = (exportSize / 2) - (drawH / 2) + (position.y * ratio);

    ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 350,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div className="animate-scale-in" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '380px',
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Recadrer la photo de profil</h3>
          <button
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* Live Canvas Circular Crop Mask Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            border: '4px solid #0066FF',
            boxShadow: '0 8px 25px rgba(0, 102, 255, 0.3)',
            cursor: isDragging ? 'grabbing' : 'grab',
            background: '#0F172A',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
        >
          <canvas
            ref={previewCanvasRef}
            style={{ width: '220px', height: '220px', display: 'block', borderRadius: '50%' }}
          />
        </div>

        <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '14px', textAlign: 'center' }}>
          Glissez la photo pour déplacer le visage et ajustez le zoom ci-dessous
        </p>

        {/* Zoom Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '20px', background: '#F8FAFC', padding: '10px 16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <ZoomOut size={18} color="#64748B" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#0066FF', cursor: 'pointer' }}
          />
          <ZoomIn size={18} color="#0066FF" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', minWidth: '38px', textAlign: 'right' }}>
            {scale.toFixed(1)}x
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            title="Réinitialiser"
            style={{ padding: '12px', borderRadius: '16px', border: '1px solid #CBD5E1', background: '#FFF', color: '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066FF, #0047FF)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 6px 18px rgba(0, 102, 255, 0.35)'
            }}
          >
            <Check size={18} /> Valider le Recadrage
          </button>
        </div>
      </div>
    </div>
  );
}
