/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { PromoBanner } from './components/PromoBanner';
import { DesktopSidebar } from './components/DesktopSidebar';
import { RightSidebar } from './components/RightSidebar';
import { VerticalVideoFeed } from './components/VerticalVideoFeed';
import { VideoFeed } from './components/VideoFeed';
import { BottomNavBar } from './components/BottomNavBar';
import { SideDrawer } from './components/SideDrawer';
import { LiveStreamModal } from './components/LiveStreamModal';
import { TokenStoreModal } from './components/TokenStoreModal';
import { WithdrawalModal } from './components/WithdrawalModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AuthModal } from './components/AuthModal';
import { KycModal } from './components/KycModal';
import { VideoModal } from './components/VideoModal';
import { ShareModal } from './components/ShareModal';
import { UploadModal } from './components/UploadModal';
import { UserProfile } from './components/UserProfile';
import { CreatorProfileModal } from './components/CreatorProfileModal';
import { NichesView } from './components/NichesView';
import { VideoClip, FilterState, UserProfileData, MainViewTab, UserAccount, SiteBranding } from './types';
import { 
  getStoredTheme, 
  setStoredTheme, 
  getAllClips, 
  saveUserClip, 
  getLikedClipIds, 
  toggleLikeClipId, 
  getSavedClipIds, 
  toggleSaveClipId,
  getStoredUserClips,
  getStoredUserProfile,
  saveStoredUserProfile,
  getFollowedCreators,
  toggleFollowCreator,
  getStoredUserAccount,
  saveStoredUserAccount,
  logoutUserAccount,
  getUnlockedClipIds,
  unlockPaywallClip,
  getSiteBranding,
  saveSiteBranding,
  saveStoredClips
} from './utils/storage';
import { 
  fetchClipsApi, 
  fetchBrandingApi, 
  sendHeartbeatApi, 
  updateUserTokensApi,
  createClipApi 
} from './utils/api';
import { 
  fetchClipsFromSupabase, 
  saveClipToSupabase, 
  saveUserProfileToSupabase, 
  saveLikeToSupabase, 
  saveFollowToSupabase 
} from './utils/supabase';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Main navigation tab (Default to the new RedGIFs-style Main Homepage!)
  const [activeTab, setActiveTab] = useState<MainViewTab>('explore_grid');

  // User Account & Authentication
  const [activeUser, setActiveUser] = useState<UserAccount>(getStoredUserAccount());
  const [unlockedClipIds, setUnlockedClipIds] = useState<string[]>(getUnlockedClipIds());
  const [siteBranding, setSiteBranding] = useState<SiteBranding>(getSiteBranding());

  // Clips and User storage
  const [allClips, setAllClips] = useState<VideoClip[]>([]);
  const [userClips, setUserClips] = useState<VideoClip[]>([]);
  const [likedClipIds, setLikedClipIds] = useState<string[]>([]);
  const [savedClipIds, setSavedClipIds] = useState<string[]>([]);
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);

  // Modals state
  const [activeModalClip, setActiveModalClip] = useState<VideoClip | null>(null);
  const [shareModalClip, setShareModalClip] = useState<VideoClip | null>(null);
  const [paywallTargetClip, setPaywallTargetClip] = useState<VideoClip | null>(null);

  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isTokenStoreOpen, setIsTokenStoreOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [creatorProfileUsername, setCreatorProfileUsername] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    searchQuery: '',
    tag: '',
    sort: 'trending',
    orientation: 'all',
    hasAudioOnly: false,
    feedMode: 'all',
  });

  // Load initial data and theme on mount
  useEffect(() => {
    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    setStoredTheme(initialTheme);

    // Initial local cache
    const loadedClips = getAllClips();
    setAllClips(loadedClips);
    setUserClips(getStoredUserClips());
    setLikedClipIds(getLikedClipIds());
    setSavedClipIds(getSavedClipIds());
    setFollowedCreators(getFollowedCreators());
    const storedUser = getStoredUserAccount();
    setActiveUser(storedUser);
    setUnlockedClipIds(getUnlockedClipIds());

    // Fetch live backend database clips & branding from Supabase + Hostinger/Node server
    const fetchLiveBackend = async () => {
      try {
        const [clipsRes, brandRes, supabaseRes] = await Promise.all([
          fetchClipsApi(),
          fetchBrandingApi(),
          fetchClipsFromSupabase().catch(() => ({ success: false, clips: [] })),
        ]);

        let combinedClips = loadedClips;

        if (clipsRes.success && clipsRes.clips && clipsRes.clips.length > 0) {
          combinedClips = clipsRes.clips;
        }

        if (supabaseRes.success && supabaseRes.clips && supabaseRes.clips.length > 0) {
          // Supabase DB is primary source of truth: merge Supabase clips over local static clips
          const supabaseMap = new Map<string, VideoClip>(supabaseRes.clips.map(c => [c.id, c] as [string, VideoClip]));
          const remainingLocal = combinedClips.filter(c => !supabaseMap.has(c.id));
          combinedClips = [...supabaseRes.clips, ...remainingLocal];
        }

        if (combinedClips.length > 0) {
          setAllClips(combinedClips);
          saveStoredClips(combinedClips);
        }

        if (brandRes.success && brandRes.branding) {
          setSiteBranding(brandRes.branding);
          saveSiteBranding(brandRes.branding);
        }
      } catch {
        // Fallback to local data on offline
      }
    };

    fetchLiveBackend();

    // Check URL hash or path for direct video link `#v=clip-1` or `/admin`
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (path === '/admin' || hash === '#admin') {
      setIsAdminLoginOpen(true);
    }

    if (hash && hash.includes('#v=')) {
      const clipId = hash.replace('#v=', '').split('&')[0];
      const matched = loadedClips.find(c => c.id === clipId);
      if (matched) {
        setActiveModalClip(matched);
      }
    }

    const handleClipDeleted = () => {
      const refreshedClips = getAllClips();
      setAllClips(refreshedClips);
      setUserClips(getStoredUserClips());
      setActiveModalClip(prev => prev && !refreshedClips.some(c => c.id === prev.id) ? null : prev);
    };

    window.addEventListener('islandheat_clip_deleted', handleClipDeleted);
    return () => window.removeEventListener('islandheat_clip_deleted', handleClipDeleted);
  }, []);

  // Periodic heartbeat sync for logged-in user so backend knows they are online
  useEffect(() => {
    if (!activeUser || !activeUser.username || activeUser.username === 'guest') return;

    // Send initial heartbeat
    sendHeartbeatApi(activeUser.username);

    // Ping every 25 seconds
    const interval = setInterval(() => {
      sendHeartbeatApi(activeUser.username);
    }, 25000);

    return () => clearInterval(interval);
  }, [activeUser.username]);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setStoredTheme(newTheme);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleLikeToggle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const willBeLiked = !likedClipIds.includes(id);
    const updated = toggleLikeClipId(id);
    setLikedClipIds(updated);
    // Sync like state to Supabase
    saveLikeToSupabase(id, activeUser.id, willBeLiked).catch(err => console.warn('Supabase like sync error:', err));
  };

  const handleSaveToggle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleSaveClipId(id);
    setSavedClipIds(updated);
  };

  const handleToggleFollow = (username: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const willBeFollowing = !followedCreators.includes(username.toLowerCase());
    const updated = toggleFollowCreator(username);
    setFollowedCreators(updated);
    // Sync follow state to Supabase
    saveFollowToSupabase(activeUser.username, username, willBeFollowing).catch(err => console.warn('Supabase follow sync error:', err));
  };

  const handleAccountUpdate = async (updated: UserAccount) => {
    setActiveUser(updated);
    saveStoredUserAccount(updated);
    // Sync user profile to Supabase 'profiles' table
    saveUserProfileToSupabase({
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      avatar: updated.avatar,
      bio: updated.bio,
      role: updated.role,
      isVerified: updated.isVerified,
      tokensBalance: updated.tokensBalance,
      earnedTokens: updated.earnedTokens,
      earningsUSD: updated.earningsUSD,
    }).catch(err => console.warn('Supabase profile sync error:', err));

    // Sync tokens with backend if updated
    if (updated.username) {
      await updateUserTokensApi(updated.username, updated.tokensBalance, updated.earnedTokens, updated.earningsUSD);
    }
  };

  const handleLogout = () => {
    const guest = logoutUserAccount();
    setActiveUser(guest);
  };

  // Paywall Post Unlock Handler
  const handleUnlockPaywall = async (clip: VideoClip) => {
    const tokenCost = clip.priceTokens || 50;
    if (activeUser.tokensBalance < tokenCost) {
      // Prompt token purchase
      setPaywallTargetClip(clip);
      setIsTokenStoreOpen(true);
    } else {
      // Deduct tokens and unlock
      const res = unlockPaywallClip(clip.id, tokenCost);
      if (res.success) {
        setActiveUser(res.account);
        setUnlockedClipIds(getUnlockedClipIds());
        if (res.account.username) {
          await updateUserTokensApi(res.account.username, res.account.tokensBalance, res.account.earnedTokens, res.account.earningsUSD);
        }
      }
    }
  };

  const handleUploadSuccess = async (newClip: VideoClip) => {
    const updatedUserClips = saveUserClip(newClip);
    setUserClips(updatedUserClips);
    setAllClips([newClip, ...allClips]);
    setActiveModalClip(newClip);
    // Send to backend database
    await createClipApi(newClip);
  };

  const handleSelectClip = (clip: VideoClip) => {
    setActiveModalClip(clip);
    window.history.replaceState(null, '', `#v=${clip.id}`);
  };

  const handleCloseModal = () => {
    setActiveModalClip(null);
    if (window.location.hash.includes('#v=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Filter and sort clips algorithm
  const filteredClips = useMemo(() => {
    return allClips
      .filter(clip => {
        if (filters.feedMode === 'following') {
          const isCreatorFollowed = followedCreators.includes(clip.creator.username.toLowerCase());
          if (!isCreatorFollowed) return false;
        }

        if (filters.category !== 'All' && clip.category !== filters.category) {
          return false;
        }

        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().replace(/^[@#]/, '');
          const matchTitle = clip.title.toLowerCase().includes(q);
          const matchTag = clip.tags.some(t => t.toLowerCase().includes(q));
          const matchCat = clip.category.toLowerCase().includes(q);
          const matchCreatorName = clip.creator.name.toLowerCase().includes(q);
          const matchCreatorUser = clip.creator.username.toLowerCase().includes(q);
          if (!matchTitle && !matchTag && !matchCat && !matchCreatorName && !matchCreatorUser) {
            return false;
          }
        }

        if (filters.tag) {
          const tagClean = filters.tag.toLowerCase().replace(/^#/, '');
          if (!clip.tags.map(t => t.toLowerCase()).includes(tagClean)) {
            return false;
          }
        }

        if (filters.orientation !== 'all') {
          if (filters.orientation === 'horizontal' && clip.aspectRatio !== '16:9') return false;
          if (filters.orientation === 'vertical' && clip.aspectRatio !== '9:16') return false;
          if (filters.orientation === 'square' && clip.aspectRatio !== '1:1') return false;
        }

        if (filters.hasAudioOnly && !clip.hasAudio) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sort === 'trending') return b.loopsCount - a.loopsCount;
        if (filters.sort === 'latest') return b.id.localeCompare(a.id);
        if (filters.sort === 'most_viewed') return b.views - a.views;
        if (filters.sort === 'top_liked') return b.likes - a.likes;
        return 0;
      });
  }, [allClips, filters, followedCreators]);

  // Separate vertical 9:16 clips for home feed
  const verticalClips = useMemo(() => {
    const vClips = filteredClips.filter(c => c.aspectRatio === '9:16');
    return vClips.length > 0 ? vClips : filteredClips;
  }, [filteredClips]);

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-300 font-sans ${
      theme === 'dark' 
        ? 'bg-zinc-950 text-zinc-100 selection:bg-red-600 selection:text-white' 
        : 'bg-zinc-50 text-zinc-900 selection:bg-red-600 selection:text-white'
    }`}>
      {/* Top Main RedGIFs Navbar */}
      <Navbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        userProfile={activeUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        userClipsCount={userClips.length}
        followedCount={followedCreators.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        branding={siteBranding}
        onOpenLive={() => setIsLiveModalOpen(true)}
        onOpenTokenStore={() => setIsTokenStoreOpen(true)}
        onOpenSideDrawer={() => setIsSideDrawerOpen(true)}
        onLogout={handleLogout}
      />

      {/* Top Starry / Crimson Promo Banner (Matches RedGIFs) */}
      <PromoBanner
        onOpenLive={() => setIsLiveModalOpen(true)}
        onOpenTokenStore={() => setIsTokenStoreOpen(true)}
      />

      {/* Three-Column Desktop Layout (Left Sidebar, Main Content, Right Sidebar) */}
      <div className="w-full max-w-full flex justify-between min-h-[calc(100vh-8rem)]">
        {/* Left Permanent Desktop Sidebar */}
        <DesktopSidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenTokenStore={() => setIsTokenStoreOpen(true)}
          onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
          onOpenLive={() => setIsLiveModalOpen(true)}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          activeUser={activeUser}
          followedCount={followedCreators.length}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          branding={siteBranding}
        />

        {/* Center Main Stage Content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-8">
          {/* TAB 1: 9:16 VERTICAL REEL PLAYER */}
          {activeTab === 'home_916' && (
            <div className="flex justify-center items-center py-2 px-1">
              <VerticalVideoFeed
                clips={verticalClips}
                activeUser={activeUser}
                followedCreators={followedCreators}
                unlockedClipIds={unlockedClipIds}
                onToggleFollow={handleToggleFollow}
                onLikeToggle={handleLikeToggle}
                likedClipIds={likedClipIds}
                onUnlockPaywall={handleUnlockPaywall}
                onOpenTokenStore={() => setIsTokenStoreOpen(true)}
                onOpenShare={(clip) => setShareModalClip(clip)}
                onOpenCreatorProfile={(username) => setCreatorProfileUsername(username)}
                onOpenSideDrawer={() => setIsSideDrawerOpen(true)}
                onOpenSearch={() => setActiveTab('explore_grid')}
                onOpenNichesModal={() => setActiveTab('niches')}
              />
            </div>
          )}

          {/* TAB 2: MAIN HOMEPAGE / EXPLORE GRID VIEW (Matches RedGIFs) */}
          {activeTab === 'explore_grid' && (
            <VideoFeed
              clips={filteredClips}
              filters={filters}
              onFilterChange={handleFilterChange}
              likedClipIds={likedClipIds}
              savedClipIds={savedClipIds}
              followedCreators={followedCreators}
              activeUser={activeUser}
              onLikeToggle={handleLikeToggle}
              onSaveToggle={handleSaveToggle}
              onToggleFollowCreator={handleToggleFollow}
              onSelectClip={handleSelectClip}
              onShareClip={(clip, e) => {
                if (e) e.stopPropagation();
                setShareModalClip(clip);
              }}
              onOpenCreatorProfile={(username) => setCreatorProfileUsername(username)}
              onOpenLive={() => setIsLiveModalOpen(true)}
            />
          )}

          {/* TAB 3: DYNAMIC NICHES / CATEGORIES BROWSER */}
          {activeTab === 'niches' && (
            <NichesView
              clips={allClips}
              onSelectCategory={(category) => {
                handleFilterChange({ category, tag: '', searchQuery: '', feedMode: 'all' });
                setActiveTab('explore_grid');
              }}
              onSelectTag={(tag) => {
                handleFilterChange({ tag, category: 'All', searchQuery: '', feedMode: 'all' });
                setActiveTab('explore_grid');
              }}
              onSelectClip={handleSelectClip}
              onOpenSteam={() => setActiveTab('home_916')}
            />
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto px-4 py-6">
              <UserProfile
                isOpen={true}
                onClose={() => setActiveTab('explore_grid')}
                userProfile={activeUser}
                onSaveProfile={(updated) => handleAccountUpdate({ ...activeUser, ...updated })}
                userClips={userClips}
                likedClipIds={likedClipIds}
                savedClipIds={savedClipIds}
                followedCreators={followedCreators}
                onToggleFollow={handleToggleFollow}
                allClips={allClips}
                onSelectClip={handleSelectClip}
                onOpenCreatorProfile={(username) => setCreatorProfileUsername(username)}
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onLogout={handleLogout}
              />
            </div>
          )}

          {/* TAB 5: ADMIN PANEL */}
          {activeTab === 'admin' && (
            <div className="max-w-5xl mx-auto px-4 py-6">
              <AdminPanelModal
                isOpen={true}
                onClose={() => setActiveTab('explore_grid')}
                clips={allClips}
                onUpdateClips={(updated) => setAllClips(updated)}
                activeUser={activeUser}
                onAccountUpdate={handleAccountUpdate}
                branding={siteBranding}
                onBrandingUpdate={setSiteBranding}
              />
            </div>
          )}
        </main>

        {/* Right Desktop Sidebar (Featured OnlyFans / VIP Creators, Niches, Wallet) */}
        {activeTab !== 'home_916' && (
          <RightSidebar
            clips={allClips}
            followedCreators={followedCreators}
            onToggleFollow={handleToggleFollow}
            onOpenCreatorProfile={(username) => setCreatorProfileUsername(username)}
            onOpenTokenStore={() => setIsTokenStoreOpen(true)}
            onSelectTag={(tag) => handleFilterChange({ tag })}
            onOpenNiches={() => setActiveTab('niches')}
            activeUser={activeUser}
          />
        )}
      </div>

      {/* Floating Bottom Navigation Bar for Mobile */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenUpload={() => setIsUploadOpen(true)}
        activeUser={activeUser}
      />

      {/* Live Stream VIP Modal */}
      <LiveStreamModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        activeUser={activeUser}
        onOpenTokenStore={() => setIsTokenStoreOpen(true)}
      />

      {/* Side Drawer Menu */}
      <SideDrawer
        isOpen={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        activeUser={activeUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenTokenStore={() => setIsTokenStoreOpen(true)}
        onOpenWithdrawal={() => setIsWithdrawalOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onTabChange={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Token Store & Wallet Purchase Modal */}
      <TokenStoreModal
        isOpen={isTokenStoreOpen}
        onClose={() => {
          setIsTokenStoreOpen(false);
          setPaywallTargetClip(null);
        }}
        activeUser={activeUser}
        onAccountUpdate={handleAccountUpdate}
        targetClipToUnlock={paywallTargetClip ? { id: paywallTargetClip.id, title: paywallTargetClip.title, priceTokens: paywallTargetClip.priceTokens || 50 } : null}
        onUnlockSuccess={() => {
          if (paywallTargetClip) {
            unlockPaywallClip(paywallTargetClip.id, paywallTargetClip.priceTokens || 50);
            setUnlockedClipIds(getUnlockedClipIds());
          }
        }}
      />

      {/* Creator Earnings Cashout / Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
        activeUser={activeUser}
        onAccountUpdate={handleAccountUpdate}
      />

      {/* Master Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        clips={allClips}
        onUpdateClips={(updated) => {
          setAllClips(updated);
          saveStoredClips(updated);
        }}
        activeUser={activeUser}
        onAccountUpdate={handleAccountUpdate}
        branding={siteBranding}
        onBrandingUpdate={setSiteBranding}
      />

      {/* User Profile Modal when opened via Navbar / Drawer */}
      {isProfileOpen && (
        <UserProfile
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userProfile={activeUser}
          onSaveProfile={(updated) => handleAccountUpdate({ ...activeUser, ...updated })}
          userClips={userClips}
          likedClipIds={likedClipIds}
          savedClipIds={savedClipIds}
          followedCreators={followedCreators}
          onToggleFollow={handleToggleFollow}
          allClips={allClips}
          onSelectClip={handleSelectClip}
          onOpenCreatorProfile={(username) => setCreatorProfileUsername(username)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Admin Login Modal (/admin) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccessLogin={() => {
          setIsAdminPanelOpen(true);
        }}
        activeUser={activeUser}
        onAccountUpdate={handleAccountUpdate}
      />

      {/* User Registration & Auth Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        activeUser={activeUser}
        onAccountUpdate={handleAccountUpdate}
      />

      {/* KYC Photo ID Verification Modal */}
      <KycModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        activeUser={activeUser}
        onAccountUpdate={handleAccountUpdate}
      />

      {/* Theatre Player Modal */}
      <VideoModal
        clip={activeModalClip}
        allClips={allClips}
        isLiked={activeModalClip ? (likedClipIds || []).includes(activeModalClip.id) : false}
        isSaved={activeModalClip ? (savedClipIds || []).includes(activeModalClip.id) : false}
        isFollowingCreator={activeModalClip?.creator?.username ? (followedCreators || []).includes(activeModalClip.creator.username.toLowerCase()) : false}
        activeUser={activeUser}
        onClose={handleCloseModal}
        onLikeToggle={handleLikeToggle}
        onSaveToggle={handleSaveToggle}
        onToggleFollowCreator={(username) => handleToggleFollow(username)}
        onOpenShare={(clip) => setShareModalClip(clip)}
        onSelectClip={handleSelectClip}
        onOpenCreatorProfile={(username) => setCreatorProfileUsername(username)}
        onSelectTag={(tag) => handleFilterChange({ tag })}
      />

      {/* Share & Embed Modal */}
      <ShareModal
        clip={shareModalClip}
        onClose={() => setShareModalClip(null)}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        activeUser={activeUser}
        onOpenKycModal={() => setIsKycModalOpen(true)}
      />

      {/* External Creator Public Profile Modal */}
      <CreatorProfileModal
        username={creatorProfileUsername}
        allClips={allClips}
        followedCreators={followedCreators}
        isFollowing={creatorProfileUsername ? (followedCreators || []).includes(creatorProfileUsername.toLowerCase()) : false}
        onToggleFollow={(username) => handleToggleFollow(username)}
        onClose={() => setCreatorProfileUsername(null)}
        onSelectClip={(clip) => {
          setCreatorProfileUsername(null);
          handleSelectClip(clip);
        }}
        likedClipIds={likedClipIds}
        savedClipIds={savedClipIds}
        onLikeToggle={handleLikeToggle}
        onSaveToggle={handleSaveToggle}
        siteBranding={siteBranding}
      />
    </div>
  );
}
