import React, { useState, useEffect, useRef } from 'react';
import { Plus, Volume2, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AuthScreen from './components/auth/AuthScreen';
import TopBar from './components/navigation/TopBar';
import GlobalUserSearchModal from './components/navigation/GlobalUserSearchModal';
import BottomNav from './components/navigation/BottomNav';
import UserAvatar from './components/common/UserAvatar';
import StoryBar from './components/feed/StoryBar';
import StoryViewer from './components/feed/StoryViewer';
import FeedCard from './components/feed/FeedCard';
import CreatePostBar from './components/feed/CreatePostBar';
import CreatePostView from './components/feed/CreatePostView';
import CameraStoryRecorder from './components/feed/CameraStoryRecorder';
import ShareModal from './components/feed/ShareModal';
import ReportModal from './components/feed/ReportModal';
import PublicProfileModal from './components/profile/PublicProfileModal';
import SwipeMatching from './components/matching/SwipeMatching';
import ChatList from './components/messaging/ChatList';
import ChatRoom from './components/messaging/ChatRoom';
import EphemeralModal from './components/messaging/EphemeralModal';
import VideoCallScreen from './components/messaging/VideoCallScreen';
import NewChatModal from './components/messaging/NewChatModal';
import CallHistoryModal from './components/messaging/CallHistoryModal';
import AIMusicStudio from './components/music_studio/AIMusicStudio';
import ProfileView from './components/premium/ProfileView';
import PaywallModal from './components/premium/PaywallModal';
import NotificationsDrawer from './components/notifications/NotificationsDrawer';
import AppSplashScreen from './components/common/AppSplashScreen';
import GlobalAudioPlayer from './components/audio/GlobalAudioPlayer';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import PullToRefresh from './components/common/PullToRefresh';
import { getStoredItem, setStoredItem, STORAGE_KEYS } from './services/mockData';
import { soundEngine } from './services/audioService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const INITIAL_COMMUNITY_USERS = [];
import { generateUUID } from './utils/uuid';
import { compressImage } from './utils/imageCompressor';

// Helper to convert Data URL to File for Supabase Storage Upload
const dataURLtoFile = (dataurl, filename = 'media_upload') => {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime.split('/')[1] || 'jpg';
    return new File([u8arr], `${filename}.${ext}`, { type: mime });
  } catch (e) {
    return null;
  }
};

