import React, { useState } from 'react';
import { DetectionScreen } from './DetectionScreen';
import { SIGN_DEFINITIONS } from '../data/signs';
import { Crown, Zap } from 'lucide-react';
import { audio } from '../services/audioService';

interface BossBattleViewProps {
  bossTitle: string;
  signIds: string[];
  onComplete: (stars: number, avgConfidence: number) => void;
  onCancel: () => void;
}

export const BossBattleView: React.FC<BossBattleViewProps> = ({
  bossTitle,
  signIds,
  onComplete,
  onCancel,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [confidences, setConfidences] = useState<number[]>([]);

  const currentSignId = signIds[currentStepIndex];
  const currentSign = SIGN_DEFINITIONS[currentSignId];

  const handleStepSuccess = (attempts: number, confidence: number) => {
    audio.playMatchDing();
    const updatedConfidences = [...confidences, confidence];
    setConfidences(updatedConfidences);

    if (currentStepIndex + 1 < signIds.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      const avgConf =
        updatedConfidences.reduce((a, b) => a + b, 0) / updatedConfidences.length;
      const stars = avgConf >= 0.85 ? 3 : avgConf >= 0.7 ? 2 : 1;
      onComplete(stars, avgConf);
    }
  };

  if (!currentSign) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#07080C]">
      {/* Top Boss Sequence Header */}
      <div className="absolute top-5 inset-x-4 z-50 flex items-center justify-between max-w-md mx-auto pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl minimal-card text-zinc-200 shadow-xl">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Boss Trial: {currentStepIndex + 1}/{signIds.length}
          </span>
        </div>

        {/* Boss Sign Progression Tracker Tokens */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {signIds.map((id, idx) => {
            const sign = SIGN_DEFINITIONS[id];
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={id + idx}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isCurrent
                    ? 'minimal-btn-primary scale-105'
                    : 'minimal-inset text-zinc-500'
                }`}
              >
                {sign?.aslLetterOrWord || id}
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded Real-Time Detection Feed */}
      <DetectionScreen
        key={currentSign.id}
        sign={currentSign}
        onSuccess={handleStepSuccess}
        onFallbackToQuiz={() => {
          handleStepSuccess(1, 0.85);
        }}
        onCancel={onCancel}
      />
    </div>
  );
};
