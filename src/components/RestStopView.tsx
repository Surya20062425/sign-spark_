import React from 'react';
import { REGIONS } from '../data/regions';
import { SaveData } from '../types';
import { Flame, Star, Trophy, ArrowRight, X } from 'lucide-react';
import { audio } from '../services/audioService';

interface RestStopViewProps {
  regionId: number;
  saveData: SaveData;
  onClose: () => void;
}

export const RestStopView: React.FC<RestStopViewProps> = ({
  regionId,
  saveData,
  onClose,
}) => {
  const region = REGIONS.find((r) => r.id === regionId) || REGIONS[0];
  
  let regionStars = 0;
  let masteredCount = 0;
  const start = region.startNode;
  const end = region.endNode;

  for (let i = start; i <= end; i++) {
    const p = saveData.nodes[i];
    if (p && p.stars > 0) {
      regionStars += p.stars;
      if (p.stars === 3) masteredCount += 1;
    }
  }

  const maxPossibleStars = (end - start + 1) * 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090E]/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm minimal-card rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl minimal-btn-secondary text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal Hearth Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4 text-amber-400">
          <Flame className="w-7 h-7 fill-current" />
        </div>

        <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400">
          Sanctuary Hearth
        </span>
        <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 mb-1">
          {region.name}
        </h2>
        <p className="text-xs text-zinc-300 mb-5 max-w-xs leading-relaxed font-normal">
          {region.description}
        </p>

        {/* Region Stats */}
        <div className="w-full grid grid-cols-2 gap-2 p-3 rounded-2xl minimal-inset mb-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-amber-400 mb-0.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Stars</span>
            </div>
            <span className="text-lg font-bold font-mono text-zinc-100">
              {regionStars} <span className="text-xs font-normal text-zinc-500">/ {maxPossibleStars}</span>
            </span>
          </div>

          <div className="flex flex-col items-center border-l border-white/[0.08]">
            <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Mastered</span>
            </div>
            <span className="text-lg font-bold font-mono text-zinc-100">
              {masteredCount} <span className="text-xs font-normal text-zinc-500">/ 10</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            audio.triggerHaptic('tap');
            onClose();
          }}
          className="w-full py-3.5 px-5 rounded-2xl minimal-btn-primary font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Resume Quest</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
