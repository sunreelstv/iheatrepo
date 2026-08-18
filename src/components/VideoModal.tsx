import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Play, Pause, Volume2, VolumeX, Heart, Bookmark, Share2, Download, 
  Sparkles, Repeat, Eye, Gauge, Maximize, MessageSquare, Send, Check, 
  ThumbsUp, Flag, Tag, ArrowRight, CornerDownRight, UserPlus, UserCheck,
  Flame, Sun, Clock, Film, Loader2, Trash2
} from 'lucide-react';
import { VideoClip, Comment, UserAccount } from '../types';
import { SoundWave } from './SoundWave';
import { getClipComments, addClipComment, canUserDeleteContent, deleteStoredClip } from '../utils/storage';
import { DEFAULT_FALLBACK_VIDEO } from '../data/mockClips';
import { fetchCommentsFromSupabase, saveCommentToSupabase } from '../utils/supabase';
import { resolveVideoUrl } from '../utils/indexedDb';

interface VideoModalProps {
  clip: VideoClip | null;
  allClips: VideoClip[];
  isLiked: boolean;
  isSaved: boolean;
  isFollowingCreator?: boolean;
  activeUser?: UserAccount;
  onClose: () => void;
  onLikeToggle: (id: string) => void;
  onSaveToggle: (id: string) => void;
  onToggleFollowCreator?: (username: string) => void;
  onOpenShare: (clip: VideoClip) => void;
  onSelectClip: (clip: VideoClip) => void;
  onOpenCreatorProfile?: (username: string) => void;
  onSelectTag?: (tag: string) => void;
}

