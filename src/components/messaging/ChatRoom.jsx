import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip, Smile, Mic, Play, Pause, ShieldCheck, CheckCheck, Trash2, Trash, Copy, X, PhoneCall, VideoOff, Reply, PhoneMissed } from 'lucide-react';
import { soundEngine } from '../../services/audioService';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

export default function ChatRoom({ chat, onBack, onStartAudioCall, onStartVideoCall, onOpenEphemeralModal, onSendMessage, onDeleteMessageForMe, onDeleteMessageForEveryone, onOpenPublicProfile }) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Swipe-to-Reply, Quoted Message & Scroll-to-Original State
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [swipedMsgId, setSwipedMsgId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const touchStartXRef = useRef(0);
  const isSwipingRef = useRef(false);

  // Recorded Audio Preview State (Hold to record -> Release to Preview & Listen before sending)
  const [audioPreviewData, setAudioPreviewData] = useState(null);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);

  // Message Context Popover Modal State
  const [selectedMessageForAction, setSelectedMessageForAction] = useState(null);
  const [confirmDeleteForMeMsgId, setConfirmDeleteForMeMsgId] = useState(null);
  const [confirmDeleteEveryoneMsgId, setConfirmDeleteEveryoneMsgId] = useState(null);

  const [reactions, setReactions] = useState({});
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playingAudioMsgId, setPlayingAudioMsgId] = useState(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [typingStatusText, setTypingStatusText] = useState('En ligne');

  // MediaRecorder & Audio Instances
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeAudioInstanceRef = useRef(null);
  const audioPreviewInstanceRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, isPartnerTyping]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!isPartnerTyping && Math.random() > 0.6) {
      setIsPartnerTyping(true);
      setTypingStatusText("En train d'écrire...");
      setTimeout(() => {
        setIsPartnerTyping(false);
        setTypingStatusText('En ligne');
      }, 3000);
    }
  };

  if (!chat) return null;

  // Universal Touch & Pointer Swipe Gesture Handling (Mobile Touch + Mouse Drag)
  const handlePointerDownMessage = (e, msgId) => {
    touchStartXRef.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    isSwipingRef.current = true;
    setSwipedMsgId(msgId);
  };

  const handlePointerMoveMessage = (e, msgId) => {
    if (!isSwipingRef.current || swipedMsgId !== msgId) return;
    const currentX = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const deltaX = currentX - touchStartXRef.current;
    if (deltaX > 0 && deltaX < 110) {
      setSwipeOffset(deltaX);
    }
  };

  const handlePointerUpMessage = (msg) => {
    if (isSwipingRef.current && swipeOffset > 40) {
      handleSelectMessageToQuote(msg);
    }
    isSwipingRef.current = false;
    setSwipeOffset(0);
    setSwipedMsgId(null);
  };

  const handleSelectMessageToQuote = (msg) => {
    try {
      if (navigator.vibrate) navigator.vibrate(25);
    } catch (err) {}
    soundEngine.playPopSound();
    setReplyingToMessage(msg);
  };

  // Scroll to Original Quoted Message and Pulse Highlight
  const handleScrollToQuotedMessage = (targetMsgId) => {
    if (!targetMsgId) return;
    const elem = document.getElementById(`msg_bubble_${targetMsgId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetMsgId);
      try {
        if (navigator.vibrate) navigator.vibrate(25);
      } catch (e) {}
      soundEngine.playPopSound();
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 1800);
    }
  };

  const handleSendMessageWithQuote = (messagePayload) => {
    if (!onSendMessage) return;

    if (replyingToMessage) {
      const isObj = typeof messagePayload === 'object';
      const textVal = isObj ? messagePayload.text : messagePayload;

      onSendMessage(chat.id, {
        text: textVal,
        quotedMessage: {
          id: replyingToMessage.id,
          senderName: replyingToMessage.sender === 'current' ? 'Vous' : chat.participant.name,
          text: replyingToMessage.text,
          mediaUrl: replyingToMessage.mediaUrl,
          isAudio: replyingToMessage.isAudio,
          audioDuration: replyingToMessage.audioDuration
        },
        mediaUrl: isObj ? messagePayload.mediaUrl : null,
        audioUrl: isObj ? messagePayload.audioUrl : null,
        isAudio: isObj ? messagePayload.isAudio : false,
        audioDuration: isObj ? messagePayload.audioDuration : null
      });
      setReplyingToMessage(null);
    } else {
      onSendMessage(chat.id, messagePayload);
    }
  };

  // Start Microphone Recording (Hold-to-Record) with Pop sound & vibration
  const handleStartRecord = async (e) => {
    e.preventDefault();
    try {
      if (navigator.vibrate) navigator.vibrate(35);
    } catch (err) {}
    soundEngine.playPopSound();
    setAudioPreviewData(null);
    setIsPlayingAudioPreview(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];

        let options = {};
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(100);
      }
      setIsRecordingAudio(true);
      setRecordingTime(0);
      setTypingStatusText("En train d'enregistrer un vocal...");

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone Access Notice:', err.message);
      setIsRecordingAudio(true);
      setRecordingTime(0);
      setTypingStatusText("En train d'enregistrer un vocal...");

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  // Release to Stop Recording & Open Pre-recorded Voice Note Preview
  const handleStopRecordAndPreparePreview = (e) => {
    if (e) e.preventDefault();
    if (!isRecordingAudio) return;

    soundEngine.playPopSound();
    try {
      if (navigator.vibrate) navigator.vibrate(20);
    } catch (err) {}

    clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);
    setTypingStatusText('En ligne');

    const durationFormatted = `00:${recordingTime < 10 ? '0' + recordingTime : recordingTime}`;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }

        setAudioPreviewData({
          audioUrl,
          audioDuration: durationFormatted
        });
      };
      mediaRecorderRef.current.stop();
    } else {
      setAudioPreviewData({
        audioUrl: null,
        audioDuration: durationFormatted
      });
    }
  };

  // Toggle Playing Pre-Recorded Audio Preview
  const togglePlayRecordedAudioPreview = () => {
    if (isPlayingAudioPreview) {
      if (audioPreviewInstanceRef.current) {
        audioPreviewInstanceRef.current.pause();
      }
      soundEngine.stop();
      setIsPlayingAudioPreview(false);
    } else {
      if (audioPreviewData?.audioUrl) {
        const audio = new Audio(audioPreviewData.audioUrl);
        audioPreviewInstanceRef.current = audio;
        audio.onended = () => setIsPlayingAudioPreview(false);
        audio.onerror = () => {
          soundEngine.generateAndPlay(120, 'Afro-Gospel');
        };
        audio.play().catch(() => {
          soundEngine.generateAndPlay(120, 'Afro-Gospel');
        });
      } else {
        soundEngine.generateAndPlay(120, 'Afro-Gospel');
      }
      setIsPlayingAudioPreview(true);
    }
  };

  // Confirm Sending Recorded Audio Preview to Chat
  const handleConfirmSendAudioPreview = () => {
    if (!audioPreviewData) return;
    if (audioPreviewInstanceRef.current) {
      audioPreviewInstanceRef.current.pause();
    }
    soundEngine.stop();
    setIsPlayingAudioPreview(false);

    handleSendMessageWithQuote({
      text: `🎙️ Message vocal audio (${audioPreviewData.audioDuration})`,
      isAudio: true,
      audioUrl: audioPreviewData.audioUrl,
      audioDuration: audioPreviewData.audioDuration
    });

    setAudioPreviewData(null);
  };

  const handleMessageLongPressSelect = (msg) => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch (e) {}
    soundEngine.playPopSound();
    setSelectedMessageForAction(msg);
  };

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const isImg = file.type.startsWith('image/');
        if (isImg) {
          handleSendMessageWithQuote({
            text: '',
            mediaUrl: reader.result,
            isImage: true
          });
        } else {
          handleSendMessageWithQuote({
            text: `📄 Document : ${file.name}`,
            documentName: file.name
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
  };

  const handleAddReaction = (msgId, emoji) => {
    try {
      if (navigator.vibrate) navigator.vibrate(25);
    } catch (e) {}
    soundEngine.playPopSound();
    setReactions({
      ...reactions,
      [msgId]: emoji
    });
    setSelectedMessageForAction(null);
  };

  const togglePlayAudioMessage = (msgId, realAudioUrl) => {
    if (playingAudioMsgId === msgId) {
      if (activeAudioInstanceRef.current) {
        activeAudioInstanceRef.current.pause();
      }
      soundEngine.stop();
      setPlayingAudioMsgId(null);
    } else {
      if (activeAudioInstanceRef.current) {
        activeAudioInstanceRef.current.pause();
      }

      setPlayingAudioMsgId(msgId);

      if (realAudioUrl) {
        const audio = new Audio(realAudioUrl);
        audio.playbackRate = playbackSpeed;
        audio.onended = () => setPlayingAudioMsgId(null);
        audio.onerror = () => {
          soundEngine.generateAndPlay(120, 'Afro-Gospel');
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            soundEngine.generateAndPlay(120, 'Afro-Gospel');
          });
        }
        activeAudioInstanceRef.current = audio;
      } else {
        soundEngine.generateAndPlay(120, 'Afro-Gospel');
      }
    }
  };

  const togglePlaybackSpeed = () => {
    const newSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(newSpeed);
    if (activeAudioInstanceRef.current) {
      activeAudioInstanceRef.current.playbackRate = newSpeed;
    }
  };

  const isMessageWithinTwoHours = (msg) => {
    if (!msg.createdAtTimestamp) return true;
    const now = Date.now();
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    return (now - msg.createdAtTimestamp) <= twoHoursInMs;
  };

  const emojiCategoryTabs = [
    { id: 'smileys', icon: '😀' },
    { id: 'music', icon: '🎵' },
    { id: 'gestures', icon: '❤️' },
    { id: 'nature', icon: '🐱' },
    { id: 'food', icon: '☕' },
    { id: 'symbols', icon: '🚀' }
  ];

  const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '👽', '👾', '🤖'],
    music: ['🎵', '🎶', '🎼', '🎹', '🎸', '🎷', '🎺', '🎻', '🥁', '🎤', '🎧', '🎙️', '🎛️', '🎚️', '📻', '🔊', '🔈', '🎬', '📸', '🎨', '🔥', '✨', '⚡', '💥', '🌟', '💫', '🎉', '🎊', '🍾', '🥂', '🥳', '💃', '🕺', '🎭', '🎟️', '🎫', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️'],
    gestures: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👏', '👍', '👎', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '👈', '👉', '👆', '👇', '✌️', '🤞', '🤟', '🤘', '🤙', '🖐️', '✋', '👌', '👋', '👊', '✊', '🤛', '🤜', '🤝', '💅'],
    nature: ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🕷️', '🌺', '🌸', '🌼', '🌻', '🌞', '🌙', '⭐', '🌟', '💫', '⚡', '🔥', '🌈', '🍀', '🌴'],
    food: ['☕', '🍵', '🧃', '🥤', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾', '🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🥚', '🥞', '🧇', '🥨', '🧀', 'salad', '🍝', '🍜', '🍲', '🍱', '🥟', '🍤', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍓', '🍒', '🍎', '🍉', '🍍'],
    symbols: ['🚀', '💡', '⚡', '💯', '👑', '🏆', '💎', '🔑', '🎯', '🔥', '⭐', '☀️', '🌙', '🌈', '🔴', '🔵', '🟢', '🟡', '🟣', '⚫', '⚪', '🟩', '🟨', '🟧', '🟥', '🟪', '🟦', '🟫', '📱', '💻', '🖥️', '📷', '📹', '📻', '⏳', '⌛', '⏰', '📌', '📍', '📍', '🔒', '🔓']
  };

  const reactionEmojis = ['❤️', '🔥', '👏', '😂', '😮', '👍', '🥳', '🤩', '💯', '🙏'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'var(--bg-light)',
      display: 'flex',
      flexDirection: 'column',
      WebkitUserSelect: 'none',
      userSelect: 'none',
      WebkitTouchCallout: 'none'
    }}>
      {/* Header with Safe Area Top Framing */}
      <div style={{
        background: 'var(--card-bg)',
        paddingTop: 'calc(14px + env(safe-area-inset-top, 14px))',
        paddingBottom: '12px',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={22} />
          </button>

          {/* Clickable Participant Avatar & Info */}
          <div
            onClick={() => onOpenPublicProfile && onOpenPublicProfile(chat.participant)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative' }}>
              <img src={chat.participant.avatar} alt={chat.participant.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
              {chat.participant.online && (
                <span style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', border: '2px solid #FFF' }} />
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{chat.participant.name}</h3>
              <span style={{ fontSize: '0.75rem', color: isPartnerTyping ? '#0066FF' : '#64748B', fontWeight: isPartnerTyping ? 700 : 400 }}>
                {typingStatusText}
              </span>
            </div>
          </div>
        </div>

        {/* Audio & Video Call Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onStartAudioCall}
            title="Appel Audio HD"
            style={{ background: '#EFF6FF', color: '#0066FF', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Phone size={18} />
          </button>
          <button
            onClick={onStartVideoCall}
            title="Appel Vidéo HD"
            style={{ background: '#EFF6FF', color: '#0066FF', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Video size={18} />
          </button>
          <button
            onClick={onOpenEphemeralModal}
            title="Minuteur d'Éphémérité"
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages List Area */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Encryption Banner */}
        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', color: '#D97706', padding: '6px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
            <ShieldCheck size={14} /> Chiffrement de bout en bout actif
          </span>
        </div>

        {chat.messages && chat.messages.length > 0 ? (
          chat.messages.map((msg) => {
          const isCurrent = msg.sender === 'current';
          const reaction = reactions[msg.id];
          const isMissedCall = msg.isCallNotice || (msg.text && msg.text.includes('Appel'));

          return (
            <div
              key={msg.id}
              id={`msg_bubble_${msg.id}`}
              onPointerDown={(e) => handlePointerDownMessage(e, msg.id)}
              onPointerMove={(e) => handlePointerMoveMessage(e, msg.id)}
              onPointerUp={() => handlePointerUpMessage(msg)}
              onTouchStart={(e) => handlePointerDownMessage(e, msg.id)}
              onTouchMove={(e) => handlePointerMoveMessage(e, msg.id)}
              onTouchEnd={() => handlePointerUpMessage(msg)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleMessageLongPressSelect(msg);
              }}
              style={{
                alignSelf: isCurrent ? 'flex-end' : isMissedCall ? 'center' : 'flex-start',
                maxWidth: isMissedCall ? '100%' : '84%',
                width: isMissedCall ? '100%' : 'auto',
                position: 'relative',
                transform: swipedMsgId === msg.id ? `translateX(${swipeOffset}px)` : 'none',
                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: highlightedMsgId === msg.id ? '0 0 0 4px #0066FF, 0 8px 25px rgba(0,102,255,0.4)' : 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              {/* Special Clickable Call Card Banner (Unified & Professional) */}
              {isMissedCall ? (
                <div style={{
                  background: isCurrent ? 'rgba(0,102,255,0.05)' : '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '8px 0'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: msg.callStatus === 'missed' ? '#FEE2E2' : '#EFF6FF', color: msg.callStatus === 'missed' ? '#EF4444' : '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {msg.isAudioOnly ? <Phone size={20} /> : <Video size={20} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>{msg.text}</h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{msg.timestamp}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playPopSound();
                      if (msg.isAudioOnly) onStartAudioCall(); else onStartVideoCall();
                    }}
                    style={{
                      background: '#0066FF', color: '#FFF', border: 'none', borderRadius: '12px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    Rappeler
                  </button>
                </div>
              ) : (
                /* Regular Message Bubble */
                <div style={{
                  background: isCurrent ? 'linear-gradient(135deg, #0066FF, #0047FF)' : 'var(--card-bg)',
                  color: isCurrent ? '#FFFFFF' : 'var(--text-dark)',
                  border: isCurrent ? 'none' : '1px solid var(--border-light)',
                  padding: '12px 14px',
                  borderRadius: isCurrent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  boxShadow: isCurrent ? '0 4px 12px rgba(0, 102, 255, 0.25)' : 'var(--shadow-sm)',
                  fontSize: '0.88rem',
                  lineHeight: 1.45,
                  position: 'relative',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}>
                  {/* CLICKABLE WHATSAPP-STYLE QUOTED / REPLIED MESSAGE ATTACHMENT CARD */}
                  {msg.quotedMessage && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScrollToQuotedMessage(msg.quotedMessage.id);
                      }}
                      title="Cliquer pour défiler vers le message d'origine"
                      style={{
                        background: isCurrent ? 'rgba(0, 0, 0, 0.22)' : '#F1F5F9',
                        borderRadius: '10px 10px 4px 4px',
                        padding: '8px 10px',
                        marginBottom: '8px',
                        borderLeft: isCurrent ? '4px solid #FFFFFF' : '4px solid #0066FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, background 0.15s ease'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: isCurrent ? '#FFFFFF' : '#0066FF',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Reply size={12} /> {msg.quotedMessage.senderName}
                        </div>

                        <div style={{
                          fontSize: '0.78rem',
                          color: isCurrent ? 'rgba(255,255,255,0.92)' : '#475569',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {msg.quotedMessage.isAudio ? `🎙️ Message vocal (${msg.quotedMessage.audioDuration || ''})` : msg.quotedMessage.text || 'Photo partagée'}
                        </div>
                      </div>

                      {msg.quotedMessage.mediaUrl && (
                        <img
                          src={msg.quotedMessage.mediaUrl}
                          alt="Aperçu miniature"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1px solid rgba(255,255,255,0.4)'
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Embedded Story Media Miniature Thumbnail Card (WITHOUT WRITTEN MENTION TEXT) */}
                  {msg.isStoryComment && (
                    <div style={{
                      width: '100%',
                      maxWidth: '220px',
                      height: '150px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                      position: 'relative',
                      background: msg.storyBgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      border: '1.5px solid rgba(255, 255, 255, 0.4)'
                    }}>
                      {msg.storyThumbnail ? (
                        <img
                          src={msg.storyThumbnail}
                          alt="Miniature Story"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textAlign: 'center'
                        }}>
                          {msg.storyCaption || 'Story StageLink'}
                        </div>
                      )}

                      {/* Subtle overlay caption on top of story media thumbnail if caption exists */}
                      {msg.storyThumbnail && msg.storyCaption && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                          padding: '16px 8px 6px 8px',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {msg.storyCaption}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Photo / Media Attachment Display */}
                  {msg.mediaUrl && (
                    <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: msg.text ? '8px' : 0, border: '1px solid rgba(255,255,255,0.2)' }}>
                      <img
                        src={msg.mediaUrl}
                        alt="Photo partagée"
                        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '280px', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Missed Call Notice Badge */}
                  {msg.isCallNotice ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: isCurrent ? '#FFFFFF' : '#EF4444',
                      fontWeight: 800,
                      fontSize: '0.84rem'
                    }}>
                      <PhoneMissed size={16} />
                      <span>{msg.text}</span>
                    </div>
                  ) : msg.text && (
                    <div style={{ userSelect: 'none' }}>{msg.text}</div>
                  )}

                  {/* Real Audio Voice Note Waveform Player */}
                  {(msg.isAudio || (msg.text && msg.text.includes('Message vocal'))) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', paddingTop: '6px', borderTop: isCurrent ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E2E8F0' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayAudioMessage(msg.id, msg.audioUrl);
                        }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: isCurrent ? '#FFF' : '#0066FF', color: isCurrent ? '#0066FF' : '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                      >
                        {playingAudioMsgId === msg.id ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />}
                      </button>

                      {/* Animated Waveform Bars */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, height: '20px' }}>
                        {[10, 18, 14, 24, 16, 8, 20, 12, 16, 24, 18, 10, 14].map((h, idx) => (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              height: `${playingAudioMsgId === msg.id ? Math.max(6, (h * playbackSpeed) % 24) : h}px`,
                              background: isCurrent ? '#FFFFFF' : '#0066FF',
                              borderRadius: '2px',
                              transition: 'all 0.15s ease'
                            }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlaybackSpeed();
                        }}
                        style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: isCurrent ? '#FFF' : '#0066FF', borderRadius: '10px', padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {playbackSpeed}x
                      </button>
                    </div>
                  )}

                  {/* Reaction Badge */}
                  {reaction && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-10px',
                      right: isCurrent ? 'auto' : '-10px',
                      left: isCurrent ? '-10px' : 'auto',
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '2px 6px',
                      fontSize: '0.78rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      border: '1px solid #E2E8F0'
                    }}>
                      {reaction}
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp & Read Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCurrent ? 'flex-end' : isMissedCall ? 'center' : 'flex-start',
                gap: '4px',
                marginTop: '4px',
                fontSize: '0.7rem',
                color: '#94A3B8'
              }}>
                <span>{msg.timestamp}</span>
              </div>
            </div>
          );
        })
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 20px',
            textAlign: 'center',
            margin: 'auto 0'
          }}>
            <img
              src={chat.participant?.avatar}
              alt={chat.participant?.name}
              style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0066FF', marginBottom: '12px', boxShadow: '0 8px 24px rgba(0,102,255,0.2)' }}
            />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
              {chat.participant?.name}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#0066FF', fontWeight: 700, margin: '0 0 16px 0' }}>
              {chat.participant?.role || 'Artiste / Producteur StageLink'}
            </p>
            <div style={{
              background: '#F1F5F9',
              borderRadius: '16px',
              padding: '12px 18px',
              fontSize: '0.82rem',
              color: '#64748B',
              fontWeight: 600,
              maxWidth: '320px',
              border: '1px solid #E2E8F0'
            }}>
              💬 Rédigez votre premier message ci-dessous pour démarrer la discussion.
            </div>
          </div>
        )}

        {/* Partner Typing Bubble Animation */}
        {isPartnerTyping && (
          <div style={{ alignSelf: 'flex-start', background: '#FFFFFF', padding: '10px 16px', borderRadius: '18px 18px 18px 4px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0066FF', animation: 'ping 1s infinite' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0066FF', animation: 'ping 1s infinite 0.2s' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0066FF', animation: 'ping 1s infinite 0.4s' }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pop/Spring Animated Long-Press Action Modal with Dismiss Outside Click Handler */}
      {selectedMessageForAction && (
        <div
          onClick={() => setSelectedMessageForAction(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '340px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              animation: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {/* Header & Quick Emoji Reactions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Réagir & Actions</span>
              <button
                onClick={() => setSelectedMessageForAction(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', background: '#F8FAFC', padding: '8px', borderRadius: '18px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
              {reactionEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(selectedMessageForAction.id, emoji)}
                  style={{ background: 'none', border: 'none', fontSize: '1.35rem', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Action List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* QUOTE / REPLY TO MESSAGE ACTION BUTTON */}
              <button
                onClick={() => {
                  handleSelectMessageToQuote(selectedMessageForAction);
                  setSelectedMessageForAction(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid #0066FF',
                  background: '#EFF6FF',
                  color: '#0066FF',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <Reply size={16} color="#0066FF" /> Répondre à ce message (Citer)
              </button>

              <button
                onClick={() => {
                  const msgId = selectedMessageForAction.id;
                  setSelectedMessageForAction(null);
                  setConfirmDeleteForMeMsgId(msgId);
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <Trash size={16} color="#64748B" /> Supprimer pour moi uniquement
              </button>

              {selectedMessageForAction.sender === 'current' && isMessageWithinTwoHours(selectedMessageForAction) && (
                <button
                  onClick={() => {
                    const msgId = selectedMessageForAction.id;
                    setSelectedMessageForAction(null);
                    setConfirmDeleteEveryoneMsgId(msgId);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#EF4444',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} color="#EF4444" /> Supprimer pour TOUS (Annuler l'envoi)
                </button>
              )}

              {selectedMessageForAction.text && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMessageForAction.text);
                    setSelectedMessageForAction(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={16} color="#0066FF" /> Copier le texte
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clean Uncluttered Emoji Picker Bar */}
      {showEmojiPicker && (
        <div style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '10px 14px',
          maxHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}>
          {/* Clean Emoji Category Icons Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1 }}>
              {emojiCategoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEmojiCategory(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: activeEmojiCategory === tab.id ? '#EFF6FF' : 'transparent',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  {tab.icon}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowEmojiPicker(false)}
              style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={14} color="#64748B" />
            </button>
          </div>

          {/* Clean Orderly Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '6px',
            overflowY: 'auto',
            padding: '2px'
          }}>
            {emojiCategories[activeEmojiCategory].map((e, idx) => (
              <button
                key={idx}
                onClick={() => handleAddEmoji(e)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.10s'
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Attachment Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileAttach}
        style={{ display: 'none' }}
      />

      {/* SWIPED / QUOTED MESSAGE PREVIEW BAR ABOVE INPUT */}
      {replyingToMessage && (
        <div style={{
          background: '#FFFFFF',
          padding: '8px 16px',
          borderTop: '1px solid #E2E8F0',
          borderLeft: '4px solid #0066FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0066FF', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Reply size={14} /> En réponse à {replyingToMessage.sender === 'current' ? 'Vous-même' : chat.participant.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {replyingToMessage.isAudio ? `🎙️ Message vocal` : replyingToMessage.text || 'Pièce jointe'}
            </div>
          </div>

          <button
            onClick={() => setReplyingToMessage(null)}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} color="#64748B" />
          </button>
        </div>
      )}

      {/* RECORDED VOICE NOTE PREVIEW BAR (Listen or Delete before Sending) */}
      {audioPreviewData ? (
        <div style={{
          background: '#FFFFFF',
          padding: '12px 16px 22px 16px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.04)'
        }}>
          {/* Discard / Delete Recording Button */}
          <button
            onClick={() => {
              if (audioPreviewInstanceRef.current) {
                audioPreviewInstanceRef.current.pause();
              }
              soundEngine.stop();
              setIsPlayingAudioPreview(false);
              setAudioPreviewData(null);
            }}
            title="Supprimer la note vocale"
            style={{
              background: '#FEF2F2',
              color: '#EF4444',
              border: '1px solid #FCA5A5',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={18} />
          </button>

          {/* Audio Preview Waveform & Playback Controls */}
          <div style={{
            flex: 1,
            background: '#F1F5F9',
            borderRadius: '20px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #CBD5E1'
          }}>
            <button
              onClick={togglePlayRecordedAudioPreview}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#0066FF',
                color: '#FFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,102,255,0.3)'
              }}
            >
              {isPlayingAudioPreview ? <Pause size={16} fill="#FFF" /> : <Play size={16} fill="#FFF" style={{ marginLeft: '2px' }} />}
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
                Vocal pré-enregistré ({audioPreviewData.audioDuration})
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Écoutez votre vocal avant de l'envoyer
              </div>
            </div>
          </div>

          {/* Confirm Send Button */}
          <button
            onClick={handleConfirmSendAudioPreview}
            title="Envoyer le vocal dans la discussion"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#0066FF',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4)'
            }}
          >
            <Send size={18} />
          </button>
        </div>
      ) : isRecordingAudio ? (
        /* Recording in progress indicator bar */
        <div style={{
          background: '#FEF2F2',
          padding: '12px 16px 20px 16px',
          borderTop: '1px solid #FCA5A5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EF4444', fontWeight: 700, fontSize: '0.88rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', animation: 'ping 1s infinite' }} />
            Enregistrement du vocal ({recordingTime}s)... Relâchez pour réécouter
          </div>

          <button
            onClick={handleStopRecordAndPreparePreview}
            style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Terminer
          </button>
        </div>
      ) : (
        /* Elevated Bottom Input Bar for Easy Touch Access */
        <div style={{
          background: '#FFFFFF',
          paddingTop: '10px',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 14px))',
          paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
          paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.03)'
        }}>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <Paperclip size={22} />
          </button>

          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <Smile size={22} color={showEmojiPicker ? '#0066FF' : '#64748B'} />
          </button>

          <input
            type="text"
            placeholder={replyingToMessage ? `Répondre à ${replyingToMessage.sender === 'current' ? 'votre message' : chat.participant.name.split(' ')[0]}...` : "Écrire un message..."}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputText.trim()) {
                handleSendMessageWithQuote(inputText);
                setInputText('');
              }
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '20px',
              border: '1px solid #CBD5E1',
              fontSize: '0.88rem',
              outline: 'none',
              background: '#F8FAFC'
            }}
          />

          {inputText.trim() ? (
            <button
              onClick={() => {
                handleSendMessageWithQuote(inputText);
                setInputText('');
              }}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#0066FF',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              onMouseDown={handleStartRecord}
              onMouseUp={handleStopRecordAndPreparePreview}
              onTouchStart={handleStartRecord}
              onTouchEnd={handleStopRecordAndPreparePreview}
              title="Maintenir enfoncé pour enregistrer un vocal"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#EFF6FF',
                color: '#0066FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal: Delete Message for Me */}
      <ConfirmDeleteModal
        isOpen={!!confirmDeleteForMeMsgId}
        onClose={() => setConfirmDeleteForMeMsgId(null)}
        onConfirm={() => {
          if (onDeleteMessageForMe) onDeleteMessageForMe(chat.id, confirmDeleteForMeMsgId);
        }}
        title="Supprimer pour vous ?"
        message="Ce message sera masqué sur votre appareil uniquement. L'autre participant verra toujours le message."
        confirmText="Supprimer pour moi"
      />

      {/* Confirmation Modal: Delete Message for Everyone */}
      <ConfirmDeleteModal
        isOpen={!!confirmDeleteEveryoneMsgId}
        onClose={() => setConfirmDeleteEveryoneMsgId(null)}
        onConfirm={() => {
          if (onDeleteMessageForEveryone) onDeleteMessageForEveryone(chat.id, confirmDeleteEveryoneMsgId);
        }}
        title="Annuler l'envoi du message ?"
        message="Ce message sera définitivement effacé de la conversation pour tous les participants."
        confirmText="Supprimer pour tous"
      />
    </div>
  );
}
