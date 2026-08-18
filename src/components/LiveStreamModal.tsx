import React, { useState } from 'react';
import { X, Radio, Eye, Heart, MessageSquare, Send, Sparkles, Lock, Gift, Volume2, VolumeX } from 'lucide-react';
import { UserAccount } from '../types';

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserAccount;
  onOpenTokenStore: () => void;
}

interface StreamModel {
  id: string;
  name: string;
  username: string;
  avatar: string;
  viewers: number;
  tags: string[];
  island: string;
  isVIPOnly?: boolean;
  currentGoal: {
    current: number;
    target: number;
    action: string;
  };
  videoUrl: string;
  posterUrl: string;
}

const MOCK_LIVE_MODELS: StreamModel[] = [
  {
    id: 'live-1',
    name: 'Aisha Kingston 🇯🇲',
    username: 'aisha_jamaica',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    viewers: 1420,
    tags: ['Jamaica', 'Dancehall', 'VIP Lounge', 'Private Chat'],
    island: 'Montego Bay, Jamaica',
    currentGoal: { current: 350, target: 500, action: 'Beach Bikini Bikini Dance 💃' },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'live-2',
    name: 'Rina Raye ✨',
    username: 'rinaraye',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    viewers: 2890,
    tags: ['Exclusive', '60fps', 'Sunset VIP', 'HD Cam'],
    island: 'Bridgetown, Barbados',
    isVIPOnly: true,
    currentGoal: { current: 820, target: 1000, action: 'Private Island Q&A + Oil Show 🔥' },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'live-3',
    name: 'Tanya Trini 🇹🇹',
    username: 'trini_nights',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    viewers: 940,
    tags: ['Trinidad', 'Carnival', 'Late Night', 'Soca'],
    island: 'Port of Spain, Trinidad',
    currentGoal: { current: 180, target: 400, action: 'Carnival Costume Reveal ✨' },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  }
];

export const LiveStreamModal: React.FC<LiveStreamModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onOpenTokenStore,
}) => {
  const [selectedStream, setSelectedStream] = useState<StreamModel>(MOCK_LIVE_MODELS[0]);
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; text: string; isTip?: boolean; tokens?: number }>>([
    { user: 'KingstonVIP', text: 'Love the stream vibes today! 🔥' },
    { user: 'CaribbeanLover', text: 'Sending island love from Miami! 🌴', isTip: true, tokens: 50 },
    { user: 'IslandBoss', text: 'You look amazing today!' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [tipSuccess, setTipSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setChatMessages(prev => [
      ...prev,
      { user: activeUser.displayName || 'Guest User', text: inputMessage.trim() }
    ]);
    setInputMessage('');
  };

  const handleTip = (amount: number) => {
    if (activeUser.tokensBalance < amount) {
      onOpenTokenStore();
    } else {
      setTipSuccess(`Sent ${amount} Tokens Tip to @${selectedStream.username}! 🎉`);
      setChatMessages(prev => [
        ...prev,
        { user: activeUser.displayName || 'You', text: `Tipped ${amount} Tokens! 🎁💖`, isTip: true, tokens: amount }
      ]);
      setTimeout(() => setTipSuccess(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-black tracking-wider animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              LIVE 🔞
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Caribbean VIP Live Streams
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-black font-black">
                  60 FPS HD
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenTokenStore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black text-xs shadow-md hover:scale-105 transition"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              Tokens: {activeUser.tokensBalance}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Main Video Stage */}
          <div className="lg:col-span-8 flex flex-col bg-black relative border-b lg:border-b-0 lg:border-r border-zinc-800">
            {/* Stream Player */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              <video
                src={selectedStream.videoUrl}
                poster={selectedStream.posterUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain max-h-[60vh] lg:max-h-full"
              />

              {/* Overlay badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  LIVE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1 border border-white/10">
                  <Eye className="w-3.5 h-3.5 text-red-400" />
                  {selectedStream.viewers.toLocaleString()} watching
                </span>
              </div>

              {/* Sound toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/10 hover:bg-black/90 transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Tip toast */}
              {tipSuccess && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-emerald-500 text-black font-black text-xs shadow-xl animate-bounce">
                  {tipSuccess}
                </div>
              )}

              {/* Stream goal bottom overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    🎯 Goal: {selectedStream.currentGoal.action}
                  </span>
                  <span className="font-mono text-yellow-400 font-bold">
                    {selectedStream.currentGoal.current} / {selectedStream.currentGoal.target} Tokens
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (selectedStream.currentGoal.current / selectedStream.currentGoal.target) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Streamer details and tip shortcuts */}
            <div className="p-3 sm:p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStream.avatar}
                  alt={selectedStream.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500"
                />
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    {selectedStream.name}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {selectedStream.island}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">@{selectedStream.username}</p>
                </div>
              </div>

              {/* Tip options */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 hidden sm:inline">Send Tip:</span>
                {[25, 50, 100, 250].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleTip(amt)}
                    className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-yellow-400 hover:text-black text-zinc-200 font-bold text-xs border border-zinc-700 transition flex items-center gap-1"
                  >
                    <Gift className="w-3 h-3 text-yellow-400 group-hover:text-black" />
                    {amt} 🪙
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat & Stream Switcher */}
          <div className="lg:col-span-4 flex flex-col bg-zinc-950 min-h-0">
            {/* Model Selector Bar */}
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/40">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Switch Live Model:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {MOCK_LIVE_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedStream(model)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition ${
                      selectedStream.id === model.id
                        ? 'bg-red-500/20 border-red-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <img src={model.avatar} alt={model.name} className="w-5 h-5 rounded-full object-cover" />
                    <span>{model.name.split(' ')[0]}</span>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  </button>
                ))}
              </div>
            </div>

            {/* Live Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-[160px] custom-scrollbar text-xs">
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[11px]">
                🔒 Welcome to VIP Island Live Chat! Maintain respectful conversation. Tips highlight your messages.
              </div>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-xl border ${
                    msg.isTip
                      ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/40 text-yellow-200'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-white flex items-center gap-1">
                      {msg.user}
                      {msg.isTip && <Sparkles className="w-3 h-3 text-yellow-400" />}
                    </span>
                    {msg.tokens && (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-mono text-[10px] font-bold">
                        +{msg.tokens} Tokens
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-200">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Send Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