export function getVideoMimeType(url: string): string {
  if (!url) return 'video/mp4';
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.webm')) return 'video/webm';
  if (cleanUrl.endsWith('.mov')) return 'video/quicktime';
  if (cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.ogv')) return 'video/ogg';
  if (cleanUrl.endsWith('.m4v')) return 'video/mp4';
  if (cleanUrl.startsWith('data:video/webm')) return 'video/webm';
  if (cleanUrl.startsWith('data:video/quicktime')) return 'video/quicktime';
  if (cleanUrl.startsWith('data:video/ogg')) return 'video/ogg';
  return 'video/mp4';
}

export const VideoModal: React.FC<VideoModalProps> = ({
  clip,
  allClips,
  isLiked,
  isSaved,
  isFollowingCreator,
  activeUser,
  onClose,
  onLikeToggle,
  onSaveToggle,
  onToggleFollowCreator,
  onOpenShare,
  onSelectClip,
  onOpenCreatorProfile,
  onSelectTag,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [loopsCompleted, setLoopsCompleted] = useState(clip?.loopsCount || 100);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showHeatMenu, setShowHeatMenu] = useState(false);
  const [isAutoLoop, setIsAutoLoop] = useState(true);
  
  // Video Source URL & Error State
  const [videoSourceUrl, setVideoSourceUrl] = useState<string>(
    clip?.videoUrl && clip.videoUrl.trim() ? clip.videoUrl : ''
  );
  const [isVideoError, setIsVideoError] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clip) return;
    let isMounted = true;
    
    // Set initial video URL from clip
    const targetUrl = clip.videoUrl && clip.videoUrl.trim() ? clip.videoUrl : '';
    
    // Check if social media webpage link
    if (targetUrl.includes('x.com/') || targetUrl.includes('twitter.com/') || targetUrl.includes('instagram.com/')) {
      setIsVideoError(true);
      setVideoSourceUrl('');
    } else {
      resolveVideoUrl(targetUrl).then(resolved => {
        if (isMounted) {
          if (resolved) {
            setVideoSourceUrl(resolved);
            setIsVideoError(false);
          } else {
            setIsVideoError(true);
          }
        }
      }).catch(() => {
        if (isMounted) setIsVideoError(true);
      });
    }

    // 1. Fetch local comments first
    const localComments = getClipComments(clip.id);
    setComments(localComments);

    // 2. Fetch live comments from Supabase database
    fetchCommentsFromSupabase(clip.id).then(res => {
      if (isMounted && res.success && res.comments && res.comments.length > 0) {
        // Merge without duplicates
        setComments(prev => {
          const map = new Map<string, Comment>();
          [...prev, ...res.comments].forEach(c => map.set(c.id, c));
          return Array.from(map.values());
        });
      }
    }).catch(err => {
      // Quiet fallback when table doesn't exist
    });

    setIsPlaying(true);
    setProgress(0);
    setPlaybackSpeed(1);
    setLoopsCompleted(clip.loopsCount || 100);
    setShowHeatMenu(false);
  }, [clip]);

  // Effect to load video & handle browser autoplay restrictions gracefully
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.load();
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('[VideoModal] Autoplay unmuted prevented by browser, falling back to muted play:', err);
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().catch(e => console.warn('[VideoModal] Muted autoplay also failed:', e));
            }
          });
        }
      }
    }
  }, [videoSourceUrl, isPlaying, playbackSpeed]);

  if (!clip) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 1;
      setProgress((current / total) * 100);
    }
  };

  const handleEnded = () => {
    setLoopsCompleted(prev => prev + 1);
    if (!isAutoLoop && relatedClips.length > 0) {
      onSelectClip(relatedClips[0]);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
      setProgress(val);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const commentText = commentInput.trim();
    setIsSubmittingComment(true);
    
    setTimeout(() => {
      const updated = addClipComment(clip.id, commentText);
      setComments(updated);
      setCommentInput('');
      setIsSubmittingComment(false);

      // Save new comment to Supabase database
      if (updated.length > 0) {
        saveCommentToSupabase(clip.id, updated[0]).catch(err => console.warn('Supabase comment sync error:', err));
      }
    }, 200);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = clip.videoUrl;
    a.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_islandheat.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const relatedClips = allClips.filter(c => c.id !== clip.id).slice(0, 4);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl rounded-3xl bg-zinc-950 border border-orange-500/30 text-white shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
        id="video-theatre-modal"
      >
        {/* Top Header Controls */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-black/70 hover:bg-orange-500 text-white backdrop-blur-md transition border border-white/10 shadow-lg"
            id="close-theatre-modal-btn"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">
          {/* Main Video Stage (Left 2 Columns) */}
          <div 
            ref={playerContainerRef}
            className="lg:col-span-2 relative bg-black flex flex-col justify-center items-center min-h-[380px] lg:min-h-[580px] overflow-hidden group select-none"
          >
            {/* Video Element or Compressing Poster State */}
            {isVideoError ? (
              <div className="relative w-full h-full min-h-[380px] lg:min-h-[580px] flex flex-col items-center justify-center bg-zinc-950 overflow-hidden group select-none">
                <img
                  src={clip.posterUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'}
                  alt={clip.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
                <div className="relative z-20 flex flex-col items-center justify-center p-6 max-w-sm text-center bg-zinc-950/90 border border-orange-500/40 rounded-3xl shadow-2xl backdrop-blur-xl space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-2">
                      <Film className="w-4 h-4 text-orange-400" />
                      Video Compressing
                    </h4>
                    <p className="text-xs text-orange-200/90 mt-1.5 font-medium leading-relaxed">
                      This video is currently processing & compressing into HD 60FPS. Please come back soon!
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[11px] font-mono text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Processing High Bitrate Stream...</span>
                  </div>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                key={videoSourceUrl}
                autoPlay
                loop={isAutoLoop}
                muted={isMuted}
                playsInline
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onClick={togglePlay}
                onError={() => {
                  console.warn('[VideoModal] Video source error for URL:', videoSourceUrl);
                  setIsVideoError(true);
                }}
                className="w-full h-full max-h-[75vh] object-contain cursor-pointer"
              >
                <source src={videoSourceUrl} type={getVideoMimeType(videoSourceUrl)} />
                <source src={videoSourceUrl} type="video/mp4" />
              </video>
            )}

            {/* Floating Heat & Island Sun Audio HUD */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowHeatMenu(!showHeatMenu)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 hover:bg-black/95 backdrop-blur-md border border-orange-500/50 hover:border-orange-400 text-xs font-mono font-bold text-orange-400 shadow-lg cursor-pointer transition active:scale-95"
                  title="Steam Heat & Playback Settings"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
                  <span>{loopsCompleted.toLocaleString()} Steams</span>
                </button>

                {/* Interactive Steam & Heat Stats Dropdown Menu */}
                {showHeatMenu && (
                  <div 
                    className="absolute top-9 left-0 w-64 bg-zinc-950/95 border border-orange-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl z-40 text-xs space-y-2.5 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="font-bold text-white flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" /> Steam Heat & Playback
                      </span>
                      <button onClick={() => setShowHeatMenu(false)} className="text-zinc-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Auto Loop Toggle */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="font-semibold text-zinc-200 text-[11px]">Auto-Repeat Steam</p>
                        <p className="text-[10px] text-zinc-500">Loop continuously on end</p>
                      </div>
                      <button
                        onClick={() => setIsAutoLoop(!isAutoLoop)}
                        className={`w-9 h-5 rounded-full p-0.5 transition cursor-pointer ${isAutoLoop ? 'bg-orange-500' : 'bg-zinc-800'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition transform ${isAutoLoop ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Heat Statistics */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
                      <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                        <p className="text-[10px] text-zinc-400">Total Steams</p>
                        <p className="text-sm font-black text-orange-400 mt-0.5">{loopsCompleted.toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                        <p className="text-[10px] text-zinc-400">Island Heat Index</p>
                        <p className="text-sm font-black text-amber-400 mt-0.5">🔥 99.4%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {clip.hasAudio && (
                <SoundWave isPlaying={isPlaying && !isMuted} size="md" />
              )}
            </div>

            {/* Video Play/Pause Overlay Icon on click */}
            {!isPlaying && (
              <div 
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-orange-500/90 text-white flex items-center justify-center cursor-pointer shadow-2xl backdrop-blur-sm transition transform hover:scale-110"
              >
                <Play className="w-10 h-10 ml-1" />
              </div>
            )}

            {/* Player Controls Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 flex flex-col gap-2 transition-opacity duration-300 opacity-90 group-hover:opacity-100 z-20">
              {/* Progress Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-amber-400 transition"
              />

              <div className="flex items-center justify-between mt-1 text-xs text-zinc-200">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="hover:text-orange-400 transition">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>

                  {clip.hasAudio && (
                    <button onClick={toggleMute} className="hover:text-amber-400 transition">
                      {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
                    </button>
                  )}

                  <span className="font-mono text-zinc-400 text-[11px]">
                    0:{clip.duration < 10 ? `0${clip.duration}` : clip.duration} HD
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Playback speed selector */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="flex items-center gap-1 font-mono text-xs px-2 py-1 rounded bg-zinc-800/80 hover:bg-orange-500/20 hover:text-orange-400 border border-zinc-700 transition"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      {playbackSpeed}x
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-8 right-0 bg-zinc-900 border border-orange-500/30 rounded-xl p-1 shadow-2xl flex flex-col gap-1 z-30 min-w-[80px]">
                        {[0.25, 0.5, 1, 1.25, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setPlaybackSpeed(s);
                              setShowSpeedMenu(false);
                            }}
                            className={`px-3 py-1 text-xs rounded-lg text-left transition font-mono ${
                              playbackSpeed === s ? 'bg-orange-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="hover:text-amber-400 transition">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Controls & Comments */}
          <div className="p-5 flex flex-col justify-between bg-zinc-900/90 border-l border-zinc-800/80 overflow-y-auto max-h-[80vh] custom-scrollbar">
            <div>
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
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div 
                      onClick={() => {
                        if (onOpenCreatorProfile) onOpenCreatorProfile(displayCreatorUsername);
                      }}
                      className="flex items-center gap-3 cursor-pointer group/creator"
                    >
                      <img 
                        src={displayCreatorAvatar} 
                        alt={displayCreatorName} 
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/60 group-hover/creator:scale-105 transition-transform"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white group-hover/creator:text-orange-400 transition">{displayCreatorName}</h4>
                          {isCreatorVerified && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <p className="text-xs text-orange-400 font-mono">@{displayCreatorUsername}</p>
                      </div>
                    </div>

                    {isOwnClip ? (
                      <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold font-mono">
                        Your Steam
                      </span>
                    ) : (
                      <button 
                        onClick={() => {
                          if (onToggleFollowCreator) onToggleFollowCreator(clip.creator.username);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-sm ${
                          isFollowingCreator 
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:text-red-400 hover:border-red-500/50' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                        id={`theatre-follow-btn-${clip.creator.username}`}
                      >
                        {isFollowingCreator ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Title & Description */}
              <div className="mt-4">
                <h2 className="text-lg font-bold text-white leading-snug">
                  {clip.title}
                </h2>
                {clip.description && (
                  <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                    {clip.description}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {clip.tags.map((t, i) => (
                    <span 
                      key={i}
                      onClick={() => {
                        if (onSelectTag) onSelectTag(t);
                      }}
                      className="px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-400 text-xs font-medium cursor-pointer transition"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>


              {/* Action Buttons Bar */}
              {(() => {
                const canDelete = canUserDeleteContent(clip.creator?.username, activeUser);
                const handleDeleteModalClip = () => {
                  if (window.confirm(`Are you sure you want to delete "${clip.title}"? This cannot be undone.`)) {
                    deleteStoredClip(clip.id);
                    onClose();
                  }
                };

                return (
                  <div className={`grid ${canDelete ? 'grid-cols-5' : 'grid-cols-4'} gap-2 mt-5 p-2 rounded-2xl bg-zinc-950 border border-zinc-800`}>
                    <button
                      onClick={() => onLikeToggle(clip.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
                        isLiked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                      <span className="text-[10px] font-bold mt-1">{clip.likes + (isLiked ? 1 : 0)}</span>
                    </button>

                    <button
                      onClick={() => onSaveToggle(clip.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
                        isSaved ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current text-amber-400' : ''}`} />
                      <span className="text-[10px] font-bold mt-1">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => onOpenShare(clip)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 transition"
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="text-[10px] font-bold mt-1">Share</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition"
                    >
                      <Download className="w-5 h-5" />
                      <span className="text-[10px] font-bold mt-1">MP4</span>
                    </button>

                    {canDelete && (
                      <button
                        onClick={handleDeleteModalClip}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition"
                        title="Delete Video"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span className="text-[10px] font-bold mt-1">Delete</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Comments Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-orange-400" />
                    Comments ({comments.length})
                  </h3>
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim() || isSubmittingComment}
                    className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {comments.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400">
                      <p className="font-medium text-zinc-300">No comments yet</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Be the first to share your thoughts on this steam!</p>
                    </div>
                  ) : (
                    comments.map((comm) => (
                      <div key={comm.id} className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-xs">
                        <div className="flex items-center justify-between text-zinc-400">
                          <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                            <img src={comm.avatar} alt={comm.user} className="w-4 h-4 rounded-full" />
                            <span>{comm.user}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">{comm.createdAt}</span>
                        </div>
                        <p className="mt-1 text-zinc-300 text-xs pl-5">{comm.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Related Clips Grid at bottom */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                More Island Steams
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {relatedClips.map((rc) => (
                  <div
                    key={rc.id}
                    onClick={() => onSelectClip(rc)}
                    className="group relative rounded-xl overflow-hidden aspect-video bg-black cursor-pointer border border-zinc-800 hover:border-orange-500 transition"
                  >
                    <img 
                      src={rc.posterUrl} 
                      alt={rc.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-1.5 flex flex-col justify-end">
                      <p className="text-[10px] font-bold text-white line-clamp-1">{rc.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