const uploadChatMediaToSupabase = async (dataUrl, fileName) => {
  if (!dataUrl || !isSupabaseConfigured()) return dataUrl;
  if (!dataUrl.startsWith('data:')) return dataUrl; // Already an HTTP URL

  try {
    // 1. Client-side compression for images
    let optimizedDataUrl = dataUrl;
    if (dataUrl.startsWith('data:image')) {
      optimizedDataUrl = await compressImage(dataUrl, 1080, 1920, 0.78);
    }

    const file = dataURLtoFile(optimizedDataUrl, fileName || `media_${Date.now()}`);
    if (!file) return optimizedDataUrl;

    const fileExt = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : 'jpg';
    const filePath = `chat_uploads/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    let bucketName = 'chat_media';
    let uploadedSuccessfully = false;

    // Try chat_media bucket
    const { error: uploadErr } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });
    if (!uploadErr) {
      uploadedSuccessfully = true;
    } else {
      // Try media bucket
      bucketName = 'media';
      const { error: err2 } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });
      if (!err2) {
        uploadedSuccessfully = true;
      } else {
        // Try public bucket
        bucketName = 'public';
        const { error: err3 } = await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });
        if (!err3) uploadedSuccessfully = true;
      }
    }

    // ONLY return public URL if upload ACTUALLY succeeded on storage!
    if (uploadedSuccessfully) {
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      if (publicUrlData && publicUrlData.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
    
    // If storage upload failed, return lightweight compressed dataUrl (which stores & renders reliably)
    return optimizedDataUrl;
  } catch (e) {
    console.warn('Storage upload fallback note:', e?.message || e);
    return dataUrl;
  }
};


function MainApp() {
  const { isAuthenticated, currentUser, updateUserProfile } = useAuth();
  const { t } = useLanguage();

  // Theme & Global Audio States
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('stagelink_theme') === 'dark';
  });

  useEffect(() => {
    const activeBgColor = isDarkMode ? '#0B0F19' : '#F8FAFC';
    document.documentElement.style.backgroundColor = activeBgColor;
    document.body.style.backgroundColor = activeBgColor;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', activeBgColor);
    }
  }, [isDarkMode]);
  const [activeGlobalTrack, setActiveGlobalTrack] = useState({
    title: 'Jam Session Afro-Gospel (Demo)',
    artist: 'StageLink Studio • Live Track',
    genre: 'Afro-Gospel',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
  });
  const [showGlobalPlayer, setShowGlobalPlayer] = useState(false);

  // Navigation & View States
  const [activeTab, setActiveTab] = useState('feed');
  const [activeStoryView, setActiveStoryView] = useState(null);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryUserList, setActiveStoryUserList] = useState([]);
  
  // Toast Notification State
  const [toastNotification, setToastNotification] = useState(null);

  const [savedStoryContext, setSavedStoryContext] = useState(null);
  const [resharedStoryData, setResharedStoryData] = useState(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCameraRecorderOpen, setIsCameraRecorderOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Social Share, Report, and Public Profile Modals
  const [sharePost, setSharePost] = useState(null);
  const [reportPost, setReportPost] = useState(null);
  const [publicProfileUser, setPublicProfileUser] = useState(null);

  // Chat & Call States
  const [selectedChat, setSelectedChat] = useState(null);
  const [isEphemeralOpen, setIsEphemeralOpen] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false); // New state for incoming call
  const [incomingCallData, setIncomingCallData] = useState(null);
  const incomingCallDataRef = useRef(null);



  useEffect(() => {
    incomingCallDataRef.current = incomingCallData;
  }, [incomingCallData]);
  const [activeCallNotificationId, setActiveCallNotificationId] = useState(null);
  const [isCallMinimized, setIsCallMinimized] = useState(false); // New state for PiP
  const [isAudioCallOnly, setIsAudioCallOnly] = useState(false);
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  // Persistent Data States

  const [posts, setPosts] = useState([]);
  const [appDataError, setAppDataError] = useState(null);
  
  // Prevent stale closures in real-time listeners
  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const [stories, setStories] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [isUploadingPost, setIsUploadingPost] = useState(false);

  // Automatically sync selectedChat when chats array updates
  useEffect(() => {
    if (selectedChat) {
      const active = chats.find(c => c.id === selectedChat.id);
      if (active && active !== selectedChat) {
        setSelectedChat(active);
      }
    }
  }, [chats, selectedChat]);

  // Native Notifications Setup
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const sendNativeNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (document.hidden || !document.hasFocus()) {
        try {
          new Notification(title, {
            body: body
          });
        } catch (e) {
          console.warn('Native notification error:', e);
        }
      }
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('stagelink_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleStartGlobalAudio = (track) => {
    if (track) setActiveGlobalTrack(track);
    setShowGlobalPlayer(true);
  };

  // Hardware & iOS Swipe Back Navigation Gesture Listener
  useEffect(() => {
    const handlePopState = (e) => {
      if (selectedChat) {
        handleBackFromChat();
      } else if (publicProfileUser) {
        setPublicProfileUser(null);
      } else if (activeStory) {
        setActiveStory(null);
      } else if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
      } else if (isCreatePostOpen) {
        setIsCreatePostOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedChat, publicProfileUser, activeStory, isNotificationsOpen, isCreatePostOpen, savedStoryContext]);

  // Real-time Universal Profile Update Event Listener across all App state components
  useEffect(() => {
    const handleProfileUpdated = (e) => {
      if (e.detail) {
        const { updatedPosts, updatedStories, updatedChats, updatedUsers, updatedNotifications } = e.detail;
        if (updatedPosts) setPosts(updatedPosts);
        if (updatedStories) setStories(updatedStories);
        if (updatedChats) setChats(updatedChats);
        if (updatedUsers) setAllUsers(updatedUsers);
        if (updatedNotifications) setNotifications(updatedNotifications);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, []);

  const handleRefreshData = async () => {
    soundEngine.playPopSound();
    if (isSupabaseConfigured()) {
      await syncPostsStoriesAndProfiles();
    } else {
      const freshPosts = getStoredItem(STORAGE_KEYS.POSTS, []);
      const freshStories = getStoredItem(STORAGE_KEYS.STORIES, []);
      const freshChats = getStoredItem(STORAGE_KEYS.CHATS, []);
      const freshUsers = getStoredItem(STORAGE_KEYS.USERS, []);

      setPosts(freshPosts);
      setStories(freshStories);
      setChats(freshChats);
      setAllUsers(freshUsers);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const welcomeSeenKey = `stagelink_welcome_shown_${currentUser.id}`;

      const loadInitialData = async () => {
        // Check cache version to force clean old formats
        const CACHE_VERSION = 'v4'; // Bumped to force complete reset for new users
        const storedVersion = localStorage.getItem('stagelink_cache_version');
        if (storedVersion !== CACHE_VERSION) {
          localStorage.removeItem(STORAGE_KEYS.CHATS);
          localStorage.removeItem(STORAGE_KEYS.POSTS);
          localStorage.removeItem(STORAGE_KEYS.STORIES);
          localStorage.removeItem(STORAGE_KEYS.USERS);
          localStorage.removeItem(STORAGE_KEYS.MATCHES);
          localStorage.setItem('stagelink_cache_version', CACHE_VERSION);
        }

        let loadedPosts = getStoredItem(STORAGE_KEYS.POSTS, []);
        let loadedStories = getStoredItem(STORAGE_KEYS.STORIES, []);
        let loadedMatches = getStoredItem(STORAGE_KEYS.MATCHES, []);
        let loadedUsers = getStoredItem(STORAGE_KEYS.USERS, []);
        let loadedChats = getStoredItem(STORAGE_KEYS.CHATS, []);

        if (isSupabaseConfigured()) {
          try {
            // Fetch live profiles from Supabase
            const { data: supaProfiles, error: supaProfilesErr } = await supabase.from('profiles').select('*').limit(100);
            if (supaProfilesErr) {
              console.warn('Supabase live profiles fetch returned error:', supaProfilesErr.message);
            } else {
              let mappedSupaUsers = [];
              if (supaProfiles && supaProfiles.length > 0) {
                mappedSupaUsers = supaProfiles.map(p => ({
                  id: p.id,
                  name: p.full_name || 'Artiste StageLink',
                  email: p.email || '',
                  role: p.role || 'Artiste',
                  company: p.company || '',
                  avatar: p.avatar_url || '',
                  verified: p.verified_badge === 'gold' || p.verified_badge === 'blue',
                  badgeType: p.verified_badge || 'none',
                  bio: p.bio || '',
                  location: p.location || '',
                  instruments: p.instruments || [],
                  genres: p.genres || [],
                  gear: p.gear || []
                }));
              }
              loadedUsers = mappedSupaUsers;
              setStoredItem(STORAGE_KEYS.USERS, loadedUsers);
            }
          } catch (err) {
            console.warn('Supabase live profiles fetch note:', err.message);
          }

          try {
            // 1. Fetch live posts with resilient join & fallback
            let supaPosts = null;
            try {
              const res = await supabase
                .from('posts')
                .select('*, profiles:user_id(full_name, avatar_url, role, verified_badge), post_likes(user_id), post_comments(id, user_id, content, created_at, profiles:user_id(full_name))')
                .order('created_at', { ascending: false });
              if (res.data && !res.error) {
                supaPosts = res.data;
              } else {
                const simpleRes = await supabase.from('posts').select('*').order('created_at', { ascending: false });
                if (simpleRes.data) supaPosts = simpleRes.data;
              }
            } catch (pe) {
              const simpleRes = await supabase.from('posts').select('*').order('created_at', { ascending: false });
              if (simpleRes.data) supaPosts = simpleRes.data;
            }

            if (supaPosts && supaPosts.length > 0) {
              const userLookup = new Map((loadedUsers || []).map(u => [u.id, u]));
              loadedPosts = supaPosts.map(p => {
                const authorProfile = userLookup.get(p.user_id) || p.profiles || {};
                const isCurrentUser = p.user_id === currentUser?.id;
                const authorName = isCurrentUser ? currentUser.name : (authorProfile.name || authorProfile.full_name || p.profiles?.full_name || 'Artiste StageLink');
                const authorAvatar = isCurrentUser ? currentUser.avatar : (authorProfile.avatar || authorProfile.avatar_url || p.profiles?.avatar_url || '');
                const authorRole = isCurrentUser ? (currentUser.role || 'Artiste') : (authorProfile.role || p.profiles?.role || 'Membre StageLink');
                const isVerified = isCurrentUser ? currentUser.verified : (authorProfile.verified || authorProfile.verified_badge === 'gold' || authorProfile.verified_badge === 'blue' || p.profiles?.verified_badge === 'gold');
                const badgeType = isCurrentUser ? currentUser.badgeType : (authorProfile.badgeType || authorProfile.verified_badge || p.profiles?.verified_badge || 'none');

                return {
                  id: p.id,
                  userId: p.user_id,
                  userName: authorName,
                  userRole: authorRole,
                  userAvatar: authorAvatar,
                  isVerified: isVerified,
                  badgeType: badgeType,
                  text: p.content || '',
                  image: p.media_url || null,
                  hasAudio: Boolean(p.audio_url),
                  audioTitle: p.audio_title || 'Extrait Audio',
                  audioUrl: p.audio_url || null,
                  likesCount: p.post_likes ? p.post_likes.length : (p.likes_count || 0),
                  isLiked: p.post_likes ? p.post_likes.some(l => l.user_id === currentUser?.id) : false,
                  commentsCount: p.post_comments ? p.post_comments.length : (p.comments_count || (p.comments ? p.comments.length : 0)),
                  comments: p.post_comments ? p.post_comments.map(c => ({
                    id: c.id,
                    userId: c.user_id,
                    userName: c.profiles?.full_name || userLookup.get(c.user_id)?.name || 'Artiste',
                    text: c.content,
                    time: new Date(c.created_at).toLocaleDateString()
                  })) : [],
                  timeAgo: 'Récemment'
                };
              });
              setStoredItem(STORAGE_KEYS.POSTS, loadedPosts);
            }

            // 2. Fetch live active stories with resilient join & fallback
            let supaStories = null;
            try {
              const res = await supabase
                .from('stories')
                .select('*, profiles:user_id(full_name, avatar_url), story_views(viewer_id, profiles:viewer_id(full_name, avatar_url, role)), story_likes(user_id)')
                .order('created_at', { ascending: false });
              if (res.data && !res.error) {
                supaStories = res.data;
              } else {
                const simpleRes = await supabase.from('stories').select('*').order('created_at', { ascending: false });
                if (simpleRes.data) supaStories = simpleRes.data;
              }
            } catch (se) {
              const simpleRes = await supabase.from('stories').select('*').order('created_at', { ascending: false });
              if (simpleRes.data) supaStories = simpleRes.data;
            }

            if (supaStories && supaStories.length > 0) {
              const userLookup = new Map((loadedUsers || []).map(u => [u.id, u]));
              const mappedSupa = supaStories.map(s => {
                const authorProfile = userLookup.get(s.user_id) || s.profiles || {};
                const isCurrentUser = s.user_id === currentUser?.id;
                const authorName = isCurrentUser ? (currentUser?.name || 'Artiste StageLink') : (authorProfile.name || authorProfile.full_name || s.profiles?.full_name || 'Artiste StageLink');
                const authorAvatar = isCurrentUser ? (currentUser?.avatar || '') : (authorProfile.avatar || authorProfile.avatar_url || s.profiles?.avatar_url || '');
                const isText = !s.media_url || s.media_url === '' || s.media_url === 'null';

                return {
                  id: s.id,
                  userId: s.user_id,
                  userName: authorName,
                  avatar: authorAvatar,
                  userAvatar: authorAvatar,
                  hasUnread: s.story_views ? !s.story_views.some(v => v.viewer_id === currentUser?.id) : true,
                  storyMedia: isText ? null : s.media_url,
                  mediaUrl: isText ? '' : s.media_url,
                  isTextStory: isText,
                  mediaType: isText ? 'text' : (s.is_video ? 'video' : ((s.media_url && (s.media_url.includes('.mp4') || s.media_url.includes('.webm') || s.media_url.includes('.mov') || s.media_url.startsWith('data:video'))) ? 'video' : 'image')),
                  isVideo: s.is_video || (s.media_url && (s.media_url.includes('.mp4') || s.media_url.includes('.webm') || s.media_url.includes('.mov'))),
                  caption: s.caption || '',
                  likesCount: s.story_likes ? s.story_likes.length : 0,
                  isLiked: s.story_likes ? s.story_likes.some(l => l.user_id === currentUser?.id) : false,
                  viewers: s.story_views ? s.story_views.map(v => ({
                    id: v.viewer_id,
                    name: v.profiles?.full_name || userLookup.get(v.viewer_id)?.name || 'Artiste',
                    avatar: v.profiles?.avatar_url || userLookup.get(v.viewer_id)?.avatar || '',
                    role: v.profiles?.role || 'Artiste'
                  })) : [],
                  time: 'Récemment'
                };
              });

              // Merge all active local stories (from all users) less than 24h old
              const freshIds = new Set(mappedSupa.map(s => s.id));
              const now = Date.now();
              const ONE_DAY_MS = 24 * 60 * 60 * 1000;
              const localUnsynced = (loadedStories || []).filter(ls => {
                if (freshIds.has(ls.id)) return false;
                const storyTimestamp = ls.createdAtTimestamp || (ls.created_at ? new Date(ls.created_at).getTime() : (ls.expires_at ? new Date(ls.expires_at).getTime() - ONE_DAY_MS : now));
                return (now - storyTimestamp) < ONE_DAY_MS;
              });
              loadedStories = [...localUnsynced, ...mappedSupa];
              setStoredItem(STORAGE_KEYS.STORIES, loadedStories);
            }

            // Fetch live matches or generate collaboration cards from real Supabase members
            const { data: supaMatches } = await supabase.from('matches').select('*');
            if (supaMatches && supaMatches.length > 0) {
              loadedMatches = supaMatches;
            } else if (loadedUsers && loadedUsers.length > 0) {
              const otherUsers = loadedUsers.filter(u => u.id !== currentUser?.id && u.email !== currentUser?.email);
              loadedMatches = otherUsers.map(u => ({
                id: `match_${u.id}`,
                userId: u.id,
                title: `Session Studio & Collaboration avec ${u.name}`,
                category: u.role || 'Artiste',
                location: u.location || 'Studio & En ligne',
                matchPercentage: 95,
                image: u.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
                description: u.bio || `Artiste ${u.role} à la recherche de collaborations sur StageLink.`,
                creator: u.name,
                creatorAvatar: u.avatar,
                verified: u.verified,
                badgeType: u.badgeType
              }));
            }

            // Fetch live messages for currentUser from Supabase
            try {
              const { data: supaMessages } = await supabase
                .from('messages')
                .select('*, sender:sender_id(id, full_name, avatar_url, role), recipient:receiver_id(id, full_name, avatar_url, role)')
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .order('created_at', { ascending: true });

              if (supaMessages && supaMessages.length > 0) {
                const chatMap = new Map();

                supaMessages.forEach(msg => {
                  const isMeSender = msg.sender_id === currentUser.id;
                  const partnerId = isMeSender ? msg.receiver_id : msg.sender_id;
                  const partnerProfile = isMeSender ? msg.recipient : msg.sender;
                  const partnerUser = (loadedUsers || []).find(u => u.id === partnerId);

                  const partnerName = partnerProfile?.full_name || partnerUser?.name || 'Artiste StageLink';
                  const partnerAvatar = partnerProfile?.avatar_url || partnerUser?.avatar || '';
                  const partnerRole = partnerProfile?.role || partnerUser?.role || 'Artiste';

                  const chatId = `chat_${partnerId}`;

                  const msgObj = {
                    id: msg.id,
                    sender: isMeSender ? 'current' : 'other',
                    senderId: msg.sender_id,
                    text: msg.content || '',
                    mediaUrl: msg.media_url || null,
                    audioUrl: msg.audio_url || null,
                    isAudio: msg.metadata?.isAudio || Boolean(msg.audio_url),
                    isVideo: msg.metadata?.isVideo || Boolean(msg.metadata?.videoUrl),
                    videoUrl: msg.metadata?.videoUrl || msg.media_url,
                    fileName: msg.metadata?.fileName || null,
                    audioDuration: msg.metadata?.audioDuration || null,
                    quotedMessage: msg.metadata?.quotedMessage || null,
                    documentName: msg.metadata?.documentName || null,
                    isCallNotice: msg.metadata?.isCallNotice || Boolean(msg.content && (msg.content.includes('Appel') || msg.content.includes('📞') || msg.content.includes('📹'))),
                    callStatus: msg.metadata?.callStatus || null,
                    isAudioOnly: msg.metadata?.isAudioOnly || false,
                    timestamp: new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAtTimestamp: new Date(msg.created_at || Date.now()).getTime(),
                    isRead: msg.is_read !== false
                  };

                  if (!chatMap.has(chatId)) {
                    chatMap.set(chatId, {
                      id: chatId,
                      participant: {
                        id: partnerId,
                        name: partnerName,
                        avatar: partnerAvatar,
                        online: false,
                        role: partnerRole
                      },
                      unreadCount: (!isMeSender && !msg.is_read) ? 1 : 0,
                      lastMessageTime: 'Récemment',
                      messages: [msgObj]
                    });
                  } else {
                    const existingChat = chatMap.get(chatId);
                    existingChat.messages.push(msgObj);
                    if (!isMeSender && !msg.is_read) {
                      existingChat.unreadCount = (existingChat.unreadCount || 0) + 1;
                    }
                  }
                });

                let supaChats = Array.from(chatMap.values());
                
                // Fetch chat states for filtering (archived, deleted, unread overrides)
                try {
                  const { data: statesData } = await supabase.from('chat_states').select('*').eq('user_id', currentUser.id);
                  if (statesData && statesData.length > 0) {
                    supaChats = supaChats.map(c => {
                      const state = statesData.find(s => s.partner_id === c.participant.id);
                      if (state) {
                        return {
                          ...c,
                          isArchived: state.is_archived,
                          isDeleted: state.is_deleted,
                          unreadCount: state.force_unread ? Math.max(1, c.unreadCount) : c.unreadCount
                        };
                      }
                      return c;
                    }).filter(c => !c.isDeleted && !c.isArchived);
                  }
                } catch (stateErr) {
                  console.warn('Supabase chat_states fetch note:', stateErr.message);
                }

                loadedChats = supaChats;
              }
            } catch (me) {
              console.warn('Supabase live messages fetch note:', me.message);
            }
          } catch (err) {
            console.warn('Supabase live data fetch note:', err.message);
          }
        }

        setAllUsers(loadedUsers);
        setPosts(loadedPosts);
        setStories(loadedStories);
        setMatches(loadedMatches);
        setChats(prevChats => {
          const mergedChats = [...loadedChats];
          prevChats.forEach(pc => {
            const matchingLoaded = mergedChats.find(lc => lc.id === pc.id);
            if (!matchingLoaded) {
              mergedChats.push(pc);
            } else {
              const existingMsgs = pc.messages || [];
              const loadedMsgs = matchingLoaded.messages || [];
              const combined = [...loadedMsgs];
              existingMsgs.forEach(em => {
                if (!combined.some(lm => lm.id === em.id)) {
                  combined.push(em);
                }
              });
              combined.sort((a, b) => (a.createdAtTimestamp || 0) - (b.createdAtTimestamp || 0));
              matchingLoaded.messages = combined;
              if (combined.length > 0) {
                matchingLoaded.lastMessage = combined[combined.length - 1].text || matchingLoaded.lastMessage;
              }
            }
          });
          setStoredItem(STORAGE_KEYS.CHATS, mergedChats);
          return mergedChats;
        });

        // Open target profile if query params exist
        try {
          const params = new URLSearchParams(window.location.search);
          const targetProfileId = params.get('profile') || params.get('user');
          if (targetProfileId && loadedUsers.length > 0) {
            const target = loadedUsers.find(
              (u) => u.id === targetProfileId || (u.name && u.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === targetProfileId)
            );
            if (target) setPublicProfileUser(target);
          }
        } catch (e) { console.error("Suppressed error:", e); }

        // Handle One-Time Welcome Onboarding & Welcome Chat for New Registrations
        const alreadyShown = localStorage.getItem(welcomeSeenKey);
        if (currentUser?.isNewRegistration && !alreadyShown) {
          localStorage.setItem(welcomeSeenKey, 'true');
          updateUserProfile({ isNewRegistration: false });

          const welcomeChatId = 'chat_stagelink_official';
          const hasWelcomeChat = loadedChats.some(c => c.id === welcomeChatId || (c.participant && c.participant.name && c.participant.name.includes('StageLink')));

          if (!hasWelcomeChat) {
            const welcomeChat = {
              id: welcomeChatId,
              participant: {
                id: 'usr_stagelink_team',
                name: 'StageLink Support Officiel',
                avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
                online: false,
                verified: true,
                badgeType: 'gold',
                role: 'Équipe Officielle StageLink'
              },
              unreadCount: 1,
              lastMessageTime: 'À l\'instant',
              messages: [
                {
                  id: 'msg_welcome_1',
                  senderId: 'usr_stagelink_team',
                  senderName: 'StageLink Support Officiel',
                  senderAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
                  text: `Bonjour ${currentUser.name} ! 👋\n\nBienvenue sur StageLink, la plateforme officielle de co-création et de connexion artistique.\n\nNous sommes ravis de vous compter parmi nos membres en tant que ${currentUser.role || 'Artiste'} !\n\n💡 Quelques conseils pour débuter :\n1. Complétez votre profil EPK (démos audio, instruments, biographie).\n2. Publiez des Stories et des extraits pour vous faire connaître.\n3. Collaborez via nos salons de discussion sécurisés.\n\nL'équipe StageLink vous souhaite une expérience musicale exceptionnelle ! 🎵`,
                  timestamp: 'À l\'instant',
                  isMe: false,
                  type: 'text'
                }
              ]
            };
            loadedChats = [welcomeChat, ...loadedChats];
            setChats(prevChats => {
          const mergedChats = [...loadedChats];
          prevChats.forEach(pc => {
            const matchingLoaded = mergedChats.find(lc => lc.id === pc.id);
            if (!matchingLoaded) {
              mergedChats.push(pc);
            } else {
              const existingMsgs = pc.messages || [];
              const loadedMsgs = matchingLoaded.messages || [];
              const combined = [...loadedMsgs];
              existingMsgs.forEach(em => {
                if (!combined.some(lm => lm.id === em.id)) {
                  combined.push(em);
                }
              });
              combined.sort((a, b) => (a.createdAtTimestamp || 0) - (b.createdAtTimestamp || 0));
              matchingLoaded.messages = combined;
              if (combined.length > 0) {
                matchingLoaded.lastMessage = combined[combined.length - 1].text || matchingLoaded.lastMessage;
              }
            }
          });
          setStoredItem(STORAGE_KEYS.CHATS, mergedChats);
          return mergedChats;
        });
          }
        }
      };

      loadInitialData();

      // Function to sync posts, stories & profiles from Supabase
      const syncPostsStoriesAndProfiles = async () => {
        if (!isSupabaseConfigured()) return;
        try {
          // 1. Sync Live Profiles
          let currentUsersList = allUsers;
          const { data: supaProfiles } = await supabase.from('profiles').select('*').limit(150);
          if (supaProfiles && supaProfiles.length > 0) {
            const mappedSupa = supaProfiles.map(p => ({
              id: p.id,
              name: p.full_name || 'Artiste StageLink',
              email: p.email || '',
              role: p.role || 'Artiste',
              company: p.company || '',
              avatar: p.avatar_url || '',
              verified: p.verified_badge === 'gold' || p.verified_badge === 'blue',
              badgeType: p.verified_badge || 'none',
              bio: p.bio || '',
              location: p.location || '',
              instruments: p.instruments || [],
              genres: p.genres || [],
              gear: p.gear || []
            }));

            setAllUsers(prev => {
              const uMap = new Map();
              mappedSupa.forEach(u => uMap.set(u.id, u));
              prev.forEach(u => {
                if (!uMap.has(u.id) && !Array.from(uMap.values()).some(m => m.name === u.name)) {
                  uMap.set(u.id, u);
                }
              });
              currentUsersList = Array.from(uMap.values());
              return currentUsersList;
            });
          }

          const userLookup = new Map(currentUsersList.map(u => [u.id, u]));

          // 2. Sync Live Posts with resilient fallback
          let supaPosts = null;
          try {
            const res = await supabase
              .from('posts')
              .select('*, profiles:user_id(full_name, avatar_url, role, verified_badge), post_likes(user_id), post_comments(id, user_id, content, created_at, profiles:user_id(full_name))')
              .order('created_at', { ascending: false });
            if (res.data && !res.error) {
              supaPosts = res.data;
            } else {
              const simpleRes = await supabase.from('posts').select('*').order('created_at', { ascending: false });
              if (simpleRes.data) supaPosts = simpleRes.data;
            }
          } catch (pe) {
            const simpleRes = await supabase.from('posts').select('*').order('created_at', { ascending: false });
            if (simpleRes.data) supaPosts = simpleRes.data;
          }

          if (supaPosts && supaPosts.length > 0) {
            const freshPosts = supaPosts.map(p => {
              const authorProfile = userLookup.get(p.user_id) || p.profiles || {};
              const isCurrentUser = p.user_id === currentUser?.id;
              const authorName = isCurrentUser ? currentUser.name : (authorProfile.name || authorProfile.full_name || p.profiles?.full_name || 'Artiste StageLink');
              const authorAvatar = isCurrentUser ? currentUser.avatar : (authorProfile.avatar || authorProfile.avatar_url || p.profiles?.avatar_url || '');
              const authorRole = isCurrentUser ? (currentUser.role || 'Artiste') : (authorProfile.role || p.profiles?.role || 'Membre StageLink');
              const isVerified = isCurrentUser ? currentUser.verified : (authorProfile.verified || authorProfile.verified_badge === 'gold' || authorProfile.verified_badge === 'blue' || p.profiles?.verified_badge === 'gold');
              const badgeType = isCurrentUser ? currentUser.badgeType : (authorProfile.badgeType || authorProfile.verified_badge || p.profiles?.verified_badge || 'none');

              return {
                id: p.id,
                userId: p.user_id,
                userName: authorName,
                userRole: authorRole,
                userAvatar: authorAvatar,
                isVerified: isVerified,
                badgeType: badgeType,
                text: p.content || '',
                image: p.media_url || null,
                hasAudio: Boolean(p.audio_url),
                audioTitle: p.audio_title || 'Extrait Audio',
                audioUrl: p.audio_url || null,
                likesCount: p.post_likes ? p.post_likes.length : (p.likes_count || 0),
                isLiked: p.post_likes ? p.post_likes.some(l => l.user_id === currentUser?.id) : false,
                commentsCount: p.post_comments ? p.post_comments.length : (p.comments_count || (p.comments ? p.comments.length : 0)),
                comments: p.post_comments ? p.post_comments.map(c => ({
                  id: c.id,
                  userId: c.user_id,
                  userName: c.profiles?.full_name || userLookup.get(c.user_id)?.name || 'Artiste',
                  text: c.content,
                  time: new Date(c.created_at).toLocaleDateString()
                })) : [],
                timeAgo: 'Récemment'
              };
            });
            setPosts(freshPosts);
            setStoredItem(STORAGE_KEYS.POSTS, freshPosts);
          }

          // 3. Sync Live Stories with resilient fallback
          let supaStories = null;
          try {
            const res = await supabase
              .from('stories')
              .select('*, profiles:user_id(full_name, avatar_url), story_views(viewer_id, profiles:viewer_id(full_name, avatar_url, role)), story_likes(user_id)')
              .order('created_at', { ascending: false });
            if (res.data && !res.error) {
              supaStories = res.data;
            } else {
              const simpleRes = await supabase.from('stories').select('*').order('created_at', { ascending: false });
              if (simpleRes.data) supaStories = simpleRes.data;
            }
          } catch (se) {
            const simpleRes = await supabase.from('stories').select('*').order('created_at', { ascending: false });
            if (simpleRes.data) supaStories = simpleRes.data;
          }

          if (supaStories && supaStories.length > 0) {
            const freshStories = supaStories.map(s => {
              const authorProfile = userLookup.get(s.user_id) || s.profiles || {};
              const isCurrentUser = s.user_id === currentUser?.id;
              const authorName = isCurrentUser ? (currentUser?.name || 'Artiste StageLink') : (authorProfile.name || authorProfile.full_name || s.profiles?.full_name || 'Artiste StageLink');
              const authorAvatar = isCurrentUser ? (currentUser?.avatar || '') : (authorProfile.avatar || authorProfile.avatar_url || s.profiles?.avatar_url || '');
              const isText = !s.media_url || s.media_url === '' || s.media_url === 'null';

              return {
                id: s.id,
                userId: s.user_id,
                userName: authorName,
                avatar: authorAvatar,
                userAvatar: authorAvatar,
                hasUnread: s.story_views ? !s.story_views.some(v => v.viewer_id === currentUser?.id) : true,
                storyMedia: isText ? null : s.media_url,
                mediaUrl: isText ? '' : s.media_url,
                isTextStory: isText,
                mediaType: isText ? 'text' : (s.is_video ? 'video' : ((s.media_url && (s.media_url.includes('.mp4') || s.media_url.includes('.webm') || s.media_url.includes('.mov') || s.media_url.startsWith('data:video'))) ? 'video' : 'image')),
                isVideo: s.is_video || (s.media_url && (s.media_url.includes('.mp4') || s.media_url.includes('.webm') || s.media_url.includes('.mov'))),
                caption: s.caption || '',
                likesCount: s.story_likes ? s.story_likes.length : 0,
                isLiked: s.story_likes ? s.story_likes.some(l => l.user_id === currentUser?.id) : false,
                viewers: s.story_views ? s.story_views.map(v => ({
                  id: v.viewer_id,
                  name: v.profiles?.full_name || userLookup.get(v.viewer_id)?.name || 'Artiste',
                  avatar: v.profiles?.avatar_url || userLookup.get(v.viewer_id)?.avatar || '',
                  role: v.profiles?.role || 'Artiste'
                })) : [],
                time: 'Récemment'
              };
            });

            // Smart Merge: Preserve all active stories from all users within 24 hours
            setStories(prevStories => {
              const freshIds = new Set(freshStories.map(s => s.id));
              const now = Date.now();
              const ONE_DAY_MS = 24 * 60 * 60 * 1000;
              const localUnsynced = (prevStories || []).filter(localS => {
                if (freshIds.has(localS.id)) return false;
                const storyTimestamp = localS.createdAtTimestamp || (localS.created_at ? new Date(localS.created_at).getTime() : (localS.expires_at ? new Date(localS.expires_at).getTime() - ONE_DAY_MS : now));
                return (now - storyTimestamp) < ONE_DAY_MS;
              });
              const merged = [...localUnsynced, ...freshStories];
              setStoredItem(STORAGE_KEYS.STORIES, merged);
              return merged;
            });
          }
        } catch (e) { console.error("Suppressed error:", e); }
      };

      const syncNotifications = async () => {
        if (!isSupabaseConfigured() || !currentUser?.id) return;
        try {
          const { data: supaNotifs } = await supabase
            .from('notifications')
            .select('*, profiles:actor_id(full_name, avatar_url)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
            
          if (supaNotifs) {
            const activePartnerId = selectedChatRef.current?.participant?.id;
            
            // Filter out message notifications if user is currently inside active discussion with that sender
            const filteredNotifs = supaNotifs.filter(n => {
              if (n.type === 'message' && activePartnerId && n.actor_id === activePartnerId) {
                return false;
              }
              return true;
            });

            const mappedNotifs = filteredNotifs.map(n => ({
              id: n.id,
              actorName: n.profiles?.full_name || 'Utilisateur',
              actorAvatar: n.profiles?.avatar_url || '',
              type: n.type,
              referenceId: n.reference_id,
              isRead: n.is_read,
              time: new Date(n.created_at).toLocaleDateString()
            }));
            setNotifications(mappedNotifs);
            setUnreadNotificationsCount(mappedNotifs.filter(n => !n.isRead).length);
          }
        } catch (e) {
          console.warn('Sync notifications note:', e);
        }
      };

      // 1. Instant Realtime Subscription Setup for Posts, Stories, Profiles, Messages & Notifications (<100ms sync)
      syncNotifications();
      let profilesSub, postsSub, storiesSub, messagesSub, notificationsSub;
        let syncMessagesFallback = null;
      if (isSupabaseConfigured()) {
        try {
          const syncMessages = async () => {
            if (!currentUser?.id) return;
            try {
              const { data: supaMsgs } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .order('created_at', { ascending: true });
              
              if (supaMsgs && supaMsgs.length > 0) {
                const partnerIds = new Set();
                supaMsgs.forEach(m => {
                  if (m.sender_id !== currentUser.id) partnerIds.add(m.sender_id);
                  if (m.receiver_id !== currentUser.id) partnerIds.add(m.receiver_id);
                });

                const { data: profiles } = await supabase.from('profiles').select('*').limit(100).in('id', Array.from(partnerIds));
                const profilesMap = {};
                if (profiles) {
                  profiles.forEach(p => {
                    profilesMap[p.id] = {
                      id: p.id,
                      name: p.full_name || 'Artiste',
                      avatar: p.avatar_url,
                      role: p.role,
                      online: false
                    };
                  });
                }

                const chatGroups = {};
                supaMsgs.forEach(msg => {
                  // Filter out messages deleted for me
                  if (msg.metadata?.deleted_for?.includes(currentUser.id)) return;

                  const isMeSender = msg.sender_id === currentUser.id;
                  const partnerId = isMeSender ? msg.receiver_id : msg.sender_id;
                  
                  if (!chatGroups[partnerId]) {
                    chatGroups[partnerId] = {
                      id: `chat_${partnerId}`,
                      participant: profilesMap[partnerId] || { id: partnerId, name: 'Utilisateur', avatar: null, role: 'Artiste' },
                      messages: [],
                      unreadCount: 0
                    };
                  }
                  
                  const formattedMsg = {
                    id: msg.id,
                    sender: isMeSender ? 'current' : 'other',
                    senderId: msg.sender_id,
                    text: msg.content || '',
                    mediaUrl: msg.media_url || null,
                    audioUrl: msg.audio_url || msg.audio_note_url || null,
                    isAudio: msg.metadata?.isAudio || Boolean(msg.audio_url || msg.audio_note_url),
                    isVideo: msg.metadata?.isVideo || Boolean(msg.metadata?.videoUrl),
                    videoUrl: msg.metadata?.videoUrl || msg.media_url || null,
                    fileName: msg.metadata?.fileName || null,
                    audioDuration: msg.metadata?.audioDuration || null,
                    quotedMessage: msg.metadata?.quotedMessage || null,
                    documentName: msg.metadata?.documentName || null,
                    isCallNotice: msg.metadata?.isCallNotice || Boolean(msg.content && (msg.content.includes('Appel') || msg.content.includes('📞') || msg.content.includes('📹'))),
                    callStatus: msg.metadata?.callStatus || null,
                    isAudioOnly: msg.metadata?.isAudioOnly || false,
                    timestamp: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    createdAtTimestamp: new Date(msg.created_at).getTime(),
                    isRead: true
                  };

                  if (!isMeSender && msg.is_read === false) {
                     chatGroups[partnerId].unreadCount += 1;
                  }

                  chatGroups[partnerId].messages.push(formattedMsg);
                  chatGroups[partnerId].lastMessageTime = formattedMsg.timestamp;
                  chatGroups[partnerId].lastMessageText = formattedMsg.text || (formattedMsg.isAudio ? '🎤 Audio' : (formattedMsg.mediaUrl ? '📷 Média' : ''));
                });

                let reconstructedChats = Object.values(chatGroups).sort((a,b) => {
                   const lastA = a.messages[a.messages.length - 1]?.createdAtTimestamp || 0;
                   const lastB = b.messages[b.messages.length - 1]?.createdAtTimestamp || 0;
                   return lastB - lastA;
                });

                const { data: statesData } = await supabase.from('chat_states').select('*').eq('user_id', currentUser.id);
                if (statesData && statesData.length > 0) {
                  const statesMap = {};
                  statesData.forEach(s => statesMap[s.partner_id] = s);
                  reconstructedChats = reconstructedChats.filter(chat => {
                    const partnerId = chat.participant?.id;
                    const state = statesMap[partnerId];
                    if (state?.is_deleted) return false;
                    if (state?.is_archived) return false;
                    if (state?.force_unread) chat.unreadCount = (chat.unreadCount || 0) + 1;
                    return true;
                  });
                }
                
                setChats(prevChats => {
                  let finalMerged = [...reconstructedChats];
                  
                  prevChats.forEach(pc => {
                    const existingIndex = finalMerged.findIndex(mc => mc.id === pc.id || (pc.participant?.id && mc.participant?.id === pc.participant.id));
                    if (existingIndex === -1) {
                      finalMerged.push(pc);
                    } else {
                      const targetChat = finalMerged[existingIndex];
                      const localMsgs = pc.messages || [];
                      const remoteMsgs = targetChat.messages || [];
                      const combined = [...remoteMsgs];

                      localMsgs.forEach(lm => {
                        const remoteMatch = combined.find(rm => rm.id === lm.id);
                        if (!remoteMatch) {
                          combined.push(lm);
                        } else {
                          // Preserve local media URLs if remote ones are null
                          if (!remoteMatch.mediaUrl && lm.mediaUrl) remoteMatch.mediaUrl = lm.mediaUrl;
                          if (!remoteMatch.videoUrl && lm.videoUrl) remoteMatch.videoUrl = lm.videoUrl;
                          if (!remoteMatch.audioUrl && lm.audioUrl) remoteMatch.audioUrl = lm.audioUrl;
                          if (!remoteMatch.isVideo && lm.isVideo) remoteMatch.isVideo = lm.isVideo;
                          if (!remoteMatch.fileName && lm.fileName) remoteMatch.fileName = lm.fileName;
                        }
                      });

                      combined.sort((a, b) => (a.createdAtTimestamp || 0) - (b.createdAtTimestamp || 0));
                      targetChat.messages = combined;
                      if (combined.length > 0) {
                        const lastM = combined[combined.length - 1];
                        targetChat.lastMessageTime = lastM.timestamp || targetChat.lastMessageTime;
                        targetChat.lastMessage = lastM.text || (lastM.isAudio ? '🎤 Audio' : (lastM.mediaUrl ? '📷 Média' : ''));
                      }
                    }
                  });

                  setStoredItem(STORAGE_KEYS.CHATS, finalMerged);

                  setSelectedChat(prev => {
                    if (prev) {
                      const updatedActive = finalMerged.find(c => c.id === prev.id || (prev.participant?.id && c.participant?.id === prev.participant.id));
                      if (updatedActive) return updatedActive;
                    }
                    return prev;
                  });

                  return finalMerged;
                });
              }
            } catch (e) { console.error("Suppressed error:", e); }
          };
          syncMessagesFallback = syncMessages;
          
          syncMessages();

          profilesSub = supabase
            .channel('realtime:profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => syncPostsStoriesAndProfiles())
            .subscribe();

          postsSub = supabase
            .channel('realtime:posts_interactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => syncPostsStoriesAndProfiles())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => syncPostsStoriesAndProfiles())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => syncPostsStoriesAndProfiles())
            .subscribe();

          storiesSub = supabase
            .channel('realtime:stories_interactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => syncPostsStoriesAndProfiles())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'story_likes' }, () => syncPostsStoriesAndProfiles())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'story_views' }, () => syncPostsStoriesAndProfiles())
            .on('broadcast', { event: 'new_story' }, (payload) => {
              if (payload.payload && payload.payload.id) {
                const incomingStory = payload.payload;
                setStories(prev => {
                  if ((prev || []).some(s => s.id === incomingStory.id)) return prev;
                  const updated = [incomingStory, ...(prev || [])];
                  setStoredItem(STORAGE_KEYS.STORIES, updated);
                  return updated;
                });
              }
              syncPostsStoriesAndProfiles().catch(() => {});
            })
            .subscribe();
            
          notificationsSub = supabase
            .channel('realtime:notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
              if (payload.new && payload.new.user_id === currentUser.id) {
                if (payload.new.type === 'incoming_call_audio' || payload.new.type === 'incoming_call_video') {
                  const isAudioOnly = payload.new.type === 'incoming_call_audio';
                  const callerId = payload.new.actor_id;
                  try {
                    const { data: actor } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', callerId).maybeSingle();
                    const callerName = actor ? actor.full_name : 'Utilisateur';
                    const callerAvatar = actor ? actor.avatar_url : '';
                    setIncomingCallData({
                      callerName,
                      callerAvatar,
                      isAudioOnly,
                      notificationId: payload.new.id,
                      callerId
                    });
                    setIsVideoCallActive(true);
                  } catch (e) { console.error("Suppressed error:", e); }
                  return; // Do not push native notification or regular sync for calls
                }

                let body = 'Vous avez une nouvelle notification';
                try {
                  const { data: actor } = await supabase.from('profiles').select('full_name').eq('id', payload.new.actor_id).maybeSingle();
                  const actorName = actor ? actor.full_name : 'Quelqu\'un';
                  if (payload.new.type === 'like_post') body = `${actorName} a aimé votre publication.`;
                  else if (payload.new.type === 'comment_post') body = `${actorName} a commenté votre publication.`;
                  else if (payload.new.type === 'like_story') body = `${actorName} a aimé votre story.`;
                  else if (payload.new.type === 'view_story') body = `${actorName} a vu votre story.`;
                  else body = `Nouvelle notification de ${actorName}.`;
                  
                  sendNativeNotification('StageLink', body);
                } catch (e) { console.error("Suppressed error:", e); }
              }
              syncNotifications();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => syncNotifications())
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, (payload) => {
              if (payload.old && incomingCallDataRef.current && payload.old.id === incomingCallDataRef.current.notificationId) {
                // The caller cancelled the call (deleted the incoming_call notification)
                setIsVideoCallActive(false);
                setIncomingCallData(null);
              }
              syncNotifications();
            })
            .subscribe();

          const handleIncomingMessageRecord = async (msgRecord, fallbackSenderProfile) => {
            if (!msgRecord || msgRecord.receiver_id !== currentUser.id) return;
            
            // Filter out messages deleted for me
            if (msgRecord.metadata?.deleted_for?.includes(currentUser.id)) return;

            const senderId = msgRecord.sender_id;
            let senderProfile = fallbackSenderProfile;
            if (!senderProfile) {
              try {
                const { data } = await supabase.from('profiles').select('*').eq('id', senderId).maybeSingle();
                senderProfile = data;
              } catch (pe) {}
            }

            const formattedMsg = {
              id: msgRecord.id,
              sender: 'other',
              senderId: msgRecord.sender_id,
              text: msgRecord.content || '',
              mediaUrl: msgRecord.media_url || null,
              audioUrl: msgRecord.audio_url || msgRecord.audio_note_url || null,
              isAudio: msgRecord.metadata?.isAudio || Boolean(msgRecord.audio_url || msgRecord.audio_note_url),
              isVideo: msgRecord.metadata?.isVideo || Boolean(msgRecord.metadata?.videoUrl),
              videoUrl: msgRecord.metadata?.videoUrl || msgRecord.media_url,
              fileName: msgRecord.metadata?.fileName || null,
              audioDuration: msgRecord.metadata?.audioDuration || null,
              quotedMessage: msgRecord.metadata?.quotedMessage || null,
              documentName: msgRecord.metadata?.documentName || null,
              isCallNotice: msgRecord.metadata?.isCallNotice || Boolean(msgRecord.content && (msgRecord.content.includes('Appel') || msgRecord.content.includes('📞') || msgRecord.content.includes('📹'))),
              callStatus: msgRecord.metadata?.callStatus || null,
              isAudioOnly: msgRecord.metadata?.isAudioOnly || false,
              timestamp: new Date(msgRecord.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAtTimestamp: new Date(msgRecord.created_at || Date.now()).getTime(),
              isRead: false
            };

            const activeChat = selectedChatRef.current;
            const isInCurrentChat = activeChat && (
              activeChat.participant?.id === senderId || 
              activeChat.id === `chat_${senderId}`
            );

            if (isInCurrentChat) {
              try {
                supabase.from('messages').update({ is_read: true }).eq('id', msgRecord.id);
              } catch (e) {}

              soundEngine.playPopSound();
              formattedMsg.isRead = true;

              setChats(prevChats => {
                const chatId = `chat_${senderId}`;
                let found = false;
                const updated = prevChats.map(c => {
                  if (c.id === chatId || c.participant?.id === senderId) {
                    found = true;
                    const msgs = c.messages || [];
                    if (!msgs.some(m => m.id === formattedMsg.id)) {
                      return {
                        ...c,
                        messages: [...msgs, formattedMsg],
                        lastMessage: formattedMsg.text || (formattedMsg.isAudio ? '🎤 Audio' : '📷 Média'),
                        lastMessageTime: formattedMsg.timestamp,
                        unreadCount: 0
                      };
                    }
                  }
                  return c;
                });
                if (!found) {
                  updated.unshift({
                    id: chatId,
                    participant: {
                      id: senderId,
                      name: senderProfile?.full_name || 'Utilisateur',
                      avatar: senderProfile?.avatar_url || '',
                      role: senderProfile?.role || 'Artiste'
                    },
                    unreadCount: 0,
                    lastMessageTime: formattedMsg.timestamp,
                    messages: [formattedMsg]
                  });
                }
                setStoredItem(STORAGE_KEYS.CHATS, updated);
                return updated;
              });

              setSelectedChat(prev => {
                if (prev && (prev.participant?.id === senderId || prev.id === `chat_${senderId}`)) {
                  const msgs = prev.messages || [];
                  if (!msgs.some(m => m.id === formattedMsg.id)) {
                    return {
                      ...prev,
                      messages: [...msgs, formattedMsg],
                      lastMessage: formattedMsg.text || (formattedMsg.isAudio ? '🎤 Audio' : '📷 Média'),
                      lastMessageTime: formattedMsg.timestamp,
                      unreadCount: 0
                    };
                  }
                }
                return prev;
              });
            } else {
              soundEngine.playMessageReceivedSound();
              setToastNotification({
                title: senderProfile?.full_name || 'Nouveau message',
                message: formattedMsg.text || (formattedMsg.isAudio ? '🎤 Message audio' : '📷 Média'),
                avatar: senderProfile?.avatar_url
              });
              setTimeout(() => setToastNotification(null), 4000);

              setChats(prevChats => {
                const chatId = `chat_${senderId}`;
                let found = false;
                const updated = prevChats.map(c => {
                  if (c.id === chatId || c.participant?.id === senderId) {
                    found = true;
                    const msgs = c.messages || [];
                    if (!msgs.some(m => m.id === formattedMsg.id)) {
                      return {
                        ...c,
                        messages: [...msgs, formattedMsg],
                        lastMessage: formattedMsg.text || (formattedMsg.isAudio ? '🎤 Audio' : '📷 Média'),
                        lastMessageTime: formattedMsg.timestamp,
                        unreadCount: (c.unreadCount || 0) + 1
                      };
                    }
                  }
                  return c;
                });
                if (!found) {
                  updated.unshift({
                    id: chatId,
                    participant: {
                      id: senderId,
                      name: senderProfile?.full_name || 'Utilisateur',
                      avatar: senderProfile?.avatar_url || '',
                      role: senderProfile?.role || 'Artiste'
                    },
                    unreadCount: 1,
                    lastMessageTime: formattedMsg.timestamp,
                    messages: [formattedMsg]
                  });
                }
                setStoredItem(STORAGE_KEYS.CHATS, updated);
                return updated;
              });
            }
          };

          messagesSub = supabase
            .channel('realtime:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
              if (payload.new) {
                handleIncomingMessageRecord(payload.new);
              }
            })
            .on('broadcast', { event: 'new_chat_message' }, (payload) => {
              if (payload.payload && payload.payload.msgRecord) {
                handleIncomingMessageRecord(payload.payload.msgRecord, payload.payload.senderProfile);
              }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, async (payload) => {
              const oldMsg = payload.old;
              if (!oldMsg || !oldMsg.id) return;
              
              setChats(prevChats => {
                const updated = prevChats.map(c => ({
                  ...c,
                  messages: (c.messages || []).filter(m => m.id !== oldMsg.id)
                }));
                setStoredItem(STORAGE_KEYS.CHATS, updated);
                return updated;
              });

              setSelectedChat(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  messages: (prev.messages || []).filter(m => m.id !== oldMsg.id)
                };
              });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, async () => {
              syncMessages();
            })
            .subscribe();
        } catch (re) {
          console.warn('Realtime subscription fallback note:', re);
        }
      }

      // 2. Background Live Posts, Stories & Profiles Polling Sync (Every 4 seconds)
      const pollInterval = setInterval(() => {
        syncPostsStoriesAndProfiles();
        syncNotifications();
        if (syncMessagesFallback) syncMessagesFallback();
      }, 4000);

      // 3. Instant Silent Sync on Tab Focus / Visibility Change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncPostsStoriesAndProfiles();
          syncNotifications();
          if (syncMessagesFallback) syncMessagesFallback();
        }
      };
      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
        if (profilesSub) supabase.removeChannel(profilesSub);
        if (postsSub) supabase.removeChannel(postsSub);
        if (storiesSub) supabase.removeChannel(storiesSub);
        if (notificationsSub) supabase.removeChannel(notificationsSub);
        if (messagesSub) supabase.removeChannel(messagesSub);
      };
    }
  }, [isAuthenticated, currentUser?.id]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const handleOpenNotifications = async () => {
    setIsNotificationsOpen(true);
    setUnreadNotificationsCount(0);
    if (isSupabaseConfigured() && currentUser?.id) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (e) { console.error("Suppressed error:", e); }
    }
  };

  const handleOpenPublicProfile = (userObj) => {
    window.history.pushState({ page: 'profile' }, '');
    setPublicProfileUser(userObj);
  };

  const handleSelectChat = async (chat) => {
    window.history.pushState({ page: 'chat' }, '');
    const updatedChats = chats.map((c) => {
      if (c.id === chat.id) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    });

    setChats(updatedChats);
    setStoredItem(STORAGE_KEYS.CHATS, updatedChats);

    const active = updatedChats.find((c) => c.id === chat.id);
    setSelectedChat(active || { ...chat, unreadCount: 0 });

    const partnerId = chat.participant?.id;
    if (isSupabaseConfigured() && currentUser?.id && partnerId) {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('receiver_id', currentUser.id)
          .eq('sender_id', partnerId);
      } catch (me) {
        console.warn('Supabase mark read note:', me?.message || me);
      }
    }
  };

  const handleStartChatWithUser = (targetUser) => {
    if (!targetUser) return;
    window.history.pushState({ page: 'chat' }, '');
    const targetId = targetUser.id;
    const targetName = targetUser.name || targetUser.userName || targetUser.full_name;

    const existing = (chats || []).find((c) => {
      if (targetId && c.participant?.id) {
        return String(c.participant.id).toLowerCase() === String(targetId).toLowerCase();
      }
      if (targetName && c.participant?.name && targetName !== 'Artiste StageLink' && targetName !== 'Artiste') {
        return String(c.participant.name).toLowerCase() === String(targetName).toLowerCase();
      }
      return false;
    });

    if (existing) {
      handleSelectChat(existing);
      setActiveTab('discussions');
    } else {
      const newChat = {
        id: `chat_${targetId || Date.now()}`,
        participant: {
          id: targetId || `usr_${Date.now()}`,
          name: targetName || 'Artiste StageLink',
          avatar: targetUser.avatar || targetUser.avatar_url || '',
          role: targetUser.role || targetUser.userRole || 'Artiste'
        },
        unreadCount: 0,
        lastMessageTime: 'À l\'instant',
        messages: []
      };

      setChats(prevChats => {
        const updated = [newChat, ...(prevChats || []).filter(c => c.id !== newChat.id)];
        setStoredItem(STORAGE_KEYS.CHATS, updated);
        return updated;
      });
      setSelectedChat(newChat);
      setActiveTab('discussions');
    }
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
    if (savedStoryContext) {
      setActiveStory(savedStoryContext.story);
      setSavedStoryContext(null);
    } else {
      setActiveTab('discussions');
    }
  };

  const handleFollowUser = (post) => {
    const currentConnections = currentUser.connectionsCount || 14;
    updateUserProfile({ connectionsCount: currentConnections + 1 });

    handleStartChatWithUser({
      id: post.userId,
      name: post.userName,
      avatar: post.userAvatar,
      role: post.userRole
    });
  };

  const handleStoryReplyToInbox = async (storyUser, replyText, isFromViewersList = false) => {
    const targetUserId = storyUser.userId || storyUser.id || `usr_story_${Date.now()}`;
    const targetUserName = storyUser.userName || storyUser.name;
    const targetAvatar = storyUser.userAvatar || storyUser.avatar;
    const targetRole = storyUser.userRole || storyUser.role || 'Artiste StageLink';

    let targetChat = chats.find(
      (c) => c.participant.id === targetUserId || c.participant.name === targetUserName
    );

    let updatedChatsList = chats;

    if (!targetChat) {
      targetChat = {
        id: `chat_${targetUserId}_${Date.now()}`,
        participant: {
          id: targetUserId,
          name: targetUserName,
          avatar: targetAvatar,
          role: targetRole,
          online: false
        },
        unreadCount: 0,
        lastMessageTime: 'À l\'instant',
        messages: []
      };
      updatedChatsList = [targetChat, ...chats];
    }

    if (replyText) {
      const rawMedia = storyUser.storyMedia || storyUser.image || storyUser.mediaUrl || null;
      const msgUuid = generateUUID();
      const newMsg = {
        id: msgUuid,
        sender: 'current',
        text: replyText,
        isStoryComment: true,
        storyId: storyUser.id,
        storyUserId: targetUserId,
        storyUserName: targetUserName,
        storyUserAvatar: targetAvatar,
        storyThumbnail: rawMedia,
        storyMedia: rawMedia,
        storyCaption: storyUser.caption || null,
        storyBgGradient: storyUser.bgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
        storyIsText: storyUser.isTextStory || false,
        storyFilter: storyUser.filter || 'none',
        storyStickers: storyUser.stickers || [],
        timestamp: 'À l\'instant',
        createdAtTimestamp: Date.now(),
        isRead: true
      };

      targetChat = {
        ...targetChat,
        unreadCount: 0,
        lastMessageTime: 'À l\'instant',
        messages: [...targetChat.messages, newMsg]
      };

      updatedChatsList = updatedChatsList.map((c) => (c.id === targetChat.id ? targetChat : c));

      // Save story reply directly to Supabase Database
      if (isSupabaseConfigured() && targetUserId && !targetUserId.startsWith('usr_')) {
        try {
          const messageMetadata = {
            isStoryComment: true,
            storyId: storyUser.id,
            storyUserId: targetUserId,
            storyUserName: targetUserName,
            storyUserAvatar: targetAvatar,
            storyThumbnail: rawMedia,
            storyMedia: rawMedia,
            storyCaption: storyUser.caption || null,
            storyBgGradient: storyUser.bgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
            storyIsText: storyUser.isTextStory || false,
            storyFilter: storyUser.filter || 'none',
            storyStickers: storyUser.stickers || []
          };

          const { error: storyMsgErr } = await supabase.from('messages').insert({
            id: msgUuid,
            sender_id: currentUser.id,
            receiver_id: targetUserId,
            content: replyText,
            media_url: rawMedia || null,
            metadata: messageMetadata
          });
          if (storyMsgErr) {
             const { error: bareStoryErr } = await supabase.from('messages').insert({
               id: msgUuid,
               sender_id: currentUser.id,
               receiver_id: targetUserId,
               content: replyText,
               metadata: messageMetadata
             });
             if (bareStoryErr) {
                console.error('All story reply insert fallbacks failed:', bareStoryErr);
             }
          }
        } catch (se) {
          console.warn('Supabase story reply insert note:', se?.message || se);
        }
      }
    }

    setChats(updatedChatsList);
    setStoredItem(STORAGE_KEYS.CHATS, updatedChatsList);

    // Only navigate away if explicitly initiated from viewers list interaction
    if (isFromViewersList) {
      if (activeStory) {
        setSavedStoryContext({ story: activeStory, showViewers: true });
      }
      setActiveStory(null);
      setSelectedChat(targetChat);
      setActiveTab('discussions');
    }
  };

  const handleOpenStoryFromMessage = (msg) => {
    if (!msg) return;

    // Search in existing stories list first
    const existingStory = stories.find(s => s.id === msg.storyId || s.userId === msg.storyUserId);
    if (existingStory) {
      setActiveStory(existingStory);
      return;
    }

    // Dynamically reconstruct story payload from message metadata
    const reconstructedStory = {
      id: msg.storyId || `story_msg_${Date.now()}`,
      userId: msg.storyUserId || selectedChat?.participant?.id || 'usr_story',
      userName: msg.storyUserName || selectedChat?.participant?.name || 'Artiste StageLink',
      userAvatar: msg.storyUserAvatar || selectedChat?.participant?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      mediaUrl: msg.storyThumbnail || msg.storyMedia || null,
      storyMedia: msg.storyThumbnail || msg.storyMedia || null,
      caption: msg.storyCaption || '',
      bgGradient: msg.storyBgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
      isTextStory: msg.storyIsText || false,
      filter: msg.storyFilter || 'none',
      stickers: msg.storyStickers || [],
      time: 'Depuis le chat'
    };

    setActiveStory(reconstructedStory);
  };

  const handleDeletePost = async (postId) => {
    const updated = posts.filter((p) => p.id !== postId);
    setPosts(updated);
    setStoredItem(STORAGE_KEYS.POSTS, updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('posts').delete().eq('id', postId);
      } catch (e) {
        console.warn('Supabase post deletion note:', e.message);
      }
    }
  };

  const handleLikePost = async (postId) => {
    let targetPost = null;
    const updated = posts.map((p) => {
      if (p.id === postId) {
        targetPost = {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? Math.max(0, (p.likesCount || 1) - 1) : (p.likesCount || 0) + 1
        };
        return targetPost;
      }
      return p;
    });
    setPosts(updated);
    setStoredItem(STORAGE_KEYS.POSTS, updated);

    if (isSupabaseConfigured() && targetPost && currentUser) {
      try {
        if (targetPost.isLiked) {
          await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
          if (targetPost.userId && targetPost.userId !== currentUser.id) {
            await supabase.from('notifications').insert({
              user_id: targetPost.userId,
              actor_id: currentUser.id,
              type: 'like_post',
              reference_id: postId
            });
          }
        } else {
          await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
        }
      } catch (e) {
        console.warn('Supabase post like update note:', e.message);
      }
    }
  };

  const handleAddComment = async (postId, commentText) => {
    let targetPost = null;
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const comments = p.comments || [];
        const newC = {
          id: `c_${Date.now()}`,
          userName: currentUser.name,
          text: commentText,
          time: 'À l\'instant'
        };
        targetPost = p;
        return {
          ...p,
          comments: [...comments, newC],
          commentsCount: (p.commentsCount || comments.length) + 1
        };
      }
      return p;
    });
    setPosts(updated);
    setStoredItem(STORAGE_KEYS.POSTS, updated);

    if (isSupabaseConfigured() && targetPost && currentUser) {
      try {
        await supabase.from('post_comments').insert({
          post_id: postId,
          user_id: currentUser.id,
          content: commentText
        });
        
        if (targetPost.userId && targetPost.userId !== currentUser.id) {
          await supabase.from('notifications').insert({
            user_id: targetPost.userId,
            actor_id: currentUser.id,
            type: 'comment_post',
            reference_id: postId
          });
        }
      } catch (e) {
        console.warn('Supabase post comment note:', e.message);
      }
    }
  };

  const handleLikeStory = async (storyId, storyUserId, isNowLiked) => {
    if (!isSupabaseConfigured() || !currentUser) return;
    try {
      if (isNowLiked) {
        await supabase.from('story_likes').insert({ story_id: storyId, user_id: currentUser.id });
        if (storyUserId && storyUserId !== currentUser.id) {
          await supabase.from('notifications').insert({
            user_id: storyUserId,
            actor_id: currentUser.id,
            type: 'like_story',
            reference_id: storyId
          });
        }
      } else {
        await supabase.from('story_likes').delete().eq('story_id', storyId).eq('user_id', currentUser.id);
      }
    } catch (e) {
      console.warn('Story like error:', e.message);
    }
  };

  const handleViewStory = async (storyId, storyUserId) => {
    if (!isSupabaseConfigured() || !currentUser || storyUserId === currentUser.id) return;
    try {
      await supabase.from('story_views').insert({ story_id: storyId, viewer_id: currentUser.id });
      if (storyUserId && storyUserId !== currentUser.id) {
        await supabase.from('notifications').insert({
          user_id: storyUserId,
          actor_id: currentUser.id,
          type: 'view_story',
          reference_id: storyId
        });
      }
    } catch (e) {
      // Ignore unique constraint violation if already viewed
    }
  };

  const handleCreatePost = async (newPostData) => {
    setIsUploadingPost(true);
    try {
      const postUuid = generateUUID();
      let rawMedia = newPostData.image || (newPostData.mediaList && newPostData.mediaList[0]?.url) || (newPostData.mediaList && typeof newPostData.mediaList[0] === 'string' ? newPostData.mediaList[0] : null);
      let finalMediaUrl = rawMedia;

      if (rawMedia && typeof rawMedia === 'string' && rawMedia.startsWith('data:')) {
        finalMediaUrl = await uploadChatMediaToSupabase(rawMedia, `post_${Date.now()}`);
      }

      let finalAudioUrl = newPostData.audioUrl || null;
      if (finalAudioUrl && typeof finalAudioUrl === 'string' && finalAudioUrl.startsWith('data:')) {
        finalAudioUrl = await uploadChatMediaToSupabase(finalAudioUrl, `audio_${Date.now()}`);
      }

      const newPost = {
        id: postUuid,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: `${currentUser.role || 'Artiste'}, ${currentUser.company || 'StageLink'}`,
        userAvatar: currentUser.avatar,
        isVerified: currentUser.verified,
        badgeType: currentUser.badgeType,
        text: newPostData.text || '',
        mediaList: newPostData.mediaList || [],
        image: finalMediaUrl,
        hasAudio: !!newPostData.hasAudio || !!finalAudioUrl,
        audioUrl: finalAudioUrl,
        audioTitle: newPostData.audioTitle || (newPostData.hasAudio ? 'Note Vocale' : null),
        timeAgo: 'À l\'instant',
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        comments: []
      };

      const updated = [newPost, ...posts];
      setPosts(updated);
      setStoredItem(STORAGE_KEYS.POSTS, updated);

      // Save post directly to Supabase Database for all users
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('posts').insert({
            id: postUuid,
            user_id: currentUser.id,
            content: newPostData.text || '',
            media_url: finalMediaUrl,
            audio_url: finalAudioUrl,
            audio_title: newPostData.audioTitle || null
          });
        } catch (pe) {
          console.warn('Supabase post creation note:', pe?.message || pe);
        }
      }

      // Success Notification Toast
      setToastNotification({
        title: 'Publication mise en ligne ! ✨',
        message: 'Votre publication est maintenant visible par toute la communauté.',
        avatar: currentUser?.avatar
      });
      setTimeout(() => setToastNotification(null), 5000);

      if (newPost.hasAudio) {
        handleStartGlobalAudio({
          title: newPost.audioTitle || 'Composition Audio',
          artist: currentUser.name,
          genre: 'Afro-Gospel'
        });
      }
    } finally {
      setIsUploadingPost(false);
    }
  };

  const handleCreateStory = async (storyData) => {
    setIsUploadingStory(true);
    try {
      const rawMedia = storyData.storyMedia || storyData.mediaUrl || storyData.media || null;
      let finalMediaUrl = rawMedia;

      // Safe Media Upload with fast 4s timeout
      if (rawMedia && typeof rawMedia === 'string' && rawMedia.startsWith('data:')) {
        try {
          const uploadPromise = uploadChatMediaToSupabase(rawMedia, `story_${Date.now()}`);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout')), 4000));
          finalMediaUrl = await Promise.race([uploadPromise, timeoutPromise]);
        } catch (uploadError) {
          console.warn('Story upload media fallback to raw data:', uploadError?.message || uploadError);
          finalMediaUrl = rawMedia;
        }
      }

      if (!finalMediaUrl) {
        finalMediaUrl = '';
      }

      const storyUuid = generateUUID();
      const privacyType = storyData.privacyType || 'all_contacts';
      const isText = storyData.isTextStory || !finalMediaUrl || finalMediaUrl === '';
      const isVideo = storyData.mediaType === 'video' || storyData.isVideo || (typeof finalMediaUrl === 'string' && (finalMediaUrl.includes('.mp4') || finalMediaUrl.includes('.webm') || finalMediaUrl.includes('.mov') || finalMediaUrl.startsWith('data:video')));

      const newStory = {
        id: storyUuid,
        userId: currentUser?.id || 'usr_me',
        userName: currentUser?.name || 'Moi',
        userAvatar: currentUser?.avatar || '',
        isVerified: currentUser?.verified || false,
        badgeType: currentUser?.badgeType || 'none',
        hasUnread: false,
        isTextStory: isText,
        mediaUrl: finalMediaUrl,
        storyMedia: isText ? null : finalMediaUrl,
        mediaType: isText ? 'text' : (isVideo ? 'video' : 'image'),
        isVideo: isVideo,
        caption: storyData.caption || '',
        bgGradient: storyData.bgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
        filter: storyData.filter || 'none',
        stickers: storyData.stickers || [],
        allowReshare: storyData.allowReshare !== false,
        isReshared: storyData.isReshared || false,
        resharedFrom: storyData.resharedFrom || null,
        privacyType: privacyType,
        createdAtTimestamp: Date.now(),
        time: 'À l\'instant'
      };

      // Optimistic instant UI update
      setStories(prev => {
        const list = [newStory, ...(prev || []).filter(s => s.id !== storyUuid)];
        setStoredItem(STORAGE_KEYS.STORIES, list);
        return list;
      });

      // Save story directly to Supabase Database for real-time sync with all users
      if (isSupabaseConfigured() && currentUser?.id) {
        try {
          // Ensure profile exists in profiles table so foreign key constraint is satisfied
          try {
            await supabase.from('profiles').upsert({
              id: currentUser.id,
              full_name: currentUser.name || 'Artiste StageLink',
              avatar_url: currentUser.avatar || '',
              role: currentUser.role || 'Artiste'
            }, { onConflict: 'id' });
          } catch (pe) {
            console.warn('Profile upsert check note:', pe);
          }

          const storyPayload = {
            id: storyUuid,
            user_id: currentUser.id,
            media_url: finalMediaUrl,
            caption: storyData.caption || '',
            is_video: isVideo,
            privacy_type: privacyType,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };

          let { error: insertErr } = await supabase.from('stories').insert(storyPayload);
          
          // Graceful fallback if the SQL migration (privacy_type column) hasn't been run yet
          if (insertErr) {
             console.warn('Initial story insert failed, trying legacy payload...', insertErr.message || insertErr);
             delete storyPayload.privacy_type;
             const fallback = await supabase.from('stories').insert(storyPayload);
             if (fallback.error) {
                console.warn('Legacy story insert note:', fallback.error.message || fallback.error);
             }
          }

          if (storyData.audienceRules && storyData.audienceRules.length > 0 && privacyType !== 'all_contacts') {
             const rulesToInsert = storyData.audienceRules.map(targetId => ({
                 story_id: storyUuid,
                 target_user_id: targetId
             }));
             const { error: rulesErr } = await supabase.from('story_audience_rules').insert(rulesToInsert);
             if (rulesErr) console.warn('story_audience_rules note:', rulesErr.message);
          }

          // Broadcast instant realtime notification to other connected clients
          try {
            supabase.channel('realtime:stories_interactions').send({
              type: 'broadcast',
              event: 'new_story',
              payload: newStory
            });
          } catch (be) {}

        } catch (se) {
          console.warn('Supabase story creation note:', se?.message || se);
        }

        // Silent non-blocking background sync
        syncPostsStoriesAndProfiles().catch(() => {});
      }

      // Success Notification Toast
      setToastNotification({
        title: 'Story publiée avec succès ! 🎉',
        message: 'Votre statut est maintenant visible par vos contacts et artistes.',
        avatar: currentUser?.avatar
      });
      setTimeout(() => setToastNotification(null), 5000);

    } catch (error) {
      console.error('Critical error in handleCreateStory:', error);
      setToastNotification({
        title: 'Erreur de publication',
        message: 'Impossible de publier la story. Veuillez réessayer.',
        avatar: null
      });
      setTimeout(() => setToastNotification(null), 5000);
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handleSendMessage = async (chatId, messageInput, explicitParticipant = null) => {
    const isObj = typeof messageInput === 'object';
    const msgUuid = generateUUID();

    const newMsg = {
      id: msgUuid,
      sender: 'current',
      senderId: currentUser?.id,
      text: isObj ? (messageInput.text || '') : messageInput,
      quotedMessage: isObj ? messageInput.quotedMessage : null,
      mediaUrl: isObj ? messageInput.mediaUrl : null,
      audioUrl: isObj ? messageInput.audioUrl : null,
      isAudio: isObj ? Boolean(messageInput.isAudio || messageInput.audioUrl) : false,
      isVideo: isObj ? Boolean(messageInput.isVideo || messageInput.videoUrl) : false,
      videoUrl: isObj ? messageInput.videoUrl : null,
      fileName: isObj ? messageInput.fileName : null,
      documentName: isObj ? messageInput.documentName : null,
      audioDuration: isObj ? messageInput.audioDuration : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAtTimestamp: Date.now(),
      isRead: true
    };

    let recipientId = null;

    setChats((prevChats) => {
      const targetChat = prevChats.find(c => c.id === chatId) || (selectedChat?.id === chatId ? selectedChat : null);
      recipientId = targetChat?.participant?.id || explicitParticipant?.id;

      let chatFound = false;
      const updatedChats = prevChats.map((c) => {
        if (c.id === chatId) {
          chatFound = true;
          return {
            ...c,
            unreadCount: 0,
            lastMessageTime: 'À l\'instant',
            messages: [...(c.messages || []), newMsg]
          };
        }
        return c;
      });

      if (!chatFound && (targetChat || explicitParticipant)) {
        updatedChats.unshift({
          id: chatId,
          participant: targetChat ? targetChat.participant : explicitParticipant,
          unreadCount: 0,
          lastMessageTime: 'À l\'instant',
          messages: [newMsg]
        });
      }

      setStoredItem(STORAGE_KEYS.CHATS, updatedChats);

      return updatedChats;
    });

    // Save message directly to Supabase Database for instant delivery to recipient
    if (isSupabaseConfigured() && recipientId) {
        soundEngine.playMessageSentSound();

        // 1. Instant Realtime Broadcast to recipient
        try {
          supabase.channel('realtime:messages').send({
            type: 'broadcast',
            event: 'new_chat_message',
            payload: {
              msgRecord: {
                id: msgUuid,
                sender_id: currentUser.id,
                receiver_id: recipientId,
                content: newMsg.text || '',
                media_url: newMsg.mediaUrl || null,
                audio_url: newMsg.audioUrl || null,
                metadata: {
                  quotedMessage: newMsg.quotedMessage || null,
                  isAudio: newMsg.isAudio || false,
                  isVideo: newMsg.isVideo || false,
                  videoUrl: newMsg.videoUrl || null,
                  fileName: newMsg.fileName || null,
                  audioDuration: newMsg.audioDuration || null,
                  documentName: newMsg.documentName || null
                },
                created_at: new Date().toISOString()
              },
              senderProfile: {
                id: currentUser.id,
                full_name: currentUser.name || 'Artiste StageLink',
                avatar_url: currentUser.avatar || '',
                role: currentUser.role || 'Artiste'
              }
            }
          });
        } catch (be) {}

        // 2. Persist in Supabase Database
        try {
          // Ensure sender profile exists
          try {
            await supabase.from('profiles').upsert({
              id: currentUser.id,
              full_name: currentUser.name || 'Artiste StageLink',
              avatar_url: currentUser.avatar || '',
              role: currentUser.role || 'Artiste'
            }, { onConflict: 'id' });
          } catch (pe) {}

          const { error: insertErr } = await supabase.from('messages').insert({
            id: msgUuid,
            sender_id: currentUser.id,
            receiver_id: recipientId,
            content: newMsg.text || '',
            media_url: newMsg.mediaUrl || null,
            audio_url: newMsg.audioUrl || null,
            metadata: {
              quotedMessage: newMsg.quotedMessage || null,
              isAudio: newMsg.isAudio || false,
              isVideo: newMsg.isVideo || false,
              videoUrl: newMsg.videoUrl || null,
              fileName: newMsg.fileName || null,
              audioDuration: newMsg.audioDuration || null,
              documentName: newMsg.documentName || null
            }
          });

          if (insertErr) {
            console.warn('Supabase message send note with metadata:', insertErr.message || insertErr);
            // Fallback 1: try with audio_note_url
            const { error: fallbackErr } = await supabase.from('messages').insert({
              id: msgUuid,
              sender_id: currentUser.id,
              receiver_id: recipientId,
              content: newMsg.text || '',
              media_url: newMsg.mediaUrl || null,
              audio_note_url: newMsg.audioUrl || null
            });
            
            if (fallbackErr) {
              console.error('Supabase fallback insert failed:', fallbackErr);
              // Fallback 2: Ultimate barebones insert
              const { error: bareFallbackErr } = await supabase.from('messages').insert({
                id: msgUuid,
                sender_id: currentUser.id,
                receiver_id: recipientId,
                content: newMsg.text || ''
              });
              if (bareFallbackErr) {
                console.error('All message insert fallbacks failed:', bareFallbackErr);
              }
            }
          }
          
          // Push notification for the message
          try {
            await supabase.from('notifications').insert({
              user_id: recipientId,
              actor_id: currentUser.id,
              type: 'message',
              reference_id: msgUuid
            });
          } catch (ne) {
            console.warn('Supabase message notification note:', ne);
          }
        } catch (me) {
          console.error('Network or unexpected error during message insert:', me);
        }
    }
  };

  const handleDeleteMessageForMe = (chatId, messageId) => {
    const updatedChats = chats.map((c) => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: c.messages.filter((m) => m.id !== messageId)
        };
      }
      return c;
    });
    setChats(updatedChats);
    setStoredItem(STORAGE_KEYS.CHATS, updatedChats);

    const active = updatedChats.find((c) => c.id === chatId);
    if (active) setSelectedChat(active);

    if (isSupabaseConfigured() && messageId) {
      try {
        // Fetch existing message to get current metadata
        supabase.from('messages').select('metadata').eq('id', messageId).single().then(({ data: msgData }) => {
          if (msgData) {
            const currentMetadata = msgData.metadata || {};
            const currentDeletedFor = currentMetadata.deleted_for || [];
            if (!currentDeletedFor.includes(currentUser.id)) {
              currentDeletedFor.push(currentUser.id);
              supabase.from('messages')
                .update({ metadata: { ...currentMetadata, deleted_for: currentDeletedFor } })
                .eq('id', messageId);
            }
          }
        });
      } catch (me) {
        console.warn('Supabase message Delete for me note:', me?.message || me);
      }
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').delete().eq('id', notificationId);
      } catch (e) {
        console.error("Erreur suppression notification:", e);
      }
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
  };

  const handleClearAllNotifications = async () => {
    if (isSupabaseConfigured() && currentUser?.id) {
      try {
        await supabase.from('notifications').delete().eq('user_id', currentUser.id);
      } catch (e) {
        console.error("Erreur suppression all notifications:", e);
      }
    }
    setNotifications([]);
    setUnreadNotificationsCount(0);
  };

  const handleDeleteMessageForEveryone = async (chatId, messageId) => {
    const updatedChats = chats.map((c) => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: c.messages.filter((m) => m.id !== messageId)
        };
      }
      return c;
    });
    setChats(updatedChats);
    setStoredItem(STORAGE_KEYS.CHATS, updatedChats);

    const active = updatedChats.find((c) => c.id === chatId);
    if (active) setSelectedChat(active);

    if (isSupabaseConfigured() && messageId) {
      try {
        await supabase.from('messages').delete().eq('id', messageId);
      } catch (me) {
        console.warn('Supabase message deletion note:', me?.message || me);
      }
    }
  };

  const handleCallEnded = async (callResult) => {
    setIsVideoCallActive(false);
    setIsIncomingCall(false);
    setIsCallMinimized(false);

    if (activeCallNotificationId && isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').delete().eq('id', activeCallNotificationId);
      } catch (e) { console.error("Suppressed error:", e); }
      setActiveCallNotificationId(null);
    }
    setIncomingCallData(null);

    if (!selectedChat) return;

    // Distinguish between completed, missed, or rejected calls
    const icon = callResult.isAudioOnly ? '📞' : '📹';
    const callType = callResult.isAudioOnly ? 'Appel audio' : 'Appel vidéo';

    let statusLabel = 'terminé';
    let durationText = callResult.duration > 0 ? ` (${Math.floor(callResult.duration / 60)}:${(callResult.duration % 60).toString().padStart(2, '0')})` : '';

    if (callResult.status === 'missed') {
      statusLabel = callResult.reason === 'timeout_60s' ? 'sans réponse' : 'manqué';
    } else if (callResult.status === 'rejected') {
      statusLabel = 'rejeté';
      durationText = '';
    }

    const callNoticeText = `${icon} ${callType} ${statusLabel}${durationText}`;

    const newMsg = {
      id: `msg_call_${Date.now()}`,
      senderId: currentUser ? currentUser.id : 'usr_1',
      sender: callResult.isIncoming ? 'other' : 'current',
      text: callNoticeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCallNotice: true,
      callStatus: callResult.status,
      isAudioOnly: callResult.isAudioOnly,
      createdAtTimestamp: Date.now()
    };

    const updatedChats = chats.map((c) => {
      if (c.id === (callResult.chatId || selectedChat.id)) {
        return {
          ...c,
          lastMessage: callNoticeText,
          lastMessageTime: 'À l\'instant',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setChats(updatedChats);
    setStoredItem(STORAGE_KEYS.CHATS, updatedChats);
  };

  const handleConnectUser = async (targetUserId) => {
    if (!isSupabaseConfigured() || !currentUser?.id) return;
    try {
      await supabase.from('followers').insert({
        follower_id: currentUser.id,
        following_id: targetUserId
      });
    } catch (e) {
      console.warn("Connection error", e);
    }
  };

  const handleApplyMatch = async (matchCard) => {
    if (!currentUser || !matchCard) return;

    const targetUserId = matchCard.userId || matchCard.id?.replace('match_', '');
    const targetUserName = matchCard.creator || matchCard.title || 'Artiste StageLink';
    const targetAvatar = matchCard.creatorAvatar || matchCard.image || '';
    const targetRole = matchCard.category || 'Artiste';

    // 1. Insert match record into Supabase matches table
    if (isSupabaseConfigured() && targetUserId) {
      try {
        await supabase.from('matches').insert({
          candidate_id: currentUser.id,
          target_id: targetUserId,
          status: 'pending'
        });
      } catch (me) {
        console.warn('Supabase match insert note:', me?.message || me);
      }
    }

    // 2. Start a direct chat session with the target artist
    handleStartChatWithUser({
      id: targetUserId,
      name: targetUserName,
      avatar: targetAvatar,
      role: targetRole
    });

    // 3. Send initial intro message in chat
    const chatId = `chat_${targetUserId}`;
    setTimeout(() => {
      handleSendMessage(chatId, `Bonjour ${targetUserName} ! Je suis intéressé(e) par votre opportunité "${matchCard.title}" sur StageLink.`, {
        id: targetUserId,
        name: targetUserName,
        avatar: targetAvatar,
        role: targetRole
      });
    }, 100);
  };

  const handleUpgradeSuccess = () => {
    updateUserProfile({ verified: true, badgeType: 'gold' });
  };


  if (appDataError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff', background: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Erreur de Synchronisation</h1>
        <p style={{ color: '#94A3B8', maxWidth: '400px', lineHeight: '1.6' }}>{appDataError}</p>
        <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '10px' }}>Veuillez v&eacute;rifier votre connexion ou rafra&icirc;chir l'application.</p>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#0066FF', color: '#fff', border: 'none', borderRadius: '12px', marginTop: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
          Rafra&icirc;chir l'application
        </button>
      </div>
    );
  }

  return (
    <div
      className={`app-viewport ${isDarkMode ? 'dark-mode' : ''}`}
      data-theme={isDarkMode ? 'dark' : 'light'}
      style={{
        position: 'relative',
        background: isDarkMode ? '#0B0F19' : '#F8FAFC',
        color: isDarkMode ? '#F8FAFC' : '#0F172A',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      {/* Top Header Navigation */}
      <TopBar
        activeTab={activeTab}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={handleOpenNotifications}
        onOpenUserSearch={() => setIsUserSearchOpen(true)}
        isDarkMode={isDarkMode}
      />

      {/* Main View Area */}
      <div className="app-content">
        {activeTab === 'feed' && (
          <PullToRefresh onRefresh={handleRefreshData} isDarkMode={isDarkMode}>
            <div style={{ position: 'relative' }}>
              <StoryBar
                stories={stories}
                isUploadingStory={isUploadingStory}
                onSelectStory={(st, userStoriesList) => {
                  const targetList = userStoriesList && userStoriesList.length > 0 ? userStoriesList : [st];
                  const targetIds = new Set(targetList.map(s => s.id));
                  const updated = stories.map((s) => targetIds.has(s.id) ? { ...s, hasUnread: false } : s);
                  setStories(updated);
                  setStoredItem(STORAGE_KEYS.STORIES, updated);
                  setActiveStory({ ...st, hasUnread: false });
                  setActiveStoryUserList(targetList);
                }}
                onAddStory={() => {
                  setResharedStoryData(null);
                  setIsCameraRecorderOpen(true);
                }}
              />

              <div style={{ padding: '12px 14px 68px 14px' }}>
                {/* Fast Create Post Bar */}
                <CreatePostBar onClickOpenModal={() => setIsCreatePostOpen(true)} />

                {posts.map((post) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    onLike={handleLikePost}
                    onFollowUser={handleFollowUser}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onOpenShare={(p) => setSharePost(p)}
                    onOpenReport={(p) => setReportPost(p)}
                    onOpenPublicProfile={handleOpenPublicProfile}
                  />
                ))}
              </div>
            </div>
          </PullToRefresh>
        )}

        {activeTab === 'match' && (
          <SwipeMatching
            matches={matches}
            onApplyMatch={handleApplyMatch}
          />
        )}
        {activeTab === 'discussions' && (
          <ChatList
            chats={chats}
            onSelectChat={handleSelectChat}
            onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
            onOpenCallHistoryModal={() => setIsCallHistoryModalOpen(true)}
            onOpenPublicProfile={handleOpenPublicProfile}
            isDarkMode={isDarkMode}
            onArchiveChat={async (chat) => {
              const partnerId = chat.participant?.id;
              if (!partnerId) return;
              const updatedChats = chats.filter(c => c.id !== chat.id);
              setChats(updatedChats);
              if (isSupabaseConfigured()) {
                try {
                  await supabase.from('chat_states').upsert({ user_id: currentUser.id, partner_id: partnerId, is_archived: true, updated_at: new Date().toISOString() });
                } catch (e) { console.warn('Archive error:', e); }
              }
            }}
            onDeleteChat={async (chat) => {
              // 1. Remove it from local UI instantly
              const updatedChats = chats.filter(c => c.id !== chat.id);
              setChats(updatedChats);
              setStoredItem(STORAGE_KEYS.CHATS, updatedChats);
              if (selectedChat?.id === chat.id) setSelectedChat(null);
              
              // 2. Persist deletion in Supabase using the specialized RPC
              if (isSupabaseConfigured() && currentUser?.id) {
                const partnerId = chat.participant?.id;
                if (!partnerId) return;
                try {
                  // The RPC will update chat_states to is_deleted = true
                  // AND mark all messages as deleted_for = currentUser.id
                  await supabase.rpc('delete_discussion', { partner: partnerId });
                  
                  // Also refresh messages sync to ensure messages are cleared from memory
                  if (syncMessagesFallback) syncMessagesFallback();
                } catch (e) { console.warn('Delete discussion error:', e); }
              }
            }}
            onToggleUnread={async (chat) => {
              const partnerId = chat.participant?.id;
              if (!partnerId) return;
              const isCurrentlyUnread = chat.unreadCount > 0;
              const newUnread = !isCurrentlyUnread;
              const updatedChats = chats.map(c => c.id === chat.id ? { ...c, unreadCount: newUnread ? 1 : 0 } : c);
              setChats(updatedChats);
              if (isSupabaseConfigured()) {
                try {
                  await supabase.from('chat_states').upsert({ user_id: currentUser.id, partner_id: partnerId, force_unread: newUnread, updated_at: new Date().toISOString() });
                } catch (e) { console.warn('Toggle unread error:', e); }
              }
            }}
          />
        )}

        {activeTab === 'studio' && (
          <AIMusicStudio
            onOpenPaywall={() => setIsPaywallOpen(true)}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            onOpenPaywall={() => setIsPaywallOpen(true)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onSimulateIncomingCall={() => {
              setIsIncomingCall(true);
              setIsVideoCallActive(true);
              setIsAudioCallOnly(false);
            }}
          />
        )}
      </div>

      {/* GLOBAL AUDIO MINI-PLAYER (Floating Background Music & Spectrum Player) */}
      {showGlobalPlayer && (
        <GlobalAudioPlayer
          currentTrack={activeGlobalTrack}
          onClose={() => setShowGlobalPlayer(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* PWA INSTALLATION ASSISTANT & TUTORIAL */}
      <PWAInstallPrompt isDarkMode={isDarkMode} />

      {/* Fullscreen Story Viewer Overlay */}
      {activeStoryView && (
        <StoryViewer 
          storyData={activeStoryView.storyData}
          initialIndex={activeStoryView.initialIndex}
          onClose={() => setActiveStoryView(null)}
        />
      )}

      {/* Global Notification Toast */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in max-w-sm w-11/12 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 flex items-center gap-4 cursor-pointer" onClick={() => setToastNotification(null)}>
          <div className="w-12 h-12 shrink-0">
            {toastNotification.avatar ? (
              <UserAvatar avatarUrl={toastNotification.avatar} size={48} border="2px solid #0066FF" />
            ) : (
              <UserAvatar size={48} border="2px solid #0066FF" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm truncate">{toastNotification.title}</h4>
            <p className="text-gray-300 text-xs truncate mt-0.5">{toastNotification.message}</p>
          </div>
        </div>
      )}

      {/* Active Story Viewer Overlay */}
      {activeStory && (
        <StoryViewer
          story={activeStory}
          userStories={activeStoryUserList}
          allStories={stories}
          initialShowViewers={savedStoryContext ? savedStoryContext.showViewers : false}
          onClose={() => {
            setActiveStory(null);
            setActiveStoryUserList([]);
            setSavedStoryContext(null);
          }}
          onDeleteStory={async (storyId) => {
            const updated = stories.filter((s) => s.id !== storyId);
            setStories(updated);
            setStoredItem(STORAGE_KEYS.STORIES, updated);
            setActiveStory(null);

            if (isSupabaseConfigured() && storyId) {
              try {
                await supabase.from('stories').delete().eq('id', storyId);
              } catch (se) {
                console.warn('Supabase story deletion note:', se?.message || se);
              }
            }
          }}
          onLikeStory={handleLikeStory}
          onViewStory={handleViewStory}
          onReshareStory={(st) => {
            setActiveStory(null);
            setResharedStoryData(st);
            setIsCameraRecorderOpen(true);
          }}
          onSendReply={handleStoryReplyToInbox}
        />
      )}

      {/* Active Chat Room Overlay */}
      {selectedChat && (
        <ChatRoom
          chat={selectedChat}
          onBack={handleBackFromChat}
          onStartAudioCall={async () => {
            setIsAudioCallOnly(true);
            setIsVideoCallActive(true);
            setIncomingCallData(null); // Ensure it's not an incoming call
            if (isSupabaseConfigured() && currentUser?.id && selectedChat?.participant?.id) {
              try {
                const { data } = await supabase.from('notifications').insert({
                  user_id: selectedChat.participant.id,
                  actor_id: currentUser.id,
                  type: 'incoming_call_audio'
                }).select('id').single();
                if (data) setActiveCallNotificationId(data.id);
              } catch (e) { console.error("Suppressed error:", e); }
            }
          }}
          onStartVideoCall={async () => {
            setIsAudioCallOnly(false);
            setIsVideoCallActive(true);
            setIncomingCallData(null);
            if (isSupabaseConfigured() && currentUser?.id && selectedChat?.participant?.id) {
              try {
                const { data } = await supabase.from('notifications').insert({
                  user_id: selectedChat.participant.id,
                  actor_id: currentUser.id,
                  type: 'incoming_call_video'
                }).select('id').single();
                if (data) setActiveCallNotificationId(data.id);
              } catch (e) { console.error("Suppressed error:", e); }
            }
          }}
          onOpenEphemeralModal={() => setIsEphemeralOpen(true)}
          onSendMessage={handleSendMessage}
          onDeleteMessageForMe={handleDeleteMessageForMe}
          onDeleteMessageForEveryone={handleDeleteMessageForEveryone}
          onOpenPublicProfile={handleOpenPublicProfile}
          onOpenStory={handleOpenStoryFromMessage}
        />
      )}

      {/* Public Profile View Modal */}
      {publicProfileUser && (
        <PublicProfileModal
          user={publicProfileUser}
          onClose={() => setPublicProfileUser(null)}
          onStartChat={handleStartChatWithUser}
          onConnectUser={handleConnectUser}
        />
      )}

      {/* New Chat Contacts Selector Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        users={allUsers}
        onSelectUser={handleStartChatWithUser}
      />

      {/* Call History Modal */}
      <CallHistoryModal
        isOpen={isCallHistoryModalOpen}
        onClose={() => setIsCallHistoryModalOpen(false)}
        chats={chats}
        onStartCallWithUser={(userObj, audioOnly) => {
          handleStartChatWithUser(userObj);
          setIsAudioCallOnly(audioOnly);
          setIsVideoCallActive(true);
        }}
        isDarkMode={isDarkMode}
      />

      {/* Global User Search Modal */}
      <GlobalUserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        users={allUsers}
        onOpenPublicProfile={handleOpenPublicProfile}
        onStartChat={handleStartChatWithUser}
        onConnectUser={handleConnectUser}
        isDarkMode={isDarkMode}
      />

      {/* Post Social Share Modal */}
      <ShareModal
        isOpen={!!sharePost}
        onClose={() => setSharePost(null)}
        post={sharePost}
      />

      {/* Content Moderation / Report Modal */}
      <ReportModal
        isOpen={!!reportPost}
        onClose={() => setReportPost(null)}
        post={reportPost}
      />

      {/* Dedicated Full-Screen Create Post Publishing Page */}
      {isCreatePostOpen && (
        <CreatePostView
          onBack={() => setIsCreatePostOpen(false)}
          onSubmitPost={handleCreatePost}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Camera Story Recorder & Reshare Publisher */}
      <CameraStoryRecorder
        isOpen={isCameraRecorderOpen}
        resharedStoryData={resharedStoryData}
        users={allUsers}
        onClose={() => {
          setIsCameraRecorderOpen(false);
          setResharedStoryData(null);
        }}
        onStoryCreated={handleCreateStory}
      />

      {/* Ephemeral Message Timer Settings Modal */}
      <EphemeralModal
        isOpen={isEphemeralOpen}
        onClose={() => setIsEphemeralOpen(false)}
        participantName={selectedChat?.participant?.name ? selectedChat.participant.name.split(' ')[0] : 'Artiste'}
      />

      {/* Live Video / Audio Call Screen */}
      <VideoCallScreen
        isOpen={isVideoCallActive}
        isIncoming={!!incomingCallData}
        isMinimized={isCallMinimized}
        onMinimize={() => setIsCallMinimized(true)}
        onMaximize={() => setIsCallMinimized(false)}
        onClose={() => {
          setIsVideoCallActive(false);
          handleCallEnded({ status: 'ended', duration: 0, isAudioOnly: incomingCallData ? incomingCallData.isAudioOnly : isAudioCallOnly });
        }}
        callerName={incomingCallData ? incomingCallData.callerName : (selectedChat?.participant?.name || 'Artiste StageLink')}
        callerAvatar={incomingCallData ? incomingCallData.callerAvatar : (selectedChat?.participant?.avatar || null)}
        remoteUserId={incomingCallData ? incomingCallData.callerId : selectedChat?.participant?.id}
        chatId={incomingCallData ? `chat_${incomingCallData.callerId}` : selectedChat?.id}
        isAudioOnly={incomingCallData ? incomingCallData.isAudioOnly : isAudioCallOnly}
        onCallEnded={handleCallEnded}
      />

      {/* RevenueCat Premium Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

      {/* Activity & Messages Notification Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        chats={chats}
        onDeleteNotification={handleDeleteNotification}
        onClearAllNotifications={handleClearAllNotifications}
        onSelectChat={(chat) => {
          setIsNotificationsOpen(false);
          handleSelectChat(chat);
          setActiveTab('discussions');
        }}
        onNavigateTab={(tab) => {
          setIsNotificationsOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* Persistent Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedChat(null);
        }}
        unreadMessagesCount={chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    let isExplicitReload = false;
    try {
      if (window.performance && window.performance.getEntriesByType) {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          isExplicitReload = navEntries[0].type === 'reload';
        }
      } else if (window.performance && window.performance.navigation) {
        isExplicitReload = window.performance.navigation.type === 1;
      }
    } catch (e) { console.error("Suppressed error:", e); }

    let lastActiveTime = 0;
    let hasSeenSession = false;
    try {
      hasSeenSession = sessionStorage.getItem('hasSeenSplashSession');
      lastActiveTime = parseInt(localStorage.getItem('stagelink_last_active') || '0', 10);
    } catch (e) { console.error("Suppressed error:", e); }

    const now = Date.now();
    const isRecentBackgroundResume = lastActiveTime > 0 && (now - lastActiveTime) < (12 * 60 * 60 * 1000);

    // If resuming from screen unlock or background multitasking, skip splash animation!
    if (isRecentBackgroundResume && !isExplicitReload && hasSeenSession) {
      return false;
    }

    // Play splash animation on cold start launch or explicit reload
    if (!hasSeenSession || isExplicitReload) {
      return true;
    }

    return false;
  });

  // Track app activity & screen lock/unlock to keep background session active
  useEffect(() => {
    const updateActiveTime = () => {
      try {
        localStorage.setItem('stagelink_last_active', Date.now().toString());
        sessionStorage.setItem('hasSeenSplashSession', 'true');
      } catch (e) { console.error("Suppressed error:", e); }
    };

    updateActiveTime();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActiveTime();
        setShowSplash(false); // Never trigger splash animation when unlocking screen
      } else {
        updateActiveTime();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', updateActiveTime);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', updateActiveTime);
    };
  }, []);

  const handleFinishSplash = () => {
    try {
      sessionStorage.setItem('hasSeenSplashSession', 'true');
      localStorage.setItem('stagelink_last_active', Date.now().toString());
    } catch (e) { console.error("Suppressed error:", e); }
    setShowSplash(false);
  };

  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
        {showSplash && <AppSplashScreen onFinish={handleFinishSplash} />}
      </AuthProvider>
    </LanguageProvider>
  );
}
