import React, { useState } from 'react';
import { 
  Search, Upload, Flame, Sparkles, User, Filter, 
  Volume2, SlidersHorizontal, Layers, UserCheck, Tag, X, LogIn,
  Radio, Menu, Zap, Bot, LogOut, PlusCircle, UserPlus, Coins, ChevronDown
} from 'lucide-react';
import { Category, FilterState, UserAccount, FeedViewMode, SiteBranding } from '../types';
import { DarkToggle } from './DarkToggle';
import { getSiteBranding } from '../utils/storage';

interface NavbarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onOpenUpload: () => void;
  onOpenProfile: () => void;
  userProfile: UserAccount;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userClipsCount: number;
  followedCount: number;
  onOpenAuth?: () => void;
  branding?: SiteBranding;
  onOpenLive?: () => void;
  onOpenTokenStore?: () => void;
  onOpenSideDrawer?: () => void;
  onLogout?: () => void;
}

const CATEGORIES: (Category | 'All')[] = [
  'All',
  'Jamaica Heat',
  'Trinidad Spice',
  'Barbados Babes',
  'Dominican Temptation',
  'Bahamas Paradise',
  'Puerto Rico Passion',
  'Curacao Dreams',
  'Aruba Sunsets',
  'St. Lucia Secrets',
  'Virgin Islands VIP',
  'Glamour',
  'Satisfying',
  'Gaming',
];

const POPULAR_SEARCH_CHIPS = ['#Jamaica', '#Trinidad', '#VIP', '#Babes', '#Sunsets', '#Bikini'];

