import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapNode, SaveData } from '../types';
import { REGIONS } from '../data/regions';
import { Crown, Hand, Sparkles, Flame, Check, Lock } from 'lucide-react';
import { audio } from '../services/audioService';

interface WindingMapProps {
  nodes: MapNode[];
  saveData: SaveData;
  onSelectNode: (node: MapNode) => void;
  onOpenRestStop: (regionId: number) => void;
}

export const WindingMap: React.FC<WindingMapProps> = ({
  nodes,
  saveData,
  onSelectNode,
  onOpenRestStop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Strictly sequential unlocking: Node 1 is unlocked. Node N unlocked when N-1 completed
  const isNodeUnlocked = (node: MapNode): boolean => {
    if (node.id === 1) return true;
    if (Boolean(saveData.nodes[node.id]) && saveData.nodes[node.id].stars > 0) return true;
    return (saveData.nodes[node.id - 1]?.stars || 0) > 0;
  };

  // Find the primary active playable node to focus on
  const currentNodeId = useMemo(() => {
    for (const node of nodes) {
      if (isNodeUnlocked(node) && (!saveData.nodes[node.id] || saveData.nodes[node.id].stars === 0)) {
        return node.id;
      }
    }
    // If all completed, return highest
    let highest = 1;
    for (const node of nodes) {
      if (saveData.nodes[node.id]) highest = Math.max(highest, node.id);
    }
    return highest;
  }, [nodes, saveData]);

  const canvasHeight = useMemo(() => {
    const maxY = Math.max(...nodes.map((n) => n.y));
    return maxY + 240;
  }, [nodes]);

  useEffect(() => {
    if (!containerRef.current) return;
    const targetElement = document.getElementById(`node-${currentNodeId}`);
    if (targetElement) {
      const topOffset = targetElement.offsetTop - window.innerHeight / 2 + 60;
      containerRef.current.scrollTo({
        top: Math.max(0, topOffset),
        behavior: 'smooth',
      });
    }
  }, [currentNodeId]);

  // Compute single continuous sequential trail edges (Node 1 -> 2 -> 3 ... -> 60)
  const pathSegments = useMemo(() => {
    const segments: Array<{
      id: string;
      from: MapNode;
      to: MapNode;
      isCompleted: boolean;
      isAvailable: boolean;
      d: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      midX: number;
      midY: number;
    }> = [];

    for (let i = 0; i < nodes.length - 1; i++) {
      const fromNode = nodes[i];
      const toNode = nodes[i + 1];

      const x1 = fromNode.x * 10;
      const y1 = fromNode.y;
      const x2 = toNode.x * 10;
      const y2 = toNode.y;
      const midY = (y1 + y2) / 2;
      const midX = (x1 + x2) / 2;

      // Smooth vertical S-curve connecting levels sequentially
      const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

      const isCompleted = (saveData.nodes[toNode.id]?.stars || 0) > 0;
      const isAvailable = (saveData.nodes[fromNode.id]?.stars || 0) > 0 && !isCompleted;

      segments.push({
        id: `seg-${fromNode.id}-${toNode.id}`,
        from: fromNode,
        to: toNode,
        isCompleted,
        isAvailable,
        d,
        x1,
        y1,
        x2,
        y2,
        midX,
        midY,
      });
    }

    return segments;
  }, [nodes, saveData]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden no-scrollbar bg-[#090A0E]"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Subtle minimalist background grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          height: `${canvasHeight}px`,
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 80%),
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* Minimal regional divider lines */}
      <div className="absolute inset-0 pointer-events-none" style={{ height: `${canvasHeight}px` }}>
        {REGIONS.map((region) => {
          const regionNodes = nodes.filter((n) => n.regionId === region.id);
          if (regionNodes.length === 0) return null;
          const minY = Math.min(...regionNodes.map((n) => n.y)) - 50;
          const maxY = Math.max(...regionNodes.map((n) => n.y)) + 50;
          const height = Math.max(220, maxY - minY);

          return (
            <div
              key={region.id}
              className="absolute w-full border-t border-white/[0.04]"
              style={{
                top: `${minY}px`,
                height: `${height}px`,
              }}
            />
          );
        })}
      </div>

      {/* Main Single Path SVG Canvas */}
      <div className="relative w-full max-w-xl mx-auto" style={{ height: `${canvasHeight}px` }}>
        <svg
          viewBox={`0 0 1000 ${canvasHeight}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ height: `${canvasHeight}px` }}
        >
          <defs>
            {/* Completed trail gradient */}
            <linearGradient id="completedTrailGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Active playable branch glow */}
            <linearGradient id="activeBranchGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Background Inactive Base Track (Single continuous path) */}
          {pathSegments.map((segment) => {
            const isHighlighted = hoveredNode === segment.from.id || hoveredNode === segment.to.id;
            return (
              <g key={`bg-${segment.id}`}>
                {/* Outer track silhouette */}
                <path
                  d={segment.d}
                  fill="none"
                  stroke="#12151E"
                  strokeWidth="8"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Inner track line */}
                <path
                  d={segment.d}
                  fill="none"
                  stroke={isHighlighted ? '#4F5675' : '#222634'}
                  strokeWidth={isHighlighted ? '4' : '3'}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* 2. Available Next Segment (Active forward track with animated pulse) */}
          {pathSegments
            .filter((seg) => seg.isAvailable && !seg.isCompleted)
            .map((segment) => (
              <g key={`avail-${segment.id}`}>
                <path
                  d={segment.d}
                  fill="none"
                  stroke="rgba(52, 211, 153, 0.25)"
                  strokeWidth="8"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                />
                <path
                  d={segment.d}
                  fill="none"
                  stroke="url(#activeBranchGlow)"
                  strokeWidth="3.5"
                  strokeDasharray="8 6"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#trailGlow)"
                  className="animate-pulse"
                />
                {/* Midpoint directional pulse */}
                <circle
                  cx={segment.midX}
                  cy={segment.midY}
                  r="3.5"
                  fill="#34D399"
                  className="animate-ping opacity-60"
                />
                <circle
                  cx={segment.midX}
                  cy={segment.midY}
                  r="2.5"
                  fill="#10B981"
                />
              </g>
            ))}

          {/* 3. Completed Segments (Solid crisp luminous white trails) */}
          {pathSegments
            .filter((seg) => seg.isCompleted)
            .map((segment) => (
              <g key={`active-${segment.id}`}>
                <path
                  d={segment.d}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="8"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                />
                <path
                  d={segment.d}
                  fill="none"
                  stroke="url(#completedTrailGlow)"
                  strokeWidth="3.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#trailGlow)"
                />
              </g>
            ))}
        </svg>

        {/* 60 Sequential Map Node Tokens along the Single Path */}
        {nodes.map((node) => {
          const progress = saveData.nodes[node.id];
          const isUnlocked = isNodeUnlocked(node);
          const stars = progress?.stars || 0;
          const isCurrent = node.id === currentNodeId && isUnlocked && stars === 0;
          const isHovered = hoveredNode === node.id;

          // Determine which side to place text: if node is on the left half (x < 50), text goes on right; if on right half (x >= 50), text goes on left
          const isLeftSided = node.x >= 50;

          const getIcon = () => {
            if (node.type === 'boss') return <Crown className="w-3.5 h-3.5 text-zinc-100" />;
            if (node.type === 'learn') return <Hand className="w-3.5 h-3.5 text-zinc-300" />;
            return <Sparkles className="w-3.5 h-3.5 text-zinc-300" />;
          };

          return (
            <div
              key={node.id}
              id={`node-${node.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 select-none group"
              style={{
                left: `${node.x}%`,
                top: `${node.y}px`,
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => {
                if (isUnlocked) {
                  audio.triggerHaptic('tap');
                  onSelectNode(node);
                } else {
                  audio.playNudge();
                }
              }}
            >
              <div className="relative flex items-center justify-center">
                {/* Minimal Clean Token with Level Number Inside */}
                {isCurrent ? (
                  <div className="w-13 h-13 md:w-14 md:h-14 rounded-full minimal-token-active flex flex-col items-center justify-center font-bold text-white transition-transform duration-200 hover:scale-105 active:scale-95 animate-token-pulse shrink-0">
                    <span className="text-[13px] font-black tracking-tight leading-none text-white">
                      {node.id}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-300 mt-0.5">
                      PLAY
                    </span>
                  </div>
                ) : stars > 0 ? (
                  <div
                    className={`w-11 h-11 md:w-12 md:h-12 rounded-full minimal-token-completed flex flex-col items-center justify-center transition-all duration-200 shrink-0 ${
                      isHovered ? 'scale-110 shadow-[0_0_16px_rgba(52,211,153,0.3)]' : ''
                    }`}
                  >
                    <span className="text-xs font-bold font-mono text-zinc-100 leading-none">
                      {node.id}
                    </span>
                    {/* Micro Stars Inset */}
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          className={`text-[7px] leading-none ${
                            s <= stars ? 'text-amber-400' : 'text-zinc-600'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ) : isUnlocked ? (
                  <div
                    className={`w-11 h-11 md:w-12 md:h-12 rounded-full minimal-token-unlocked text-zinc-300 flex flex-col items-center justify-center transition-all duration-200 shrink-0 ${
                      isHovered ? 'scale-110 border-white/30 text-white' : ''
                    }`}
                  >
                    <span className="text-xs font-bold font-mono text-zinc-200 leading-none">
                      {node.id}
                    </span>
                    <div className="mt-0.5 opacity-80 scale-75 origin-center">
                      {getIcon()}
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full minimal-token-locked text-zinc-600 flex flex-col items-center justify-center opacity-40 cursor-not-allowed shrink-0">
                    <span className="text-[10px] font-mono text-zinc-600 leading-none font-bold">
                      {node.id}
                    </span>
                    <Lock className="w-2.5 h-2.5 text-zinc-700 mt-0.5" />
                  </div>
                )}

                {/* Node Title & Details on the Side */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap flex flex-col ${
                    isLeftSided
                      ? 'right-full mr-3 items-end text-right'
                      : 'left-full ml-3 items-start text-left'
                  }`}
                >
                  <span
                    className={`text-[11px] md:text-xs font-semibold tracking-tight leading-tight transition-colors ${
                      isCurrent
                        ? 'text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                        : isUnlocked
                        ? 'text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                        : 'text-zinc-600 opacity-50'
                    }`}
                  >
                    {node.title}
                  </span>
                  {node.subtitle && isUnlocked && (
                    <span className="text-[9px] text-zinc-400 font-medium leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {node.subtitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Minimal Clean Hover Tooltip */}
              {isHovered && !isCurrent && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-12 px-3 py-1.5 rounded-xl minimal-card shadow-2xl whitespace-nowrap z-30 pointer-events-none animate-fadeIn border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-400">Level {node.id}:</span>
                    <p className="text-xs font-semibold text-zinc-100">{node.title}</p>
                  </div>
                  {node.subtitle && (
                    <p className="text-[10px] text-zinc-400">{node.subtitle}</p>
                  )}
                  {!isUnlocked && (
                    <p className="text-[9px] text-amber-400/80 font-mono mt-0.5">Complete Level {node.id - 1} to unlock</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Rest Stop Sanctuary Landmarks (Between Regions at Nodes 10, 20, 30, 40, 50) */}
        {[1, 2, 3, 4, 5].map((regionId) => {
          const region = REGIONS.find((r) => r.id === regionId);
          if (!region) return null;
          const endNode = nodes.find((n) => n.id === region.endNode);
          if (!endNode) return null;
          const stopY = endNode.y - 55;
          const isPassed = (saveData.nodes[region.endNode]?.stars || 0) > 0;

          return (
            <div
              key={`rest-${regionId}`}
              className="absolute left-1/2 -translate-x-1/2 z-20 cursor-pointer select-none -translate-y-1/2"
              style={{ top: `${stopY}px` }}
              onClick={() => onOpenRestStop(regionId)}
            >
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                  isPassed
                    ? 'minimal-btn-secondary border-emerald-500/30 text-emerald-400'
                    : 'bg-[#121318] border border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Flame className="w-3 h-3 fill-current text-amber-400" />
                <span className="text-xs font-semibold">
                  Rest Sanctuary {regionId}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
