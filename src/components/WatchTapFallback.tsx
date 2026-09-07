import React, { useState } from 'react';
import { SignDefinition } from '../types';
import { HandSilhouetteDemo } from './HandSilhouetteDemo';
import { audio } from '../services/audioService';
import { Eye, CheckCircle2, XCircle, X } from 'lucide-react';

interface WatchTapFallbackProps {
  sign: SignDefinition;
  onSuccess: () => void;
  onCancel: () => void;
}

export const WatchTapFallback: React.FC<WatchTapFallbackProps> = ({
  sign,
  onSuccess,
  onCancel,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const choices = sign.choices || [
    sign.aslLetterOrWord,
    'Letter X',
    'Letter Y',
    'Letter Z',
  ];

  const handleSelect = (choice: string) => {
    if (selectedChoice !== null) return;
    setSelectedChoice(choice);

    const hit = choice.includes(sign.aslLetterOrWord) || choice === sign.label;
    setIsCorrect(hit);

    if (hit) {
      audio.playMatchDing();
      setTimeout(() => {
        onSuccess();
      }, 900);
    } else {
      audio.playNudge();
      setTimeout(() => {
        setSelectedChoice(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090E]/90 backdrop-blur-md select-none">
      <div className="w-full max-w-sm minimal-card rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-2xl">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-xl minimal-btn-secondary text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08] text-zinc-300">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Watch & Tap
            </span>
          </div>
        </div>

        {/* Demo */}
        <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
          Study the Handshape
        </span>

        <div className="w-44 h-44 rounded-2xl minimal-inset flex items-center justify-center mb-4 p-2">
          <HandSilhouetteDemo sign={sign} size={140} />
        </div>

        <p className="text-xs text-zinc-200 font-semibold mb-4">
          Which sign is demonstrated above?
        </p>

        {/* 4 Choices */}
        <div className="grid grid-cols-2 gap-2.5 w-full mb-4">
          {choices.map((choice) => {
            const isSelected = selectedChoice === choice;
            const isTarget = choice.includes(sign.aslLetterOrWord) || choice === sign.label;

            let style = 'minimal-btn-secondary text-zinc-200';
            if (selectedChoice !== null) {
              if (isTarget) {
                style = 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm';
              } else if (isSelected) {
                style = 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40';
              } else {
                style = 'bg-[#10121A] text-zinc-600 opacity-40 border-transparent';
              }
            }

            return (
              <button
                key={choice}
                disabled={selectedChoice !== null}
                onClick={() => handleSelect(choice)}
                className={`py-3 px-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${style}`}
              >
                <span>{choice}</span>
                {isSelected && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
              </button>
            );
          })}
        </div>

        {/* Tip */}
        <p className="text-[11px] text-zinc-400 font-normal">
          Tip: {sign.tip}
        </p>
      </div>
    </div>
  );
};
