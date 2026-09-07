import React, { useEffect, useState } from 'react';
import { SignDefinition } from '../types';
import { HandSilhouetteDemo } from './HandSilhouetteDemo';
import { RotateCcw, ArrowRight, X, Sparkles, Bot, RefreshCw } from 'lucide-react';
import { audio } from '../services/audioService';
import { aiService } from '../services/aiService';

interface PromptScreenProps {
  sign: SignDefinition;
  onStartDetection: () => void;
  onCancel: () => void;
  autoAdvanceSeconds?: number;
}

export const PromptScreen: React.FC<PromptScreenProps> = ({
  sign,
  onStartDetection,
  onCancel,
  autoAdvanceSeconds = 5,
}) => {
  const [timeLeft, setTimeLeft] = useState(autoAdvanceSeconds);
  const [replayKey, setReplayKey] = useState(0);
  const [showAiHint, setShowAiHint] = useState(false);
  const [aiHintText, setAiHintText] = useState<string | null>(null);
  const [loadingAiHint, setLoadingAiHint] = useState(false);

  useEffect(() => {
    // If user is reading AI hint, pause auto-countdown so they have time to read
    if (showAiHint) return;

    if (timeLeft <= 0) {
      onStartDetection();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onStartDetection, showAiHint]);

  const handleToggleAiHint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    audio.triggerHaptic('tap');
    if (!showAiHint && !aiHintText) {
      setLoadingAiHint(true);
      setShowAiHint(true);
      try {
        const hint = await aiService.getSignHint(sign);
        setAiHintText(hint);
      } catch (err) {
        setAiHintText(`Keep your knuckles clearly visible and palm facing the camera.`);
      } finally {
        setLoadingAiHint(false);
      }
    } else {
      setShowAiHint((prev) => !prev);
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    audio.playTick();
    setReplayKey((k) => k + 1);
    setTimeLeft(autoAdvanceSeconds);
  };

  return (
    <div
      onClick={() => {
        audio.triggerHaptic('tap');
        onStartDetection();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-[#08090E]/85 backdrop-blur-md select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm realistic-card rounded-3xl p-6 md:p-7 flex flex-col items-center text-center shadow-2xl"
      >
        {/* Top Header & Countdown */}
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-xl minimal-btn-secondary flex items-center justify-center text-zinc-400 hover:text-white"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl minimal-inset text-xs font-mono font-bold text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ready in {timeLeft}s</span>
          </div>
        </div>

        {/* Character Title */}
        <div className="mb-3">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400">
            Sign Challenge
          </span>
          <h2
            className="text-4xl md:text-5xl font-black text-white tracking-tight mt-0.5"
          >
            {sign.aslLetterOrWord}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            {sign.label}
          </p>
        </div>

        {/* Realistic Volumetric Hand Demo Container */}
        <div
          key={replayKey}
          className="relative w-48 h-48 rounded-2xl minimal-inset flex items-center justify-center mb-4 p-2"
        >
          <HandSilhouetteDemo sign={sign} size={150} />

          <button
            onClick={handleReplay}
            className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg minimal-btn-secondary text-[11px] font-semibold flex items-center gap-1 text-zinc-300"
            title="Replay demo"
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
            <span>Replay</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-4 space-y-1">
          <p className="text-sm font-semibold text-zinc-200">
            Form with your {sign.dominantHand === 'right' ? 'right hand' : 'hand'}
          </p>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed font-normal">
            {sign.instruction}
          </p>
        </div>

        {/* AI Sensei Hint Button & Drawer */}
        <div className="w-full mb-4">
          <button
            onClick={handleToggleAiHint}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              showAiHint
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/[0.04] border-white/[0.08] hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showAiHint ? 'Hide AI Sensei Tips' : 'AI Sensei: Mnemonic & Tips'}</span>
          </button>

          {showAiHint && (
            <div className="mt-2 p-3 rounded-xl bg-[#12131A] border border-emerald-500/20 text-left text-[11px] leading-relaxed text-zinc-300 animate-fadeIn">
              {loadingAiHint ? (
                <div className="flex items-center justify-center gap-2 py-2 text-zinc-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Gemini is generating custom mnemonic...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line space-y-1">
                  {aiHintText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Minimalist Crisp Primary Button */}
        <button
          onClick={() => {
            audio.triggerHaptic('tap');
            onStartDetection();
          }}
          className="w-full py-3.5 px-5 rounded-2xl minimal-btn-primary font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Start Camera</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
