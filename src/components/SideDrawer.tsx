import React from 'react';
import { 
  X, User, Coins, DollarSign, PlusSquare, 
  Sun, Moon, LogOut, Flame, Compass, ChevronRight, Sparkles, Smartphone, Search
} from 'lucide-react';
import { UserAccount, MainViewTab, FilterState } from '../types';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserAccount;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenTokenStore: () => void;
  onOpenWithdrawal: () => void;
  onOpenAdminPanel: () => void;
  onOpenAuthModal: () => void;
  onOpenUpload: () => void;
  onTabChange: (tab: MainViewTab) => void;
  onLogout?: () => void;
  filters?: FilterState;
  onFilterChange?: (newFilters: Partial<FilterState>) => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  activeUser,
  theme,
  onToggleTheme,
  onOpenTokenStore,
  onOpenWithdrawal,
  onOpenAdminPanel,
  onOpenAuthModal,
  onOpenUpload,
  onTabChange,
  onLogout,
  filters,
  onFilterChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* Dark Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 h-full p-5 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto custom-scrollbar">
        <div>
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-black text-xs">
                IH
              </div>
              <span className="font-black text-lg text-white tracking-wider">
                Island<span className="text-orange-500">Heat</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search inside Side Drawer */}
          {onFilterChange && (
            <div className="mt-3">
              <div className="relative flex items-center w-full">
                <Search className="absolute left-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tags, creators, niches..."
                  value={filters?.searchQuery || ''}
                  onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onTabChange('explore_grid');
                      onClose();
                    }
                  }}
                  className="w-full pl-9 pr-7 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
                {filters?.searchQuery && (
                  <button
                    onClick={() => onFilterChange({ searchQuery: '' })}
                    className="absolute right-2 text-zinc-400 hover:text-white text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* User Account Info Card */}
          <div 
            onClick={() => {
              onClose();
              onTabChange(activeUser.role === 'admin' ? 'admin' : 'profile');
            }}
            className="mt-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/40 cursor-pointer transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img src={activeUser.avatar} alt="Avatar" className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-500/50" />
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-1">
                  <span>{activeUser.displayName}</span>
                  {activeUser.isVerified && <Sparkles className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
                </div>
                <div className="text-xs text-orange-400 font-mono">@{activeUser.username}</div>
                <span className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-black uppercase mt-1 ${
                  activeUser.role === 'admin' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                  activeUser.role === 'creator' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {activeUser.role} Account
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>

          {/* Token Balance Quick Banner */}
          <div className="mt-3 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Coins className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{activeUser.tokensBalance} Tokens</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenTokenStore();
              }}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px] shadow"
            >
              + Buy Tokens
            </button>
          </div>

          {/* Navigation Links */}
          <div className="mt-6 space-y-2">
            {/* Token Wallet */}
            <button
              onClick={() => {
                onClose();
                onOpenTokenStore();
              }}
              className="w-full p-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-white font-bold text-xs flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Buy Tokens (PayPal / Bank)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Creator Payouts */}
            <button
              onClick={() => {
                onClose();
                onOpenWithdrawal();
              }}
              className="w-full p-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-white font-bold text-xs flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Withdraw Earnings (${(activeUser.earnedTokens * 0.10).toFixed(2)})</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Upload Video / Clip (Prominent) */}
            <button
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold text-xs flex items-center justify-between shadow-lg shadow-orange-600/20 border border-orange-400/40 transition transform active:scale-95"
            >
              <div className="flex items-center gap-3">
                <PlusSquare className="w-5 h-5 text-white" />
                <span className="tracking-wide">Upload Video / Clip</span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                + Upload
              </span>
            </button>

            {/* Steam (9:16 Shorts) */}
            <button
              onClick={() => {
                onClose();
                onTabChange('home_916');
              }}
              className="w-full p-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-white font-bold text-xs flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-orange-400" />
                <span>Steam (9:16 Reels)</span>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/30">
                9:16
              </span>
            </button>

            {/* Explore Grid */}
            <button
              onClick={() => {
                onClose();
                onTabChange('explore_grid');
              }}
              className="w-full p-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-white font-bold text-xs flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-blue-400" />
                <span>Explore Grid View</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            {/* Niches Categories */}
            <button
              onClick={() => {
                onClose();
                onTabChange('niches');
              }}
              className="w-full p-3 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-white font-bold text-xs flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Niches & Categories</span>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                HOT
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Drawer Controls */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          {/* Theme Mode Toggle */}
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-orange-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>Dark Mode Theme</span>
            </span>
            <button
              onClick={onToggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors p-1 ${
                theme === 'dark' ? 'bg-orange-500' : 'bg-zinc-700'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* User Auth Switch / Log Out Button */}
          {activeUser.isLoggedIn ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="flex-1 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>Switch Account</span>
              </button>
              {onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-rose-500/20 border border-zinc-800 text-zinc-400 hover:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-102 transition"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Register Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
