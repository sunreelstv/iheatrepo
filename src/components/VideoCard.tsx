import React, { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX, Heart, Bookmark, Share2, Check, Sparkles, Flame, Eye, Lock, UserPlus, UserCheck, Loader2, Clock, Trash2 } from 'lucide-react';
import { VideoClip, UserAccount } from '../types';
import { SoundWave } from './SoundWave';
import { getVideoMimeType } from './VideoModal';
import { resolveVideoUrl } from '../utils/indexedDb';
import { canUserDeleteContent, deleteStoredClip } from '../utils/storage';

interface VideoCardProps {
  clip: VideoClip;
  isLiked: boolean;
  isSaved: boolean;
  isFollowingCreator?: boolean;
  activeUser?: UserAccount;
  onLikeToggle: (id: string, e: React.MouseEvent) => void;
  onSaveToggle: (id: string, e: React.MouseEvent) => void;
  onToggleFollowCreator?: (username: string, e: React.MouseEvent) => void;
  onSelect: (clip: VideoClip) => void;
  onShare: (clip: VideoClip, e: React.MouseEvent) => void;
  onOpenCreatorProfile?: (username: string, e: React.MouseEvent) => void;
  onSelectTag?: (tag: string, e: React.MouseEvent) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  clip,
  isLiked,
  isSaved,
  isFollowingCreator,
  activeUser,
  onLikeToggle,
  onSaveToggle,
  onToggleFollowCreator,
  onSelect,
  onShare,
  onOpenCreatorProfile,
  onSelectTag,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [cardVideoUrl, setCardVideoUrl] = useState<string>('');
  const [hasVideoError, setHasVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;
    const rawUrl = clip?.videoUrl ? clip.videoUrl.trim() : '';

    if (!rawUrl) {
      setHasVideoError(true);
      setCardVideoUrl('');
      return;
    }

    // Check if URL is an HTML webpage (e.g. X/Twitter, Instagram status page)
    if (rawUrl.includes('x.com/') || rawUrl.includes('twitter.com/') || rawUrl.includes('instagram.com/')) {
      setHasVideoError(true);
      setCardVideoUrl('');
      return;
    }

    resolveVideoUrl(rawUrl).then((resolved) => {
      if (isMounted) {
        if (resolved) {
          setCardVideoUrl(resolved);
          setHasVideoError(false);
        } else {
          setHasVideoError(true);
        }
      }
    }).catch(() => {
      if (isMounted) setHasVideoError(true);
    });

    return () => {
      isMounted = false;
    };
  }, [clip?.videoUrl]);

  const canDelete = canUserDeleteContent(clip.creator?.username, activeUser);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${clip.title}"? This action cannot be undone.`)) {
      deleteStoredClip(clip.id);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleQuickCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(clip, e);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div
      onClick={() => onSelect(clip)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-red-500/70 dark:bg-zinc-900 dark:border-zinc-800/80 dark:hover:border-red-500/70 light:bg-white light:border-zinc-200 light:hover:border-red-500/70 shadow-lg hover:shadow-2xl hover:shadow-red-600/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      id={`video-card-${clip.id}`}
    >
      {/* Video / Thumbnail Container (Default 9:16 aspect ratio on homepage) */}
      <div className={`relative w-full overflow-hidden bg-zinc-950 ${
        clip.aspectRatio === '16:9' ? 'aspect-video' :
        clip.aspectRatio === '1:1' ? 'aspect-square' :
        'aspect-[9/16]'
      }`}>
        {/* Poster Image */}
        <img
          src={clip.posterUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'}
          alt={clip.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isHovered && !hasVideoError ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />

        {/* Video Element or Compressing State */}
        {!hasVideoError && cardVideoUrl ? (
          <video
            ref={videoRef}
            key={cardVideoUrl}
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            onError={() => {
              console.warn('[VideoCard] Video error:', cardVideoUrl);
              setHasVideoError(true);
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source src={cardVideoUrl} type={getVideoMimeType(cardVideoUrl)} />
            <source src={cardVideoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md border border-orange-500/40 rounded-xl p-2 z-10 flex items-center gap-2 shadow-lg">
            <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
            <div className="flex flex-col text-[10px] leading-tight text-left">
              <span className="font-bold text-white">Video Compressing</span>
              <span className="text-orange-300/80">Come back soon</span>
            </div>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5">
            {clip.is4K ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md">
                4K 60FPS
              </span>
            ) : clip.isHD ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-red-600 text-white shadow-md">
                HD
              </span>
            ) : null}

            {clip.isPaywalled && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-yellow-400 text-black shadow-md flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                {clip.priceTokens || 50} 🪙
              </span>
            )}

            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-md text-zinc-200 border border-white/10">
              {clip.category}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {clip.hasAudio && (
              <SoundWave isPlaying={isHovered} size="sm" />
            )}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-white font-mono">
              0:{clip.duration < 10 ? `0${clip.duration}` : clip.duration}
            </span>
          </div>
        </div>

        {/* Hover Controls Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 transition-opacity duration-300 flex flex-col justify-between p-3 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Top Controls Overlay */}
          <div className="flex justify-between items-center pointer-events-auto">
            {canDelete ? (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white backdrop-blur-md transition border border-red-400/50 shadow-md flex items-center gap-1 text-xs px-2.5 font-medium"
                title="Delete Video"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}
            {clip.hasAudio && (
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition border border-white/10"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-zinc-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            )}
          </div>

          {/* Bottom Quick Action Bar */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2 text-xs text-zinc-200">
              <span className="flex items-center gap-1 font-mono text-[11px] bg-black/60 px-2 py-0.5 rounded-full border border-white/10 text-red-400">
                <Flame className="w-3 h-3 fill-red-400" />
                {formatNumber(clip.loopsCount)} loops
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] bg-black/60 px-2 py-0.5 rounded-full border border-white/10 text-zinc-300">
                <Eye className="w-3 h-3 text-emerald-400" />
                {formatNumber(clip.views)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => onLikeToggle(clip.id, e)}
                className={`p-2 rounded-full backdrop-blur-md transition border ${
                  isLiked 
                    ? 'bg-red-600 text-white border-red-500 scale-110 shadow-lg' 
                    : 'bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border-white/10'
                }`}
                title="Like clip"
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={(e) => onSaveToggle(clip.id, e)}
                className={`p-2 rounded-full backdrop-blur-md transition border ${
                  isSaved 
                    ? 'bg-yellow-400 text-black border-yellow-300 scale-110 shadow-lg' 
                    : 'bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border-white/10'
                }`}
                title="Save clip"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleQuickCopy}
                className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-red-400 backdrop-blur-md transition border border-white/10"
                title="Share & Embed"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-50">
        <div>
          <h3 className="font-bold text-sm text-zinc-100 dark:text-zinc-100 light:text-zinc-900 line-clamp-1 group-hover:text-red-400 transition-colors">
            {clip.title}
          </h3>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {clip.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx}
                onClick={(e) => {
                  if (onSelectTag) {
                    e.stopPropagation();
                    onSelectTag(tag, e);
                  }
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 dark:text-red-400 light:text-red-700 font-medium border border-red-500/20 hover:border-red-400 transition cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Creator Info + Quick Follow */}
        {(() => {
          const isOwnClip = Boolean(
            (activeUser && activeUser.id !== 'guest' && clip?.creator?.username && activeUser.username.toLowerCase() === clip.creator.username.toLowerCase()) ||
            (clip?.isUserUploaded && activeUser && activeUser.id !== 'guest') ||
            (clip?.creator?.username === 'you_creator')
          );

          const displayCreatorName = isOwnClip && activeUser && activeUser.id !== 'guest'
            ? (activeUser.displayName || activeUser.username)
            : clip.creator.name;

          const displayCreatorUsername = isOwnClip && activeUser && activeUser.id !== 'guest'
            ? activeUser.username
            : clip.creator.username;

          const displayCreatorAvatar = isOwnClip && activeUser && activeUser.id !== 'guest'
            ? activeUser.avatar
            : clip.creator.avatar;

          const isCreatorVerified = isOwnClip && activeUser && activeUser.id !== 'guest'
            ? Boolean(activeUser.isVerified)
            : Boolean(clip.creator.isVerified);

          return (
            <div className="mt-3 pt-2.5 border-t border-zinc-800 dark:border-zinc-800 light:border-zinc-200 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
              <div 
                onClick={(e) => {
                  if (onOpenCreatorProfile) {
                    e.stopPropagation();
                    onOpenCreatorProfile(displayCreatorUsername, e);
                  }
                }}
                className="flex items-center gap-2 group/creator cursor-pointer hover:text-red-400 transition min-w-0"
              >
                <img 
                  src={displayCreatorAvatar} 
                  alt={displayCreatorName} 
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-red-500/50 group-hover/creator:scale-110 transition-transform shrink-0"
                />
                <span className="font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-800 truncate max-w-[90px] sm:max-w-[110px] group-hover/creator:text-red-400">
                  {displayCreatorName}
                </span>
                {isCreatorVerified && (
                  <Sparkles className="w-3 h-3 text-red-400 shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isOwnClip ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
                    You
                  </span>
                ) : (
                  onToggleFollowCreator && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFollowCreator(clip.creator.username, e);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                        isFollowingCreator
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                          : 'text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700'
                      }`}
                      title={isFollowingCreator ? 'Following' : 'Follow Creator'}
                    >
                      {isFollowingCreator ? <UserCheck className="w-2.5 h-2.5" /> : <UserPlus className="w-2.5 h-2.5" />}
                      <span>{isFollowingCreator ? 'Followed' : 'Follow'}</span>
                    </button>
                  )
                )}

                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 light:text-zinc-500">
                  {clip.createdAt}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
