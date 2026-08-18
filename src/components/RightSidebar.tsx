import React from 'react';
import { Sparkles, UserPlus, UserCheck, Flame, ExternalLink, CheckCircle2, ChevronRight, Coins } from 'lucide-react';
import { VideoClip, UserAccount } from '../types';
import { MOCK_NICHES } from '../data/mockClips';

interface RightSidebarProps {
  clips: VideoClip[];
  followedCreators: string[];
  onToggleFollow: (username: string, e: React.MouseEvent) => void;
  onOpenCreatorProfile: (username: string) => void;
  onOpenTokenStore: () => void;
  onSelectTag: (tag: string) => void;
  onOpenNiches?: () => void;
  activeUser: UserAccount;
}

interface FeaturedCreator {
  name: string;
  username: string;
  avatar: string;
  subCount: string;
  tags: string[];
  isOF?: boolean;
  island: string;
  bio: string;
}

const FEATURED_CREATORS: FeaturedCreator[] = [
  {
    name: 'Rina Raye ✨',
    username: 'rinaraye',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    subCount: '84.2K',
    tags: ['Amateur', 'Glamour', 'VIP'],
    isOF: true,
    island: 'Barbados',
    bio: 'Sweet smile, surprise steam loops. Daily exclusive 60fps.',
  },
  {
    name: 'Aisha Kingston 🇯🇲',
    username: 'aisha_jamaica',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    subCount: '62.8K',
    tags: ['JamaicaHeat', 'Beach', 'Dancehall'],
    isOF: true,
    island: 'Jamaica',
    bio: 'Montego Bay vibes & private beach loops.',
  },
  {
    name: 'Tanya Trini 🇹🇹',
    username: 'trini_nights',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    subCount: '49.1K',
    tags: ['Carnival', '4K', 'Soca'],
    isOF: true,
    island: 'Trinidad',
    bio: 'Port of Spain carnival queen.',
  },
  {
    name: 'Chloe Bajan 🇧🇧',
    username: 'bajan_vibes',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    subCount: '31.5K',
    tags: ['Sunset', 'Surfing', 'Ocean'],
    isOF: true,
    island: 'Barbados',
    bio: 'Golden hour waves & Island steam.',
  },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  clips,
  followedCreators,
  onToggleFollow,
  onOpenCreatorProfile,
  onOpenTokenStore,
  onSelectTag,
  onOpenNiches,
  activeUser,
}) => {
  return (
    <aside className="hidden xl:flex flex-col w-72 2xl:w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar p-4 space-y-5 select-none z-20">
      {/* Featured Creators Card (Matches RedGIFs "Onlyfans creators you might enjoy:") */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-white dark:text-white light:text-zinc-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Creators you might enjoy:
          </h3>
          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            VIP Only
          </span>
        </div>

        <div className="space-y-3">
          {FEATURED_CREATORS.map((creator) => {
            const isFollowed = followedCreators.includes(creator.username.toLowerCase());

            return (
              <div
                key={creator.username}
                className="group relative p-3 rounded-2xl bg-zinc-950/80 dark:bg-zinc-950/80 light:bg-white border border-zinc-800/80 hover:border-red-500/50 transition-all cursor-pointer shadow-md"
                onClick={() => onOpenCreatorProfile(creator.username)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-red-500/40 group-hover:scale-105 transition-transform"
                    />
                    {creator.isOF && (
                      <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-sky-500 text-[8px] font-black text-white uppercase tracking-tighter shadow">
                        OF
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-xs text-white dark:text-white light:text-zinc-900 truncate">
                        {creator.name}
                      </h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">@{creator.username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-red-400 font-bold">{creator.island}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {creator.subCount} fans
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                <p className="text-[11px] text-zinc-300 dark:text-zinc-300 light:text-zinc-600 mt-2 line-clamp-1 italic">
                  "{creator.bio}"
                </p>

                {/* Quick Follow Button */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 overflow-hidden">
                    {creator.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 truncate"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFollow(creator.username, e);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-black transition flex items-center gap-1 shrink-0 ${
                      isFollowed
                        ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md hover:scale-105'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending Caribbean Niches */}
      <div className="p-4 rounded-3xl bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 
            onClick={onOpenNiches}
            className="text-xs font-black uppercase tracking-wider text-white dark:text-white light:text-zinc-900 flex items-center gap-1.5 cursor-pointer hover:text-red-400 transition"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            Trending Niches
          </h3>
          <button 
            onClick={onOpenNiches}
            className="text-[10px] text-zinc-400 hover:text-red-400 font-bold transition cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="space-y-1.5">
          {MOCK_NICHES.slice(0, 5).map((niche) => (
            <button
              key={niche.id}
              onClick={() => {
                if (onOpenNiches) {
                  onOpenNiches();
                } else {
                  onSelectTag(niche.title.split(' ')[0]);
                }
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950/50 hover:bg-zinc-800 text-left transition group border border-transparent hover:border-zinc-700"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={niche.avatar}
                  alt={niche.title}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-zinc-700"
                />
                <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                  {niche.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 group-hover:text-orange-400">
                {niche.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Token Top Up Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-white">Your Wallet</span>
          </div>
          <span className="text-xs font-mono font-black text-yellow-400">
            {activeUser.tokensBalance} 🪙
          </span>
        </div>
        <p className="text-[11px] text-zinc-300">
          Top up tokens to unlock 4K clips and tip creators during live streams.
        </p>
        <button
          onClick={onOpenTokenStore}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black font-black text-xs hover:scale-105 transition shadow-lg flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 fill-black" />
          Buy Tokens (Instant VIP)
        </button>
      </div>
    </aside>
  );
};
