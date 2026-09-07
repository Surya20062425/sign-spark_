import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { audio } from '../services/audioService';
import { ArrowRight, Trophy, Play, Map, RotateCcw } from 'lucide-react';

interface StarRevealScreenProps {
  starsEarned: number; // 1, 2, or 3
  attempts: number;
  confidence: number;
  signLabel: string;
  onContinue: () => void; // Return to map
  onNextLevel?: () => void; // Proceed to next level practice
  hasNextLevel?: boolean;
  nextLevelTitle?: string;
}

export const StarRevealScreen: React.FC<StarRevealScreenProps> = ({
  starsEarned,
  attempts,
  confidence,
  signLabel,
  onContinue,
  onNextLevel,
  hasNextLevel = true,
  nextLevelTitle,
}) => {
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [countdown, setCountdown] = useState(3); // 3 seconds
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: starsEarned === 3 ? 60 : 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E5B842', '#34D399', '#F4F4F5'],
      });
    } catch {
      // Ignored
    }

    for (let i = 1; i <= starsEarned; i++) {
      setTimeout(() => {
        audio.playStarChime(i);
      }, (i - 1) * 200);
    }
  }, [starsEarned]);

  // Auto-advance countdown timer
  useEffect(() => {
    if (!autoAdvance || !hasNextLevel || !onNextLevel) return;

    if (countdown <= 0) {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        audio.triggerHaptic('success');
        onNextLevel();
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, autoAdvance, hasNextLevel, onNextLevel]);

  const handleNextClick = () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    audio.triggerHaptic('tap');
    if (onNextLevel && hasNextLevel) {
      onNextLevel();
    } else {
      onContinue();
    }
  };

  const getPraiseText = () => {
    if (starsEarned === 3) return 'Mastered!';
    if (starsEarned === 2) return 'Great Job!';
    return 'Lesson Complete!';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090E]/90 backdrop-blur-md select-none overflow-y-auto"
    >
      <div
        className="w-full max-w-sm minimal-card rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-2xl border border-white/10 my-auto"
      >
        {/* Minimal Trophy Icon */}
        <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center mb-4 text-zinc-100 shadow-sm">
          <Trophy className="w-7 h-7 text-amber-400" />
        </div>

        {/* 3 Minimal Stars */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= starsEarned;
            return (
              <div
                key={starIdx}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
                  isEarned
                    ? 'bg-amber-400/20 border border-amber-400/40 text-amber-400 scale-105'
                    : 'minimal-inset text-zinc-600'
                }`}
              >
                ★
              </div>
            );
          })}
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {getPraiseText()}
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5 mb-5 font-normal">
          {signLabel}
        </p>

        {/* Minimal Sunken Metrics Box */}
        <div className="w-full grid grid-cols-2 gap-2 p-3 rounded-2xl minimal-inset mb-5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
              Accuracy
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="flex flex-col items-center border-l border-white/[0.08]">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
              Attempts
            </span>
            <span className="text-lg font-bold font-mono text-zinc-100 mt-0.5">
              {attempts} {attempts === 1 ? 'try' : 'tries'}
            </span>
          </div>
        </div>

        {/* Auto-Advance Status & Progress Indicator */}
        {hasNextLevel && onNextLevel ? (
          <div className="w-full mb-4">
            {autoAdvance ? (
              <div className="p-3 rounded-2xl minimal-inset text-left space-y-1.5 border border-white/[0.04]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    Auto-Next in {countdown}s...
                  </span>
                  <button
                    onClick={() => setAutoAdvance(false)}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer font-medium"
                  >
                    Pause
                  </button>
                </div>
                {nextLevelTitle && (
                  <p className="text-[11px] text-zinc-400 truncate">
                    Next: <strong className="text-white">{nextLevelTitle}</strong>
                  </p>
                )}
                {/* Visual smooth progress bar */}
                <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl minimal-inset text-xs text-zinc-400">
                <span>Auto-advance paused</span>
                <button
                  onClick={() => {
                    setCountdown(3);
                    setAutoAdvance(true);
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Resume
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-2xl minimal-inset text-xs text-emerald-300 font-semibold">
            🎉 Summit Reached! You have mastered all levels on the trail!
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {hasNextLevel && onNextLevel && (
            <button
              onClick={handleNextClick}
              className="w-full py-3.5 px-5 rounded-2xl minimal-btn-primary font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-transform"
            >
              <span>Practice Next Level</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              audio.triggerHaptic('tap');
              onContinue();
            }}
            className={`w-full py-3 px-5 rounded-2xl font-semibold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all ${
              hasNextLevel && onNextLevel
                ? 'minimal-btn-secondary text-zinc-300 hover:text-white'
                : 'minimal-btn-primary font-bold text-sm'
            }`}
          >
            <Map className="w-4 h-4 text-zinc-400" />
            <span>Return to Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
