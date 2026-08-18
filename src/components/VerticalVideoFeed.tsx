import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, Search, Heart, Volume2, VolumeX, Share2, Sparkles, 
  UserPlus, UserCheck, Lock, Unlock, Coins, ChevronUp, ChevronDown, 
  MoreVertical, Flame, Play, Pause, CreditCard, ShieldCheck, CheckCircle2,
  Clock, Film, Loader2, Trash2
} from 'lucide-react';
import { VideoClip, UserAccount } from '../types';
import { MOCK_NICHES, DEFAULT_FALLBACK_VIDEO } from '../data/mockClips';
import { getVideoMimeType } from './VideoModal';
import { resolveVideoUrl } from '../utils/indexedDb';
import { canUserDeleteContent, deleteStoredClip } from '../utils/storage';

interface VerticalVideoFeedProps {
  clips: VideoClip[];
  activeUser: UserAccount;
  followedCreators: string[];
  unlockedClipIds: string[];
  onToggleFollow: (username: string, e?: React.MouseEvent) => void;
  onLikeToggle: (id: string, e?: React.MouseEvent) => void;
  likedClipIds: string[];
  onUnlockPaywall: (clip: VideoClip) => void;
  onOpenTokenStore: () => void;
  onOpenShare: (clip: VideoClip) => void;
  onOpenCreatorProfile: (username: string) => void;
  onOpenSideDrawer: () => void;
  onOpenSearch: () => void;
  onOpenNichesModal: () => void;
}

