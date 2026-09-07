import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, Lightbulb, Compass } from 'lucide-react';
import { aiService, ChatMessage, CoachContext } from '../services/aiService';
import { SaveData, SignDefinition } from '../types';
import { audio } from '../services/audioService';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveData: SaveData;
  activeSign?: SignDefinition | null;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  saveData,
  activeSign,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'How do I avoid mixing up Letter A, S, and E?',
    'What are the 5 core parameters of ASL?',
    'Tips for better camera detection with MediaPipe',
    'Explain Deaf culture etiquette for beginners',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const completedCount = Object.values(saveData.nodes || {}).filter(
        (n) => n && typeof n === 'object' && 'stars' in n && (n as { stars: number }).stars > 0
      ).length;

      const welcomeText = activeSign
        ? `Hello, Explorer! I am your AI Sign Sensei powered by Gemini. I see you are currently practicing **${activeSign.label}** (${activeSign.aslLetterOrWord}). How can I help you perfect this gesture?`
        : `Greetings! I am your AI Sign Sensei powered by Gemini. You've conquered **${completedCount}/60** levels so far. Ask me anything about ASL handshapes, mnemonics, finger placement, or Deaf culture!`;

      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: welcomeText,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, activeSign, saveData, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    audio.triggerHaptic('tap');
    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const completedCount = Object.values(saveData.nodes || {}).filter(
      (n) => n && typeof n === 'object' && 'stars' in n && (n as { stars: number }).stars > 0
    ).length;

    const context: CoachContext = {
      currentSign: activeSign
        ? {
            id: activeSign.id,
            label: activeSign.label,
            aslLetterOrWord: activeSign.aslLetterOrWord,
          }
        : undefined,
      questProgress: {
        completedCount,
        totalStars: saveData.totalStars,
        streak: saveData.currentStreak,
        currentLevel: saveData.currentLevel,
      },
    };

    try {
      const response = await aiService.askCoach(text, context, updatedMessages);
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          content: response.reply,
          timestamp: Date.now(),
        },
      ]);

      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (err) {
      console.error('Coach reply error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          content: 'I had a momentary hiccup connecting to the stars, but remember: keep your wrist steady and relax your fingers when forming shapes!',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    // Simple markdown renderer for bold and bullet lists
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs md:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Parse bold **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formatted = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={i} className="text-emerald-300 font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="flex-1 text-zinc-200">{formatted}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-zinc-200">
              {formatted}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg h-[88vh] max-h-[640px] bg-[#0C0D12] border border-white/[0.1] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#111319]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
                  AI Sign Sensei
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {activeSign
                  ? `Focusing on: ${activeSign.label} (${activeSign.aslLetterOrWord})`
                  : 'Real-time ASL Tutor & Quest Guide'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.triggerHaptic('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-xl minimal-btn-secondary flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
            title="Close AI Sensei"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-emerald-600/90 text-white rounded-tr-none'
                    : 'bg-[#151720] border border-white/[0.08] text-zinc-200 rounded-tl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  renderContent(msg.content)
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-white/[0.1] border border-white/[0.1] flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#151720] border border-white/[0.08] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span className="text-xs text-zinc-400">Sensei is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && !loading && (
          <div className="px-4 py-2 border-t border-white/[0.05] bg-[#0E0F14] overflow-x-auto flex gap-2 no-scrollbar">
            {suggestions.slice(0, 3).map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="whitespace-nowrap px-3 py-1 rounded-xl bg-white/[0.05] hover:bg-emerald-500/15 border border-white/[0.08] hover:border-emerald-500/30 text-[11px] text-zinc-300 hover:text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Lightbulb className="w-3 h-3 text-amber-400/80 shrink-0" />
                <span>{sug}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 md:p-4 border-t border-white/[0.08] bg-[#111319] flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeSign
                ? `Ask about signing ${activeSign.label}...`
                : 'Ask AI Sensei about ASL gestures, mnemonics, or signs...'
            }
            className="flex-1 bg-black/40 border border-white/[0.1] focus:border-emerald-500/50 rounded-2xl px-4 py-2.5 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              input.trim() && !loading
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md active:scale-95'
                : 'bg-white/[0.06] text-zinc-600 cursor-not-allowed'
            }`}
            title="Send to AI Sensei"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
