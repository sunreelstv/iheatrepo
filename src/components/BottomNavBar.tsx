import React from 'react';
import { Smartphone, Compass, PlusSquare, Flame, User, ShieldCheck } from 'lucide-react';
import { MainViewTab, UserAccount } from '../types';

interface BottomNavBarProps {
  activeTab: MainViewTab;
  onTabChange: (tab: MainViewTab) => void;
  onOpenUpload: () => void;
  activeUser: UserAccount;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenUpload,
  activeUser,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 max-w-md mx-auto sm:max-w-none transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {/* Steam 9:16 Vertical View */}
        <button
          onClick={() => onTabChange('home_916')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'home_916' 
              ? 'text-orange-400 font-bold scale-105' 
              : 'text-zinc-400 hover:text-white'
          }`}
          id="nav-tab-steam"
        >
          <Smartphone className={`w-5 h-5 ${activeTab === 'home_916' ? 'stroke-orange-400' : ''}`} />
          <span className="text-[10px] tracking-tight font-bold">Steam</span>
        </button>

        {/* Explore Grid View */}
        <button
          onClick={() => onTabChange('explore_grid')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'explore_grid' 
              ? 'text-orange-400 font-bold scale-105' 
              : 'text-zinc-400 hover:text-white'
          }`}
          id="nav-tab-explore"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Explore</span>
        </button>

        {/* Upload Button (+) */}
        <button
          onClick={onOpenUpload}
          className="p-2 rounded-2xl bg-gradient-to-tr from-orange-500 to-emerald-500 text-white shadow-lg shadow-orange-500/20 hover:scale-110 active:scale-95 transition transform -mt-3"
          id="nav-tab-upload"
          title="Upload Clip"
        >
          <PlusSquare className="w-6 h-6" />
        </button>

        {/* Niches / Categories */}
        <button
          onClick={() => onTabChange('niches')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'niches' 
              ? 'text-orange-400 font-bold scale-105' 
              : 'text-zinc-400 hover:text-white'
          }`}
          id="nav-tab-niches"
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Niches</span>
        </button>

        {/* Profile / Admin Tab */}
        <button
          onClick={() => onTabChange(activeUser.role === 'admin' && activeUser.isLoggedIn ? 'admin' : 'profile')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'profile' || (activeTab === 'admin' && activeUser.role === 'admin' && activeUser.isLoggedIn)
              ? 'text-emerald-400 font-bold scale-105' 
              : 'text-zinc-400 hover:text-white'
          }`}
          id="nav-tab-profile"
        >
          <div className="relative">
            {activeUser.isLoggedIn ? (
              <>
                <img 
                  src={activeUser.avatar} 
                  alt={activeUser.displayName} 
                  className={`w-5 h-5 rounded-full object-cover ring-1 ${
                    activeTab === 'profile' || activeTab === 'admin' ? 'ring-emerald-400' : 'ring-zinc-600'
                  }`}
                />
                {activeUser.role === 'admin' && (
                  <ShieldCheck className="w-3 h-3 text-emerald-400 absolute -top-1 -right-1 bg-black rounded-full" />
                )}
              </>
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">
            {activeUser.role === 'admin' && activeUser.isLoggedIn ? 'Admin' : activeUser.isLoggedIn ? 'Profile' : 'Sign In'}
          </span>
        </button>
      </div>
    </nav>
  );
};
