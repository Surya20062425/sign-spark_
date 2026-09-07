import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { storageService } from '../services/storageService';
import { UserProfile, SaveData } from '../types';
import { Sparkles, Mail, Lock, User as UserIcon, Check, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { audio } from '../services/audioService';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
  saveData: SaveData;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
  saveData,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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
        audio.playMatchDing();
        if (res.user) {
          setStatusMsg({ type: 'success', text: 'Account created! Loading your quest...' });
          onLoginSuccess(res.user);
          await supabaseService.syncProgressToCloud(saveData);
        } else {
          setStatusMsg({ type: 'info', text: 'Account created! Please check your email to confirm or sign in.' });
        }
      }
    } else {
      const res = await supabaseService.signInWithEmail(email, password);
      setLoading(false);
      if (res.error) {
        setStatusMsg({ type: 'error', text: res.error });
      } else {
        audio.playMatchDing();
        setStatusMsg({ type: 'success', text: 'Welcome back! Syncing your progress...' });
        if (res.user) {
          onLoginSuccess(res.user);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090A0E] select-none overflow-y-auto">
      {/* Background ambient grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(52, 211, 153, 0.08) 0%, transparent 70%),
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      <div className="relative w-full max-w-md minimal-card rounded-3xl p-6 md:p-8 flex flex-col shadow-2xl border border-white/10 z-10 my-auto">
        {/* App Branding & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-zinc-100 shadow-md mb-3">
            <Sparkles className="w-7 h-7 text-emerald-400 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            SignQuest
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-normal max-w-xs">
            Interactive AI-Powered ASL Mastery with Real-Time Gesture Tracking
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="w-full grid grid-cols-2 gap-1 p-1 rounded-2xl minimal-inset mb-4 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setStatusMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setStatusMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isSignUp
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Message Alert */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs font-medium flex items-start gap-2.5 animate-fadeIn ${
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
                  className="block mt-1.5 text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                >
                  Click here to Sign In with this email
                </button>
              )}
            </div>
          </div>
        )}

        {/* Supabase Authentication Form */}
        <form onSubmit={handleAuth} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider font-mono">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Alex Learner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl minimal-inset text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider font-mono">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="learner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl minimal-inset text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl minimal-inset text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl minimal-btn-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-transform"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In & Sign Up */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setStatusMsg(null);
            }}
            className="text-xs text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer"
          >
            {isSignUp ? (
              <span>Already have an account? <strong className="text-emerald-400">Sign In</strong></span>
            ) : (
              <span>Don't have an account? <strong className="text-emerald-400">Create one</strong></span>
            )}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-zinc-500 uppercase font-mono font-medium tracking-widest">
            or
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Continue as Guest option */}
        <button
          type="button"
          onClick={() => {
            audio.triggerHaptic('tap');
            onContinueAsGuest();
          }}
          className="w-full py-2.5 px-4 rounded-xl minimal-btn-secondary text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-white/20"
        >
          <span>Continue as Guest</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        <p className="text-[10px] text-zinc-500 text-center mt-3 leading-tight">
          Progress is automatically saved and syncs to your account when signed in.
        </p>
      </div>
    </div>
  );
};
