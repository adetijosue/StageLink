import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Prevent double-tap zoom & pinch-to-zoom gestures on all mobile browsers
if (typeof window !== 'undefined') {
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 280 && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Handle stale chunk errors gracefully by auto-reloading once
  window.addEventListener('vite:preloadError', (event) => {
    const reloaded = sessionStorage.getItem('stagelink_preload_reload');
    if (!reloaded) {
      sessionStorage.setItem('stagelink_preload_reload', '1');
      window.location.reload();
    }
  });
}

// Register PWA Service Worker for Native Notifications & Background Execution
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('StageLink ServiceWorker registration note:', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
