import React from 'react';
import { Sun } from 'lucide-react';

interface SoundWaveProps {
  isPlaying?: boolean;
  colorClass?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

export const SoundWave: React.FC<SoundWaveProps> = ({ 
  isPlaying = true, 
  size = 'md',
  title = 'Island Heat Audio'
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const containerPad = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <div 
      className={`flex items-center gap-1.5 ${containerPad} rounded-full bg-black/70 backdrop-blur-md border border-amber-500/40 shadow-sm`}
      title={title}
    >
      <Sun 
        className={`${iconSize} text-amber-400 ${
          isPlaying ? 'animate-[spin_6s_linear_infinite] drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]' : 'opacity-60'
        }`} 
      />
      {isPlaying && (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
      )}
    </div>
  );
};

