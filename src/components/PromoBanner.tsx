import React from 'react';
import { Sparkles, Flame, ArrowRight, Zap, X } from 'lucide-react';

interface PromoBannerProps {
  onOpenLive: () => void;
  onOpenTokenStore: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  onOpenLive,
  onOpenTokenStore,
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed) return null;

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 border-b border-red-900/30 text-white select-none">
      {/* Background Subtle Stars / Sparkles Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Left announcement text */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600/30 text-red-400 shrink-0">
            <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
          </span>
          <div className="flex items-center gap-2 truncate">
            <span className="font-black tracking-wide text-zinc-100 hidden sm:inline">
              Caribbean Steam Loops & VIP Live is here
            </span>
            <span className="font-bold tracking-wide text-zinc-100 sm:hidden">
              VIP Caribbean Steam Loops
            </span>
            <span className="text-zinc-400 hidden md:inline">•</span>
            <span className="text-red-400 font-semibold hidden md:inline">
              60fps High Bitrate 4K Loops + Private Shows
            </span>
          </div>
        </div>

        {/* Right CTA button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenLive}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-[11px] uppercase tracking-wider shadow-md hover:shadow-red-500/20 transition transform active:scale-95"
          >
            <Sparkles className="w-3 h-3 fill-white" />
            <span>VIP Live Shows</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded-md transition"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
