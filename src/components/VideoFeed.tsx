import React from 'react';
import { 
  Flame, 
  Sparkles, 
  SlidersHorizontal, 
  Volume2, 
  Grid, 
  Layers, 
  Filter, 
  UserCheck, 
  Users, 
  Clock, 
  TrendingUp, 
  Star, 
  Compass, 
  Radio
} from 'lucide-react';
import { VideoClip, FilterState, SortOption, OrientationFilter, FeedViewMode, UserAccount } from '../types';
import { POPULAR_TAGS } from '../data/mockClips';
import { VideoCard } from './VideoCard';

interface VideoFeedProps {
  clips: VideoClip[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  likedClipIds: string[];
  savedClipIds: string[];
  followedCreators: string[];
  activeUser?: UserAccount;
  onLikeToggle: (id: string, e: React.MouseEvent) => void;
  onSaveToggle: (id: string, e: React.MouseEvent) => void;
  onToggleFollowCreator: (username: string, e: React.MouseEvent) => void;
  onSelectClip: (clip: VideoClip) => void;
  onShareClip: (clip: VideoClip, e: React.MouseEvent) => void;
  onOpenCreatorProfile: (username: string) => void;
  onOpenLive?: () => void;
}

type MainSubTab = 'for_you' | 'trending' | 'latest' | 'following' | 'top_rated';

export const VideoFeed: React.FC<VideoFeedProps> = ({
  clips,
  filters,
  onFilterChange,
  likedClipIds,
  savedClipIds,
  followedCreators,
  activeUser,
  onLikeToggle,
  onSaveToggle,
  onToggleFollowCreator,
  onSelectClip,
  onShareClip,
  onOpenCreatorProfile,
  onOpenLive,
}) => {
  // Determine current active subtab from filters
  let activeSubTab: MainSubTab = 'trending';
  if (filters.feedMode === 'following') {
    activeSubTab = 'following';
  } else if (filters.sort === 'latest') {
    activeSubTab = 'latest';
  } else if (filters.sort === 'top_liked' || filters.sort === 'most_viewed') {
    activeSubTab = 'top_rated';
  } else if (filters.category !== 'All' || filters.tag) {
    activeSubTab = 'for_you';
  }

  const handleSubTabClick = (tab: MainSubTab) => {
    if (tab === 'for_you') {
      onFilterChange({ feedMode: 'all', sort: 'trending', tag: '', category: 'All' });
    } else if (tab === 'trending') {
      onFilterChange({ feedMode: 'all', sort: 'trending' });
    } else if (tab === 'latest') {
      onFilterChange({ feedMode: 'all', sort: 'latest' });
    } else if (tab === 'following') {
      onFilterChange({ feedMode: 'following' });
    } else if (tab === 'top_rated') {
      onFilterChange({ feedMode: 'all', sort: 'top_liked' });
    }
  };

  return (
    <section className="w-full max-w-full px-2 sm:px-4 lg:px-6 py-3 sm:py-5">
      {/* 1. RedGIFs Subheader Navigation Tabs ("For You" | "Trending" | "Latest" | "Following" | "Top Rated") */}
      <div className="flex items-center justify-center sm:justify-start border-b border-zinc-800/80 mb-4 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-6 sm:gap-10 min-w-max px-2">
          {/* For You */}
          <button
            onClick={() => handleSubTabClick('for_you')}
            className={`py-3 text-sm sm:text-base font-bold transition-all relative ${
              activeSubTab === 'for_you'
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>For You</span>
            {activeSubTab === 'for_you' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>

          {/* Trending (Active in screenshot!) */}
          <button
            onClick={() => handleSubTabClick('trending')}
            className={`py-3 text-sm sm:text-base font-bold transition-all relative flex items-center gap-1.5 ${
              activeSubTab === 'trending'
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Trending</span>
            {activeSubTab === 'trending' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>

          {/* Latest */}
          <button
            onClick={() => handleSubTabClick('latest')}
            className={`py-3 text-sm sm:text-base font-bold transition-all relative ${
              activeSubTab === 'latest'
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Latest</span>
            {activeSubTab === 'latest' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>

          {/* Following */}
          <button
            onClick={() => handleSubTabClick('following')}
            className={`py-3 text-sm sm:text-base font-bold transition-all relative flex items-center gap-1.5 ${
              activeSubTab === 'following'
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Following</span>
            {followedCreators.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {followedCreators.length}
              </span>
            )}
            {activeSubTab === 'following' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>

          {/* Top Rated */}
          <button
            onClick={() => handleSubTabClick('top_rated')}
            className={`py-3 text-sm sm:text-base font-bold transition-all relative ${
              activeSubTab === 'top_rated'
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Top Rated</span>
            {activeSubTab === 'top_rated' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Popular Tags Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar">
        <span className="text-xs font-bold text-red-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 fill-red-500" />
          Tags:
        </span>
        {POPULAR_TAGS.map((tag, idx) => {
          const isSelected = filters.tag === tag || (filters.searchQuery ? filters.searchQuery.toLowerCase().includes(tag.toLowerCase()) : false);
          return (
            <button
              key={idx}
              onClick={() => {
                if (filters.tag === tag) {
                  onFilterChange({ tag: '' });
                } else {
                  onFilterChange({ tag, searchQuery: '' });
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 border ${
                isSelected 
                  ? 'bg-red-600 text-white border-red-500 shadow-md font-bold' 
                  : 'bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 border-zinc-800 dark:border-zinc-800 light:border-zinc-300 hover:border-red-500'
              }`}
            >
              #{tag}
            </button>
          );
        })}
        {(filters.tag || filters.searchQuery) && (
          <button
            onClick={() => onFilterChange({ tag: '', searchQuery: '' })}
            className="text-xs text-orange-400 underline font-medium shrink-0 ml-1"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* 3. Filter & Sort Quick Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Feed Mode Indicator if following */}
          {filters.feedMode === 'following' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              Showing Following Feed ({followedCreators.length} followed)
            </span>
          )}

          {/* Orientation Ratio Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 font-medium">Aspect:</span>
            <select
              value={filters.orientation}
              onChange={(e) => onFilterChange({ orientation: e.target.value as OrientationFilter })}
              className="px-2.5 py-1 rounded-xl bg-zinc-950 dark:bg-zinc-950 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-300 text-zinc-200 dark:text-zinc-200 light:text-zinc-900 focus:outline-none focus:border-red-500 font-medium"
            >
              <option value="all">All Ratios</option>
              <option value="horizontal">Horizontal (16:9)</option>
              <option value="vertical">Vertical (9:16)</option>
              <option value="square">Square (1:1)</option>
            </select>
          </div>

          {/* Audio toggle */}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-800 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={filters.hasAudioOnly}
              onChange={(e) => onFilterChange({ hasAudioOnly: e.target.checked })}
              className="w-3.5 h-3.5 accent-red-500 rounded"
            />
            <Volume2 className="w-3.5 h-3.5 text-red-400" />
            Sound Only
          </label>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Sort:</span>
          <div className="flex p-0.5 rounded-xl bg-zinc-950 dark:bg-zinc-950 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-zinc-300">
            {(['trending', 'latest', 'most_viewed', 'top_liked'] as SortOption[]).map((sortOpt) => (
              <button
                key={sortOpt}
                onClick={() => onFilterChange({ sort: sortOpt })}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition ${
                  filters.sort === sortOpt
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {sortOpt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Video Clips Grid */}
      {clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/40 my-6">
          {filters.feedMode === 'following' ? (
            <>
              <Users className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-white">No clips in your Following Feed</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                You are currently following {followedCreators.length} creators, but no clips match the active filter.
              </p>
              <button
                onClick={() => onFilterChange({ feedMode: 'all', category: 'All', tag: '', searchQuery: '' })}
                className="mt-4 px-5 py-2.5 rounded-full font-bold text-xs bg-red-600 text-white shadow-lg"
              >
                Explore All Creators
              </button>
            </>
          ) : (
            <>
              <Sparkles className="w-12 h-12 text-orange-400 mb-3 animate-pulse" />
              <h3 className="text-lg font-bold text-white">No looping clips found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Try searching another tag, creator, or island niche!
              </p>
              <button
                onClick={() => onFilterChange({ category: 'All', tag: '', searchQuery: '', orientation: 'all', hasAudioOnly: false })}
                className="mt-4 px-5 py-2.5 rounded-full font-bold text-xs bg-red-600 text-white shadow-lg"
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-5">
          {clips.map((clip) => (
            <VideoCard
              key={clip.id}
              clip={clip}
              isLiked={likedClipIds.includes(clip.id)}
              isSaved={savedClipIds.includes(clip.id)}
              isFollowingCreator={followedCreators.includes(clip.creator.username.toLowerCase())}
              activeUser={activeUser}
              onLikeToggle={onLikeToggle}
              onSaveToggle={onSaveToggle}
              onToggleFollowCreator={onToggleFollowCreator}
              onSelect={onSelectClip}
              onShare={onShareClip}
              onOpenCreatorProfile={(username) => onOpenCreatorProfile(username)}
              onSelectTag={(tag) => onFilterChange({ tag })}
            />
          ))}
        </div>
      )}
    </section>
  );
};
