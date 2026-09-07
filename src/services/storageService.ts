import { SaveData, NodeProgress } from '../types';
import { supabaseService } from './supabaseService';

const STORAGE_KEY = 'signquest_v1_save';

const defaultSaveData: SaveData = {
  version: 1,
  nodes: {
    1: { stars: 0, attempts: 0, bestConfidence: 0 },
  },
  totalStars: 0,
  currentStreak: 1,
  bestStreak: 1,
  shortcutsUnlocked: [],
  soundEnabled: true,
  lastPlayed: new Date().toISOString(),
  unlockedRegion: 1,
};

class StorageService {
  private data: SaveData = defaultSaveData;
  private listeners: Set<(data: SaveData) => void> = new Set();

  constructor() {
    this.loadFromLocal();
  }

  private loadFromLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = { ...defaultSaveData, ...parsed };
          this.updateStreakOnDayChange();
          return;
        }
      }
    } catch {
      // Corrupted storage fallback
    }
    this.data = defaultSaveData;
  }

  private updateStreakOnDayChange() {
    try {
      const last = new Date(this.data.lastPlayed);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        this.data.currentStreak += 1;
        if (this.data.currentStreak > this.data.bestStreak) {
          this.data.bestStreak = this.data.currentStreak;
        }
      } else if (diffDays > 2) {
        // Missed more than 2 days
        this.data.currentStreak = 1;
      }
      this.data.lastPlayed = now.toISOString();
    } catch {
      // Ignored
    }
  }

  public getSaveData(): SaveData {
    return this.data;
  }

  public subscribe(callback: (data: SaveData) => void): () => void {
    this.listeners.add(callback);
    callback(this.data);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.data));
  }

  public saveProgress(data: Partial<SaveData>) {
    this.data = {
      ...this.data,
      ...data,
      lastPlayed: new Date().toISOString(),
    };

    // Calculate total stars
    let total = 0;
    Object.values(this.data.nodes).forEach((n) => {
      total += n.stars || 0;
    });
    this.data.totalStars = total;

    // Check unlocked highest region
    let maxNode = 1;
    Object.keys(this.data.nodes).forEach((k) => {
      const id = parseInt(k, 10);
      if (this.data.nodes[id]?.stars > 0 && id > maxNode) {
        maxNode = id;
      }
    });
    this.data.unlockedRegion = Math.min(6, Math.floor((maxNode - 1) / 10) + 1);

    // Save to local storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // Try cloud sync if Supabase is connected
    supabaseService.syncProgressToCloud(this.data);
    this.notify();
  }

  public completeNode(nodeId: number, starsEarned: number, confidence: number) {
    const existing = this.data.nodes[nodeId] || { stars: 0, attempts: 0, bestConfidence: 0 };
    const newStars = Math.max(existing.stars, starsEarned);
    const bestConf = Math.max(existing.bestConfidence, confidence);

    const updatedNodes: Record<number, NodeProgress> = {
      ...this.data.nodes,
      [nodeId]: {
        stars: newStars,
        attempts: existing.attempts + 1,
        bestConfidence: Math.round(bestConf * 100) / 100,
        completedAt: new Date().toISOString(),
      },
    };

    // Auto-unlock next node if not unlocked yet
    const nextNodeId = nodeId + 1;
    if (nextNodeId <= 60 && !updatedNodes[nextNodeId]) {
      updatedNodes[nextNodeId] = { stars: 0, attempts: 0, bestConfidence: 0 };
    }

    this.saveProgress({ nodes: updatedNodes });
  }

  public unlockShortcut(nodeFrom: number, nodeTo: number) {
    const currentShortcuts = this.data.shortcutsUnlocked || [];
    if (!currentShortcuts.includes(nodeFrom)) {
      const updatedNodes = { ...this.data.nodes };
      // Unlock destination node
      if (!updatedNodes[nodeTo]) {
        updatedNodes[nodeTo] = { stars: 0, attempts: 0, bestConfidence: 0 };
      }
      this.saveProgress({
        shortcutsUnlocked: [...currentShortcuts, nodeFrom],
        nodes: updatedNodes,
      });
    }
  }

  public resetProgress() {
    this.data = {
      ...defaultSaveData,
      nodes: { 1: { stars: 0, attempts: 0, bestConfidence: 0 } },
    };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored
    }
    this.notify();
  }
}

export const storageService = new StorageService();
