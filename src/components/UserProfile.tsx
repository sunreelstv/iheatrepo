import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Video, Heart, Bookmark, User, Sparkles, Upload, Edit3, Check, 
  UserCheck, UserX, Tag, LogOut, LogIn, UserPlus, Coins, ShieldCheck,
  Camera, Image as ImageIcon, Globe, Key, Volume2, Lock, Link, Plus, Trash2, Download
} from 'lucide-react';
import { VideoClip, UserAccount, CreatorImage } from '../types';
import { 
  getStoredCreatorImages, saveStoredCreatorImage, deleteCreatorImage, 
  getUnlockedImageIds, toggleLikeCreatorImage 
} from '../utils/storage';
import { uploadImageToSupabase, saveCreatorImageToSupabase, saveUserProfileToSupabase } from '../utils/supabase';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserAccount;
  onSaveProfile: (profile: Partial<UserAccount>) => void;
  userClips: VideoClip[];
  likedClipIds: string[];
  savedClipIds: string[];
  followedCreators: string[];
  onToggleFollow: (username: string) => void;
  allClips: VideoClip[];
  onSelectClip: (clip: VideoClip) => void;
  onOpenUpload: () => void;
  onOpenCreatorProfile: (username: string) => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  userClips = [],
  likedClipIds = [],
  savedClipIds = [],
  followedCreators = [],
  onToggleFollow,
  allClips = [],
  onSelectClip,
  onOpenUpload,
  onOpenCreatorProfile,
  onOpenAuthModal,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'steams' | 'images' | 'following' | 'saved' | 'likes'>('steams');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTag, setActiveTag] = useState<string>('All');
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);

  // Photos state
  const [creatorImages, setCreatorImages] = useState<CreatorImage[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoTags, setPhotoTags] = useState('IslandHeat, Exclusive');
  const [photoIsPaywalled, setPhotoIsPaywalled] = useState(false);
  const [photoPrice, setPhotoPrice] = useState(30);
  const [selectedPhoto, setSelectedPhoto] = useState<CreatorImage | null>(null);

  // Edit form state
  const [editUsername, setEditUsername] = useState(userProfile.username);
  const [editDisplayName, setEditDisplayName] = useState(userProfile.displayName);
  const [editBio, setEditBio] = useState(userProfile.bio);
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar);
  const [editOnlyfans, setEditOnlyfans] = useState(userProfile.socialLinks?.onlyfans || '');
  const [editWebsite, setEditWebsite] = useState(userProfile.socialLinks?.website || '');
  const [avatarUploadMsg, setAvatarUploadMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUserPhotos = () => {
    const all = getStoredCreatorImages();
    const userPhotos = all.filter(img => img.creatorUsername.toLowerCase() === userProfile.username.toLowerCase());
    setCreatorImages(userPhotos);
  };

  useEffect(() => {
    if (isOpen) {
      loadUserPhotos();
    }
  }, [isOpen, userProfile.username]);

  if (!isOpen) return null;

  const likedClips = (allClips || []).filter(c => (likedClipIds || []).includes(c.id));
  const savedClips = (allClips || []).filter(c => (savedClipIds || []).includes(c.id));

  // Handle Custom Avatar File Upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarUploadMsg('❌ Please select a valid image file');
      setTimeout(() => setAvatarUploadMsg(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadMsg('❌ Image must be under 5MB');
      setTimeout(() => setAvatarUploadMsg(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEditAvatar(dataUrl);
        setAvatarUploadMsg('✅ Photo selected! Click "Save Profile" below.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Find unique followed creator objects
  const followedCreatorMap = new Map<string, { name: string; username: string; avatar: string }>();
  (allClips || []).forEach(clip => {
    if (clip?.creator?.username && (followedCreators || []).includes(clip.creator.username.toLowerCase())) {
      followedCreatorMap.set(clip.creator.username.toLowerCase(), clip.creator);
    }
  });
  const followedCreatorList = Array.from(followedCreatorMap.values());

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalAvatar = editAvatar;

    if (editAvatar && editAvatar.startsWith('data:')) {
      setAvatarUploadMsg('Uploading photo to Supabase Storage...');
      const uploadRes = await uploadImageToSupabase(editAvatar, `profile_${userProfile.username}_${Date.now()}.jpg`);
      if (uploadRes.success && uploadRes.url) {
        finalAvatar = uploadRes.url;
      }
    }

    const updatedData: Partial<UserAccount> = {
      username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      displayName: editDisplayName.trim() || 'Creator',
      bio: editBio.trim(),
      avatar: finalAvatar,
      socialLinks: {
        onlyfans: editOnlyfans.trim(),
        website: editWebsite.trim(),
      },
    };

    onSaveProfile(updatedData);

    // Sync profile with Supabase 'profiles' table
    saveUserProfileToSupabase({
      id: userProfile.id,
      ...updatedData,
    }).catch(err => console.warn('Supabase profile update warning:', err));

    setIsEditing(false);
    setAvatarUploadMsg('');
  };

  const handleSaveNewPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return;

    let finalImageUrl = photoFile;

    if (photoFile.startsWith('data:')) {
      const uploadRes = await uploadImageToSupabase(photoFile, `gallery_${userProfile.username}_${Date.now()}.jpg`);
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
      }
    }

    const tagsArr = photoTags.split(/[,# ]+/).map(t => t.trim()).filter(Boolean);

    const newPhoto = {
      creatorUsername: userProfile.username,
      creatorName: userProfile.displayName,
      creatorAvatar: userProfile.avatar,
      imageUrl: finalImageUrl,
      title: photoTitle.trim() || 'Profile Photo',
      description: photoDesc.trim() || 'Exclusive creator profile photo.',
      tags: tagsArr.length > 0 ? tagsArr : ['IslandHeat', 'Exclusive'],
      isPaywalled: photoIsPaywalled,
      priceTokens: photoIsPaywalled ? Number(photoPrice) || 30 : 0,
    };

    const saved = saveStoredCreatorImage(newPhoto);

    // Sync creator photo to Supabase
    saveCreatorImageToSupabase(saved).catch(err => console.warn('Supabase creator image sync warning:', err));

    setPhotoFile('');
    setPhotoTitle('');
    setPhotoDesc('');
    setIsUploadingPhoto(false);
    loadUserPhotos();
  };

  const handleDeletePhoto = (photoId: string) => {
    if (confirm('Delete this photo from your profile?')) {
      deleteCreatorImage(photoId);
      loadUserPhotos();
      setSelectedPhoto(null);
    }
  };

  const rawDisplayClips = activeTab === 'steams' ? userClips : activeTab === 'saved' ? savedClips : likedClips;

  // Extract tags for tag pill filter
  const extractedTags = Array.from(new Set(rawDisplayClips.flatMap(c => c.tags || [])));
  const availableTags = ['All', ...extractedTags];

  const displayClips = rawDisplayClips.filter(clip => {
    if (activeTag !== 'All' && !clip.tags.some(t => t.toLowerCase() === activeTag.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-orange-500/30 text-white p-5 md:p-6 shadow-2xl custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        id="user-profile-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img 
                src={userProfile.avatar} 
                alt={userProfile.displayName} 
                className="w-16 h-16 rounded-full object-cover ring-2 ring-orange-500 shadow-md bg-zinc-900"
              />
              {userProfile.isLoggedIn && (
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">{userProfile.displayName}</h2>
                {userProfile.isVerified && (
                  <span className="p-0.5 rounded-full bg-orange-500 text-white shrink-0" title="Verified">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
                {userProfile.role === 'admin' && userProfile.isLoggedIn && (
                  <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-400 font-mono font-medium">
                {userProfile.isLoggedIn ? `@${userProfile.username}` : 'Guest Visitor'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userProfile.isLoggedIn ? (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    isEditing 
                      ? 'bg-zinc-800 text-orange-400 border-orange-500/40' 
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>

                <button
                  onClick={onLogout}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition flex items-center gap-1.5"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black shadow-md hover:scale-105 transition flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In / Register
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guest Registration Promotion Banner if Not Logged In */}
        {!userProfile.isLoggedIn && (
          <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-emerald-500/15 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Create an Account & Claim 50 Free Tokens</span>
              </h3>
              <p className="text-xs text-zinc-300 mt-0.5">
                Register on IslandHeat to post 60fps steams, upload exclusive profile photos, and unlock VIP content.
              </p>
            </div>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shrink-0 hover:scale-105 transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Register Free
            </button>
          </div>
        )}

        {/* Edit Profile Form with Photo Upload */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="my-4 p-4 rounded-2xl bg-zinc-900/90 border border-orange-500/30 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-orange-500" /> Customize Profile & Avatar
            </h3>

            {/* Profile Photo Uploader */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <img 
                  src={editAvatar} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-orange-500 hover:bg-orange-400 text-white shadow"
                  title="Upload New Photo"
                >
                  <Upload className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-orange-400" /> Upload Profile Image
                  </button>
                  <span className="text-[11px] text-zinc-400">JPG, PNG up to 5MB</span>
                </div>
                {avatarUploadMsg && (
                  <p className="text-xs font-semibold text-emerald-400">{avatarUploadMsg}</p>
                )}
              </div>
            </div>

            {/* Name and Handle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Display Name
                </label>
                <input 
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Username Handle (@)
                </label>
                <input 
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-orange-400 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Bio Description
              </label>
              <textarea 
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell viewers about your steams and content..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Fansly / OnlyFans URL
                </label>
                <input 
                  type="url"
                  placeholder="https://fansly.com/yourname"
                  value={editOnlyfans}
                  onChange={(e) => setEditOnlyfans(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Website / Custom Link
                </label>
                <input 
                  type="url"
                  placeholder="https://islandheat.tv"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Profile Changes
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="mt-3 text-xs md:text-sm text-zinc-300 leading-relaxed">
              {userProfile.bio || "Welcome to my IslandHeat steam feed! Check the exclusive content below 👇"}
            </p>

            {/* Social Links Display Row */}
            <div className="flex items-center gap-2.5 my-3">
              <a 
                href={userProfile.socialLinks?.onlyfans || "https://fansly.com"} 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-rose-400 hover:text-rose-300 transition shadow"
                title="VIP Fan Page"
              >
                <Heart className="w-4 h-4 fill-current" />
              </a>

              <button 
                onClick={() => onOpenUpload()}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-amber-400 hover:text-amber-300 transition shadow"
                title="Upload Steam / Paywall"
              >
                <Key className="w-4 h-4" />
              </button>

              <a 
                href={userProfile.socialLinks?.website || "https://islandheat.tv"} 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition shadow"
                title="Website Link"
              >
                <Globe className="w-4 h-4" />
              </a>

              {userProfile.isLoggedIn && (
                <button
                  onClick={() => setIsUploadingPhoto(true)}
                  className="ml-auto px-3 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 transition shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload Photo
                </button>
              )}
            </div>
          </>
        )}

        {/* Quick Photo Upload Form */}
        {isUploadingPhoto && userProfile.isLoggedIn && (
          <form onSubmit={handleSaveNewPhoto} className="my-4 p-4 rounded-2xl bg-zinc-900 border border-orange-500/40 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> Upload Exclusive Photo (Profile Only)
              </h3>
              <button type="button" onClick={() => setIsUploadingPhoto(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Image File or Direct URL *</label>
              <input 
                type="text" 
                placeholder="Paste image URL (https://...)" 
                value={photoFile}
                onChange={(e) => setPhotoFile(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
              />
              <div className="mt-1 flex items-center gap-2">
                <label className="cursor-pointer px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                  <span>Pick Local Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setPhotoFile(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {photoFile && <span className="text-[10px] text-emerald-400 font-bold">Image attached!</span>}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Photo Title *</label>
              <input 
                type="text" 
                placeholder="e.g. VIP Oceanfront Shoot" 
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Description (Visible only on your profile)</label>
              <textarea 
                rows={2}
                placeholder="Describe this photo set, location, or private set details..." 
                value={photoDesc}
                onChange={(e) => setPhotoDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Tags</label>
              <input 
                type="text" 
                placeholder="IslandHeat, Glamour, VIP, Caribbean" 
                value={photoTags}
                onChange={(e) => setPhotoTags(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Paywall toggle */}
            <div className="pt-1 flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <Lock className={`w-4 h-4 ${photoIsPaywalled ? 'text-amber-400' : 'text-zinc-500'}`} />
                <div>
                  <p className="text-xs font-bold text-white">Paywall this Image</p>
                  <p className="text-[10px] text-zinc-400">Viewers must unlock with tokens to view full resolution</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={photoIsPaywalled} 
                  onChange={(e) => setPhotoIsPaywalled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {photoIsPaywalled && (
              <div className="flex items-center gap-2 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                <span className="text-xs font-bold text-amber-300">Unlock Price:</span>
                <input 
                  type="number" 
                  min="5" 
                  max="500" 
                  value={photoPrice} 
                  onChange={(e) => setPhotoPrice(Math.max(5, Number(e.target.value)))}
                  className="w-20 px-2 py-1 rounded bg-zinc-900 border border-amber-500/50 text-xs text-white text-center font-bold"
                />
                <span className="text-xs text-amber-400 font-bold">🪙 Tokens</span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider transition shadow-lg"
            >
              Post Photo to Profile
            </button>
          </form>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-1.5 my-4 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Steams</p>
            <p className="text-sm md:text-base font-black text-white mt-0.5">{userClips.length}</p>
          </div>
          <div className="border-l border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Images</p>
            <p className="text-sm md:text-base font-black text-orange-400 mt-0.5">{creatorImages.length}</p>
          </div>
          <div className="border-l border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Following</p>
            <p className="text-sm md:text-base font-black text-emerald-400 mt-0.5">{followedCreators.length}</p>
          </div>
          <div className="border-l border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Saved</p>
            <p className="text-sm md:text-base font-black text-amber-400 mt-0.5">{savedClipIds.length}</p>
          </div>
          <div className="border-l border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Liked</p>
            <p className="text-sm md:text-base font-black text-rose-400 mt-0.5">{likedClipIds.length}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-zinc-800 pb-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => { setActiveTab('steams'); setActiveTag('All'); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'steams' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> My Steams ({userClips.length})
          </button>

          <button
            onClick={() => { setActiveTab('images'); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'images' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> My Photos ({creatorImages.length})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'saved' ? 'bg-amber-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Saved ({savedClips.length})
          </button>

          <button
            onClick={() => setActiveTab('likes')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'likes' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" /> Liked ({likedClips.length})
          </button>

          <button
            onClick={() => setActiveTab('following')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'following' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Following ({followedCreatorList.length})
          </button>
        </div>

        {/* Tags Pill Bar */}
        {availableTags.length > 1 && activeTab !== 'following' && activeTab !== 'images' && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 custom-scrollbar">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                  activeTag === tag
                    ? 'bg-zinc-900 border-orange-500 text-orange-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <div className="pt-3">
          {activeTab === 'following' ? (
            followedCreatorList.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                <User className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">You haven't followed any creators yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {followedCreatorList.map(creator => (
                  <div 
                    key={creator.username}
                    className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div 
                      onClick={() => {
                        onClose();
                        onOpenCreatorProfile(creator.username);
                      }}
                      className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition"
                    >
                      <img 
                        src={creator.avatar} 
                        alt={creator.name} 
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-orange-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{creator.name}</p>
                        <p className="text-[10px] text-orange-400 font-mono">@{creator.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleFollow(creator.username)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 border border-zinc-700 transition"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'images' ? (
            creatorImages.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">You haven't uploaded any photos to your profile yet.</p>
                <button
                  onClick={() => setIsUploadingPhoto(true)}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload First Photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-4">
                {creatorImages.map(img => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedPhoto(img)}
                    className="group relative aspect-square bg-zinc-900 cursor-pointer overflow-hidden rounded-xl border border-zinc-800 hover:border-orange-500 transition shadow"
                  >
                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                    {img.isPaywalled && (
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/80 text-[9px] font-bold text-amber-300 flex items-center gap-0.5 border border-amber-500/40">
                        <Lock className="w-2.5 h-2.5" /> {img.priceTokens}🪙
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end">
                      <p className="text-[11px] font-bold text-white line-clamp-1">{img.title}</p>
                      <p className="text-[9px] text-zinc-300 line-clamp-1">{img.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : displayClips.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
              <Video className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">No steams found in this section.</p>
              {activeTab === 'steams' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpload();
                  }}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload First Steam
                </button>
              )}
            </div>
          ) : (
            /* 3-Column Content Grid */
            <div className="grid grid-cols-3 gap-1 md:gap-1.5 pb-4">
              {displayClips.map(clip => {
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

                    {/* Paywalled Badge */}
                    {clip.isPaywalled && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold text-amber-300 flex items-center gap-0.5 border border-amber-500/40">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{clip.priceTokens || 50}🪙</span>
                      </div>
                    )}

                    {/* Duration / Views overlay */}
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

        {/* Selected Photo Modal Lightbox */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedPhoto(null)}
          >
            <div 
              className="relative max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 overflow-hidden shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white">{selectedPhoto.title}</h3>
                <button onClick={() => setSelectedPhoto(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black max-h-[350px] flex items-center justify-center">
                <img src={selectedPhoto.imageUrl} alt={selectedPhoto.title} className="w-full h-full object-contain max-h-[350px]" />
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <p>{selectedPhoto.description || 'No description provided.'}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400 font-medium">
                  {selectedPhoto.isPaywalled ? `Paywalled: ${selectedPhoto.priceTokens}🪙` : 'Free Photo'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeletePhoto(selectedPhoto.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-bold border border-red-800/40 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

