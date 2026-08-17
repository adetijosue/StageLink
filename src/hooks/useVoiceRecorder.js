import { useState, useRef, useCallback } from 'react';
import { soundEngine } from '../services/audioService';

/**
 * StageLink Universal Voice Note Recorder Hook
 * High-performance audio capture with iOS/Android codec fallback & realtime waveform
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPreviewData, setAudioPreviewData] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [waveformData, setWaveformData] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioPreviewInstanceRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const waveAnimRef = useRef(null);
  const streamRef = useRef(null);

  /**
   * Start Voice Recording
   */
  const startRecording = useCallback(async () => {
    soundEngine.playPopSound();
    if (navigator.vibrate) navigator.vibrate([30]);

    setAudioPreviewData(null);
    setIsPlayingPreview(false);
    setWaveformData([]);
    setRecordingTime(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Votre navigateur ne supporte pas l\'enregistrement audio.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      audioChunksRef.current = [];

      // Determine best supported MIME type
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Realtime Audio Waveform Analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          source.connect(analyser);
          analyserRef.current = analyser;

          const updateWave = () => {
            if (!analyserRef.current) return;
            const buffer = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(buffer);
            let sum = 0;
            for (let i = 0; i < buffer.length; i++) sum += buffer[i];
            const avg = Math.min(100, Math.round((sum / buffer.length / 255) * 100));

            setWaveformData((prev) => [...prev.slice(-35), Math.max(10, avg)]);
            waveAnimRef.current = requestAnimationFrame(updateWave);
          };
          waveAnimRef.current = requestAnimationFrame(updateWave);
        } catch (e) {
          console.warn('AudioContext visualization setup note:', e);
        }
      }

      mediaRecorder.start(100);
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access error:', err);
      alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès dans les paramètres.');
    }
  }, []);

  /**
   * Stop Recording and prepare Preview or execute callback
   */
  const stopRecording = useCallback((onComplete) => {
    soundEngine.playPopSound();
    if (navigator.vibrate) navigator.vibrate([20]);

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (waveAnimRef.current) cancelAnimationFrame(waveAnimRef.current);
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
    }

    setIsRecording(false);
    const durationFormatted = `${Math.floor(recordingTime / 60).toString().padStart(2, '0')}:${(recordingTime % 60).toString().padStart(2, '0')}`;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        const preview = {
          blob: audioBlob,
          url: audioUrl,
          duration: durationFormatted,
          durationSeconds: Math.max(1, recordingTime),
          waveform: waveformData.length > 0 ? waveformData : [25, 50, 75, 40, 90, 60, 80, 45, 70, 55, 65, 30]
        };

        setAudioPreviewData(preview);

        if (typeof onComplete === 'function') {
          onComplete(preview);
        }
      };
      mediaRecorderRef.current.stop();
    }
  }, [recordingTime, waveformData]);

  /**
   * Cancel and discard recording
   */
  const cancelRecording = useCallback(() => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (waveAnimRef.current) cancelAnimationFrame(waveAnimRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioPreviewInstanceRef.current) {
      audioPreviewInstanceRef.current.pause();
    }
    setIsRecording(false);
    setAudioPreviewData(null);
    setIsPlayingPreview(false);
    setWaveformData([]);
    setRecordingTime(0);
  }, []);

  /**
   * Toggle Playback of Recorded Audio Preview
   */
  const togglePlayPreview = useCallback(() => {
    if (!audioPreviewData?.url) return;

    if (isPlayingPreview) {
      if (audioPreviewInstanceRef.current) {
        audioPreviewInstanceRef.current.pause();
      }
      setIsPlayingPreview(false);
    } else {
      const audio = new Audio(audioPreviewData.url);
      audioPreviewInstanceRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
      audio.onerror = () => setIsPlayingPreview(false);
      audio.play().catch(() => setIsPlayingPreview(false));
      setIsPlayingPreview(true);
    }
  }, [audioPreviewData, isPlayingPreview]);

  return {
    isRecording,
    recordingTime,
    audioPreviewData,
    isPlayingPreview,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording,
    togglePlayPreview
  };
}