export const Navbar: React.FC<NavbarProps> = ({
  filters,
  onFilterChange,
  onOpenUpload,
  onOpenProfile,
  userProfile,
  theme,
  onToggleTheme,
  userClipsCount,
  followedCount,
  onOpenAuth,
  branding: propBranding,
  onOpenLive,
  onOpenTokenStore,
  onOpenSideDrawer,
  onLogout,
}) => {
  const branding = propBranding || getSiteBranding();
  const accent = branding.accentColor || '#ef4444';

  const isLoggedIn = userProfile && userProfile.username && userProfile.username !== 'guest';

  // Mobile search toggle state
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(true);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-zinc-950/95 border-b border-zinc-800/90 dark:bg-zinc-950/95 dark:border-zinc-800/90 light:bg-white/95 light:border-zinc-200 transition-colors">
      {/* 1. TOP MAIN NAV BAR */}
      <div className="w-full px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left Side: Brand Logo + Watch Live Button */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div 
            onClick={() => onFilterChange({ category: 'All', tag: '', searchQuery: '', feedMode: 'all' })}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group select-none"
            id="brand-logo"
          >
            {branding.logoType === 'image' && branding.logoImageUrl ? (
              <img 
                src={branding.logoImageUrl} 
                alt={branding.siteName}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-red-500/40 shadow-lg group-hover:scale-105 transition-transform shrink-0" 
              />
            ) : (
              <div className="flex items-center">
                <span className="text-lg sm:text-2xl font-black tracking-tighter text-red-600 dark:text-red-500 font-sans uppercase group-hover:brightness-110 transition">
                  {branding.logoText || 'ISLAND'}
                  <span className="text-white dark:text-white light:text-zinc-900 ml-0.5">
                    {branding.logoSubtext || 'HEAT'}
                  </span>
                </span>
                <span className="ml-1 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-red-600 text-white font-mono shadow-sm">
                  VIP
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Button: "Watch Live 🔞" (Desktop/Tablet) */}
          <button
            onClick={onOpenLive}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-100 hover:text-white font-bold text-xs shadow-sm transition active:scale-95 group"
            id="nav-watch-live-btn"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping group-hover:animate-pulse" />
            <span>Watch Live 🔞</span>
          </button>
        </div>

        {/* Center: Desktop Search Bar (Hidden on Mobile < md to prevent jumbling) */}
        <div className="hidden md:block flex-1 min-w-0 max-w-2xl mx-2 lg:mx-4">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 shrink-0 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search tags, creators, niches..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-800 light:border-zinc-300 text-zinc-100 dark:text-zinc-100 light:text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition shadow-inner font-sans"
              id="search-input"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-2.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Search Toggle (Mobile), Upload Button, Auth / User, Dark Toggle, Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile Search Bar Toggle Button (Visible only on < md) */}
          <button
            onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
            className={`md:hidden p-2 rounded-full border transition flex items-center justify-center relative ${
              filters.searchQuery || isMobileSearchVisible
                ? 'bg-red-950/50 border-red-500/60 text-red-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            id="mobile-search-toggle-btn"
            title="Toggle Search Bar"
          >
            <Search className="w-4 h-4" />
            {filters.searchQuery && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-zinc-950 animate-pulse" />
            )}
          </button>

          {/* 1. HIGH-VISIBILITY PROMINENT UPLOAD BUTTON */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white shadow-lg shadow-orange-600/30 border border-orange-400/50 transition-all transform hover:scale-[1.03] active:scale-95 whitespace-nowrap cursor-pointer"
            id="open-upload-btn"
            title="Upload Caribbean Video / Clip"
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.5] shrink-0" />
            <span className="font-extrabold tracking-wide hidden xs:inline">Upload</span>
          </button>

          {/* 2. AUTHENTICATION CONTROLS (LOGIN/REGISTER OR USER PROFILE + LOGOUT) */}
          {!isLoggedIn ? (
            <div className="flex items-center">
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-bold text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white shadow-sm transition active:scale-95 whitespace-nowrap"
                id="header-login-register-btn"
                title="Log In or Create New Account"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="hidden sm:inline">Log In / Register</span>
                <span className="sm:hidden">Log In</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Active Logged-In User Profile Button */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-emerald-500/40 text-white text-xs font-bold transition active:scale-95 max-w-[110px] sm:max-w-[180px]"
                id="header-user-profile-btn"
                title={`Logged in as ${userProfile.displayName}`}
              >
                <div className="relative shrink-0">
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.displayName}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ring-1 ring-emerald-400"
                  />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-zinc-950 animate-pulse" />
                </div>
                <span className="truncate hidden xs:inline">{userProfile.displayName}</span>
              </button>

              {/* Explicit Log Out Header Button (Desktop only) */}
              <button
                onClick={onLogout}
                className="hidden md:flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-full bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 text-xs font-bold transition active:scale-95"
                id="header-logout-btn"
                title="Log Out of Account"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <div className="hidden sm:block">
            <DarkToggle theme={theme} onToggle={onToggleTheme} />
          </div>

          {/* Hamburger Menu / Side Drawer Button */}
          <button
            onClick={onOpenSideDrawer || onOpenProfile}
            className="p-2 sm:p-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black shadow-md transition transform active:scale-95 flex items-center justify-center shrink-0"
            id="nav-menu-btn"
            title="Menu & Navigation Drawer"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. DEDICATED FULL-WIDTH MOBILE SEARCH BAR ROW (Shown on screens < md) */}
      {isMobileSearchVisible && (
        <div className="md:hidden px-2.5 py-2 bg-zinc-950/98 border-t border-zinc-850 dark:border-zinc-850 light:border-zinc-200 animate-fade-in">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3 w-4 h-4 text-zinc-400 shrink-0 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search tags, creators, niches..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-800 light:border-zinc-300 text-zinc-100 dark:text-zinc-100 light:text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 shadow-inner font-sans"
              id="mobile-search-input"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-2.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick-Tag Search Chips for Mobile */}
          <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto custom-scrollbar pb-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase shrink-0">Popular:</span>
            {POPULAR_SEARCH_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => onFilterChange({ searchQuery: chip.replace('#', '') })}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition shrink-0 ${
                  filters.searchQuery.toLowerCase() === chip.toLowerCase().replace('#', '')
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {chip}
              </button>
            ))}
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-red-400 hover:bg-red-950/40 border border-red-500/30 shrink-0 ml-auto"
              >
                Clear Search &times;
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. SUB-HEADER CATEGORIES BAR */}
      <div className="border-t border-zinc-850 dark:border-zinc-850 light:border-zinc-200 py-2 px-2.5 sm:px-6 lg:px-8 max-w-full flex items-center gap-2 sm:gap-3 overflow-x-auto custom-scrollbar">
        {/* Main Feed Toggle Pills */}
        <div className="flex p-0.5 rounded-full bg-zinc-900 border border-zinc-800 shrink-0">
          <button
            onClick={() => onFilterChange({ feedMode: 'all' })}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition ${
              filters.feedMode === 'all'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-yellow-300" />
            <span>All Feeds</span>
          </button>
          <button
            onClick={() => onFilterChange({ feedMode: 'following' })}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition ${
              filters.feedMode === 'following'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Following ({followedCount})</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800 shrink-0" />

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 min-w-max">
          {CATEGORIES.map((cat) => {
            const isActive = filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => onFilterChange({ category: cat })}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
                  isActive 
                    ? 'bg-zinc-800 text-red-400 font-bold border border-red-500/40 shadow-sm' 
                    : 'bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
