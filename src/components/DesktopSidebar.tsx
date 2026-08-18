import React from 'react';
import { 
  Home, 
  Compass, 
  PlusCircle, 
  Flame, 
  Radio, 
  Coins, 
  UserCheck, 
  DollarSign, 
  ShieldCheck, 
  Smartphone, 
  Moon, 
  Sun, 
  Sparkles,
  Heart,
  Bookmark
} from 'lucide-react';
import { MainViewTab, UserAccount, SiteBranding } from '../types';

interface DesktopSidebarProps {
  activeTab: MainViewTab;
  onTabChange: (tab: MainViewTab) => void;
  onOpenUpload: () => void;
  onOpenTokenStore: () => void;
  onOpenWithdrawal: () => void;
  onOpenLive: () => void;
  onOpenAdminPanel: () => void;
  onOpenAuthModal: () => void;
  activeUser: UserAccount;
  followedCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  branding: SiteBranding;
  onFilterFollowing?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenUpload,
  onOpenTokenStore,
  onOpenWithdrawal,
  onOpenLive,
  onOpenAdminPanel,
  onOpenAuthModal,
  activeUser,
  followedCount,
  theme,
  onToggleTheme,
  branding,
}) => {
  const accent = branding.accentColor || '#ef4444';

  const navItems = [
    {
      id: 'explore_grid' as MainViewTab,
      label: 'Home',
      icon: Home,
      action: () => onTabChange('explore_grid'),
      isActive: activeTab === 'explore_grid',
    },
    {
      id: 'explore_grid' as MainViewTab,
      label: 'Explore',
      icon: Compass,
      action: () => onTabChange('explore_grid'),
      isActive: false,
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: PlusCircle,
      action: onOpenUpload,
      isActive: false,
      isAction: true,
    },
    {
      id: 'niches' as MainViewTab,
      label: 'Niches',
      icon: Flame,
      action: () => onTabChange('niches'),
      isActive: activeTab === 'niches',
      badge: 'HOT',
    },
  ];

  const islandFeatures = [
    {
      label: 'Steam',
      icon: Smartphone,
      action: () => onTabChange('home_916'),
      isActive: activeTab === 'home_916',
      badge: '9:16',
    },
    {
      label: 'Watch Live 🔞',
      icon: Radio,
      action: onOpenLive,
      isActive: false,
      isLive: true,
    },
    {
      label: 'Token Store',
      icon: Coins,
      action: onOpenTokenStore,
      isActive: false,
      pill: `${activeUser.tokensBalance} 🪙`,
    },
    {
      label: 'Following',
      icon: UserCheck,
      action: () => onTabChange('explore_grid'),
      isActive: false,
      count: followedCount,
    },
    {
      label: 'Creator Cashout',
      icon: DollarSign,
      action: onOpenWithdrawal,
      isActive: false,
      sub: `$${activeUser.earningsUSD.toFixed(0)}`,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-r border-zinc-800/80 bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-white text-zinc-300 dark:text-zinc-300 light:text-zinc-700 select-none overflow-y-auto custom-scrollbar p-3 justify-between z-30">
      <div className="space-y-6">
        {/* Main Primary Navigation (Matches RedGIFs) */}
        <div className="space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isUpload = item.id === 'upload';
            return (
              <button
                key={idx}
                onClick={item.action}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all group ${
                  isUpload 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white shadow-lg shadow-orange-600/30 border border-orange-400/40 my-1'
                    : item.isActive
                    ? 'bg-gradient-to-r from-red-600/20 to-orange-500/10 text-white border-l-4 border-red-500 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80 dark:hover:bg-zinc-900/80 light:hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isUpload
                        ? 'text-white'
                        : item.isActive 
                        ? 'text-red-500 fill-red-500/20' 
                        : 'text-zinc-400 group-hover:text-white'
                    }`}
                  />
                  <span className={`text-sm font-bold ${isUpload ? 'text-white font-black uppercase tracking-wider' : ''}`}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
                {isUpload && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    +New
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/80 dark:bg-zinc-800/80 light:bg-zinc-200" />

        {/* Island Heat Exclusive Features */}
        <div>
          <span className="px-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-400 block mb-2">
            Island Heat Features
          </span>
          <div className="space-y-1">
            {islandFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition group ${
                    item.isActive
                      ? 'bg-zinc-900 text-white font-bold border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 light:hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-zinc-400 group-hover:text-red-400 transition" />
                    <span>{item.label}</span>
                  </div>

                  {item.isLive && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-black animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE
                    </span>
                  )}

                  {item.pill && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-black font-black font-mono">
                      {item.pill}
                    </span>
                  )}

                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      {item.count}
                    </span>
                  )}

                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">
                      {item.badge}
                    </span>
                  )}

                  {item.sub && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {item.sub}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* VIP Token Store Promo Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-950/40 via-zinc-900 to-zinc-950 border border-red-500/30 text-center space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-yellow-400 uppercase">
            <Sparkles className="w-3.5 h-3.5 fill-yellow-400" />
            VIP Creator Pass
          </div>
          <p className="text-[11px] text-zinc-300">
            Unlock 4K uncompressed 60fps loops & private shows.
          </p>
          <button
            onClick={onOpenTokenStore}
            className="w-full py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-xs hover:scale-105 transition shadow-md"
          >
            Get Tokens 🪙
          </button>
        </div>
      </div>

      {/* Bottom Profile / Quick Settings */}
      <div className="pt-3 border-t border-zinc-800/80 space-y-2">
        {activeUser.isLoggedIn && activeUser.role === 'admin' && (
          <button
            onClick={onOpenAdminPanel}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-purple-950/40 text-purple-300 border border-purple-800/40 hover:bg-purple-900/60 transition"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Admin Panel</span>
            </div>
            <span className="text-[9px] px-1 py-0.2 bg-purple-500 text-black rounded font-black">ADMIN</span>
          </button>
        )}

        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-zinc-400">
          <span>IslandHeat v2.4</span>
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
