import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `You are the SignQuest AI Sensei, an enthusiastic, expert American Sign Language (ASL) tutor and quest companion.
Your goal is to guide players as they learn ASL handshapes, numbers, letters, words, and phrases in a gamified quest.
Key Guidelines:
1. Explain signs clearly using the 5 parameters of ASL: Handshape, Palm Orientation, Location, Movement, and Non-Manual Markers (facial expressions).
2. Provide memorable mnemonics and visualization tricks to help signs stick in memory.
3. Highlight common mistakes beginners make (e.g., confusing letters A, S, and T; improper thumb tucks; backward palm orientations).
4. Encourage players with a friendly, motivational tone.
5. Provide thoughtful insights into Deaf culture and etiquette when relevant.
6. Keep responses concise, well-formatted, and easy to read quickly during game sessions.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    res.json({
      status: 'ok',
      service: 'SignQuest API',
      aiConfigured: hasKey,
      model: 'gemini-3.8-flash',
    });
  });

  // AI Sign Coach chat endpoint
  app.post('/api/ai/coach', async (req: Request, res: Response) => {
    const { message, context, conversationHistory } = req.body || {};

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getAiClient();

    // Context details to enrich the prompt
    let contextualPrefix = '';
    if (context) {
      const { currentSign, questProgress } = context;
      if (currentSign) {
        contextualPrefix += `[Current Active Sign: "${currentSign.label || currentSign.aslLetterOrWord || currentSign.id}"]\n`;
      }
      if (questProgress) {
        contextualPrefix += `[Player Quest Progress: ${questProgress.completedCount || 0}/60 levels completed, ${questProgress.totalStars || 0} stars, streak: ${questProgress.streak || 0} days]\n`;
      }
    }

    if (!ai) {
      // Elegant pedagogical fallback if Gemini API key is not yet set
      const cleanMsg = message.toLowerCase();
      let fallbackReply = `Welcome to SignQuest AI Sensei! I'm here to help you master ASL gestures and handshapes. `;

      if (cleanMsg.includes('tip') || cleanMsg.includes('help') || cleanMsg.includes('how')) {
        fallbackReply += `Here are the foundational rules of ASL:
• **Handshape**: Relax your fingers and maintain distinct knuckle bends.
• **Palm Orientation**: Most alphabet letters face forward toward the camera or conversational partner unless specified.
• **Consistency**: Sign in your comfortable 'signing space' between your chest and chin.`;
      } else if (cleanMsg.includes('mnemonic') || cleanMsg.includes('remember')) {
        fallbackReply += `A great mnemonic technique is associating the letter shape with a physical object. For example:
• **Letter C**: Your hand literally forms a cup or crescent.
• **Letter B**: Four fingers standing tall like a banner, thumb folded in front.
• **Letter D**: Index finger points straight up like the tall vertical stem of a lowercase 'd'.`;
      } else {
        fallbackReply += `Feel free to ask me for handshape tips, mnemonics, or etiquette tips for any sign in your quest!`;
      }

      res.json({
        reply: fallbackReply,
        source: 'fallback',
        suggestions: [
          'How do I form the Letter A vs Letter S?',
          'Tips for proper camera lighting for sign detection',
          'Explain the 5 parameters of ASL',
        ],
      });
      return;
    }

    try {
      // Build conversation contents
      let contentsPayload: string = '';
      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-4).map((item) => `${item.role === 'user' ? 'User' : 'Sensei'}: ${item.content}`).join('\n');
        contentsPayload = `${contextualPrefix}\nRecent Conversation:\n${recentHistory}\n\nUser: ${message}\nSensei:`;
      } else {
        contentsPayload = `${contextualPrefix}\nUser: ${message}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const replyText = response.text || 'I am ready to help with your sign language quest!';

      res.json({
        reply: replyText,
        source: 'gemini-3.8-flash',
        suggestions: [
          'Give me a mnemonic for this sign',
          'What are common beginner errors with this sign?',
          'Quiz me on a random sign',
        ],
      });
    } catch (error) {
      console.error('Gemini API Coach error:', error);
      res.json({
        reply: `Great question! Here is a core tip from the SignQuest coaching playbook: focus on keeping your wrist steady and your palm orientation accurate. For the sign you are currently practicing, ensure your thumb is placed properly against your fingers so the camera can clearly read the silhouette.`,
        source: 'fallback-on-error',
        suggestions: [
          'How do I distinguish Letter A from Letter S?',
          'What is the best hand distance from the webcam?',
        ],
      });
    }
  });

  // Dedicated instant sign-hint endpoint for pre-detection tips
  app.post('/api/ai/sign-hint', async (req: Request, res: Response) => {
    const { signId, signLabel, aslLetterOrWord, description, instruction, tip } = req.body || {};

    const ai = getAiClient();
    const prompt = `Give me a concise, expert 3-bullet coach tip for signing "${signLabel || aslLetterOrWord || signId}".
Details:
- Description: ${description || 'N/A'}
- Instruction: ${instruction || 'N/A'}
- Tip: ${tip || 'N/A'}

Provide:
1. 💡 **Mnemonic Hook**: One catchy memory aid.
2. ✋ **Hand Placement**: Specific finger or palm cue to get it detected accurately.
3. ⚠️ **Watch Out**: The single most common beginner error.
Keep each bullet point to 1-2 short sentences.`;

    if (!ai) {
      res.json({
        signId,
        hint: `💡 **Mnemonic Hook**: Visualize the visual shape of "${aslLetterOrWord || signLabel}".\n✋ **Hand Placement**: ${instruction || tip || 'Keep your palm upright and fingers clean.'}\n⚠️ **Watch Out**: Avoid tilting your hand too far backward away from the camera lens.`,
        source: 'fallback',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.5,
        },
      });

      res.json({
        signId,
        hint: response.text || `Focus on proper palm orientation and distinct finger separation for ${signLabel}.`,
        source: 'gemini-3.8-flash',
      });
    } catch (error) {
      console.error('Gemini Sign Hint error:', error);
      res.json({
        signId,
        hint: `💡 **Mnemonic Hook**: Form the distinctive contours of ${signLabel}.\n✋ **Hand Placement**: ${instruction || tip || 'Position hand center-frame.'}\n⚠️ **Watch Out**: Keep your wrist relaxed and aligned with your forearm.`,
        source: 'fallback-on-error',
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SignQuest] Server running on http://localhost:${PORT}`);
  });
}

startServer();
