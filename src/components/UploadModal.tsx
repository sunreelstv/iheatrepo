import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Video, Link as LinkIcon, Sparkles, Check, AlertCircle, 
  Volume2, VolumeX, Tag, Image as ImageIcon, Camera, RefreshCw, Cloud, 
  User, Lock, Unlock, Plus, Trash2, ChevronLeft, ChevronRight, Eye, Layers
} from 'lucide-react';
import { Category, VideoClip, AspectRatio, UserAccount, CreatorImage } from '../types';
import { POPULAR_TAGS } from '../data/mockClips';
import { uploadVideoToSupabase, uploadImageToSupabase, saveClipToSupabase, saveUserProfileToSupabase, saveCreatorImageToSupabase } from '../utils/supabase';
import { saveStoredUserAccount, saveStoredCreatorImage } from '../utils/storage';
import { saveMediaBlob } from '../utils/indexedDb';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (clip: VideoClip) => void;
  onUploadGallerySuccess?: (gallery: CreatorImage) => void;
  activeUser?: UserAccount;
  initialTab?: 'file' | 'url' | 'gallery';
  onOpenKycModal?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUploadSuccess, 
  onUploadGallerySuccess,
  activeUser,
  initialTab = 'file',
  onOpenKycModal,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'gallery'>(initialTab);
  
  // Video Steam State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Jamaica Heat');
  const [tags, setTags] = useState<string[]>(['Caribbean', 'HD']);
  const [tagInput, setTagInput] = useState('');
  const [hasAudio, setHasAudio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<number>(6);
  
  // Video Thumbnail & Custom Screenshot State
  const [autoThumbnailUrl, setAutoThumbnailUrl] = useState<string>('');
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState<string>('');
  const [thumbnailMode, setThumbnailMode] = useState<'auto' | 'custom'>('auto');
  const [isCapturingFrame, setIsCapturingFrame] = useState<boolean>(false);
  const [customThumbInputUrl, setCustomThumbInputUrl] = useState<string>('');
  const [showThumbUrlInput, setShowThumbUrlInput] = useState(false);

  // Gallery Upload State (Multi-photo)
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryCoverIdx, setGalleryCoverIdx] = useState<number>(0);
  const [galleryPreviewIdx, setGalleryPreviewIdx] = useState<number>(0);
  const [galleryImageUrlInput, setGalleryImageUrlInput] = useState<string>('');
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryDescription, setGalleryDescription] = useState('');
  const [galleryCategory, setCategoryGallery] = useState<Category>('Jamaica Heat');
  const [galleryTags, setGalleryTags] = useState<string[]>(['IslandHeat', 'Exclusive', 'Gallery']);
  const [galleryTagInput, setGalleryTagInput] = useState('');
  const [galleryIsPaywalled, setGalleryIsPaywalled] = useState(false);
  const [galleryPriceTokens, setGalleryPriceTokens] = useState(30);

  // Creator Customization State
  const [creatorName, setCreatorName] = useState('');
  const [creatorUsername, setCreatorUsername] = useState('');
  const [creatorAvatar, setCreatorAvatar] = useState('');
  const [avatarUploadMsg, setAvatarUploadMsg] = useState('');

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const customThumbInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial tab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Initialize Creator Identity from active user
  useEffect(() => {
    if (activeUser && activeUser.id !== 'guest') {
      setCreatorName(activeUser.displayName || activeUser.username);
      setCreatorUsername(activeUser.username);
      setCreatorAvatar(activeUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
    } else {
      setCreatorName('Island Creator');
      setCreatorUsername('island_creator');
      setCreatorAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
    }
  }, [activeUser, isOpen]);

  if (!isOpen) return null;

  // Handle custom creator avatar file upload
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarUploadMsg('❌ Please select an image file');
      setTimeout(() => setAvatarUploadMsg(''), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCreatorAvatar(dataUrl);
        setAvatarUploadMsg('✅ Photo selected!');
        setTimeout(() => setAvatarUploadMsg(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Capture canvas screenshot from video element
  const captureFrameFromVideo = (videoEl: HTMLVideoElement) => {
    try {
      setIsCapturingFrame(true);
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        if (dataUrl && dataUrl.length > 200) {
          setAutoThumbnailUrl(dataUrl);
          setThumbnailMode('auto');
        }
      }
    } catch (err) {
      console.warn('Auto-thumbnail canvas extraction warning:', err);
    } finally {
      setIsCapturingFrame(false);
    }
  };

  // Custom Thumbnail from file
  const handleCustomThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomThumbnailUrl(dataUrl);
        setThumbnailMode('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomThumbUrl = () => {
    if (customThumbInputUrl.trim()) {
      setCustomThumbnailUrl(customThumbInputUrl.trim());
      setThumbnailMode('custom');
      setShowThumbUrlInput(false);
      setCustomThumbInputUrl('');
    }
  };

  // Video File Select
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/') && !file.type.includes('gif')) {
      setErrorMsg('Please select a valid video file (MP4, WebM) or animated steam.');
      return;
    }
    setErrorMsg('');
    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vid = videoRef.current;
      const dur = Math.round(vid.duration) || 6;
      setDuration(dur);

      const width = vid.videoWidth;
      const height = vid.videoHeight;
      if (height > width * 1.2) {
        setAspectRatio('9:16');
      } else if (Math.abs(width - height) < 50) {
        setAspectRatio('1:1');
      } else {
        setAspectRatio('16:9');
      }

      try {
        vid.currentTime = Math.min(0.5, (vid.duration || 1) / 2);
      } catch (e) {
        captureFrameFromVideo(vid);
      }
    }
  };

  const handleSeeked = () => {
    if (videoRef.current && thumbnailMode === 'auto') {
      captureFrameFromVideo(videoRef.current);
    }
  };

  const handleAddTag = (t: string) => {
    const trimmed = t.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setErrorMsg('');
    setVideoFile(null);
    setPreviewUrl(urlInput.trim());
    if (!title) {
      setTitle('Custom Caribbean Steam');
    }
  };

  // --- GALLERY MULTI-PHOTO HANDLERS ---
  const handleGalleryFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMsg('');

    const newImgs: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          newImgs.push(dataUrl);
        }
        processed++;
        if (processed === files.length) {
          setGalleryImages(prev => [...prev, ...newImgs]);
          if (!galleryTitle && files[0]) {
            const name = files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            setGalleryTitle(name.charAt(0).toUpperCase() + name.slice(1) + ' Photo Set');
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddGalleryUrl = () => {
    if (!galleryImageUrlInput.trim()) return;
    setGalleryImages(prev => [...prev, galleryImageUrlInput.trim()]);
    if (!galleryTitle) {
      setGalleryTitle('Exclusive Island Photo Set');
    }
    setGalleryImageUrlInput('');
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const updated = galleryImages.filter((_, idx) => idx !== indexToRemove);
    setGalleryImages(updated);
    if (galleryCoverIdx >= updated.length) {
      setGalleryCoverIdx(Math.max(0, updated.length - 1));
    }
    if (galleryPreviewIdx >= updated.length) {
      setGalleryPreviewIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleAddGalleryTag = (t: string) => {
    const trimmed = t.trim().replace(/^#/, '');
    if (trimmed && !galleryTags.includes(trimmed)) {
      setGalleryTags([...galleryTags, trimmed]);
    }
    setGalleryTagInput('');
  };

  const handleRemoveGalleryTag = (tagToRemove: string) => {
    setGalleryTags(galleryTags.filter(t => t !== tagToRemove));
  };

  // --- SUBMIT VIDEO CLIP ---
  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      setErrorMsg('Please select a video file or paste a video URL.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter a title for your steam.');
      return;
    }

    // Validate pasted URLs for webpage links (Twitter/X, Instagram, TikTok)
    if (activeTab === 'url' && urlInput) {
      const cleanUrl = urlInput.trim().toLowerCase();
      if (cleanUrl.includes('x.com/') || cleanUrl.includes('twitter.com/')) {
        setErrorMsg('⚠️ X/Twitter status links are web pages, not direct video files. Please paste a direct MP4/video link ending in .mp4 or .webm.');
        return;
      }
      if (cleanUrl.includes('instagram.com/') || cleanUrl.includes('tiktok.com/')) {
        setErrorMsg('⚠️ Social media post links are web pages, not direct video files. Please paste a direct video file link.');
        return;
      }
    }

    setIsPublishing(true);
    setUploadProgress(10);
    setUploadStatusText('Preparing media for publishing...');

    try {
      const newClipId = `user-clip-${Date.now()}`;
      let finalVideoUrl = previewUrl;
      const activeThumb = thumbnailMode === 'custom' && customThumbnailUrl ? customThumbnailUrl : autoThumbnailUrl;
      let finalPosterUrl = activeThumb || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';
      let finalCreatorAvatar = creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

      // 1. Upload Video file to Supabase if it's a local File object
      if (videoFile) {
        setUploadStatusText('Uploading video file directly to Supabase Storage...');
        const uploadRes = await uploadVideoToSupabase(videoFile, undefined, (pct) => {
          setUploadProgress(Math.min(75, Math.max(15, pct)));
        });

        if (uploadRes.success && uploadRes.url) {
          finalVideoUrl = uploadRes.url;
        } else {
          throw new Error(uploadRes.error || 'Failed to upload video to Supabase Storage. Please ensure a public storage bucket is configured.');
        }
      }

      // 2. Upload thumbnail if generated/uploaded
      if (activeThumb && activeThumb.startsWith('data:')) {
        setUploadStatusText('Saving high-res video thumbnail...');
        const thumbRes = await uploadImageToSupabase(activeThumb, `thumb_${Date.now()}.jpg`);
        if (thumbRes.success && thumbRes.url) {
          finalPosterUrl = thumbRes.url;
        }
      }

      // 3. Upload creator avatar if new
      if (creatorAvatar && creatorAvatar.startsWith('data:')) {
        setUploadStatusText('Saving creator profile photo...');
        const avatarRes = await uploadImageToSupabase(creatorAvatar, `avatar_${Date.now()}.jpg`);
        if (avatarRes.success && avatarRes.url) {
          finalCreatorAvatar = avatarRes.url;
        }
      }

      setUploadProgress(85);
      setUploadStatusText('Saving creator profile and steam...');

      const finalName = creatorName.trim() || (activeUser?.displayName) || 'Island Creator';
      const cleanUsername = (creatorUsername.trim() || activeUser?.username || 'island_creator')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');

      const isVerified = Boolean(activeUser?.isVerified === true);

      saveUserProfileToSupabase({
        id: activeUser?.id && activeUser.id !== 'guest' ? activeUser.id : `user_${cleanUsername}`,
        username: cleanUsername,
        displayName: finalName,
        avatar: finalCreatorAvatar,
        role: 'creator',
        isVerified: isVerified,
      }).catch(err => console.warn('Profile Supabase sync:', err));

      if (activeUser) {
        saveStoredUserAccount({
          displayName: finalName,
          username: cleanUsername,
          avatar: finalCreatorAvatar,
        });
      }

      const newClip: VideoClip = {
        id: `user-clip-${Date.now()}`,
        title: title.trim(),
        description: `Uploaded steam created with HD IslandHeat engine.`,
        videoUrl: finalVideoUrl,
        posterUrl: finalPosterUrl,
        creator: {
          name: finalName,
          username: cleanUsername,
          avatar: finalCreatorAvatar,
          isVerified,
        },
        duration: duration || 6,
        aspectRatio,
        category,
        tags: tags.length > 0 ? tags : ['Caribbean', 'Uploaded', 'Steam'],
        views: 1,
        likes: 0,
        loopsCount: 1,
        hasAudio,
        createdAt: 'Just now',
        isHD: true,
        is4K: true,
        isUserUploaded: true,
      };

      saveClipToSupabase(newClip).catch(err => console.warn('Supabase DB save fallback:', err));

      setUploadProgress(100);
      setUploadStatusText('Upload complete!');

      setTimeout(() => {
        onUploadSuccess(newClip);
        setIsPublishing(false);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Upload error:', err);
      setIsPublishing(false);
      setErrorMsg(err?.message || 'Failed to publish steam. Please check your network.');
    }
  };

  // --- SUBMIT PHOTO GALLERY ---
  const handleSubmitGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (galleryImages.length === 0) {
      setErrorMsg('Please select or upload at least one photo for your gallery.');
      return;
    }
    if (!galleryTitle.trim()) {
      setErrorMsg('Please enter a title for your gallery.');
      return;
    }
    if (galleryIsPaywalled && !activeUser?.isVerified) {
      setErrorMsg('🔒 Token paywalls require approved Backend Admin Verification (KYC). Submit your Photo ID to backend admin for approval, or uncheck paywalls to publish for FREE!');
      return;
    }

    setIsPublishing(true);
    setUploadProgress(15);
    setUploadStatusText('Preparing gallery photos...');

    try {
      const finalCreatorAvatar = creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
      const finalName = creatorName.trim() || (activeUser?.displayName) || 'Island Creator';
      const cleanUsername = (creatorUsername.trim() || activeUser?.username || 'island_creator')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');

      // Upload images to Supabase if data URLs
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < galleryImages.length; i++) {
        const img = galleryImages[i];
        setUploadProgress(20 + Math.round((i / galleryImages.length) * 50));
        setUploadStatusText(`Uploading photo ${i + 1} of ${galleryImages.length}...`);

        if (img.startsWith('data:')) {
          const res = await uploadImageToSupabase(img, `gallery_${Date.now()}_${i}.jpg`);
          if (res.success && res.url) {
            uploadedImageUrls.push(res.url);
          } else {
            uploadedImageUrls.push(img);
          }
        } else {
          uploadedImageUrls.push(img);
        }
      }

      setUploadProgress(80);
      setUploadStatusText('Publishing gallery to Caribbean network...');

      const coverUrl = uploadedImageUrls[galleryCoverIdx] || uploadedImageUrls[0];

      // Save to localStorage
      const savedGallery = saveStoredCreatorImage({
        creatorUsername: cleanUsername,
        creatorName: finalName,
        creatorAvatar: finalCreatorAvatar,
        imageUrl: coverUrl,
        images: uploadedImageUrls,
        title: galleryTitle.trim(),
        description: galleryDescription.trim(),
        category: galleryCategory,
        tags: galleryTags.length > 0 ? galleryTags : ['IslandHeat', 'Gallery'],
        isPaywalled: galleryIsPaywalled,
        priceTokens: galleryIsPaywalled ? galleryPriceTokens : 0,
      });

      // Save to Supabase
      saveCreatorImageToSupabase(savedGallery).catch(e => console.warn('Supabase gallery sync:', e));

      setUploadProgress(100);
      setUploadStatusText('Gallery published successfully!');

      setTimeout(() => {
        if (onUploadGallerySuccess) onUploadGallerySuccess(savedGallery);
        setIsPublishing(false);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Gallery publish error:', err);
      setIsPublishing(false);
      setErrorMsg(err?.message || 'Failed to publish gallery. Please try again.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-orange-500/30 text-white p-5 sm:p-6 shadow-2xl custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        id="upload-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">
                {activeTab === 'gallery' ? 'Upload Photo Gallery & Carousel' : 'Upload & Share Steam Video'}
              </h2>
              <p className="text-xs text-zinc-400">
                {activeTab === 'gallery' 
                  ? 'Publish multi-photo sets, carousels, and VIP paywalled photo shoots'
                  : 'High bitrate WebM/MP4 steam publishing on IslandHeat'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            id="close-upload-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Selector Tabs */}
        <div className="mt-4 flex gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'file' ? 'bg-orange-500 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" /> File Drop
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'url' ? 'bg-orange-500 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" /> Steam URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'gallery' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black shadow' : 'text-orange-400 hover:text-white'
            }`}
            id="tab-upload-gallery"
          >
            <Layers className="w-4 h-4" /> Upload Gallery
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ==================== TAB 1 & 2: VIDEO STEAM UPLOAD ==================== */}
        {(activeTab === 'file' || activeTab === 'url') && (
          <form onSubmit={handleSubmitVideo} className="mt-4 space-y-4">
            {/* Tab 1: File Drop */}
            {activeTab === 'file' && (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="video/mp4,video/webm,video/quicktime,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-orange-500/40 hover:border-amber-400 bg-zinc-950/60 hover:bg-zinc-950/90 rounded-xl p-6 text-center cursor-pointer transition group"
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500/20 to-amber-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-200">
                    Drag & Drop video file here, or <span className="text-orange-400 underline">Browse</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Supports MP4, WebM, MOV up to 250MB</p>
                </div>
              </div>
            )}

            {/* Tab 2: Steam URL */}
            {activeTab === 'url' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="Paste direct MP4, WebM, or stream video link..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl transition"
                  >
                    Load Link
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Tip: Direct stream URLs (.mp4, .webm) enable automatic high-res frame capture. You can also upload custom screenshots below.
                </p>
              </div>
            )}

            {/* Video Preview Stage */}
            {previewUrl && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black border border-orange-500/30 max-h-52 flex items-center justify-center">
                  <video 
                    ref={videoRef}
                    src={previewUrl}
                    autoPlay 
                    loop 
                    muted={!hasAudio}
                    onLoadedMetadata={handleLoadedMetadata}
                    onSeeked={handleSeeked}
                    onError={() => {
                      setErrorMsg('Could not load video preview directly. You can upload a custom thumbnail below to publish this stream link.');
                    }}
                    className="max-h-52 object-contain"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] text-amber-400 font-mono">
                    {aspectRatio} • {duration}s steam
                  </div>
                </div>

                {/* THUMBNAIL CAPTURE & CUSTOM UPLOAD CONTROLS */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-orange-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-400" />
                      Steam Thumbnail & Screenshot
                    </label>
                    <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setThumbnailMode('auto')}
                        className={`px-2 py-1 rounded font-semibold transition ${
                          thumbnailMode === 'auto' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Auto Frame
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailMode('custom')}
                        className={`px-2 py-1 rounded font-semibold transition ${
                          thumbnailMode === 'custom' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Custom Photo
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Current active thumbnail preview */}
                      {thumbnailMode === 'custom' && customThumbnailUrl ? (
                        <img 
                          src={customThumbnailUrl} 
                          alt="Custom thumbnail" 
                          className="w-16 h-11 object-cover rounded-lg border border-orange-500 shadow"
                        />
                      ) : autoThumbnailUrl ? (
                        <img 
                          src={autoThumbnailUrl} 
                          alt="Auto thumbnail" 
                          className="w-16 h-11 object-cover rounded-lg border border-orange-500/60 shadow"
                        />
                      ) : (
                        <div className="w-16 h-11 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}

                      <div>
                        <div className="text-xs font-bold text-zinc-200">
                          {thumbnailMode === 'custom' ? 'Custom Uploaded Thumbnail' : 'Video Frame Capture'}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          {thumbnailMode === 'custom'
                            ? 'Custom high-res poster selected'
                            : 'Captured automatically from current video frame'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {thumbnailMode === 'auto' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (videoRef.current) captureFrameFromVideo(videoRef.current);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 border border-white/10 flex items-center gap-1 transition"
                          title="Capture current video frame"
                        >
                          <RefreshCw className="w-3 h-3 text-orange-400" />
                          Re-capture Frame
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <input
                            ref={customThumbInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCustomThumbSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => customThumbInputRef.current?.click()}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-[11px] font-semibold text-orange-400 border border-orange-500/40 flex items-center gap-1 transition"
                          >
                            <Upload className="w-3 h-3" />
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowThumbUrlInput(!showThumbUrlInput)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 border border-zinc-700 transition"
                          >
                            URL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Custom Thumb URL Input */}
                  {showThumbUrlInput && (
                    <div className="flex gap-2 pt-2 border-t border-zinc-800">
                      <input
                        type="url"
                        placeholder="Paste image link for thumbnail (e.g. https://.../poster.jpg)"
                        value={customThumbInputUrl}
                        onChange={(e) => setCustomThumbInputUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-orange-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomThumbUrl}
                        className="px-3 py-1.5 text-xs bg-orange-500 text-black font-bold rounded-lg"
                      >
                        Set
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Creator Profile & Credit Identity Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-orange-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  Creator Profile & Credit
                </label>
                {avatarUploadMsg && (
                  <span className="text-[11px] text-emerald-400 font-medium animate-fadeIn">{avatarUploadMsg}</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative shrink-0 group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <img 
                    src={creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                    alt="Creator Avatar" 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500/60 group-hover:opacity-80 transition"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <input 
                    ref={avatarInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarFileSelect}
                    className="hidden" 
                  />
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">
                      Display Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Aisha Official"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-0.5">
                      Handle / Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-orange-400 font-mono">@</span>
                      <input 
                        type="text" 
                        placeholder="username"
                        value={creatorUsername}
                        onChange={(e) => setCreatorUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="w-full pl-6 pr-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300 shrink-0 flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                  <span>Photo</span>
                </button>
              </div>
            </div>

            {/* Video Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Steam Title <span className="text-orange-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Electric Caribbean Island Sunset"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Category / Island Niche
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Jamaica Heat">Jamaica Heat 🇯🇲</option>
                  <option value="Trinidad Spice">Trinidad Spice 🇹🇹</option>
                  <option value="Barbados Babes">Barbados Babes 🇧🇧</option>
                  <option value="Dominican Temptation">Dominican Temptation 🇩🇴</option>
                  <option value="Bahamas Paradise">Bahamas Paradise 🇧🇸</option>
                  <option value="Puerto Rico Passion">Puerto Rico Passion 🇵🇷</option>
                  <option value="Curacao Dreams">Curacao Dreams 🇨🇼</option>
                  <option value="Aruba Sunsets">Aruba Sunsets 🇦🇼</option>
                  <option value="St. Lucia Secrets">St. Lucia Secrets 🇱🇨</option>
                  <option value="Virgin Islands VIP">Virgin Islands VIP 🇻🇮</option>
                  <option value="Glamour">Glamour</option>
                  <option value="Satisfying">Satisfying</option>
                  <option value="Gaming">Gaming</option>
                </select>
              </div>
            </div>

            {/* Audio Toggle & Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2">
                  {hasAudio ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                  <span className="text-xs font-medium text-zinc-200">Include Audio</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={hasAudio}
                  onChange={(e) => setHasAudio(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-orange-400" /> Tags
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="Add tag (e.g. Jamaica, VIP, 4K)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[11px] font-medium"
                    >
                      #{t}
                      <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload Progress Indicator */}
            {isPublishing && (
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-orange-400">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 animate-bounce text-amber-400" />
                    {uploadStatusText || 'Uploading media to IslandHeat...'}
                  </span>
                  <span className="font-mono text-amber-300">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-orange-500/20">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Video Submit buttons */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase Cloud Connected</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPublishing}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing || !previewUrl}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  id="publish-clip-btn"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Publishing ({uploadProgress}%)...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Publish Steam
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ==================== TAB 3: UPLOAD GALLERY (PHOTOS & SETS) ==================== */}
        {activeTab === 'gallery' && (
          <form onSubmit={handleSubmitGallery} className="mt-4 space-y-4">
            {/* Multi-Photo Picker */}
            <div>
              <input
                ref={galleryFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleGalleryFilesSelect}
                className="hidden"
              />
              <div
                onClick={() => galleryFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    handleGalleryFilesSelect({ target: { files: e.dataTransfer.files } } as any);
                  }
                }}
                className="border-2 border-dashed border-amber-500/40 hover:border-orange-400 bg-zinc-950/60 hover:bg-zinc-950/90 rounded-xl p-5 text-center cursor-pointer transition group"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                  <Layers className="w-6 h-6" />
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-200">
                  Drag & Drop <span className="text-amber-400 font-bold">multiple photos</span> here, or <span className="text-amber-400 underline">Browse</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Select multiple photos for an interactive carousel set (JPG, PNG, WebP)
                </p>
              </div>

              {/* Paste Image URL option */}
              <div className="mt-2 flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste an image URL to add to this gallery..."
                  value={galleryImageUrlInput}
                  onChange={(e) => setGalleryImageUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs rounded-xl border border-zinc-700 transition"
                >
                  Add Photo
                </button>
              </div>
            </div>

            {/* Gallery Preview & Carousel View */}
            {galleryImages.length > 0 && (
              <div className="space-y-3 p-3 rounded-xl bg-zinc-950 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">
                      📸 {galleryImages.length} Photos Selected
                    </span>
                    {galleryImages.length > 1 && (
                      <span className="text-[11px] text-zinc-400">
                        (Carousel format active on profile & gallery feed)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add More
                  </button>
                </div>

                {/* Interactive Carousel Preview inside upload modal */}
                <div className="relative w-full h-52 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-zinc-800">
                  <img 
                    src={galleryImages[galleryPreviewIdx] || galleryImages[0]} 
                    alt="Gallery Preview" 
                    className="h-full w-full object-contain"
                  />

                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setGalleryPreviewIdx(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white hover:text-amber-400 transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGalleryPreviewIdx(prev => (prev + 1) % galleryImages.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white hover:text-amber-400 transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur text-[10px] text-amber-400 font-mono">
                        Slide {galleryPreviewIdx + 1} of {galleryImages.length}
                      </div>
                    </>
                  )}

                  {galleryCoverIdx === galleryPreviewIdx && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                      Cover Photo ⭐
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip with Cover Selection & Delete */}
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {galleryImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 group cursor-pointer transition ${
                        galleryPreviewIdx === idx ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-zinc-800'
                      }`}
                      onClick={() => setGalleryPreviewIdx(idx)}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                      
                      {/* Set as cover button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGalleryCoverIdx(idx);
                        }}
                        title={galleryCoverIdx === idx ? 'Main Cover' : 'Click to set as cover photo'}
                        className={`absolute top-1 left-1 p-0.5 rounded ${
                          galleryCoverIdx === idx ? 'bg-amber-500 text-black' : 'bg-black/60 text-zinc-300 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>

                      {/* Remove photo button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGalleryImage(idx);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded bg-black/70 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paywall & VIP Monetization Settings */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {galleryIsPaywalled ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                  <div>
                    <span className="text-xs font-bold text-zinc-200">
                      {galleryIsPaywalled ? 'VIP Paywalled Gallery (Tokens Required)' : 'Free Public Gallery'}
                    </span>
                    <p className="text-[10px] text-zinc-400">
                      {galleryIsPaywalled 
                        ? 'Viewers must spend tokens to unlock and view this photo set' 
                        : 'Free for all fans to view, rate, and like'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={galleryIsPaywalled}
                  onChange={(e) => setGalleryIsPaywalled(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {galleryIsPaywalled && (
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3 animate-fadeIn">
                  <label className="text-xs font-semibold text-amber-400">
                    Unlock Token Price:
                  </label>
                  <div className="flex items-center gap-2">
                    {[20, 30, 50, 100].map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => setGalleryPriceTokens(price)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          galleryPriceTokens === price 
                            ? 'bg-amber-500 text-black shadow' 
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {price} 🪙
                      </button>
                    ))}
                    <div className="relative w-20">
                      <input
                        type="number"
                        min={5}
                        max={1000}
                        value={galleryPriceTokens}
                        onChange={(e) => setGalleryPriceTokens(parseInt(e.target.value) || 30)}
                        className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Creator Profile & Credit block */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Creator Credit
              </label>

              <div className="flex items-center gap-3">
                <img 
                  src={creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                  alt="Creator Avatar" 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/60"
                />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    placeholder="Display Name"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                  <input 
                    type="text" 
                    placeholder="@username"
                    value={creatorUsername}
                    onChange={(e) => setCreatorUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Gallery Info Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Gallery Title <span className="text-amber-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Barbados Private Villa Sunset Photo Set"
                  value={galleryTitle}
                  onChange={(e) => setGalleryTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Category / Island Niche
                </label>
                <select
                  value={galleryCategory}
                  onChange={(e) => setCategoryGallery(e.target.value as Category)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Barbados Babes">Barbados Babes 🇧🇧</option>
                  <option value="Jamaica Heat">Jamaica Heat 🇯🇲</option>
                  <option value="Trinidad Spice">Trinidad Spice 🇹🇹</option>
                  <option value="Dominican Temptation">Dominican Temptation 🇩🇴</option>
                  <option value="Bahamas Paradise">Bahamas Paradise 🇧🇸</option>
                  <option value="Puerto Rico Passion">Puerto Rico Passion 🇵🇷</option>
                  <option value="Curacao Dreams">Curacao Dreams 🇨🇼</option>
                  <option value="Aruba Sunsets">Aruba Sunsets 🇦🇼</option>
                  <option value="St. Lucia Secrets">St. Lucia Secrets 🇱🇨</option>
                  <option value="Virgin Islands VIP">Virgin Islands VIP 🇻🇮</option>
                  <option value="Glamour">Glamour</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Describe this photo set for your fans..."
                value={galleryDescription}
                onChange={(e) => setGalleryDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Gallery Tags
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Add tags (e.g. Sunset, VIP, 4K, Glamour)..."
                  value={galleryTagInput}
                  onChange={(e) => setGalleryTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGalleryTag(galleryTagInput);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddGalleryTag(galleryTagInput)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {galleryTags.map((t, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-medium"
                  >
                    #{t}
                    <button type="button" onClick={() => handleRemoveGalleryTag(t)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Publish Progress */}
            {isPublishing && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 animate-bounce text-amber-400" />
                    {uploadStatusText || 'Publishing photo set...'}
                  </span>
                  <span className="font-mono text-amber-300">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-amber-500/20">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Gallery Submit Buttons */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Showcased in Dedicated Galleries & Profile</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPublishing}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing || galleryImages.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  id="publish-gallery-btn"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Publishing ({uploadProgress}%)...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      Publish Photo Gallery
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
