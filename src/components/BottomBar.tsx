import React, { useState } from 'react';
import { SaveData, UserProfile } from '../types';
import { REGIONS } from '../data/regions';
import { Star, Zap, Volume2, VolumeX, Cloud, Bot } from 'lucide-react';
import { audio } from '../services/audioService';

interface BottomBarProps {
  saveData: SaveData;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenAiCoach: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  saveData,
  currentUser,
  onOpenAuth,
  onOpenAiCoach,
}) => {
  const [isMuted, setIsMuted] = useState(audio.getMuted());

  const currentRegion = REGIONS.find((r) => r.id === saveData.unlockedRegion) || REGIONS[0];
  const completedNodesCount = Object.values(saveData.nodes || {}).filter(
    (n) => n && typeof n === 'object' && 'stars' in n && (n as { stars: number }).stars > 0
  ).length;

  const handleToggleSound = () => {
    const next = audio.toggleMute();
    setIsMuted(next);
  };

  const progressPercent = Math.min(100, Math.round((completedNodesCount / 60) * 100));

  return (
    <footer className="fixed bottom-4 inset-x-4 md:inset-x-0 md:bottom-6 z-30 pointer-events-none flex justify-center">
      <div className="w-full max-w-2xl minimal-card px-5 py-2.5 rounded-2xl flex items-center justify-between pointer-events-auto select-none backdrop-blur-xl">
        {/* Left: Progress Meter */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-300">
                Quest: <span className="text-white font-bold">{completedNodesCount}</span>/60
              </span>
              <span className="text-[10px] text-zinc-500 font-mono font-medium">({progressPercent}%)</span>
            </div>
            {/* Minimal Inset Progress Bar */}
            <div className="w-24 md:w-32 h-1.5 rounded-full minimal-inset overflow-hidden mt-1 p-0">
              <div
                className="h-full bg-white transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Minimal Region Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium text-zinc-300 uppercase tracking-wide">
            {currentRegion.name}
          </span>
        </div>

        {/* Right: Minimal Metrics & Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Stars Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl minimal-inset">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span className="text-xs font-bold font-mono text-zinc-100">{saveData.totalStars}</span>
          </div>

          {/* Streak Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl minimal-inset">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            <span className="text-xs font-bold font-mono text-zinc-100">{saveData.currentStreak}d</span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="w-8 h-8 rounded-xl minimal-btn-secondary flex items-center justify-center text-zinc-300"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
            )}
          </button>

          {/* AI Sensei Coach Button */}
          <button
            onClick={() => {
              audio.triggerHaptic('tap');
              onOpenAiCoach();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="Ask AI Sign Sensei (Gemini 3.8 Flash)"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Cloud Sync Button */}
          <button
            onClick={onOpenAuth}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              currentUser && !currentUser.isGuest
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'minimal-btn-secondary text-zinc-400'
            }`}
            title={currentUser && !currentUser.isGuest ? `Signed in as ${currentUser.name}` : 'Cloud Sync (Supabase)'}
          >
            <Cloud className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
