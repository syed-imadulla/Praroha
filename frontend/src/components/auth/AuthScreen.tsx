import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Sparkles, ArrowRight, AlertCircle, CheckCircle2, Mail, KeyRound, RefreshCw } from 'lucide-react';

type AuthScreenMode = 'signin' | 'signup' | 'forgot_password' | 'verify_email_sent' | 'reset_password';

export const AuthScreen: React.FC = () => {
  const {
    signIn,
    signUp,
    resendVerificationEmail,
    resetPasswordForEmail,
    updateUserPassword,
    error,
    sessionExpiredMessage,
    isPasswordRecovery,
    clearError,
    clearPasswordRecovery,
  } = useAuthStore();

  const [mode, setMode] = useState<AuthScreenMode>(
    isPasswordRecovery ? 'reset_password' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // If password recovery state changes in store
  React.useEffect(() => {
    if (isPasswordRecovery) {
      setMode('reset_password');
    }
  }, [isPasswordRecovery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessNotice(null);
    clearError();

    const trimmedEmail = email.trim();

    if (mode === 'reset_password') {
      if (newPassword.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      setIsSubmitting(true);
      const res = await updateUserPassword(newPassword);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessNotice('Your password has been successfully updated. You may now sign in.');
        clearPasswordRecovery();
        setMode('signin');
      } else if (res.error) {
        setLocalError(res.error);
      }
      return;
    }

    if (mode === 'forgot_password') {
      if (!trimmedEmail) {
        setLocalError('Please enter your email address to receive a reset link.');
        return;
      }
      setIsSubmitting(true);
      const res = await resetPasswordForEmail(trimmedEmail);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessNotice(`Password reset link sent to ${trimmedEmail}. Please check your inbox.`);
      } else if (res.error) {
        setLocalError(res.error);
      }
      return;
    }

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

      if (res.success) {
        if (res.requiresVerification) {
          setMode('verify_email_sent');
        } else {
          setSuccessNotice('Account successfully created!');
        }
      } else if (res.error) {
        setLocalError(res.error);
      }
    } else {
      setIsSubmitting(true);
      const res = await signIn(trimmedEmail, password);
      setIsSubmitting(false);
      if (!res.success && res.unconfirmedEmail) {
        setLocalError('Your email address has not been verified yet. Check your inbox or request a new verification email below.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your email address first.');
      return;
    }
    setIsSubmitting(true);
    const res = await resendVerificationEmail(trimmedEmail);
    setIsSubmitting(false);
    if (res.success) {
      setSuccessNotice(`Verification email sent to ${trimmedEmail}. Check your inbox.`);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (res.error) {
      setLocalError(res.error);
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
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'verify_email_sent' && 'Verify your email'}
            {mode === 'forgot_password' && 'Reset your password'}
            {mode === 'reset_password' && 'Set new password'}
          </h1>
          <p className="text-stone-400 text-sm mt-2 font-sans font-light">
            {mode === 'signin' && 'Sign in to continue growing your worlds.'}
            {mode === 'signup' && 'Start growing your first world.'}
            {mode === 'verify_email_sent' && 'A verification link has been sent to your email.'}
            {mode === 'forgot_password' && 'Enter your email to receive a password recovery link.'}
            {mode === 'reset_password' && 'Enter your new secure password.'}
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

        {/* Mode: Verify Email Sent */}
        {mode === 'verify_email_sent' ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <Mail className="w-8 h-8" />
            </div>
            <p className="text-sm text-stone-300 leading-relaxed font-sans">
              We sent a confirmation email to <span className="font-semibold text-emerald-300">{email}</span>. Click the link in that email to activate your account.
            </p>
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-serif transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend verification email'}
                </span>
              </button>
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
                Back to sign in
              </button>
            </div>
          </div>
        ) : (
          /* Form for signin, signup, forgot_password, reset_password */
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'reset_password' && (
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
            )}

            {mode === 'reset_password' ? (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-400 font-serif mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-400 font-serif mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors text-sm"
                  />
                </div>
              </>
            ) : mode !== 'forgot_password' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-wider text-stone-400 font-serif">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setLocalError(null);
                        setSuccessNotice(null);
                        clearError();
                      }}
                      className="text-xs text-emerald-400/80 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
            ) : null}

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
              <span>
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot_password' && 'Send Reset Link'}
                {mode === 'reset_password' && 'Update Password'}
              </span>
              {mode === 'forgot_password' ? (
                <KeyRound className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>
        )}

        {/* Resend verification prompt if signin fails due to unconfirmed email */}
        {mode === 'signin' && activeError?.toLowerCase().includes('not been verified') && (
          <div className="mt-4 pt-3 border-t border-stone-800/50 text-center">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendCooldown > 0 || isSubmitting}
              className="text-xs text-amber-300 hover:text-amber-200 underline cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend confirmation link'}
            </button>
          </div>
        )}

        {/* Toggle Mode Footer */}
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
          ) : mode === 'signup' ? (
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
              Back to sign in
            </button>
          )}
        </div>

        {/* Guest / Demo Explorer */}
        <div className="mt-4 pt-3 border-t border-stone-800/40 text-center">
          <button
            type="button"
            data-testid="auth-guest-demo-btn"
            onClick={() => useAuthStore.getState().continueAsGuest()}
            className="text-xs text-stone-400 hover:text-emerald-300 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-stone-900/50 font-serif"
          >
            Explore in Demo Workspace →
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-stone-600 text-xs font-serif tracking-widest">
        SEED → UNIVERSE · BOTANICAL CREATIVE JOURNAL
      </div>
    </div>
  );
};
