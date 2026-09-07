import React, { useState, useEffect } from 'react';
import { GameScreen, MapNode, SaveData, SignDefinition, UserProfile } from './types';
import { MAP_NODES } from './data/mapNodes';
import { SIGN_DEFINITIONS } from './data/signs';
import { storageService } from './services/storageService';
import { supabaseService } from './services/supabaseService';
import { audio } from './services/audioService';
import { WindingMap } from './components/WindingMap';
import { PromptScreen } from './components/PromptScreen';
import { DetectionScreen } from './components/DetectionScreen';
import { StarRevealScreen } from './components/StarRevealScreen';
import { BossBattleView } from './components/BossBattleView';
import { RestStopView } from './components/RestStopView';
import { WatchTapFallback } from './components/WatchTapFallback';
import { BottomBar } from './components/BottomBar';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { AICoachModal } from './components/AICoachModal';
import { Sparkles, LogOut, Bot } from 'lucide-react';

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(storageService.getSaveData());
  const [gameState, setGameState] = useState<GameScreen>('map');
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);
  const [activeSignIndex, setActiveSignIndex] = useState<number>(0);
  const [activeRegionRestStop, setActiveRegionRestStop] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(supabaseService.getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAiCoach, setShowAiCoach] = useState<boolean>(false);
  
  // Track whether the user has passed the initial login screen in this session
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(() => {
    return Boolean(supabaseService.getCurrentUser() && !supabaseService.getCurrentUser()?.isGuest);
  });

  // Result metrics for star reveal
  const [earnedStars, setEarnedStars] = useState<number>(3);
  const [lastConfidence, setLastConfidence] = useState<number>(0.92);
  const [lastAttempts, setLastAttempts] = useState<number>(1);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageService.subscribe((data) => {
      setSaveData({ ...data });
    });
    return () => unsubscribe();
  }, []);

  // Handle node selection from map
  const handleSelectNode = (node: MapNode) => {
    setActiveNode(node);
    setActiveSignIndex(0);

    if (node.type === 'boss') {
      setGameState('boss_mode');
    } else {
      setGameState('prompt');
    }
  };

  // Automatically advance to the next level practice
  const handleNextLevel = () => {
    if (!activeNode) {
      handleReturnToMap();
      return;
    }

    const nextNode = MAP_NODES.find((n) => n.id === activeNode.id + 1);
    if (nextNode) {
      handleSelectNode(nextNode);
    } else {
      handleReturnToMap();
    }
  };

  // Get current active sign definition
  const getCurrentSign = (): SignDefinition | undefined => {
    if (!activeNode || !activeNode.signIds || activeNode.signIds.length === 0) return undefined;
    const signId = activeNode.signIds[activeSignIndex] || activeNode.signIds[0];
    return SIGN_DEFINITIONS[signId];
  };

  // On detection success
  const handleDetectionSuccess = (attempts: number, confidence: number) => {
    if (!activeNode) return;

    const stars = attempts <= 1 ? 3 : attempts === 2 ? 2 : 1;
    setEarnedStars(stars);
    setLastAttempts(attempts);
    setLastConfidence(confidence);

    storageService.completeNode(activeNode.id, stars, confidence);

    if (activeNode.shortcutTo && activeNode.requiredStarsForShortcut) {
      if (saveData.totalStars + stars >= activeNode.requiredStarsForShortcut) {
        storageService.unlockShortcut(activeNode.id, activeNode.shortcutTo);
      }
    }

    setGameState('star_reveal');
  };

  // On Boss Battle complete
  const handleBossBattleComplete = (stars: number, avgConfidence: number) => {
    if (!activeNode) return;
    setEarnedStars(stars);
    setLastAttempts(1);
    setLastConfidence(avgConfidence);

    storageService.completeNode(activeNode.id, stars, avgConfidence);
    setGameState('star_reveal');
  };

  const handleReturnToMap = () => {
    setGameState('map');
    setActiveNode(null);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setHasEnteredApp(true);
    setSaveData(storageService.getSaveData());
  };

  const handleContinueAsGuest = () => {
    const guestUser: UserProfile = {
      id: 'guest',
      name: 'Guest Explorer',
      isGuest: true,
    };
    setCurrentUser(guestUser);
    setHasEnteredApp(true);
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    setHasEnteredApp(false);
    setShowAuthModal(false);
    setGameState('map');
    setActiveNode(null);
  };

  // Render Supabase Login Page first if not entered yet
  if (!hasEnteredApp) {
    return (
      <LoginPage
        saveData={saveData}
        onLoginSuccess={handleLoginSuccess}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  const currentSign = getCurrentSign();
  const nextNode = activeNode ? MAP_NODES.find((n) => n.id === activeNode.id + 1) : undefined;

  return (
    <div className="relative w-full h-screen bg-[#090A0E] text-[#E2E8F0] overflow-hidden select-none font-sans">
      {/* Top Minimal Console Header Navigation */}
      {gameState === 'map' && (
        <header className="absolute top-4 inset-x-4 md:top-6 md:inset-x-8 z-20 pointer-events-none flex items-center justify-end">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                audio.triggerHaptic('tap');
                setShowAiCoach(true);
              }}
              className="px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="AI Sign Sensei (Powered by Gemini 3.8 Flash)"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Sensei</span>
            </button>

            <button
              onClick={() => {
                audio.triggerHaptic('tap');
                setShowAuthModal(true);
              }}
              className="minimal-btn-secondary px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              title={currentUser && !currentUser.isGuest ? `Signed in as ${currentUser.name}` : 'Sign in with Supabase'}
            >
              <div className="w-5 h-5 rounded-md bg-white/[0.1] flex items-center justify-center text-[10px] font-bold text-white">
                {currentUser?.name ? currentUser.name.slice(0, 1).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-zinc-200">
                {currentUser && !currentUser.isGuest ? currentUser.name : `Level ${Math.floor(saveData.totalStars / 5) + 1}`}
              </span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-xl minimal-btn-secondary flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer shadow-lg"
              title="Sign Out / Switch Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* 1. Map View (The primary game board) */}
      <WindingMap
        nodes={MAP_NODES}
        saveData={saveData}
        onSelectNode={handleSelectNode}
        onOpenRestStop={(regionId) => setActiveRegionRestStop(regionId)}
      />

      {/* Persistent Bottom Bar */}
      {gameState === 'map' && (
        <BottomBar
          saveData={saveData}
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenAiCoach={() => setShowAiCoach(true)}
        />
      )}

      {/* 2. Pre-detection Prompt Screen */}
      {gameState === 'prompt' && currentSign && (
        <PromptScreen
          sign={currentSign}
          onStartDetection={() => setGameState('detecting')}
          onCancel={handleReturnToMap}
        />
      )}

      {/* 3. Real-Time Camera Detection View */}
      {gameState === 'detecting' && currentSign && (
        <DetectionScreen
          sign={currentSign}
          onSuccess={handleDetectionSuccess}
          onFallbackToQuiz={() => setGameState('watch_tap')}
          onCancel={handleReturnToMap}
        />
      )}

      {/* 4. Watch & Tap Fallback Mode */}
      {gameState === 'watch_tap' && currentSign && (
        <WatchTapFallback
          sign={currentSign}
          onSuccess={() => handleDetectionSuccess(1, 0.95)}
          onCancel={handleReturnToMap}
        />
      )}

      {/* 5. Boss Battle Sequence View */}
      {gameState === 'boss_mode' && activeNode && (
        <BossBattleView
          bossTitle={activeNode.title}
          signIds={activeNode.signIds}
          onComplete={handleBossBattleComplete}
          onCancel={handleReturnToMap}
        />
      )}

      {/* 6. Star Reveal & Celebration View with Auto-Advance to Next Level */}
      {gameState === 'star_reveal' && activeNode && (
        <StarRevealScreen
          starsEarned={earnedStars}
          attempts={lastAttempts}
          confidence={lastConfidence}
          signLabel={activeNode.title}
          onContinue={handleReturnToMap}
          onNextLevel={handleNextLevel}
          hasNextLevel={Boolean(nextNode)}
          nextLevelTitle={nextNode ? `${nextNode.title}${nextNode.subtitle ? ` (${nextNode.subtitle})` : ''}` : undefined}
        />
      )}

      {/* 7. Rest Stop Sanctuary Celebration */}
      {activeRegionRestStop !== null && (
        <RestStopView
          regionId={activeRegionRestStop}
          saveData={saveData}
          onClose={() => setActiveRegionRestStop(null)}
        />
      )}

      {/* Supabase Cloud Auth & Backup Modal */}
      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          saveData={saveData}
          onClose={() => setShowAuthModal(false)}
          onUserChange={(user) => {
            setCurrentUser(user);
            setSaveData(storageService.getSaveData());
          }}
          onSignOut={handleSignOut}
        />
      )}

      {/* Gemini AI Sign Sensei Coach Modal */}
      <AICoachModal
        isOpen={showAiCoach}
        onClose={() => setShowAiCoach(false)}
        saveData={saveData}
        activeSign={currentSign}
      />
    </div>
  );
}

