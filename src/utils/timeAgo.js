import { useState, useEffect } from 'react';

/**
 * Format any date or timestamp into a dynamic, accurate relative time string
 * Supports ISO strings, Date objects, millisecond timestamps, or legacy relative strings.
 * 
 * @param {string|number|Date} dateOrTimestamp 
 * @param {string} [language='fr'] 'fr' | 'en'
 * @returns {string} Relative time string (e.g. "À l'instant", "Il y a 5 min", "Il y a 2 h", "Il y a 3 j")
 */
export function formatTimeAgo(dateOrTimestamp, language = 'fr') {
  if (!dateOrTimestamp) {
    return language === 'en' ? 'Recently' : 'Récemment';
  }

  // If already a relative label like "À l'instant" or "Just now", return directly unless it is "Récemment"
  if (typeof dateOrTimestamp === 'string' && (dateOrTimestamp === 'Récemment' || dateOrTimestamp === 'Recently')) {
    // If no timestamp attached, return localized fallback
    return language === 'en' ? 'Recently' : 'Récemment';
  }

  let date;
  if (dateOrTimestamp instanceof Date) {
    date = dateOrTimestamp;
  } else if (typeof dateOrTimestamp === 'number') {
    date = new Date(dateOrTimestamp);
  } else if (typeof dateOrTimestamp === 'string') {
    // Check if valid date string
    const parsed = new Date(dateOrTimestamp);
    if (isNaN(parsed.getTime())) {
      // Return as-is if it's already a descriptive formatted string
      return dateOrTimestamp;
    }
    date = parsed;
  } else {
    return language === 'en' ? 'Recently' : 'Récemment';
  }

  const now = Date.now();
  const timestamp = date.getTime();
  const diffMs = now - timestamp;
  const isEn = language === 'en';

  // Future or right now (< 45s)
  if (diffMs < 45 * 1000) {
    return isEn ? 'Just now' : "À l'instant";
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  // < 60 seconds
  if (diffSec < 60) {
    return isEn ? `${diffSec}s ago` : `Il y a ${diffSec}s`;
  }

  // < 60 minutes
  if (diffMin < 60) {
    return isEn ? `${diffMin}m ago` : `Il y a ${diffMin} min`;
  }

  // < 24 hours
  if (diffHours < 24) {
    return isEn ? `${diffHours}h ago` : `Il y a ${diffHours} h`;
  }

  // < 7 days
  if (diffDays < 7) {
    return isEn ? `${diffDays}d ago` : `Il y a ${diffDays} j`;
  }

  // If within the same year, show "22 août" / "Aug 22"
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();

  try {
    if (currentYear === dateYear) {
      return date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    } else {
      return date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch (e) {
    return date.toLocaleDateString();
  }
}

/**
 * React hook to keep a relative time string reactive and automatically updated in live UI
 * 
 * @param {string|number|Date} dateOrTimestamp 
 * @param {string} [language='fr'] 
 * @param {number} [refreshIntervalMs=30000] Default 30s interval
 * @returns {string}
 */
export function useTimeAgo(dateOrTimestamp, language = 'fr', refreshIntervalMs = 30000) {
  const [formatted, setFormatted] = useState(() => formatTimeAgo(dateOrTimestamp, language));

  useEffect(() => {
    setFormatted(formatTimeAgo(dateOrTimestamp, language));

    const interval = setInterval(() => {
      setFormatted(formatTimeAgo(dateOrTimestamp, language));
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [dateOrTimestamp, language, refreshIntervalMs]);

  return formatted;
}
