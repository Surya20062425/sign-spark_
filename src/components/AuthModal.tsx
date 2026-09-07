import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { storageService } from '../services/storageService';
import { UserProfile, SaveData } from '../types';
import { Cloud, Lock, Mail, User as UserIcon, Check, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { audio } from '../services/audioService';

interface AuthModalProps {
  currentUser: UserProfile | null;
  saveData: SaveData;
  onClose: () => void;
  onUserChange: (user: UserProfile | null) => void;
  onSignOut?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  saveData,
  onClose,
  onUserChange,
  onSignOut,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isConfigured = supabaseService.getIsConfigured();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setStatusMsg({ type: 'error', text: 'Please enter both email and password.' });
      return;
    }

    if (password.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    if (isSignUp) {
      const res = await supabaseService.signUpWithEmail(email, password, name.trim());
      setLoading(false);
      if (res.error) {
        setStatusMsg({ type: 'error', text: res.error });
      } else {
        setStatusMsg({ type: 'success', text: 'Account created! You are now signed in.' });
        if (res.user) {
          onUserChange(res.user);
          await supabaseService.syncProgressToCloud(saveData);
        }
      }
    } else {
      const res = await supabaseService.signInWithEmail(email, password);
      setLoading(false);
      if (res.error) {
        setStatusMsg({ type: 'error', text: res.error });
      } else {
        setStatusMsg({ type: 'success', text: 'Welcome back! Syncing your progress.' });
        if (res.user) {
          onUserChange(res.user);
          const cloudSave = await supabaseService.fetchProgressFromCloud();
          if (cloudSave && cloudSave.totalStars > saveData.totalStars) {
            storageService.saveProgress(cloudSave);
          } else {
            await supabaseService.syncProgressToCloud(saveData);
          }
        }
      }
    }
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    onUserChange(null);
    if (onSignOut) {
      onSignOut();
    }
    setStatusMsg({ type: 'info', text: 'Signed out. Storing progress locally.' });
  };

  const handleManualSync = async () => {
    setLoading(true);
    const ok = await supabaseService.syncProgressToCloud(saveData);
    setLoading(false);
    if (ok) {
      audio.playMatchDing();
      setStatusMsg({ type: 'success', text: 'Progress synced to Supabase.' });
    } else {
      setStatusMsg({ type: 'error', text: 'Sync failed. Check connection.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090E]/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm minimal-card rounded-3xl p-6 md:p-8 flex flex-col shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl minimal-btn-secondary text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Icon */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-100">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Cloud Backup
            </h3>
            <p className="text-xs text-zinc-400 font-normal">
              Supabase Account Sync
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : statusMsg.type === 'error'
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
            }`}
          >
            {statusMsg.type === 'success' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
            {statusMsg.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <span>{statusMsg.text}</span>
              {statusMsg.text.includes('already exists') && isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setStatusMsg(null);
                  }}
                  className="block mt-1 text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                >
                  Click here to Sign In with this email
                </button>
              )}
            </div>
          </div>
        )}

        {/* Logged in state */}
        {currentUser && !currentUser.isGuest ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl minimal-inset space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  {currentUser.name || currentUser.email}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                {currentUser.email}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-zinc-300 border-t border-white/[0.08]">
                <span className="text-zinc-400 font-normal">Stars Backed Up</span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {saveData.totalStars} ★
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleManualSync}
                disabled={loading}
                className="flex-1 py-3 rounded-xl minimal-btn-primary text-xs font-bold tracking-wide flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-3 rounded-xl minimal-btn-secondary text-zinc-300 hover:text-white text-xs font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Login / Sign Up Form */
          <div>
            <form onSubmit={handleAuth} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl minimal-inset text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl minimal-inset text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl minimal-inset text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl minimal-btn-primary text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{isSignUp ? 'Create Profile' : 'Sign In'}</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setStatusMsg(null);
                }}
                className="text-xs text-zinc-400 hover:text-white font-medium transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
