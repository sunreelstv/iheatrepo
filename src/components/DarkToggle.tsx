import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface DarkToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  compact?: boolean;
}

export const DarkToggle: React.FC<DarkToggleProps> = ({ theme, onToggle, compact = false }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      type="button"
      id="dark-mode-toggle-btn"
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      title={`Current: ${isDark ? 'Dark Mode' : 'Light Mode'} (Click to toggle)`}
      className={`group relative inline-flex items-center gap-1 sm:gap-1.5 rounded-full p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shrink-0 ${
        isDark 
          ? 'bg-zinc-800/90 text-amber-400 border border-orange-500/30 hover:border-orange-500/70 shadow-inner' 
          : 'bg-emerald-100 text-zinc-900 border border-emerald-400/50 hover:border-emerald-500 shadow-sm'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-full p-1 sm:p-1.5 transition-transform duration-300 ${
          isDark ? 'translate-x-0 bg-orange-500 text-white shadow-md' : 'translate-x-full bg-emerald-500 text-white shadow-md'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:-rotate-12" />
        ) : (
          <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:rotate-45 text-amber-200" />
        )}
      </div>

      {!compact && (
        <span className={`hidden sm:inline pr-2 text-xs font-semibold tracking-wide transition-colors ${
          isDark ? 'text-zinc-200 group-hover:text-orange-400' : 'text-zinc-800 group-hover:text-emerald-700'
        }`}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};
