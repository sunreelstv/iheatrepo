import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Heart, Star, Lock, Unlock, 
  Share2, Coins, User, CheckCircle, Eye, MessageSquare, Sparkles, Send, Download, Trash2
} from 'lucide-react';
import { CreatorImage, UserAccount, SiteBranding } from '../types';
import { 
  getStoredUserAccount, unlockCreatorImage, toggleLikeCreatorImage, 
  rateCreatorGallery, getUnlockedImageIds, getStoredCreatorImages, recordGalleryView,
  canUserDeleteContent, deleteStoredCreatorImage
} from '../utils/storage';

interface GalleryViewerModalProps {
  gallery: CreatorImage | null;
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserAccount;
  onOpenTokenStore: () => void;
  onOpenCreatorProfile?: (username: string) => void;
  onOpenAuthModal?: () => void;
  branding?: SiteBranding;
}

export const GalleryViewerModal: React.FC<GalleryViewerModalProps> = ({
  gallery,
  isOpen,
  onClose,
  activeUser,
  onOpenTokenStore,
  onOpenCreatorProfile,
  onOpenAuthModal,
  branding,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentGallery, setCurrentGallery] = useState<CreatorImage | null>(gallery);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [unlockFeedback, setUnlockFeedback] = useState<{ msg: string; success: boolean } | null>(null);
  const [ratingFeedback, setRatingFeedback] = useState<string>('');
  
  // Quick comments
  const [comments, setComments] = useState<Array<{ id: string; user: string; avatar: string; text: string; time: string }>>([
    { id: '1', user: 'Marcus_VIP', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', text: 'Stunning Caribbean photography! Full 4K quality is incredible.', time: '2 hours ago' },
    { id: '2', user: 'IslandLover99', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', text: '5 stars well deserved ⭐⭐⭐⭐⭐', time: '1 hour ago' }
  ]);
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    if (gallery) {
      setCurrentGallery(gallery);
      setCurrentIdx(0);
      setLikesCount(gallery.likes || 1);
      
      const unlockedIds = getUnlockedImageIds();
      const unlocked = !gallery.isPaywalled || 
        unlockedIds.includes(gallery.id) || 
        (activeUser.isLoggedIn && (activeUser.role === 'admin' || activeUser.username.toLowerCase() === gallery.creatorUsername.toLowerCase()));
      setIsUnlocked(unlocked);

      // User's rating
      if (gallery.userRatings && activeUser.id && gallery.userRatings[activeUser.id]) {
        setUserRating(gallery.userRatings[activeUser.id]);
      } else {
        setUserRating(0);
      }

      recordGalleryView(gallery.id);
    }
  }, [gallery, activeUser]);

  // Keyboard navigation for carousel
  useEffect(() => {
    if (!isOpen || !currentGallery) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      const images = currentGallery.images && currentGallery.images.length > 0 ? currentGallery.images : [currentGallery.imageUrl];
      if (images.length <= 1) return;

      if (e.key === 'ArrowRight') {
        setCurrentIdx((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentGallery, onClose]);

  if (!isOpen || !currentGallery) return null;

  const images = currentGallery.images && currentGallery.images.length > 0 
    ? currentGallery.images 
    : [currentGallery.imageUrl];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (images.length > 1) {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (images.length > 1) {
      setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleUnlock = () => {
    if (!activeUser.isLoggedIn || activeUser.id === 'guest') {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    const res = unlockCreatorImage(currentGallery.id);
    if (res.success) {
      setIsUnlocked(true);
      setUnlockFeedback({ msg: '🎉 Gallery unlocked successfully!', success: true });
      setTimeout(() => setUnlockFeedback(null), 4000);
    } else {
      setUnlockFeedback({ msg: res.error || 'Failed to unlock gallery.', success: false });
      if (res.error?.includes('Insufficient tokens')) {
        setTimeout(() => {
          onOpenTokenStore();
        }, 1200);
      }
    }
  };

  const handleRate = (score: number) => {
    if (!activeUser.isLoggedIn || activeUser.id === 'guest') {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    const res = rateCreatorGallery(currentGallery.id, score);
    if (res.success) {
      setUserRating(score);
      setCurrentGallery(prev => prev ? { ...prev, rating: res.newRating, ratingCount: res.newRatingCount } : null);
      setRatingFeedback(`Rated ${score} ★! Thanks for rating.`);
      setTimeout(() => setRatingFeedback(''), 3000);
    } else {
      setRatingFeedback(res.error || 'Could not rate gallery.');
    }
  };

  const handleLike = () => {
    toggleLikeCreatorImage(currentGallery.id);
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const newComm = {
      id: `comm_${Date.now()}`,
      user: activeUser.displayName || activeUser.username || 'IslandFan',
      avatar: activeUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      text: commentInput.trim(),
      time: 'Just now'
    };
    setComments([newComm, ...comments]);
    setCommentInput('');
  };

  const currentPhotoUrl = images[currentIdx] || currentGallery.imageUrl;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl h-[92vh] flex flex-col lg:flex-row bg-zinc-950 border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        id="gallery-viewer-modal-container"
      >
        {/* Top Right Action Bar (Delete & Close) */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {canUserDeleteContent(currentGallery?.creatorUsername, activeUser) && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${currentGallery?.title}"? This action cannot be undone.`)) {
                  deleteStoredCreatorImage(currentGallery.id);
                  onClose();
                }
              }}
              className="p-2 px-3 rounded-full bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 transition backdrop-blur border border-red-400/50 shadow-lg cursor-pointer"
              title="Delete Photo Gallery"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Gallery</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/70 hover:bg-black text-white hover:text-orange-400 transition backdrop-blur border border-white/10"
            id="close-gallery-viewer-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LEFT / CENTER: Carousel Stage */}
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden select-none min-h-[50vh] lg:min-h-full">
          {/* Main Image Display */}
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img 
              src={currentPhotoUrl} 
              alt={currentGallery.title}
              className={`max-h-[70vh] lg:max-h-[82vh] w-auto max-w-full object-contain transition-all duration-300 ${
                !isUnlocked ? 'filter blur-2xl scale-105 pointer-events-none' : ''
              }`}
            />

            {/* Paywall Overlay */}
            {!isUnlocked && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-600/30 mb-4 animate-bounce">
                  <Lock className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
                  Exclusive VIP Photo Gallery
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white max-w-md">
                  {currentGallery.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-sm">
                  {currentGallery.description || 'Unlock full unrestricted 4K access to this exclusive multi-photo Caribbean gallery set.'}
                </p>

                <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleUnlock}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition"
                    id="unlock-gallery-modal-btn"
                  >
                    <Unlock className="w-4 h-4" />
                    Unlock for {currentGallery.priceTokens || 30} Tokens
                  </button>

                  <button
                    onClick={onOpenTokenStore}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
                  >
                    <Coins className="w-4 h-4" />
                    Balance: {activeUser.tokensBalance} 🪙 (Get More)
                  </button>
                </div>

                {unlockFeedback && (
                  <div className={`mt-3 text-xs font-bold ${unlockFeedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {unlockFeedback.msg}
                  </div>
                )}
              </div>
            )}

            {/* Carousel Navigation Arrows */}
            {isUnlocked && images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white hover:text-orange-400 backdrop-blur transition border border-white/10 z-20"
                  id="gallery-prev-btn"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white hover:text-orange-400 backdrop-blur transition border border-white/10 z-20"
                  id="gallery-next-btn"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image Index Pill */}
            {images.length > 1 && isUnlocked && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur text-xs font-bold text-amber-400 border border-amber-500/30 z-20">
                📸 {currentIdx + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {images.length > 1 && isUnlocked && (
            <div className="w-full bg-zinc-950/80 backdrop-blur border-t border-zinc-800/80 p-2 flex items-center justify-center gap-2 overflow-x-auto custom-scrollbar z-20">
              {images.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                    currentIdx === i 
                      ? 'border-orange-500 scale-105 shadow-md shadow-orange-500/30' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumb ${i+1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Gallery Details, Rating, Creator Card & Comments */}
        <div className="w-full lg:w-80 xl:w-96 bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col justify-between overflow-y-auto custom-scrollbar p-5">
          <div className="space-y-4">
            {/* Creator Profile Header */}
            <div 
              onClick={() => {
                if (onOpenCreatorProfile) onOpenCreatorProfile(currentGallery.creatorUsername);
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-orange-500/40 cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={currentGallery.creatorAvatar} 
                  alt={currentGallery.creatorName} 
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-500/50" 
                />
                <div>
                  <div className="flex items-center gap-1 text-sm font-bold text-white">
                    <span>{currentGallery.creatorName}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-orange-400 fill-orange-400/20" />
                  </div>
                  <span className="text-xs text-orange-400 font-mono">@{currentGallery.creatorUsername}</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 font-semibold">
                Creator
              </span>
            </div>

            {/* Gallery Info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {currentGallery.isPaywalled ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase border border-amber-500/40">
                    VIP Paywall ({currentGallery.priceTokens} 🪙)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/40">
                    Free Gallery
                  </span>
                )}
                {currentGallery.category && (
                  <span className="text-xs text-zinc-400 font-medium">
                    • {currentGallery.category}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-zinc-100 leading-snug">
                {currentGallery.title}
              </h2>
              {currentGallery.description && (
                <p className="mt-1 text-xs text-zinc-400 line-clamp-3">
                  {currentGallery.description}
                </p>
              )}

              {/* Tags */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {currentGallery.tags.map((t, idx) => (
                  <span key={idx} className="text-[10px] font-medium text-orange-400/90 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Rating & Like Box */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{currentGallery.rating || 5.0}</span>
                    <span className="text-xs text-zinc-500 font-normal">({currentGallery.ratingCount || 1} ratings)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Rate this photo gallery:</span>
                </div>

                {/* Like Button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isLiked 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                      : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{likesCount}</span>
                </button>
              </div>

              {/* 5-Star Interactive Rating Widget */}
              <div className="flex items-center justify-center gap-2 py-1 bg-zinc-900/60 rounded-lg border border-zinc-800/60">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = hoverRating ? hoverRating >= star : userRating >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className="p-1 text-zinc-600 hover:scale-125 transition transform"
                      title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star className={`w-5 h-5 ${active ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                    </button>
                  );
                })}
              </div>

              {ratingFeedback && (
                <p className="text-[11px] text-emerald-400 text-center font-medium animate-fadeIn">
                  {ratingFeedback}
                </p>
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                  Fan Comments ({comments.length})
                </span>
                <span className="text-[10px] text-zinc-500">Live</span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <img src={comm.avatar} alt={comm.user} className="w-4 h-4 rounded-full object-cover" />
                        <span className="font-semibold text-zinc-200 text-[11px]">{comm.user}</span>
                      </div>
                      <span className="text-[9px] text-zinc-500">{comm.time}</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">{comm.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="mt-4 pt-3 border-t border-zinc-800 flex gap-2">
            <input 
              type="text"
              placeholder="Leave a comment on this set..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition"
              title="Post Comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
