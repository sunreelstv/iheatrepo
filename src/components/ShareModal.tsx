import React, { useState } from 'react';
import { X, Copy, Check, Code, ExternalLink, Share2, Download, CheckCircle2, Play, Send } from 'lucide-react';
import { VideoClip } from '../types';

interface ShareModalProps {
  clip: VideoClip | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ clip, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [embedAutoplay, setEmbedAutoplay] = useState(true);
  const [embedMute, setEmbedMute] = useState(true);

  if (!clip) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://redgifs.io';
  const directUrl = `${currentOrigin}/#v=${clip.id}`;
  const shortCodeUrl = `https://redgifs.io/v/${clip.id}`;
  const shareText = `🔥 Check out "${clip.title}" on RedGifs Loop Platform!\n\n${directUrl}`;
  const embedCode = `<iframe src="${directUrl}&embed=1&autoplay=${embedAutoplay ? 1 : 0}&muted=${embedMute ? 1 : 0}" width="640" height="360" frameborder="0" allowfullscreen allow="autoplay"></iframe>`;
  const markdownCode = `[![${clip.title}](${clip.posterUrl})](${directUrl})`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: clip.title,
          text: `Watch "${clip.title}" by @${clip.creator.username}`,
          url: directUrl,
        });
      } catch (e) {
        // Fallback copy
        handleCopy(directUrl, 'direct');
      }
    } else {
      handleCopy(directUrl, 'direct');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = clip.videoUrl;
    a.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_loop.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const socialLinks = [
    {
      name: 'X (Twitter)',
      icon: '𝕏',
      color: 'bg-zinc-800 hover:bg-zinc-700 text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 ${clip.title}\n\n`)}&url=${encodeURIComponent(directUrl)}`
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}`)}`
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-sky-600 hover:bg-sky-500 text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(directUrl)}&text=${encodeURIComponent(clip.title)}`
    },
    {
      name: 'Reddit',
      icon: '🤖',
      color: 'bg-orange-600 hover:bg-orange-500 text-white',
      url: `https://reddit.com/submit?url=${encodeURIComponent(directUrl)}&title=${encodeURIComponent(clip.title)}`
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-orange-500/30 dark:bg-zinc-900 dark:border-orange-500/30 light:bg-white light:border-zinc-200 text-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        id="share-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 dark:border-zinc-800 light:border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white dark:text-white light:text-zinc-900">
                Share Looping Clip
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-xs">{clip.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            id="close-share-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Share Card Preview (Thumbnail + Title + Creator) */}
        <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5 shadow-inner">
          <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-orange-500/30 bg-black">
            <img 
              src={clip.posterUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'} 
              alt={clip.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow">
                <Play className="w-3 h-3 fill-white ml-0.5" />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">{clip.title}</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">by @{clip.creator.username} • {clip.category}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
              Autoplay Ready • 4K HD
            </span>
          </div>
        </div>

        {/* Social Quick Share Buttons */}
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Quick Social Share
          </label>
          <div className="grid grid-cols-4 gap-2">
            {socialLinks.map((s, idx) => (
              <a 
                key={idx}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold transition shadow ${s.color}`}
              >
                <span className="text-base mb-0.5">{s.icon}</span>
                <span className="text-[10px]">{s.name}</span>
              </a>
            ))}
          </div>

          {/* Web Share Native Button */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="mt-2 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-orange-400" />
              Share via System / Mobile Apps
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {/* Direct Link with Thumbnail Preview metadata */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
              Direct Link (Includes Thumbnail Preview)
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={directUrl}
                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none"
              />
              <button
                onClick={() => handleCopy(directUrl, 'direct')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition shadow-md whitespace-nowrap"
                id="copy-direct-link-btn"
              >
                {copiedType === 'direct' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedType === 'direct' ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Short Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1.5">
              Short RedGifs URL
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={shortCodeUrl}
                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none font-mono"
              />
              <button
                onClick={() => handleCopy(shortCodeUrl, 'short')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md whitespace-nowrap"
                id="copy-short-link-btn"
              >
                {copiedType === 'short' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedType === 'short' ? 'Copied' : 'Copy Short'}
              </button>
            </div>
          </div>

          {/* Embed Code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Code className="w-3.5 h-3.5" /> HTML Embed Code (Autoplay Ready)
              </label>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={embedAutoplay} 
                    onChange={e => setEmbedAutoplay(e.target.checked)}
                    className="accent-orange-500 rounded"
                  />
                  Autoplay
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={embedMute} 
                    onChange={e => setEmbedMute(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  Muted
                </label>
              </div>
            </div>
            <textarea 
              readOnly 
              rows={2}
              value={embedCode}
              className="w-full p-2.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-300 font-mono focus:outline-none resize-none"
            />
            <div className="flex justify-end mt-1.5">
              <button
                onClick={() => handleCopy(embedCode, 'embed')}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition flex items-center gap-1"
                id="copy-embed-code-btn"
              >
                {copiedType === 'embed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'embed' ? 'Copied Embed Code' : 'Copy Embed Code'}
              </button>
            </div>
          </div>

          {/* Markdown Code for Reddit/Forums */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Reddit / Forum Markdown (Thumbnail Preview Linked)
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={markdownCode}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono focus:outline-none"
              />
              <button
                onClick={() => handleCopy(markdownCode, 'markdown')}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition whitespace-nowrap"
              >
                {copiedType === 'markdown' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Action Buttons: Download Video File */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 text-white shadow-lg transition transform active:scale-95"
              id="download-video-btn"
            >
              <Download className="w-4 h-4" />
              Download High Quality MP4 Clip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
