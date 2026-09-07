import { SignDefinition } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface CoachContext {
  currentSign?: {
    id: string;
    label: string;
    aslLetterOrWord?: string;
  };
  questProgress?: {
    completedCount: number;
    totalStars: number;
    streak: number;
    currentLevel: number;
  };
}

export interface AiCoachResponse {
  reply: string;
  suggestions?: string[];
  source?: string;
}

export interface SignHintResponse {
  signId: string;
  hint: string;
  source?: string;
}

class AiService {
  private hintCache: Map<string, string> = new Map();

  /**
   * Chat with the Gemini AI Sign Sensei
   */
  public async askCoach(
    message: string,
    context?: CoachContext,
    conversationHistory?: ChatMessage[]
  ): Promise<AiCoachResponse> {
    try {
      const historyPayload = conversationHistory?.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context,
          conversationHistory: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        reply: data.reply,
        suggestions: data.suggestions || [],
        source: data.source || 'gemini-3.8-flash',
      };
    } catch (err) {
      console.warn('AI Coach fetch error:', err);
      return {
        reply: `Here is a tip for your gesture training: keep your hand directly facing the camera, ensure good lighting on your knuckles, and maintain a steady wrist posture. What specific sign or letter can I help you with?`,
        suggestions: [
          'How do I position my thumb for Letter A?',
          'What is the difference between Letter B and Letter 4?',
          'How do I practice fluid finger-spelling?',
        ],
        source: 'local-fallback',
      };
    }
  }

  /**
   * Fetch custom AI mnemonic and precision cues for a specific sign
   */
  public async getSignHint(sign: SignDefinition): Promise<string> {
    if (this.hintCache.has(sign.id)) {
      return this.hintCache.get(sign.id)!;
    }

    try {
      const res = await fetch('/api/ai/sign-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signId: sign.id,
          signLabel: sign.label,
          aslLetterOrWord: sign.aslLetterOrWord,
          description: sign.description,
          instruction: sign.instruction,
          tip: sign.tip,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: SignHintResponse = await res.json();
      if (data.hint) {
        this.hintCache.set(sign.id, data.hint);
        return data.hint;
      }
    } catch (err) {
      console.warn('Sign hint fetch error:', err);
    }

    // Default fallback from sign definition
    const defaultHint = `💡 **Mnemonic**: Think of "${sign.label}" formed clearly against your palm.\n✋ **Hand Placement**: ${sign.tip || sign.instruction}\n⚠️ **Watch Out**: Keep your hand in center camera view.`;
    this.hintCache.set(sign.id, defaultHint);
    return defaultHint;
  }
}

export const aiService = new AiService();
