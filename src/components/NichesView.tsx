import React, { useState } from 'react';
import { Flame, Sparkles, TrendingUp, Search, Layers, Compass, Play, Grid, Film, ArrowRight } from 'lucide-react';
import { VideoClip, FilterState } from '../types';
import { MOCK_NICHES, POPULAR_TAGS } from '../data/mockClips';

interface NichesViewProps {
  clips: VideoClip[];
  onSelectCategory: (category: string) => void;
  onSelectTag: (tag: string) => void;
  onSelectClip: (clip: VideoClip) => void;
  onOpenSteam: () => void;
}

export const NichesView: React.FC<NichesViewProps> = ({
  clips,
  onSelectCategory,
  onSelectTag,
  onSelectClip,
  onOpenSteam,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');
  const [viewFormat, setViewFormat] = useState<'grid' | 'cards' | 'compact'>('grid');

  // Enrich MOCK_NICHES with real clips count and top preview video
  const enrichedNiches = MOCK_NICHES.map((niche) => {
    // Extract base name, e.g. "Jamaica", "Trinidad", etc.
    const key = niche.id.toLowerCase();
    const matchingClips = clips.filter(c => 
      c.category.toLowerCase().includes(key) ||
      c.tags.some(t => t.toLowerCase().includes(key)) ||
      c.title.toLowerCase().includes(key)
    );

    const totalViews = matchingClips.reduce((acc, c) => acc + c.views, 0);
    const totalLoops = matchingClips.reduce((acc, c) => acc + c.loopsCount, 0);
    const previewClip = matchingClips[0] || clips[0];

    return {
      ...niche,
      realCount: matchingClips.length,
      totalViews,
      totalLoops,
      previewClip,
      tags: [niche.id, 'VIP', 'Steam', '4K', 'Caribbean'],
    };
  });

  // Filter niches based on user search query
  const filteredNiches = enrichedNiches.filter((niche) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      niche.title.toLowerCase().includes(q) ||
      niche.id.toLowerCase().includes(q) ||
      niche.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const categoriesList = [
    { name: 'All Island Niches', key: 'All', count: clips.length },
    { name: 'Jamaica Heat 🇯🇲', key: 'Jamaica Heat', count: clips.filter(c => c.category === 'Jamaica Heat').length },
    { name: 'Trinidad Spice 🇹🇹', key: 'Trinidad Spice', count: clips.filter(c => c.category === 'Trinidad Spice').length },
    { name: 'Dominican Temptation 🇩🇴', key: 'Dominican Temptation', count: clips.filter(c => c.category === 'Dominican Temptation').length },
    { name: 'Barbados Babes 🇧🇧', key: 'Barbados Babes', count: clips.filter(c => c.category === 'Barbados Babes').length },
    { name: 'Bahamas Paradise 🇧🇸', key: 'Bahamas Paradise', count: clips.filter(c => c.category === 'Bahamas Paradise').length },
    { name: 'Puerto Rico Passion 🇵🇷', key: 'Puerto Rico Passion', count: clips.filter(c => c.category === 'Puerto Rico Passion').length },
    { name: 'Curacao Dreams 🇨🇼', key: 'Curacao Dreams', count: clips.filter(c => c.category === 'Curacao Dreams').length },
    { name: 'St. Lucia Secrets 🇱🇨', key: 'St. Lucia Secrets', count: clips.filter(c => c.category === 'St. Lucia Secrets').length },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-zinc-900 to-zinc-950 border border-red-500/30 p-5 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 fill-white" />
                Featured Niches
              </span>
              <span className="text-xs text-zinc-400 font-mono font-bold">
                {enrichedNiches.length} Island Categories
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Explore Caribbean Niches & Steam Categories
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">
              Browse handpicked island themes, dancers, models, and exclusive 9:16 vertical Steams filtered by region and heat level.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSteam}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-red-600/20 flex items-center gap-2 transition transform active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>Watch 9:16 Steam Reels</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Dynamic View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        {/* Search inside niches */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search niche or island (e.g. Jamaica, Carnival, VIP)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* View Format Selector: Grid / Large Cards / Text Compact */}
        <div className="flex items-center gap-1 self-end sm:self-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
          <button
            onClick={() => setViewFormat('grid')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewFormat === 'grid' 
                ? 'bg-red-600 text-white shadow' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid Cards</span>
          </button>

          <button
            onClick={() => setViewFormat('cards')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewFormat === 'cards' 
                ? 'bg-red-600 text-white shadow' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Featured Banners</span>
          </button>

          <button
            onClick={() => setViewFormat('compact')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              viewFormat === 'compact' 
                ? 'bg-red-600 text-white shadow' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Text List</span>
          </button>
        </div>
      </div>

      {/* Quick Tag Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <span className="text-xs font-bold text-zinc-400 shrink-0 uppercase tracking-wider">
          Quick Filter:
        </span>
        {['All', ...POPULAR_TAGS].map((tag, idx) => (
          <button
            key={idx}
            onClick={() => onSelectTag(tag === 'All' ? '' : tag)}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500 text-zinc-300 hover:text-white transition shrink-0"
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* NICHES PRESENTATION LAYOUTS */}

      {/* 1. GRID CARDS FORMAT (Visual 9:16 & Poster Previews with Dynamic Stats) */}
      {viewFormat === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredNiches.map((niche) => {
            const categoryMatch = categoriesList.find(c => c.name.includes(niche.title.split(' ')[0])) || categoriesList[0];
            return (
              <div
                key={niche.id}
                onClick={() => onSelectCategory(categoryMatch.key === 'All' ? niche.title.split(' ')[0] : categoryMatch.key)}
                className="group relative flex flex-col rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/90 hover:border-red-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-red-600/20 transform hover:-translate-y-1.5"
              >
                {/* Visual Cover / Preview */}
                <div className="relative w-full aspect-[9/10] bg-zinc-950 overflow-hidden">
                  <img
                    src={niche.previewClip?.posterUrl || niche.avatar}
                    alt={niche.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                  {/* Top Stats Tag */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase text-red-400">
                      {niche.count}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold shadow flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 fill-white" />
                      HOT
                    </span>
                  </div>

                  {/* Bottom Island Title & Details */}
                  <div className="absolute bottom-3 left-3 right-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={niche.avatar}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full object-cover ring-2 ring-red-500"
                      />
                      <h3 className="text-base font-black text-white group-hover:text-red-400 transition-colors truncate">
                        {niche.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-zinc-300 line-clamp-1">
                      Trending 9:16 Steams, models, and creator drops.
                    </p>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="p-3 bg-zinc-950 flex items-center justify-between border-t border-zinc-800/80">
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {niche.realCount > 0 ? `${niche.realCount} active clips` : 'Explore Category'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-red-400 group-hover:translate-x-1 transition-transform">
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. FEATURED BANNER CARDS FORMAT */}
      {viewFormat === 'cards' && (
        <div className="space-y-4">
          {filteredNiches.map((niche) => {
            const categoryMatch = categoriesList.find(c => c.name.includes(niche.title.split(' ')[0])) || categoriesList[0];
            return (
              <div
                key={niche.id}
                onClick={() => onSelectCategory(categoryMatch.key === 'All' ? niche.title.split(' ')[0] : categoryMatch.key)}
                className="group relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-red-500 transition-all p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <img
                    src={niche.avatar}
                    alt={niche.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-red-500/60 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-red-400 transition-colors">
                        {niche.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white uppercase">
                        Active Niche
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      Curated Caribbean loops, 4K HD resolution, and 9:16 vertical Steams.
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-xs font-mono text-zinc-300">
                      <span className="text-red-400 font-bold">{niche.count}</span>
                      <span>•</span>
                      <span>Verified Models</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 group-hover:bg-red-600 text-zinc-200 group-hover:text-white font-bold text-xs transition flex items-center justify-center gap-2">
                    <span>Browse {niche.title.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. TEXT LIST FORMAT */}
      {viewFormat === 'compact' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoriesList.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => onSelectCategory(cat.key)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500 text-left transition group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center font-bold text-red-500 border border-zinc-800 group-hover:scale-110 transition-transform">
                  <Flame className="w-5 h-5 fill-red-500/20" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {cat.count} total clips available
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
