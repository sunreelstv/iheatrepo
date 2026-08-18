import React, { useState, useMemo } from 'react';
import { 
  Images, Sparkles, Star, Lock, Heart, Eye, Filter, 
  Search, Plus, Flame, TrendingUp, Award, DollarSign, ChevronRight, ChevronLeft, CheckCircle, Trash2
} from 'lucide-react';
import { CreatorImage, UserAccount, Category } from '../types';
import { getStoredCreatorImages, getUnlockedImageIds, toggleLikeCreatorImage, canUserDeleteContent, deleteStoredCreatorImage } from '../utils/storage';

interface GalleriesViewProps {
  activeUser: UserAccount;
  onSelectGallery: (gallery: CreatorImage) => void;
  onOpenUploadGallery: () => void;
  onOpenCreatorProfile?: (username: string) => void;
}

export const GalleriesView: React.FC<GalleriesViewProps> = ({
  activeUser,
  onSelectGallery,
  onOpenUploadGallery,
  onOpenCreatorProfile,
}) => {
  const [galleries, setGalleries] = useState<CreatorImage[]>(() => getStoredCreatorImages());
  const [activeSort, setActiveSort] = useState<'recent' | 'popular' | 'top_rated' | 'paywalled' | 'free'>('popular');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [cardCarouselIdxs, setCardCarouselIdxs] = useState<{ [cardId: string]: number }>({});

  const unlockedIds = useMemo(() => getUnlockedImageIds(), []);

  React.useEffect(() => {
    const handleDeleted = () => setGalleries(getStoredCreatorImages());
    window.addEventListener('islandheat_gallery_deleted', handleDeleted);
    return () => window.removeEventListener('islandheat_gallery_deleted', handleDeleted);
  }, []);

  const refreshGalleries = () => {
    setGalleries(getStoredCreatorImages());
  };

  const categories = [
    'All',
    'Jamaica Heat',
    'Barbados Babes',
    'Trinidad Spice',
    'Dominican Temptation',
    'Bahamas Paradise',
    'Puerto Rico Passion',
    'Glamour',
    'VIP'
  ];

  const filteredGalleries = useMemo(() => {
    return galleries
      .filter((g) => {
        if (selectedCategory !== 'All') {
          const matchCat = g.category === selectedCategory;
          const matchTag = g.tags.some(t => t.toLowerCase() === selectedCategory.toLowerCase());
          if (!matchCat && !matchTag) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().replace(/^[@#]/, '');
          const matchTitle = g.title.toLowerCase().includes(q);
          const matchDesc = g.description.toLowerCase().includes(q);
          const matchCreator = g.creatorName.toLowerCase().includes(q) || g.creatorUsername.toLowerCase().includes(q);
          const matchTag = g.tags.some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchCreator && !matchTag) return false;
        }

        if (activeSort === 'paywalled' && !g.isPaywalled) return false;
        if (activeSort === 'free' && g.isPaywalled) return false;

        return true;
      })
      .sort((a, b) => {
        if (activeSort === 'top_rated') return (b.rating || 0) - (a.rating || 0);
        if (activeSort === 'popular') return (b.views || 0) + (b.likes || 0) * 10 - ((a.views || 0) + (a.likes || 0) * 10);
        if (activeSort === 'recent') return b.id.localeCompare(a.id);
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [galleries, selectedCategory, searchQuery, activeSort]);

  const handleCardPrev = (e: React.MouseEvent, gallery: CreatorImage) => {
    e.stopPropagation();
    const imgs = gallery.images && gallery.images.length > 0 ? gallery.images : [gallery.imageUrl];
    const current = cardCarouselIdxs[gallery.id] || 0;
    const nextIdx = (current - 1 + imgs.length) % imgs.length;
    setCardCarouselIdxs({ ...cardCarouselIdxs, [gallery.id]: nextIdx });
  };

  const handleCardNext = (e: React.MouseEvent, gallery: CreatorImage) => {
    e.stopPropagation();
    const imgs = gallery.images && gallery.images.length > 0 ? gallery.images : [gallery.imageUrl];
    const current = cardCarouselIdxs[gallery.id] || 0;
    const nextIdx = (current + 1) % imgs.length;
    setCardCarouselIdxs({ ...cardCarouselIdxs, [gallery.id]: nextIdx });
  };

  const handleLike = (e: React.MouseEvent, galleryId: string) => {
    e.stopPropagation();
    toggleLikeCreatorImage(galleryId);
    refreshGalleries();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-950 to-orange-950/40 border border-orange-500/30 p-5 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Images className="w-3.5 h-3.5" />
              Caribbean Photo & VIP Galleries
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Island Creator <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">Galleries & Photo Sets</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Explore high-res Caribbean photo sets, multi-photo carousels, unreleased VIP paywalled shoots, and rate your favorite creators.
            </p>
          </div>

          <button
            onClick={onOpenUploadGallery}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs sm:text-sm shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition transform self-start md:self-auto shrink-0"
            id="upload-gallery-cta-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Upload Gallery
          </button>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setActiveSort('popular')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSort === 'popular' 
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/30' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Popular
            </button>

            <button
              onClick={() => setActiveSort('top_rated')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSort === 'top_rated' 
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/30' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              Top Rated ⭐
            </button>

            <button
              onClick={() => setActiveSort('recent')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSort === 'recent' 
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/30' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Recent
            </button>

            <button
              onClick={() => setActiveSort('paywalled')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSort === 'paywalled' 
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30' 
                  : 'bg-zinc-900 text-amber-400 hover:text-amber-300 border border-zinc-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              VIP Paywalled
            </button>

            <button
              onClick={() => setActiveSort('free')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSort === 'free' 
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30' 
                  : 'bg-zinc-900 text-emerald-400 hover:text-emerald-300 border border-zinc-800'
              }`}
            >
              Free
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search galleries, tags, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Galleries Grid */}
      {filteredGalleries.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <Images className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-300">No galleries found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try resetting your search or filter options, or upload the first set!</p>
          <button
            onClick={onOpenUploadGallery}
            className="mt-4 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs"
          >
            Upload Photo Set
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredGalleries.map((gallery) => {
            const images = gallery.images && gallery.images.length > 0 ? gallery.images : [gallery.imageUrl];
            const activeImgIdx = cardCarouselIdxs[gallery.id] || 0;
            const currentImg = images[activeImgIdx] || gallery.imageUrl;
            const isUnlocked = !gallery.isPaywalled || unlockedIds.includes(gallery.id) || 
              (activeUser.isLoggedIn && (activeUser.role === 'admin' || activeUser.username.toLowerCase() === gallery.creatorUsername.toLowerCase()));

            return (
              <div
                key={gallery.id}
                onClick={() => onSelectGallery(gallery)}
                onMouseEnter={() => setHoveredCardId(gallery.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                className="group relative flex flex-col bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-orange-500/50 overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                id={`gallery-card-${gallery.id}`}
              >
                {/* Photo Stage / Carousel Preview */}
                <div className="relative w-full aspect-[4/3] bg-black overflow-hidden select-none">
                  <img
                    src={currentImg}
                    alt={gallery.title}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      !isUnlocked ? 'filter blur-md scale-110 opacity-70' : ''
                    }`}
                  />

                  {/* Multi-Photo Carousel Indicators */}
                  {images.length > 1 && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-bold text-amber-400 border border-amber-500/30 z-10 flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      <span>{images.length} Photos</span>
                    </div>
                  )}

                  {/* Rating Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[11px] font-bold text-amber-400 border border-amber-500/30 z-10 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{gallery.rating || 5.0}</span>
                    <span className="text-[9px] text-zinc-400 font-normal">({gallery.ratingCount || 1})</span>
                  </div>

                  {/* Paywall Overlay Badge */}
                  {gallery.isPaywalled && (
                    <div className="absolute bottom-2.5 left-2.5 z-10">
                      {isUnlocked ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/80 backdrop-blur text-black text-[10px] font-black uppercase tracking-wider">
                          Unlocked VIP
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500 backdrop-blur text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Lock className="w-3 h-3" />
                          VIP • {gallery.priceTokens || 30} 🪙
                        </span>
                      )}
                    </div>
                  )}

                  {/* Delete Button (If Admin or Content Creator) */}
                  {(() => {
                    const canDelete = canUserDeleteContent(gallery.creatorUsername, activeUser);
                    if (!canDelete) return null;
                    const handleDelete = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${gallery.title}"? This cannot be undone.`)) {
                        deleteStoredCreatorImage(gallery.id);
                        refreshGalleries();
                      }
                    };
                    return (
                      <button
                        onClick={handleDelete}
                        className="absolute bottom-2.5 right-2.5 z-20 p-1.5 rounded-md bg-red-600/90 hover:bg-red-600 text-white backdrop-blur transition border border-red-400/50 shadow-md flex items-center gap-1 text-[10px] font-bold"
                        title="Delete Photo Gallery"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    );
                  })()}

                  {/* Quick In-Card Carousel Next / Prev Controls */}
                  {images.length > 1 && isUnlocked && hoveredCardId === gallery.id && (
                    <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                      <button
                        onClick={(e) => handleCardPrev(e, gallery)}
                        className="p-1 rounded-full bg-black/70 hover:bg-black text-white hover:text-orange-400 backdrop-blur pointer-events-auto transition border border-white/10"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleCardNext(e, gallery)}
                        className="p-1 rounded-full bg-black/70 hover:bg-black text-white hover:text-orange-400 backdrop-blur pointer-events-auto transition border border-white/10"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-orange-400 font-semibold uppercase">
                        {gallery.category || 'Caribbean VIP'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {gallery.createdAt}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-zinc-100 line-clamp-1 group-hover:text-orange-400 transition mt-0.5">
                      {gallery.title}
                    </h3>
                  </div>

                  {/* Creator Info & Like */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenCreatorProfile) onOpenCreatorProfile(gallery.creatorUsername);
                      }}
                      className="flex items-center gap-2 group/creator"
                    >
                      <img 
                        src={gallery.creatorAvatar} 
                        alt={gallery.creatorName} 
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-orange-500/50" 
                      />
                      <span className="text-xs text-zinc-300 font-medium group-hover/creator:text-orange-400 transition truncate max-w-[110px]">
                        {gallery.creatorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleLike(e, gallery.id)}
                        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 transition"
                      >
                        <Heart className="w-3.5 h-3.5 hover:fill-red-500 hover:text-red-500" />
                        <span>{gallery.likes || 1}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
