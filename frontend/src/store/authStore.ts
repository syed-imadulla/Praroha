import { create } from 'zustand';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../realtime/supabaseRealtime';
import { useWorkspaceStore } from './workspaceStore';
import { projectSubscription } from '../realtime/projectSubscription';
import { apiClient } from '../api/client';

export type AuthStatus = 'AUTH_LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthState {
  authStatus: AuthStatus;
  user: User | null;
  session: Session | null;
  error: string | null;
  sessionExpiredMessage: string | null;

  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  handleSessionExpired: () => void;
  clearError: () => void;
}

function formatAuthError(errMessage: string): string {
  const lower = errMessage.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('password') && (lower.includes('least') || lower.includes('weak') || lower.includes('short'))) {
    return 'Please choose a stronger password.';
  }
  if (lower.includes('rate limit') || lower.includes('email limit') || lower.includes('too many requests')) {
    return 'Too many sign-up attempts. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout')) {
    return 'Something went wrong. Please try again.';
  }
  return errMessage || 'Something went wrong. Please try again.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authStatus: 'AUTH_LOADING',
  user: null,
  session: null,
  error: null,
  sessionExpiredMessage: null,

  initAuth: async () => {
    if (!supabase) {
      console.warn('[Auth] Supabase client not configured.');
      set({ authStatus: 'UNAUTHENTICATED' });
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[Auth] Error getting initial session:', error);
        set({ authStatus: 'UNAUTHENTICATED', user: null, session: null });
      } else if (session?.user) {
        set({
          authStatus: 'AUTHENTICATED',
          user: session.user,
          session,
          sessionExpiredMessage: null,
        });
      } else {
        set({ authStatus: 'UNAUTHENTICATED', user: null, session: null });
      }

      // Listen for all auth state changes
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`[Auth] State change event: ${event}`);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
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
        set({ error: friendlyMsg });
        return { success: false, error: friendlyMsg };
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
      // 1. Server-side pre-confirmed creation to bypass Supabase public SMTP email rate limit
      const apiRes = await apiClient.signUp(trimmedEmail, password);
      if (apiRes.success) {
        // Automatically sign in the user now that the account is pre-confirmed
        const loginRes = await get().signIn(trimmedEmail, password);
        return loginRes;
      }

      // If backend returned a specific error (e.g. account already exists)
      if (apiRes.error?.message) {
        const friendlyMsg = formatAuthError(apiRes.error.message);
        set({ error: friendlyMsg });
        return { success: false, error: friendlyMsg };
      }
    } catch (apiErr) {
      console.warn('[Auth] Server-side signup attempt failed, falling back to direct client signup:', apiErr);
    }

    // 2. Direct client fallback
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        const friendlyMsg = formatAuthError(error.message);
        set({ error: friendlyMsg });
        return { success: false, error: friendlyMsg };
      }

      if (data.session) {
        set({
          authStatus: 'AUTHENTICATED',
          user: data.user,
          session: data.session,
          error: null,
        });
      } else {
        return {
          success: true,
          error: 'Account created! Please sign in with your credentials.',
        };
      }
      return { success: true };
    } catch (err: any) {
      const msg = formatAuthError(err?.message || 'Sign up failed.');
      set({ error: msg });
      return { success: false, error: msg };
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
      // Complete cleanup of protected workspace and realtime state
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
      });
    }
  },

  handleSessionExpired: () => {
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
    });
  },

  clearError: () => set({ error: null }),
}));
