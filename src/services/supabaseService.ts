import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SaveData, UserProfile } from '../types';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured: boolean = false;
  private currentUser: UserProfile | null = null;

  constructor() {
    const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
    const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim().replace(/^["']|["']$/g, '');

    if (rawUrl && rawKey && rawUrl.startsWith('http')) {
      try {
        this.client = createClient(rawUrl, rawKey);
        this.isConfigured = true;
        this.initAuthListener();
      } catch (err) {
        console.warn('Supabase client initialization:', err);
      }
    }
  }

  public getIsConfigured(): boolean {
    return this.isConfigured;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  private async initAuthListener() {
    if (!this.client) return;

    try {
      const { data } = await this.client.auth.getUser();
      if (data?.user) {
        this.setCurrentUserFromAuth(data.user);
      }

      this.client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.setCurrentUserFromAuth(session.user);
        } else {
          this.currentUser = null;
        }
      });
    } catch (e) {
      console.warn('Auth check error:', e);
    }
  }

  private setCurrentUserFromAuth(user: User) {
    this.currentUser = {
      id: user.id,
      email: user.email,
      isGuest: false,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Learner',
    };
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public async signInWithEmail(email: string, password: string): Promise<{ error?: string; user?: UserProfile }> {
    if (!this.client) {
      return { error: 'Authentication service is not ready. Please try again.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { error: 'Please enter both email and password.' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim(),
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials')) {
          return { error: 'Invalid email or password. Please verify your credentials or switch to Create Account.' };
        }
        if (msg.includes('email not confirmed')) {
          return { error: 'Email has not been confirmed yet. Please check your inbox or disable email confirmation in your Supabase Auth settings.' };
        }
        if (msg.includes('too many requests')) {
          return { error: 'Too many attempts. Please wait a moment and try again.' };
        }
        return { error: error.message };
      }

      if (data.user) {
        this.setCurrentUserFromAuth(data.user);
        return { user: this.currentUser! };
      }
      return { error: 'Sign in was unsuccessful. Please check your email and password.' };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Unknown login error occurred.' };
    }
  }

  public async signUpWithEmail(email: string, password: string, name?: string): Promise<{ error?: string; user?: UserProfile }> {
    if (!this.client) {
      return { error: 'Authentication service is not ready.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { error: 'Please enter both email and password.' };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email: cleanEmail,
        password: password.trim(),
        options: {
          data: { name: name?.trim() || cleanEmail.split('@')[0] },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('unique constraint')) {
          return { error: 'An account with this email already exists. Please switch to Sign In.' };
        }
        return { error: error.message };
      }

      // Check if user already exists (Supabase security feature returns empty identities array when user is already registered)
      if (data.user?.identities && data.user.identities.length === 0) {
        return { error: 'An account with this email already exists. Please switch to Sign In.' };
      }

      if (data.user) {
        if (data.session) {
          this.setCurrentUserFromAuth(data.user);
          return { user: this.currentUser! };
        } else {
          // If no session is returned, email confirmation is active on the Supabase project
          return {
            error: 'Account created! Please check your email inbox to verify your address before signing in (or disable email confirmation in your Supabase Auth dashboard).'
          };
        }
      }

      return { error: 'Unable to complete account registration.' };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Sign up error occurred.' };
    }
  }

  public async signOut(): Promise<void> {
    try {
      if (this.client) {
        await this.client.auth.signOut();
      }
    } catch (e) {
      console.warn('Signout warning:', e);
    } finally {
      this.currentUser = null;
    }
  }

  // Cloud sync progress
  public async syncProgressToCloud(saveData: SaveData): Promise<boolean> {
    if (!this.client || !this.currentUser || this.currentUser.isGuest) {
      return false;
    }

    try {
      const { error } = await this.client
        .from('signquest_progress')
        .upsert(
          {
            user_id: this.currentUser.id,
            total_stars: saveData.totalStars,
            current_streak: saveData.currentStreak,
            save_data: saveData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.warn('Cloud sync error (table may need creating):', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Sync failed:', err);
      return false;
    }
  }

  public async fetchProgressFromCloud(): Promise<SaveData | null> {
    if (!this.client || !this.currentUser) return null;

    try {
      const { data, error } = await this.client
        .from('signquest_progress')
        .select('save_data')
        .eq('user_id', this.currentUser.id)
        .single();

      if (!error && data?.save_data) {
        return data.save_data as SaveData;
      }
    } catch (err) {
      console.warn('Failed to load cloud progress:', err);
    }
    return null;
  }
}

export const supabaseService = new SupabaseService();
