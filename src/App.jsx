import React, { useState, useEffect } from 'react';
import { Plus, Volume2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AuthScreen from './components/auth/AuthScreen';
import OnboardingWizard from './components/auth/OnboardingWizard';
import TopBar from './components/navigation/TopBar';
import GlobalUserSearchModal from './components/navigation/GlobalUserSearchModal';
import BottomNav from './components/navigation/BottomNav';
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
  const [activeStory, setActiveStory] = useState(null);
  const [savedStoryContext, setSavedStoryContext] = useState(null);
  const [resharedStoryData, setResharedStoryData] = useState(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCameraRecorderOpen, setIsCameraRecorderOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(2);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
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
  const [isCallMinimized, setIsCallMinimized] = useState(false); // New state for PiP
  const [isAudioCallOnly, setIsAudioCallOnly] = useState(false);
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  // Persistent Data States
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

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
        const { updatedPosts, updatedStories, updatedChats, updatedUsers } = e.detail;
        if (updatedPosts) setPosts(updatedPosts);
        if (updatedStories) setStories(updatedStories);
        if (updatedChats) setChats(updatedChats);
        if (updatedUsers) setAllUsers(updatedUsers);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, []);

  const handleRefreshData = () => {
    const freshPosts = getStoredItem(STORAGE_KEYS.POSTS, []);
    const freshStories = getStoredItem(STORAGE_KEYS.STORIES, []);
    const freshChats = getStoredItem(STORAGE_KEYS.CHATS, []);
    const freshUsers = getStoredItem(STORAGE_KEYS.USERS, []);

    setPosts(freshPosts);
    setStories(freshStories);
    setChats(freshChats);
    setAllUsers(freshUsers);
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const loadInitialData = async () => {
        let loadedPosts = getStoredItem(STORAGE_KEYS.POSTS, []);
        let loadedStories = getStoredItem(STORAGE_KEYS.STORIES, []);
        let loadedMatches = getStoredItem(STORAGE_KEYS.MATCHES, []);
        let loadedUsers = getStoredItem(STORAGE_KEYS.USERS, []);
        let loadedChats = getStoredItem(STORAGE_KEYS.CHATS, []);

        if (isSupabaseConfigured()) {
          try {
            // Fetch live profiles
            const { data: supaProfiles } = await supabase.from('profiles').select('*');
            if (supaProfiles && supaProfiles.length > 0) {
              const mappedUsers = supaProfiles.map(p => ({
                id: p.id,
                name: p.full_name,
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
              loadedUsers = mappedUsers;
            }

            // Fetch live posts
            const { data: supaPosts } = await supabase
              .from('posts')
              .select('*, profiles:user_id(full_name, avatar_url, role, verified_badge)')
              .order('created_at', { ascending: false });

            if (supaPosts && supaPosts.length > 0) {
              loadedPosts = supaPosts.map(p => ({
                id: p.id,
                userId: p.user_id,
                userName: p.profiles?.full_name || 'Artiste StageLink',
                userRole: p.profiles?.role || 'Membre StageLink',
                userAvatar: p.profiles?.avatar_url || '',
                isVerified: p.profiles?.verified_badge === 'gold' || p.profiles?.verified_badge === 'blue',
                badgeType: p.profiles?.verified_badge || 'none',
                text: p.content || '',
                image: p.media_url || null,
                hasAudio: Boolean(p.audio_url),
                audioTitle: p.audio_title || 'Extrait Audio',
                audioUrl: p.audio_url || null,
                likesCount: p.likes_count || 0,
                isLiked: false,
                commentsCount: p.comments_count || 0,
                comments: [],
                timeAgo: 'Récemment'
              }));
            }

            // Fetch live active stories (unexpired)
            const { data: supaStories } = await supabase
              .from('stories')
              .select('*, profiles:user_id(full_name, avatar_url)')
              .gte('expires_at', new Date().toISOString())
              .order('created_at', { ascending: false });

            if (supaStories && supaStories.length > 0) {
              loadedStories = supaStories.map(s => ({
                id: s.id,
                userId: s.user_id,
                userName: s.profiles?.full_name || 'Artiste StageLink',
                avatar: s.profiles?.avatar_url || '',
                hasUnread: true,
                storyMedia: s.media_url,
                caption: s.caption || '',
                time: 'Récemment'
              }));
            }

            // Fetch live matches
            const { data: supaMatches } = await supabase.from('matches').select('*');
            if (supaMatches && supaMatches.length > 0) {
              loadedMatches = supaMatches;
            }
          } catch (err) {
            console.warn('Supabase live data fetch note:', err.message);
          }
        }

        setAllUsers(loadedUsers);
        setPosts(loadedPosts);
        setStories(loadedStories);
        setMatches(loadedMatches);
        setChats(loadedChats);

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
        } catch (e) {}

        if (currentUser.isNewRegistration) {
          setIsOnboardingOpen(true);
        }
      };

      loadInitialData();
    }
  }, [isAuthenticated, currentUser?.id]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
    setUnreadNotificationsCount(0);
  };

  const handleSelectChat = (chat) => {
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
  };

  const handleStartChatWithUser = (targetUser) => {
    window.history.pushState({ page: 'chat' }, '');
    const existing = chats.find((c) => c.participant.id === targetUser.id || c.participant.name === targetUser.name || c.participant.name === targetUser.userName);
    if (existing) {
      handleSelectChat(existing);
      setActiveTab('discussions');
    } else {
      const newChat = {
        id: `chat_${targetUser.id || Date.now()}`,
        participant: {
          id: targetUser.id || `usr_${Date.now()}`,
          name: targetUser.name || targetUser.userName,
          avatar: targetUser.avatar || targetUser.userAvatar,
          online: true,
          role: targetUser.role || targetUser.userRole
        },
        unreadCount: 0,
        lastMessageTime: 'À l\'instant',
        messages: []
      };

      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setStoredItem(STORAGE_KEYS.CHATS, updatedChats);
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
      setActiveTab('feed');
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

  const handleStoryReplyToInbox = (storyUser, replyText, isFromViewersList = false) => {
    if (isFromViewersList && activeStory) {
      setSavedStoryContext({ story: activeStory, showViewers: true });
    }

    setActiveStory(null);

    const targetUserId = storyUser.userId || storyUser.id || `usr_story_${Date.now()}`;
    const targetUserName = storyUser.userName || storyUser.name;
    const targetAvatar = storyUser.avatar;
    const targetRole = storyUser.role || 'Artiste StageLink';

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
          online: true
        },
        unreadCount: 0,
        lastMessageTime: 'À l\'instant',
        messages: []
      };
      updatedChatsList = [targetChat, ...chats];
    }

    if (replyText) {
      const newMsg = {
        id: `msg_story_${Date.now()}`,
        sender: 'current',
        text: replyText,
        isStoryComment: true,
        storyThumbnail: storyUser.storyMedia || storyUser.image || storyUser.mediaUrl || null,
        storyCaption: storyUser.caption || null,
        storyBgGradient: storyUser.bgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
        storyIsText: storyUser.isTextStory || false,
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
    }

    setChats(updatedChatsList);
    setStoredItem(STORAGE_KEYS.CHATS, updatedChatsList);
    setSelectedChat(targetChat);
    setActiveTab('discussions');
  };

  const handleDeletePost = (postId) => {
    const updated = posts.filter((p) => p.id !== postId);
    setPosts(updated);
    setStoredItem(STORAGE_KEYS.POSTS, updated);
  };

  const handleLikePost = (postId) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
        };
      }
      return p;
    });
    setPosts(updated);
    setStoredItem(STORAGE_KEYS.POSTS, updated);
  };

  const handleAddComment = (postId, commentText) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const comments = p.comments || [];
        const newC = {
          id: `c_${Date.now()}`,
          userName: currentUser.name,
          text: commentText,
          time: 'À l\'instant'
        };
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
  };

  const handleCreatePost = (newPostData) => {
    const newPost = {
      id: `post_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: `${currentUser.role}, ${currentUser.company}`,
      userAvatar: currentUser.avatar,
      isVerified: currentUser.verified,
      badgeType: currentUser.badgeType,
      text: newPostData.text,
      mediaList: newPostData.mediaList || [],
      hasAudio: !!newPostData.hasAudio,
      audioUrl: newPostData.audioUrl || null,
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

    // Also trigger global player demo
    if (newPost.hasAudio) {
      handleStartGlobalAudio({
        title: newPost.audioTitle || 'Composition Audio',
        artist: currentUser.name,
        genre: 'Afro-Gospel'
      });
    }
  };

  const handleCreateStory = (storyData) => {
    const rawMedia = storyData.storyMedia || storyData.mediaUrl || storyData.media || null;
    const newStory = {
      id: `story_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      isVerified: currentUser.verified,
      badgeType: currentUser.badgeType,
      hasUnread: false,
      isTextStory: storyData.isTextStory || false,
      mediaUrl: rawMedia,
      storyMedia: rawMedia,
      mediaType: storyData.mediaType || storyData.type || (rawMedia ? 'image' : null),
      caption: storyData.caption || '',
      bgGradient: storyData.bgGradient || 'linear-gradient(135deg, #0066FF, #0047FF)',
      filter: storyData.filter || 'none',
      stickers: storyData.stickers || [],
      allowReshare: storyData.allowReshare !== false,
      isReshared: storyData.isReshared || false,
      resharedFrom: storyData.resharedFrom || null,
      time: 'À l\'instant'
    };

    const updated = [newStory, ...stories];
    setStories(updated);
    setStoredItem(STORAGE_KEYS.STORIES, updated);
  };

  const handleSendMessage = (chatId, messageInput) => {
    const updatedChats = chats.map((c) => {
      if (c.id === chatId) {
        const isObj = typeof messageInput === 'object';

        const newMsg = {
          id: `msg_${Date.now()}`,
          sender: 'current',
          text: isObj ? messageInput.text : messageInput,
          quotedMessage: isObj ? messageInput.quotedMessage : null,
          mediaUrl: isObj ? messageInput.mediaUrl : null,
          audioUrl: isObj ? messageInput.audioUrl : null,
          isAudio: isObj ? messageInput.isAudio : false,
          audioDuration: isObj ? messageInput.audioDuration : null,
          timestamp: 'À l\'instant',
          createdAtTimestamp: Date.now(),
          isRead: true
        };

        return {
          ...c,
          unreadCount: 0,
          lastMessageTime: 'À l\'instant',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setChats(updatedChats);
    setStoredItem(STORAGE_KEYS.CHATS, updatedChats);

    const active = updatedChats.find((c) => c.id === chatId);
    if (active) setSelectedChat(active);
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
  };

  const handleDeleteMessageForEveryone = (chatId, messageId) => {
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
  };

  const handleCallEnded = (callResult) => {
    setIsVideoCallActive(false);
    setIsIncomingCall(false);
    setIsCallMinimized(false);

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

  const handleUpgradeSuccess = () => {
    updateUserProfile({ verified: true, badgeType: 'gold' });
  };

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
                onSelectStory={(st) => {
                  const updated = stories.map((s) => s.id === st.id ? { ...s, hasUnread: false } : s);
                  setStories(updated);
                  setStoredItem(STORAGE_KEYS.STORIES, updated);
                  setActiveStory({ ...st, hasUnread: false });
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
                    onOpenPublicProfile={(userObj) => {
                      window.history.pushState({ page: 'profile' }, '');
                      setPublicProfileUser(userObj);
                    }}
                  />
                ))}
              </div>
            </div>
          </PullToRefresh>
        )}

        {activeTab === 'match' && (
          <SwipeMatching
            matches={matches}
            onApplyMatch={(match) => {}}
          />
        )}

        {activeTab === 'discussions' && (
          <ChatList
            chats={chats}
            onSelectChat={handleSelectChat}
            onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
            onOpenCallHistoryModal={() => setIsCallHistoryModalOpen(true)}
            isDarkMode={isDarkMode}
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
      {activeStory && (
        <StoryViewer
          story={activeStory}
          allStories={stories}
          initialShowViewers={savedStoryContext ? savedStoryContext.showViewers : false}
          onClose={() => {
            setActiveStory(null);
            setSavedStoryContext(null);
          }}
          onDeleteStory={(storyId) => {
            const updated = stories.filter((s) => s.id !== storyId);
            setStories(updated);
            setStoredItem(STORAGE_KEYS.STORIES, updated);
            setActiveStory(null);
          }}
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
          onStartAudioCall={() => {
            setIsAudioCallOnly(true);
            setIsVideoCallActive(true);
          }}
          onStartVideoCall={() => {
            setIsAudioCallOnly(false);
            setIsVideoCallActive(true);
          }}
          onOpenEphemeralModal={() => setIsEphemeralOpen(true)}
          onSendMessage={handleSendMessage}
          onDeleteMessageForMe={handleDeleteMessageForMe}
          onDeleteMessageForEveryone={handleDeleteMessageForEveryone}
          onOpenPublicProfile={(usr) => {
            window.history.pushState({ page: 'profile' }, '');
            setPublicProfileUser(usr);
          }}
        />
      )}

      {/* Public Profile View Modal */}
      {publicProfileUser && (
        <PublicProfileModal
          user={publicProfileUser}
          onClose={() => setPublicProfileUser(null)}
          onStartChat={handleStartChatWithUser}
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
        onOpenPublicProfile={(usr) => {
          window.history.pushState({ page: 'profile' }, '');
          setPublicProfileUser(usr);
        }}
        onStartChat={handleStartChatWithUser}
        isDarkMode={isDarkMode}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
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
        participantName={selectedChat ? selectedChat.participant.name.split(' ')[0] : 'Sarah'}
      />

      {/* Live Video / Audio Call Screen */}
      <VideoCallScreen
        isOpen={isVideoCallActive}
        isIncoming={isIncomingCall}
        isMinimized={isCallMinimized}
        onMinimize={() => setIsCallMinimized(true)}
        onMaximize={() => setIsCallMinimized(false)}
        onClose={() => setIsVideoCallActive(false)}
        callerName={selectedChat ? selectedChat.participant.name : 'Sarah Jenkins'}
        callerAvatar={selectedChat ? selectedChat.participant.avatar : null}
        isAudioOnly={isAudioCallOnly}
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
    } catch (e) {}

    let lastActiveTime = 0;
    let hasSeenSession = false;
    try {
      hasSeenSession = sessionStorage.getItem('hasSeenSplashSession');
      lastActiveTime = parseInt(localStorage.getItem('stagelink_last_active') || '0', 10);
    } catch (e) {}

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
      } catch (e) {}
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
    } catch (e) {}
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
