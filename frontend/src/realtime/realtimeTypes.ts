import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeEventCallback = (payload: RealtimePostgresChangesPayload<any>) => void;

export interface RealtimeSubscriptionStatus {
  isConnected: boolean;
  projectId: string | null;
  error: string | null;
}
