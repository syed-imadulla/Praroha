import { create } from 'zustand';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../realtime/supabaseRealtime';
import { useWorkspaceStore } from './workspaceStore';
import { projectSubscription } from '../realtime/projectSubscription';

export type AuthStatus = 'AUTH_LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthState {
  authStatus: AuthStatus;
  user: User | null;
  session: Session | null;
  error: string | null;
  sessionExpiredMessage: string | null;
  isPasswordRecovery: boolean;

  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; unconfirmedEmail?: boolean }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  handleSessionExpired: () => void;
  continueAsGuest: () => void;
  clearError: () => void;
  clearPasswordRecovery: () => void;
}

function formatAuthError(errMessage: string): string {
  const lower = errMessage.toLowerCase();
  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for the confirmation link.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('password') && (lower.includes('least') || lower.includes('weak') || lower.includes('short'))) {
    return 'Please choose a password with at least 6 characters.';
  }
  if (lower.includes('rate limit') || lower.includes('email limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout')) {
    return 'Connection error. Please check your network and try again.';
  }
  return errMessage || 'Something went wrong. Please try again.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authStatus: 'AUTH_LOADING',
  user: null,
  session: null,
  error: null,
  sessionExpiredMessage: null,
  isPasswordRecovery: false,

  initAuth: async () => {
    const isGuestRequested =
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('praroha_guest_session') === 'true' ||
        window.location.pathname.startsWith('/projects/demo-canonical-bio-city'));

    if (!supabase) {
      console.warn('[Auth] Supabase client not configured.');
      if (isGuestRequested) {
        get().continueAsGuest();
      } else {
        set({ authStatus: 'UNAUTHENTICATED' });
      }
      return;
    }

    try {
      // Check if URL has recovery hash
      if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
        set({ isPasswordRecovery: true });
      }

      if (useAuthStore.getState().authStatus === 'AUTHENTICATED') {
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[Auth] Error getting initial session:', error);
        if (isGuestRequested) {
          get().continueAsGuest();
        } else {
          set({ authStatus: 'UNAUTHENTICATED', user: null, session: null });
        }
      } else if (session?.user) {
        // Enforce email verification check: if user has unconfirmed email, treat as unauthenticated
        const isEmailConfirmed = Boolean(
          session.user.email_confirmed_at || session.user.confirmed_at
        );
        if (!isEmailConfirmed && session.user.app_metadata?.provider === 'email') {
          console.warn('[Auth] User email not yet confirmed.');
          set({
            authStatus: 'UNAUTHENTICATED',
            user: session.user,
            session: null,
            error: 'Please verify your email before accessing your workspace.',
          });
        } else {
          set({
            authStatus: 'AUTHENTICATED',
            user: session.user,
            session,
            sessionExpiredMessage: null,
          });
        }
      } else {
        if (isGuestRequested) {
          get().continueAsGuest();
        } else {
          set({ authStatus: 'UNAUTHENTICATED', user: null, session: null });
        }
      }

      // Listen for all auth state changes
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`[Auth] State change event: ${event}`);
        if (event === 'PASSWORD_RECOVERY') {
          set({ isPasswordRecovery: true });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            set({
              authStatus: 'AUTHENTICATED',
              user: session.user,
              session,
              sessionExpiredMessage: null,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          projectSubscription.disconnectAll();
          useWorkspaceStore.getState().resetWorkspace();
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.history.pushState(null, '', '/');
          }
          set({
            authStatus: 'UNAUTHENTICATED',
            user: null,
            session: null,
            error: null,
            isPasswordRecovery: false,
          });
        }
      });
    } catch (err) {
      console.error('[Auth] Unexpected error during initAuth:', err);
      set({ authStatus: 'UNAUTHENTICATED', user: null, session: null });
    }
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available.' };
    }
    set({ error: null, sessionExpiredMessage: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const friendlyMsg = formatAuthError(error.message);
        const isUnconfirmed = error.message.toLowerCase().includes('not confirmed');
        set({ error: friendlyMsg });
        return { success: false, error: friendlyMsg, unconfirmedEmail: isUnconfirmed };
      }

      // Check if email confirmed
      const isConfirmed = Boolean(
        data.user?.email_confirmed_at || data.user?.confirmed_at
      );
      if (!isConfirmed && data.user?.app_metadata?.provider === 'email') {
        await supabase.auth.signOut();
        const msg = 'Please verify your email address before signing in.';
        set({ error: msg, authStatus: 'UNAUTHENTICATED' });
        return { success: false, error: msg, unconfirmedEmail: true };
      }

      set({
        authStatus: 'AUTHENTICATED',
        user: data.user,
        session: data.session,
        error: null,
        sessionExpiredMessage: null,
      });
      return { success: true };
    } catch (err: any) {
      const msg = formatAuthError(err?.message || 'Login failed.');
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  signUp: async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available.' };
    }
    set({ error: null, sessionExpiredMessage: null });
    const trimmedEmail = email.trim();

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        const friendlyMsg = formatAuthError(error.message);
        set({ error: friendlyMsg });
        return { success: false, error: friendlyMsg };
      }

      // If user signed up and email is not yet confirmed, require verification
      const isConfirmed = Boolean(
        data.user?.email_confirmed_at || data.user?.confirmed_at
      );

      if (!isConfirmed || !data.session) {
        return {
          success: true,
          requiresVerification: true,
        };
      }

      // If already confirmed (or auto-confirm configured on provider)
      set({
        authStatus: 'AUTHENTICATED',
        user: data.user,
        session: data.session,
        error: null,
      });
      return { success: true, requiresVerification: false };
    } catch (err: any) {
      const msg = formatAuthError(err?.message || 'Sign up failed.');
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  resendVerificationEmail: async (email: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available.' };
    }
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) {
        return { success: false, error: formatAuthError(error.message) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err?.message || 'Failed to resend verification email.') };
    }
  },

  resetPasswordForEmail: async (email: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available.' };
    }
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/#type=recovery` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) {
        return { success: false, error: formatAuthError(error.message) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err?.message || 'Failed to send password reset email.') };
    }
  },

  updateUserPassword: async (password: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available.' };
    }
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        return { success: false, error: formatAuthError(error.message) };
      }
      set({ isPasswordRecovery: false, error: null });
      if (data.user) {
        set({ user: data.user, authStatus: 'AUTHENTICATED' });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err?.message || 'Failed to update password.') };
    }
  },

  signOut: async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[Auth] Error during Supabase signOut:', err);
    } finally {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('praroha_guest_session');
        } catch (e) {
          // ignore
        }
      }
      projectSubscription.disconnectAll();
      useWorkspaceStore.getState().resetWorkspace();
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
      }
      set({
        authStatus: 'UNAUTHENTICATED',
        user: null,
        session: null,
        error: null,
        isPasswordRecovery: false,
      });
    }
  },

  handleSessionExpired: () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('praroha_guest_session');
      } catch (e) {
        // ignore
      }
    }
    projectSubscription.disconnectAll();
    useWorkspaceStore.getState().resetWorkspace();
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    set({
      authStatus: 'UNAUTHENTICATED',
      user: null,
      session: null,
      error: null,
      sessionExpiredMessage: 'Your session has expired. Please sign in again.',
      isPasswordRecovery: false,
    });
  },

  continueAsGuest: () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('praroha_guest_session', 'true');
      } catch (e) {
        // ignore
      }
    }
    set({
      authStatus: 'AUTHENTICATED',
      user: {
        id: 'guest-creator',
        email: 'guest@praroha.local',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: { provider: 'guest' },
        user_metadata: { is_guest: true },
      } as any,
      session: null,
      error: null,
      sessionExpiredMessage: null,
      isPasswordRecovery: false,
    });
    // Immediately load the read-only canonical demo universe into the workspace
    useWorkspaceStore.getState().loadCanonicalDemoUniverse();
  },

  clearError: () => set({ error: null }),
  clearPasswordRecovery: () => set({ isPasswordRecovery: false }),
}));

if (typeof window !== 'undefined') {
  (window as any).__authStore = useAuthStore;
}

