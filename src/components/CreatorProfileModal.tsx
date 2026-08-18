import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, UserPlus, UserCheck, Heart, Video, CheckCircle, 
  Search, Menu, Key, Globe, ExternalLink, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Volume2, Lock, Eye, Play, MessageSquare, Image as ImageIcon, MoreHorizontal, Check,
  Coins, Plus, Download, Share2, Trash2
} from 'lucide-react';
import { VideoClip, SiteBranding, CreatorImage, UserAccount } from '../types';
import { 
  getSiteBranding, getStoredCreatorImages, getUnlockedImageIds, 
  unlockCreatorImage, toggleLikeCreatorImage, getStoredUserAccount, 
  saveStoredCreatorImage, canUserDeleteContent, deleteStoredClip, deleteStoredCreatorImage 
} from '../utils/storage';
import { uploadImageToSupabase, saveCreatorImageToSupabase } from '../utils/supabase';

interface CreatorProfileModalProps {
  username: string | null;
  allClips: VideoClip[];
  followedCreators?: string[];
  isFollowing?: boolean;
  onToggleFollow: (username: string) => void;
  onClose: () => void;
  onSelectClip: (clip: VideoClip) => void;
  siteBranding?: SiteBranding;
  likedClipIds?: string[];
  savedClipIds?: string[];
  onLikeToggle?: (clipId: string) => void;
  onSaveToggle?: (clipId: string) => void;
  onOpenTokenStore?: () => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  username,
  allClips = [],
  followedCreators = [],
  isFollowing: propIsFollowing,
  onToggleFollow,
  onClose,
  onSelectClip,
  siteBranding: propBranding,
  likedClipIds = [],
  savedClipIds = [],
  onLikeToggle,
  onSaveToggle,
  onOpenTokenStore,
}) => {
  const branding = propBranding || getSiteBranding();
  const currentUser = getStoredUserAccount();

  const [activeTag, setActiveTag] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'steams' | 'images' | 'vip'>('steams');
  const [isBioExpanded, setIsBioExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);

  // Images state
  const [creatorImages, setCreatorImages] = useState<CreatorImage[]>([]);
  const [unlockedImageIds, setUnlockedImageIds] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<CreatorImage | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [unlockFeedback, setUnlockFeedback] = useState<{ msg: string; success: boolean } | null>(null);

  // Quick image upload state
  const [newImageFiles, setNewImageFiles] = useState<string[]>([]);
  const [newImageFileUrlInput, setNewImageFileUrlInput] = useState('');
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageDesc, setNewImageDesc] = useState('');
  const [newImageTags, setNewImageTags] = useState('IslandHeat, Exclusive, Gallery');
  const [newImageIsPaywalled, setNewImageIsPaywalled] = useState(false);
  const [newImagePrice, setNewImagePrice] = useState(30);

  const isCurrentCreator = currentUser.isLoggedIn && currentUser.username.toLowerCase() === (username || '').toLowerCase();

  const refreshImages = () => {
    if (!username) return;
    const allImgs = getStoredCreatorImages();
    const filtered = allImgs.filter(
      img => img.creatorUsername.toLowerCase() === username.toLowerCase()
    );
    setCreatorImages(filtered);
    setUnlockedImageIds(getUnlockedImageIds());
  };

  useEffect(() => {
    refreshImages();
  }, [username]);

  if (!username) return null;

  // Find creator clips
  const creatorClips = (allClips || []).filter(
    c => c?.creator?.username && c.creator.username.toLowerCase() === username.toLowerCase()
  );

  // Derive creator info from clips or default
  const firstClip = creatorClips[0];
  const displayName = firstClip ? firstClip.creator.name : (currentUser.username.toLowerCase() === username.toLowerCase() ? currentUser.displayName : username);
  const avatar = firstClip ? firstClip.creator.avatar : (currentUser.username.toLowerCase() === username.toLowerCase() ? currentUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
  const isVerified = firstClip ? firstClip.creator.isVerified !== false : true;

  const totalSteamViews = creatorClips.reduce((acc, c) => acc + (c.loopsCount || c.views || 0), 0) || 6700000;
  const isFollowing = typeof propIsFollowing === 'boolean' 
    ? propIsFollowing 
    : (followedCreators || []).map(f => (f || '').toLowerCase()).includes(username.toLowerCase());
  const baseFollowers = 8200;
  const followersCount = baseFollowers + (isFollowing ? 1 : 0);
  const postsCount = creatorClips.length + creatorImages.length;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Collect available tags from creator clips and images
  const defaultTags: string[] = ['Amateur', 'Ass', 'Babe', 'Big Ass', 'Big Tits', 'Boobs', 'Cute', 'VIP', '4K', 'IslandHeat'];
  const extractedTags: string[] = Array.from(new Set([
    ...creatorClips.flatMap(c => c.tags || []),
    ...creatorImages.flatMap(img => img.tags || [])
  ]));
  const allAvailableTags: string[] = Array.from(new Set([...defaultTags, ...extractedTags]));

  // Filter clips
  const filteredClips = creatorClips.filter(clip => {
    if (activeTag !== 'All' && !clip.tags.some(t => t.toLowerCase() === activeTag.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = clip.title.toLowerCase().includes(q);
      const matchTag = clip.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchTag) return false;
    }
    if (activeTab === 'vip' && !clip.isPaywalled) return false;
    return true;
  });

  // Filter images
  const filteredImages = creatorImages.filter(img => {
    if (activeTag !== 'All' && !img.tags.some(t => t.toLowerCase() === activeTag.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = img.title.toLowerCase().includes(q);
      const matchDesc = img.description.toLowerCase().includes(q);
      const matchTag = img.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }
    if (activeTab === 'vip' && !img.isPaywalled) return false;
    return true;
  });

  const handleUnlockImage = (image: CreatorImage) => {
    setUnlockFeedback(null);
    const res = unlockCreatorImage(image.id);
    if (res.success) {
      setUnlockFeedback({ msg: '🎉 Image unlocked successfully!', success: true });
      setUnlockedImageIds(getUnlockedImageIds());
      setTimeout(() => setUnlockFeedback(null), 4000);
    } else {
      setUnlockFeedback({ msg: res.error || 'Failed to unlock image', success: false });
      setTimeout(() => setUnlockFeedback(null), 5000);
    }
  };

  const handleLikeImage = (imageId: string) => {
    toggleLikeCreatorImage(imageId);
    refreshImages();
    if (selectedImage && selectedImage.id === imageId) {
      setSelectedImage(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
    }
  };

  const handleCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newImageFiles.length === 0) {
      setUnlockFeedback({ msg: 'Please provide at least one image photo.', success: false });
      return;
    }

    const uploadedUrls: string[] = [];
    for (let i = 0; i < newImageFiles.length; i++) {
      const fileStr = newImageFiles[i];
      if (fileStr.startsWith('data:')) {
        try {
          const uploadRes = await uploadImageToSupabase(fileStr, `creator_${username}_${Date.now()}_${i}.jpg`);
          if (uploadRes.success && uploadRes.url) {
            uploadedUrls.push(uploadRes.url);
          } else {
            uploadedUrls.push(fileStr);
          }
        } catch (e) {
          uploadedUrls.push(fileStr);
        }
      } else {
        uploadedUrls.push(fileStr);
      }
    }

    const tagsArr = newImageTags
      .split(/[,# ]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const savedImage = saveStoredCreatorImage({
      creatorUsername: username,
      creatorName: displayName,
      creatorAvatar: avatar,
      imageUrl: uploadedUrls[0],
      images: uploadedUrls,
      title: newImageTitle.trim() || 'Exclusive Photo Set',
      description: newImageDesc.trim() || 'High quality exclusive creator photo set.',
      tags: tagsArr.length > 0 ? tagsArr : ['IslandHeat', 'Exclusive', 'Gallery'],
      isPaywalled: newImageIsPaywalled,
      priceTokens: newImageIsPaywalled ? Number(newImagePrice) || 30 : 0,
    });

    // Also sync to Supabase Database
    saveCreatorImageToSupabase(savedImage).catch(err => console.warn('Supabase DB creator image error:', err));

    setNewImageFiles([]);
    setNewImageTitle('');
    setNewImageDesc('');
    setIsUploadingImage(false);
    refreshImages();
    setActiveTab('images');
  };

  const handleDeleteImage = (imageId: string) => {
    if (confirm('Delete this photo from your profile?')) {
      deleteStoredCreatorImage(imageId);
      refreshImages();
      setSelectedImage(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl h-full md:h-[92vh] md:max-h-[92vh] overflow-y-auto bg-black text-white md:rounded-3xl border border-zinc-800 shadow-2xl flex flex-col custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        id="creator-profile-view"
      >
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between gap-3">
          {/* Site Logo */}
          <div className="flex items-center gap-2">
            {branding.logoType === 'image' && branding.logoImageUrl ? (
              <img 
                src={branding.logoImageUrl} 
                alt={branding.siteName} 
                className="h-8 w-auto object-contain max-w-[100px]" 
              />
            ) : (
              <div 
                className="text-2xl font-black tracking-tighter cursor-pointer flex items-center"
                style={{ color: branding.accentColor || '#f97316' }}
              >
                {branding.logoText || 'IH'}
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${displayName}'s steams and photos...`}
              className="w-full pl-9 pr-8 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Menu / Close Button */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition shadow flex items-center justify-center"
              title="Close Profile"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Unlock Feedback Toast */}
        {unlockFeedback && (
          <div className={`mx-4 mt-3 p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
            unlockFeedback.success 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' 
              : 'bg-red-950/90 text-red-300 border-red-500/50'
          }`}>
            <span>{unlockFeedback.msg}</span>
            {!unlockFeedback.success && onOpenTokenStore && (
              <button 
                onClick={onOpenTokenStore}
                className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-black text-[11px] font-black uppercase tracking-wider ml-2"
              >
                Buy Tokens 🪙
              </button>
            )}
          </div>
        )}

        {/* Profile Details Container */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Top Profile Header: Avatar + Username + Stats */}
          <div className="flex items-start gap-4">
            {/* Round Avatar */}
            <div className="relative shrink-0">
              <img 
                src={avatar} 
                alt={displayName} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-2 ring-orange-500/50 bg-zinc-900 shadow-xl"
              />
            </div>

            {/* Right Side: Username + 3 Stats Columns */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2.5">
                <h1 className="text-lg md:text-xl font-bold text-white truncate">{displayName}</h1>
                {isVerified && (
                  <span className="p-0.5 rounded-full bg-orange-500 text-white shrink-0" title="Verified Creator">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* 3 Stats: Posts, Followers, Steam Views */}
              <div className="grid grid-cols-3 gap-2 text-left">
                <div>
                  <p className="text-base md:text-lg font-bold text-white">{postsCount}</p>
                  <p className="text-xs text-zinc-400 font-medium">Posts</p>
                </div>
                <div>
                  <p className="text-base md:text-lg font-bold text-white">{formatNumber(followersCount)}</p>
                  <p className="text-xs text-zinc-400 font-medium">Followers</p>
                </div>
                <div>
                  <p className="text-base md:text-lg font-bold text-white">{formatNumber(totalSteamViews)}</p>
                  <p className="text-xs text-zinc-400 font-medium">Steam Views</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio text */}
          <div className="text-xs md:text-sm text-zinc-300 leading-relaxed">
            <p>
              Caribbean Steam Creator & VIP Model. Daily tropical steams, high-res photos, and exclusive content.
            </p>
            {isBioExpanded && (
              <p className="mt-2 text-zinc-400 text-xs">
                Official Caribbean 60fps high bitrate steam creator on IslandHeat. Access paywalled VIP photo sets and exclusive behind-the-scenes streams.
              </p>
            )}
            <button 
              onClick={() => setIsBioExpanded(!isBioExpanded)}
              className="mt-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition flex items-center gap-1"
            >
              {isBioExpanded ? 'Less' : 'More'}
            </button>
          </div>

          {/* Large Full-Width Follow/Unfollow Button */}
          <button
            onClick={() => onToggleFollow(username)}
            className={`w-full py-2.5 rounded-full font-bold text-sm transition shadow-md border ${
              isFollowing 
                ? 'bg-transparent text-white border-zinc-600 hover:border-zinc-400' 
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:opacity-95 border-none font-black'
            }`}
            id="follow-creator-action-btn"
          >
            {isFollowing ? 'Unfollow Creator' : 'Follow Creator'}
          </button>

          {/* Row of Circular Social Links */}
          <div className="flex items-center gap-3 pt-1">
            {/* Fan Club */}
            <a 
              href="https://fansly.com" 
              target="_blank" 
              rel="noreferrer"
              className="w-11 h-11 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition"
              title="Fan Club"
            >
              <Heart className="w-5 h-5 fill-current text-rose-500" />
            </a>

            {/* VIP Key */}
            <button 
              onClick={() => setActiveTab('vip')}
              className="w-11 h-11 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-amber-400 hover:text-amber-300 transition"
              title="VIP Steams & Photos"
            >
              <Key className="w-5 h-5" />
            </button>

            {/* Official Website */}
            <a 
              href="https://islandheat.tv" 
              target="_blank" 
              rel="noreferrer"
              className="w-11 h-11 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition"
              title="IslandHeat Official"
            >
              <Globe className="w-5 h-5" />
            </a>

            {/* Upload Photo Button for Creator */}
            {isCurrentCreator && (
              <button
                onClick={() => setIsUploadingImage(!isUploadingImage)}
                className="ml-auto px-3.5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Photo</span>
              </button>
            )}
          </div>

          {/* Quick Photo Upload Form (Only on profile) */}
          {isUploadingImage && isCurrentCreator && (
            <form onSubmit={handleCreateImage} className="p-4 rounded-2xl bg-zinc-900 border border-orange-500/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Upload Exclusive Profile Photo
                </span>
                <button type="button" onClick={() => setIsUploadingImage(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Input / File Picker (Supports Multi-Photos) */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Photo Images or Direct URLs (Supports Multi-Photo Set) *
                </label>
                <div className="flex gap-1.5 mb-1.5">
                  <input 
                    type="text" 
                    placeholder="Paste image URL (https://...)" 
                    value={newImageFileUrlInput}
                    onChange={(e) => setNewImageFileUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageFileUrlInput.trim()) {
                        setNewImageFiles([...newImageFiles, newImageFileUrlInput.trim()]);
                        setNewImageFileUrlInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-bold text-xs rounded-lg border border-zinc-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                    <span>Choose Multiple Local Files</span>
                    <input 
                      type="file" 
                      multiple
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          Array.from(files).forEach((f: File) => {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setNewImageFiles(prev => [...prev, ev.target!.result as string]);
                              }
                            };
                            reader.readAsDataURL(f);
                          });
                        }
                      }}
                    />
                  </label>
                  {newImageFiles.length > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {newImageFiles.length} Photo{newImageFiles.length > 1 ? 's' : ''} Selected
                    </span>
                  )}
                </div>

                {/* Selected Photos Strip */}
                {newImageFiles.length > 0 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 custom-scrollbar">
                    {newImageFiles.map((img, i) => (
                      <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-zinc-700 group">
                        <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewImageFiles(newImageFiles.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-black/60 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Photo Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. VIP Ocean Villa Sunset Portrait" 
                  value={newImageTitle}
                  onChange={(e) => setNewImageTitle(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Description / Caption</label>
                <textarea 
                  rows={2}
                  placeholder="Add details, photoshoot backdrop, or VIP notes (visible on your profile only)..." 
                  value={newImageDesc}
                  onChange={(e) => setNewImageDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Tags (separated by comma)</label>
                <input 
                  type="text" 
                  placeholder="IslandHeat, Glamour, VIP, Caribbean" 
                  value={newImageTags}
                  onChange={(e) => setNewImageTags(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Paywall Toggle */}
              <div className="pt-1 flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${newImageIsPaywalled ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-white">Paywall this Image</p>
                    <p className="text-[10px] text-zinc-400">Viewers must spend tokens to unlock full resolution</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newImageIsPaywalled} 
                    onChange={(e) => setNewImageIsPaywalled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {newImageIsPaywalled && (
                <div className="flex items-center gap-2 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                  <span className="text-xs font-bold text-amber-300">Unlock Price:</span>
                  <input 
                    type="number" 
                    min="5" 
                    max="500" 
                    value={newImagePrice} 
                    onChange={(e) => setNewImagePrice(Math.max(5, Number(e.target.value)))}
                    className="w-20 px-2 py-1 rounded bg-zinc-900 border border-amber-500/50 text-xs text-white text-center font-bold"
                  />
                  <span className="text-xs text-amber-400 font-bold">🪙 Tokens</span>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider transition"
              >
                Publish Photo to Profile
              </button>
            </form>
          )}

          {/* Filter by Tag Section */}
          <div className="pt-2">
            <p className="text-xs text-zinc-400 font-medium mb-2.5">
              Filter {displayName}'s steams and images by tag
            </p>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setActiveTag('All')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                  activeTag === 'All'
                    ? 'bg-zinc-900 border-orange-500 text-orange-400 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                All
              </button>
              {allAvailableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                    activeTag.toLowerCase() === tag.toLowerCase()
                      ? 'bg-zinc-900 border-orange-500 text-orange-400 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Steams vs Images vs VIP Tabs */}
          <div className="flex border-b border-zinc-800 pt-2">
            <button
              onClick={() => setActiveTab('steams')}
              className={`flex-1 py-3 text-center text-xs md:text-sm font-bold tracking-wider uppercase transition relative flex items-center justify-center gap-1.5 ${
                activeTab === 'steams' ? 'text-white font-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Steams ({creatorClips.length})</span>
              {activeTab === 'steams' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-sm" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 py-3 text-center text-xs md:text-sm font-bold tracking-wider uppercase transition relative flex items-center justify-center gap-1.5 ${
                activeTab === 'images' ? 'text-white font-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Images ({creatorImages.length})</span>
              {activeTab === 'images' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-sm" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('vip')}
              className={`flex-1 py-3 text-center text-xs md:text-sm font-bold tracking-wider uppercase transition relative flex items-center justify-center gap-1.5 ${
                activeTab === 'vip' ? 'text-amber-400 font-black' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>VIP Exclusive</span>
              {activeTab === 'vip' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 shadow-sm" />
              )}
            </button>
          </div>

          {/* Tab Content 1: Steams */}
          {activeTab === 'steams' && (
            <div>
              {filteredClips.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950">
                  <Video className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No steams found matching "{activeTag}"</p>
                  <button 
                    onClick={() => { setActiveTag('All'); setSearchQuery(''); }}
                    className="mt-2 text-xs text-orange-400 hover:underline font-bold"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-1.5 pb-6">
                  {filteredClips.map((clip) => {
                    const isHovered = hoveredClipId === clip.id;
                    return (
                      <div
                        key={clip.id}
                        onMouseEnter={() => setHoveredClipId(clip.id)}
                        onMouseLeave={() => setHoveredClipId(null)}
                        onClick={() => {
                          onSelectClip(clip);
                          onClose();
                        }}
                        className="group relative aspect-square bg-zinc-900 cursor-pointer overflow-hidden rounded-sm hover:brightness-110 transition"
                      >
                        {isHovered ? (
                          <video
                            src={clip.videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img 
                            src={clip.posterUrl || clip.creator.avatar} 
                            alt={clip.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}

                        {/* Delete Button (If Admin or Content Owner) */}
                        {canUserDeleteContent(clip.creator?.username, currentUser) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete "${clip.title}"? This action cannot be undone.`)) {
                                deleteStoredClip(clip.id);
                              }
                            }}
                            className="absolute top-1 left-1 z-20 p-1 rounded bg-red-600/90 hover:bg-red-600 text-white backdrop-blur transition shadow"
                            title="Delete Steam"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        {/* Paywalled Badge */}
                        {clip.isPaywalled && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold text-amber-300 flex items-center gap-0.5 border border-amber-500/40">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{clip.priceTokens || 50}🪙</span>
                          </div>
                        )}

                        {/* Duration / Views overlay bottom */}
                        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between text-[9px] text-white/90 font-medium pointer-events-none drop-shadow-md">
                          <span className="bg-black/60 px-1 py-0.5 rounded backdrop-blur-xs">
                            0:{clip.duration < 10 ? `0${clip.duration}` : clip.duration}
                          </span>
                          {clip.hasAudio && (
                            <Volume2 className="w-3 h-3 text-white/80 bg-black/60 p-0.5 rounded" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: Images */}
          {activeTab === 'images' && (
            <div>
              {filteredImages.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950">
                  <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No profile photos uploaded yet.</p>
                  {isCurrentCreator && (
                    <button 
                      onClick={() => setIsUploadingImage(true)}
                      className="mt-3 px-4 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Upload First Photo
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-6">
                  {filteredImages.map((image) => {
                    const isUnlocked = !image.isPaywalled || unlockedImageIds.includes(image.id) || isCurrentCreator;
                    const imageCount = (image.images && image.images.length > 0) ? image.images.length : 1;
                    return (
                      <div
                        key={image.id}
                        onClick={() => { setSelectedImage(image); setSelectedImageIdx(0); }}
                        className="group relative aspect-square bg-zinc-900 cursor-pointer overflow-hidden rounded-xl border border-zinc-800/80 hover:border-orange-500/60 transition shadow-md"
                      >
                        <img 
                          src={image.imageUrl} 
                          alt={image.title}
                          className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                            !isUnlocked ? 'blur-md brightness-75 scale-105' : ''
                          }`}
                          loading="lazy"
                        />

                        {/* Multi-Photo Carousel Badge */}
                        {imageCount > 1 && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[9px] font-black text-amber-300 flex items-center gap-1 border border-amber-500/30">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>{imageCount} Photos</span>
                          </div>
                        )}

                        {/* Paywall Overlay */}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                            <div className="p-2 rounded-full bg-amber-500/90 text-black mb-1 shadow">
                              <Lock className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <span className="text-[10px] font-black text-amber-300">VIP PHOTO</span>
                            <span className="text-[10px] text-zinc-300 font-bold">{image.priceTokens}🪙 to unlock</span>
                          </div>
                        )}

                        {/* Title & Likes on hover or unlocked */}
                        {isUnlocked && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end">
                            <p className="text-[11px] font-bold text-white line-clamp-1">{image.title}</p>
                            <p className="text-[9px] text-zinc-300 line-clamp-1">{image.description}</p>
                          </div>
                        )}

                        {/* Free / Price badge */}
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-md shadow">
                          {image.isPaywalled ? (
                            <span className="text-amber-400 bg-black/80 px-1.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> {image.priceTokens}🪙
                            </span>
                          ) : (
                            <span className="text-emerald-400 bg-black/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                              Free
                            </span>
                          )}
                        </div>

                        {/* Delete Button (If Admin or Content Owner) */}
                        {canUserDeleteContent(image.creatorUsername, currentUser) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete "${image.title}"? This action cannot be undone.`)) {
                                deleteStoredCreatorImage(image.id);
                              }
                            }}
                            className="absolute bottom-1.5 left-1.5 z-20 p-1.5 rounded bg-red-600/90 hover:bg-red-600 text-white backdrop-blur transition shadow"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Content 3: VIP (Combines paywalled steams and paywalled images) */}
          {activeTab === 'vip' && (
            <div className="space-y-4 pb-6">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center gap-3">
                <Key className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-amber-300">Creator VIP Vault</p>
                  <p className="text-zinc-400 text-[11px]">Exclusive paywalled 4K steam clips and high-resolution photo sets.</p>
                </div>
              </div>

              {/* VIP Steams Section */}
              {filteredClips.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-amber-400" /> VIP Steams ({filteredClips.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {filteredClips.map((clip) => (
                      <div
                        key={clip.id}
                        onClick={() => { onSelectClip(clip); onClose(); }}
                        className="group relative aspect-square bg-zinc-900 cursor-pointer overflow-hidden rounded-lg border border-amber-500/40 hover:brightness-110 transition"
                      >
                        <img src={clip.posterUrl || clip.creator.avatar} alt={clip.title} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-300 flex items-center gap-0.5 border border-amber-500/40">
                          <Lock className="w-2.5 h-2.5" /> {clip.priceTokens || 50}🪙
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 text-[9px] text-white font-medium bg-black/60 px-1 py-0.5 rounded truncate">
                          {clip.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIP Images Section */}
              {filteredImages.filter(img => img.isPaywalled).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" /> VIP Photo Sets ({filteredImages.filter(img => img.isPaywalled).length})
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {filteredImages.filter(img => img.isPaywalled).map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className="group relative aspect-square bg-zinc-900 cursor-pointer overflow-hidden rounded-lg border border-amber-500/40 hover:brightness-110 transition"
                      >
                        <img 
                          src={img.imageUrl} 
                          alt={img.title} 
                          className={`w-full h-full object-cover ${
                            !unlockedImageIds.includes(img.id) && !isCurrentCreator ? 'blur-sm brightness-75' : ''
                          }`} 
                        />
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-300 flex items-center gap-0.5 border border-amber-500/40">
                          <Lock className="w-2.5 h-2.5" /> {img.priceTokens}🪙
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 text-[9px] text-white font-medium bg-black/60 px-1 py-0.5 rounded truncate">
                          {img.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Photo Lightbox / Modal with Paywall and Description */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 md:p-6 bg-black/95 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Lightbox Button */}
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-zinc-700 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Image / Carousel View */}
            <div className="relative flex-1 bg-black flex flex-col items-center justify-center min-h-[280px] md:min-h-[460px] overflow-hidden group/view">
              {(() => {
                const isUnlocked = !selectedImage.isPaywalled || unlockedImageIds.includes(selectedImage.id) || isCurrentCreator;
                const imagesList = (selectedImage.images && selectedImage.images.length > 0) ? selectedImage.images : [selectedImage.imageUrl];
                const activeImgUrl = imagesList[selectedImageIdx] || selectedImage.imageUrl;

                if (isUnlocked) {
                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                      <img 
                        src={activeImgUrl} 
                        alt={`${selectedImage.title} - ${selectedImageIdx + 1}`}
                        className="w-full h-full max-h-[68vh] object-contain transition-all duration-300"
                      />

                      {/* Carousel Controls */}
                      {imagesList.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageIdx((selectedImageIdx - 1 + imagesList.length) % imagesList.length);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-zinc-700 opacity-90 hover:opacity-100 transition shadow-lg"
                            title="Previous Image"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageIdx((selectedImageIdx + 1) % imagesList.length);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-zinc-700 opacity-90 hover:opacity-100 transition shadow-lg"
                            title="Next Image"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>

                          {/* Image Counter Badge & Dots */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-zinc-700 text-xs text-white">
                            <span className="font-mono text-[11px] font-bold text-amber-400">
                              {selectedImageIdx + 1} / {imagesList.length}
                            </span>
                            <div className="flex gap-1">
                              {imagesList.map((_, dotIdx) => (
                                <button
                                  key={dotIdx}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedImageIdx(dotIdx); }}
                                  className={`w-2 h-2 rounded-full transition ${
                                    dotIdx === selectedImageIdx ? 'bg-orange-500 w-4' : 'bg-zinc-600 hover:bg-zinc-400'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <img 
                      src={selectedImage.imageUrl} 
                      alt={selectedImage.title}
                      className="absolute inset-0 w-full h-full object-cover blur-xl brightness-50"
                    />
                    <div className="relative z-10 p-6 rounded-2xl bg-black/80 border border-amber-500/50 max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-black text-white mb-1">
                        {imagesList.length > 1 ? `Paywalled VIP Gallery (${imagesList.length} Photos)` : 'Paywalled Creator Photo'}
                      </h3>
                      <p className="text-xs text-zinc-300 mb-4">
                        Unlock this full high-resolution {imagesList.length > 1 ? 'gallery set' : 'photo'} for {selectedImage.priceTokens} tokens.
                      </p>
                      <button
                        onClick={() => handleUnlockImage(selectedImage)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs uppercase tracking-wider transition shadow-lg"
                      >
                        Unlock for {selectedImage.priceTokens} 🪙 Tokens
                      </button>
                      {onOpenTokenStore && (
                        <button
                          onClick={onOpenTokenStore}
                          className="mt-2 text-[11px] text-amber-400 hover:underline font-bold"
                        >
                          Need tokens? Buy token pack
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Photo Details & Description (Only seen on creator profile) */}
            <div className="w-full md:w-80 p-5 md:p-6 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col justify-between space-y-4">
              <div>
                {/* Creator info */}
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                  <img src={selectedImage.creatorAvatar} alt={selectedImage.creatorName} className="w-10 h-10 rounded-full object-cover ring-1 ring-orange-500/50" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{selectedImage.creatorName}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">@{selectedImage.creatorUsername}</p>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="pt-3">
                  <h3 className="text-base font-bold text-white mb-1.5">{selectedImage.title}</h3>
                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80 mb-3">
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {selectedImage.description || 'Exclusive creator photo posted exclusively on profile.'}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedImage.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-orange-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-zinc-500">Posted {selectedImage.createdAt} • Only visible on profile</p>
              </div>

              {/* Action Buttons: Like, Share, Delete */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLikeImage(selectedImage.id)}
                    className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span>{selectedImage.likes} Likes</span>
                  </button>

                  <a
                    href={selectedImage.imageUrl}
                    download={`${selectedImage.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition"
                    title="Download Photo"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                {isCurrentCreator && (
                  <button
                    onClick={() => handleDeleteImage(selectedImage.id)}
                    className="w-full py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

