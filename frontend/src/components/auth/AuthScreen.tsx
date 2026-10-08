import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const { signIn, signUp, error, sessionExpiredMessage, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessNotice(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('Please choose a password with at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      const res = await signUp(trimmedEmail, password);
      setIsSubmitting(false);
      if (res.success && res.error) {
        // e.g. account created notification
        setSuccessNotice(res.error);
        setMode('signin');
      }
    } else {
      setIsSubmitting(true);
      await signIn(trimmedEmail, password);
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Botanical ambient gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-stone-900/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-stone-900/80 border border-stone-800/80 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10 transition-all">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-serif tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>PRAROHA</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif text-stone-100 font-normal tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-stone-400 text-sm mt-2 font-sans font-light">
            {mode === 'signin'
              ? 'Sign in to continue growing your worlds.'
              : 'Start growing your first world.'}
          </p>
        </div>

        {/* Expired Session Notice */}
        {sessionExpiredMessage && (
          <div className="mb-6 p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-start gap-2.5 text-amber-200 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{sessionExpiredMessage}</span>
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-start gap-2.5 text-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Notice */}
        {activeError && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{activeError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 font-serif mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              autoComplete="email"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 font-serif mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors text-sm"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-400 font-serif mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 font-serif font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center pt-4 border-t border-stone-800/60">
          {mode === 'signin' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setLocalError(null);
                setSuccessNotice(null);
                clearError();
              }}
              className="text-stone-400 hover:text-emerald-400 text-xs transition-colors cursor-pointer"
            >
              Don't have an account? <span className="text-emerald-400 font-medium">Create one</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setLocalError(null);
                setSuccessNotice(null);
                clearError();
              }}
              className="text-stone-400 hover:text-emerald-400 text-xs transition-colors cursor-pointer"
            >
              Already have an account? <span className="text-emerald-400 font-medium">Sign in</span>
            </button>
          )}
        </div>
      </div>

      {/* Editorial footer */}
      <div className="mt-8 text-center text-stone-600 text-xs font-serif tracking-widest">
        SEED → UNIVERSE · TATTVA 2
      </div>
    </div>
  );
};