export const VerticalVideoFeed: React.FC<VerticalVideoFeedProps> = ({
  clips,
  activeUser,
  followedCreators,
  unlockedClipIds,
  onToggleFollow,
  onLikeToggle,
  likedClipIds,
  onUnlockPaywall,
  onOpenTokenStore,
  onOpenShare,
  onOpenCreatorProfile,
  onOpenSideDrawer,
  onOpenSearch,
  onOpenNichesModal,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(16);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentClip = clips[currentIndex] || clips[0];
  const [feedVideoUrl, setFeedVideoUrl] = useState<string>(
    currentClip?.videoUrl && currentClip.videoUrl.trim() ? currentClip.videoUrl : ''
  );
  const [isFeedVideoError, setIsFeedVideoError] = useState(false);

  const isFollowing = currentClip ? (followedCreators || []).includes(currentClip.creator.username.toLowerCase()) : false;
  const isLiked = currentClip ? (likedClipIds || []).includes(currentClip.id) : false;
  const isUnlocked = currentClip 
    ? (!currentClip.isPaywalled || (unlockedClipIds || []).includes(currentClip.id) || currentClip.creator.username.toLowerCase() === (activeUser?.username || '').toLowerCase()) 
    : true;

  // Sync video play/pause & reset state when current clip changes
  useEffect(() => {
    let isMounted = true;
    const targetUrl = currentClip?.videoUrl && currentClip.videoUrl.trim() ? currentClip.videoUrl : '';
    
    if (!targetUrl) {
      setIsFeedVideoError(true);
      setFeedVideoUrl('');
      return;
    }

    if (targetUrl.includes('x.com/') || targetUrl.includes('twitter.com/') || targetUrl.includes('instagram.com/')) {
      setIsFeedVideoError(true);
      setFeedVideoUrl('');
      return;
    }

    resolveVideoUrl(targetUrl).then(resolved => {
      if (isMounted) {
        if (resolved) {
          setFeedVideoUrl(resolved);
          setIsFeedVideoError(false);
        } else {
          setIsFeedVideoError(true);
        }
      }
    }).catch(() => {
      if (isMounted) setIsFeedVideoError(true);
    });

    return () => {
      isMounted = false;
    };
  }, [currentClip?.videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (isPlaying && isUnlocked) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('[VerticalVideoFeed] Autoplay prevented:', err);
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isUnlocked, isPlaying, feedVideoUrl]);

  // Keyboard navigation for arrow keys and spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < clips.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setCurrentIndex(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
          } else {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isPlaying, clips.length]);

  // Touch Swipe & Wheel Scroll gesture handling
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 35; // minimum swipe px

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndY.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null || touchEndY.current === null) return;
    const distance = touchStartY.current - touchEndY.current;
    
    // Swiped Up (distance positive) -> Next clip
    if (distance > minSwipeDistance) {
      handleNextClip();
    } 
    // Swiped Down (distance negative) -> Previous clip
    else if (distance < -minSwipeDistance) {
      handlePrevClip();
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Wheel scroll throttling for desktop trackpad / mouse
  const lastWheelTime = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 350) return;
    if (Math.abs(e.deltaY) > 20) {
      lastWheelTime.current = now;
      if (e.deltaY > 0) {
        handleNextClip();
      } else {
        handlePrevClip();
      }
    }
  };

  const handleNextClip = () => {
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // loop back to first
    }
  };

  const handlePrevClip = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentClip) return null;

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="relative w-full max-w-md mx-auto h-[calc(100vh-64px)] sm:h-[820px] bg-black sm:rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col justify-between select-none touch-pan-y"
    >
      {/* Main 9:16 Video Player Container */}
      <div className="relative w-full h-full bg-zinc-950 overflow-hidden flex items-center justify-center">
        {/* Background Video or Compressing State */}
        {isFeedVideoError ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950 overflow-hidden select-none">
            <img
              src={currentClip.posterUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'}
              alt={currentClip.title}
              className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
            <div className="relative z-20 flex flex-col items-center justify-center p-6 max-w-xs text-center bg-zinc-950/90 border border-orange-500/40 rounded-3xl shadow-2xl backdrop-blur-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-2">
                  <Film className="w-4 h-4 text-orange-400" />
                  Video Compressing
                </h4>
                <p className="text-xs text-orange-200/90 mt-1 font-medium leading-relaxed">
                  This video stream is processing & compressing into HD 60FPS. Please come back soon!
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[10px] font-mono text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Processing Stream...</span>
              </div>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            key={feedVideoUrl}
            poster={currentClip.posterUrl}
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || currentClip.duration || 16)}
            onError={() => {
              console.warn('[VerticalVideoFeed] Video error for URL:', feedVideoUrl);
              setIsFeedVideoError(true);
            }}
            className={`w-full h-full object-cover cursor-pointer transition-all duration-300 ${!isUnlocked ? 'filter blur-lg scale-105 opacity-40' : ''}`}
          >
            <source src={feedVideoUrl} type={getVideoMimeType(feedVideoUrl)} />
            <source src={feedVideoUrl} type="video/mp4" />
          </video>
        )}

        {/* Play / Pause Center Overlay Flash */}
        {!isPlaying && isUnlocked && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl animate-pulse">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Top Overlay Controls Bar with REDGIFS Brand Logo */}
        <div className="absolute top-0 left-0 right-0 p-3 pt-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between z-20">
          {/* Top Left Menu / Drawer Trigger & REDGIFS Logo */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenSideDrawer}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition shadow-md"
              id="open-side-drawer-btn"
              title="Open Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Prominent IslandHeat Logo */}
            <div 
              onClick={() => onOpenSearch()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 backdrop-blur-md cursor-pointer transition"
              id="home-islandheat-logo"
            >
              <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 p-[1px] flex items-center justify-center shadow">
                <span className="font-black text-[9px] text-black">IH</span>
              </div>
              <span className="font-black text-xs tracking-tight text-white">
                Island<span className="text-orange-500">Heat</span>
              </span>
            </div>
          </div>

          {/* Right Header Actions: Token Balance Pill & Search */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenTokenStore}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 hover:bg-orange-500/30 backdrop-blur-md border border-orange-500/40 text-orange-300 font-bold text-xs shadow-lg transition"
            >
              <Coins className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>{activeUser.tokensBalance}</span>
              <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.2 rounded-full ml-0.5">BUY</span>
            </button>

            <button 
              onClick={onOpenSearch}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition"
              id="top-search-btn"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating "Swipe Up" Motion Guidance Pill */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-80 animate-bounce">
          <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] text-zinc-300 font-semibold flex items-center gap-1 shadow-lg">
            <ChevronUp className="w-3 h-3 text-orange-400" />
            <span>Swipe up for next video</span>
          </div>
        </div>

        {/* Navigation Quick Up / Down Arrows (Side Floating Controls) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20 opacity-80 hover:opacity-100 transition">
          <button
            onClick={handlePrevClip}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-black/50 hover:bg-orange-500 backdrop-blur-md text-white disabled:opacity-30 disabled:hover:bg-black/50 transition border border-white/10 shadow-md"
            title="Previous Video"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextClip}
            className="p-2 rounded-full bg-black/50 hover:bg-orange-500 backdrop-blur-md text-white transition border border-white/10 shadow-md"
            title="Next Video"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Right Action Side Stack (Matching Screenshot) */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-20">
          {/* Creator Live Avatar with Badge */}
          <div 
            onClick={() => onOpenCreatorProfile(currentClip.creator.username)}
            className="relative cursor-pointer group"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-orange-500 to-emerald-400 p-[2px] animate-pulse">
              <img 
                src={currentClip.creator.avatar} 
                alt={currentClip.creator.name} 
                className="w-12 h-12 rounded-full object-cover ring-2 ring-black"
              />
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-red-600 text-[9px] font-black tracking-wider text-white uppercase rounded-full border border-black shadow">
              LIVE
            </span>
          </div>

          {/* Loop / View Count */}
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition cursor-pointer">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-[11px] font-bold text-white mt-1 shadow-sm">
              {(currentClip.loopsCount / 1000).toFixed(0)}K
            </span>
          </div>

          {/* Like Heart Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => onLikeToggle(currentClip.id, e)}
              className={`p-3 rounded-full backdrop-blur-md border transition ${
                isLiked 
                  ? 'bg-red-500/80 text-white border-red-400 shadow-lg shadow-red-500/30' 
                  : 'bg-black/40 text-white border-white/10 hover:bg-black/60'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-white' : ''}`} />
            </button>
            <span className="text-[11px] font-bold text-white mt-1">
              {currentClip.likes + (isLiked ? 1 : 0)}
            </span>
          </div>

          {/* Mute / Unmute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition"
          >
            {isMuted ? <VolumeX className="w-6 h-6 text-red-400" /> : <Volume2 className="w-6 h-6 text-emerald-400" />}
          </button>

          {/* Paywall Unlock / Token Tip Button */}
          {currentClip.isPaywalled && !isUnlocked ? (
            <button
              onClick={() => onUnlockPaywall(currentClip)}
              className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/40 border border-orange-300 animate-bounce cursor-pointer"
              title="Unlock Paywalled Post"
            >
              <Lock className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={onOpenTokenStore}
              className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-amber-400/50 text-amber-300 hover:bg-amber-500 hover:text-black transition cursor-pointer"
              title="Tip Tokens"
            >
              <Coins className="w-6 h-6 fill-amber-300" />
            </button>
          )}

          {/* Share / More Options Button */}
          <button
            onClick={() => onOpenShare(currentClip)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition"
          >
            <MoreVertical className="w-6 h-6" />
          </button>

          {/* Delete Button (If Admin or Content Owner) */}
          {(() => {
            const canDeleteCurrent = canUserDeleteContent(currentClip.creator?.username, activeUser);
            if (!canDeleteCurrent) return null;
            const handleDeleteCurrentClip = () => {
              if (window.confirm(`Are you sure you want to delete "${currentClip.title}"? This action cannot be undone.`)) {
                deleteStoredClip(currentClip.id);
              }
            };

            return (
              <div className="flex flex-col items-center">
                <button
                  onClick={handleDeleteCurrentClip}
                  className="p-3 rounded-full bg-red-600/90 hover:bg-red-600 backdrop-blur-md border border-red-400 text-white transition shadow-lg"
                  title="Delete Video"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
                <span className="text-[10px] font-bold text-red-400 mt-1">Delete</span>
              </div>
            );
          })()}
        </div>

        {/* PAYWALL LOCKED GLASS OVERLAY CARD (If post is paywalled & locked) */}
        {currentClip.isPaywalled && !isUnlocked && (
          <div className="absolute inset-x-4 top-1/4 z-30 p-6 rounded-3xl bg-zinc-950/90 border border-orange-500/40 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg mb-3">
              <Lock className="w-8 h-8" />
            </div>
            
            <h3 className="text-lg font-black text-white tracking-wide">
              Exclusive Paywalled Post
            </h3>
            <p className="text-xs text-zinc-300 mt-1 max-w-xs">
              Unlock {currentClip.creator.name}'s premium high-bitrate vertical loop video.
            </p>

            <div className="my-4 px-4 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span className="text-sm font-black text-amber-300">
                Unlock Price: {currentClip.priceTokens || 50} Tokens
              </span>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => onUnlockPaywall(currentClip)}
                className="w-full py-3 rounded-full font-bold text-xs bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 text-white shadow-xl shadow-orange-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Post Now ({currentClip.priceTokens || 50} Tokens)</span>
              </button>

              <button
                onClick={onOpenTokenStore}
                className="w-full py-2.5 rounded-full font-semibold text-xs bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Buy Tokens with PayPal or Bank Wire</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Overlay Info Section (Matching Screenshot) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2.5 z-20">
          {/* Creator Pill + Verified Badge + Follow Button */}
          {(() => {
            const isOwnClip = Boolean(
              (activeUser && activeUser.id !== 'guest' && currentClip?.creator?.username && activeUser.username.toLowerCase() === currentClip.creator.username.toLowerCase()) ||
              (currentClip?.isUserUploaded && activeUser && activeUser.id !== 'guest') ||
              (currentClip?.creator?.username === 'you_creator')
            );

            const displayCreatorUsername = isOwnClip && activeUser && activeUser.id !== 'guest'
              ? activeUser.username
              : currentClip.creator.username;

            const isCreatorVerified = isOwnClip && activeUser && activeUser.id !== 'guest'
              ? Boolean(activeUser.isVerified)
              : Boolean(currentClip.creator.isVerified);

            return (
              <div className="flex items-center gap-2.5">
                <div 
                  onClick={() => onOpenCreatorProfile(displayCreatorUsername)}
                  className="flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="font-bold text-sm text-white hover:text-emerald-400 transition">
                    @{displayCreatorUsername}
                  </span>
                  {isCreatorVerified && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[10px]" title="Verified Creator">
                      ✓
                    </span>
                  )}
                </div>

                {isOwnClip ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
                    You
                  </span>
                ) : (
                  <button
                    onClick={(e) => onToggleFollow(currentClip.creator.username, e)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 border shadow-sm ${
                      isFollowing 
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-red-400 hover:border-red-500' 
                        : 'bg-white text-black border-white hover:bg-emerald-400'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Caption / Description Text */}
          <p className="text-xs text-zinc-200 font-medium line-clamp-2 drop-shadow-md">
            {currentClip.description || currentClip.title}
          </p>

          {/* "5 Niches you might like" Carousel Bar (Exact Match to Screenshot!) */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 mb-1.5">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-orange-400 font-extrabold">5 Niches</span> you might like
              </span>
              <button 
                onClick={onOpenNichesModal}
                className="text-emerald-400 hover:underline text-[10px]"
              >
                See All
              </button>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto custom-scrollbar pb-1">
              {MOCK_NICHES.map((niche) => (
                <button
                  key={niche.id}
                  onClick={onOpenNichesModal}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 hover:bg-orange-500/20 border border-zinc-800 hover:border-orange-500/40 shrink-0 transition"
                >
                  <img src={niche.avatar} alt={niche.title} className="w-4 h-4 rounded-full object-cover" />
                  <span className="text-[10px] text-zinc-200 font-medium whitespace-nowrap">{niche.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Progress Bar & Time Timestamp */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
