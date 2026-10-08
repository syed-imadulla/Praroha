import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabaseRealtime';
import { RealtimeEventCallback } from './realtimeTypes';

class ProjectSubscription {
  private channel: RealtimeChannel | null = null;
  private globalProjectsChannel: RealtimeChannel | null = null;
  private currentProjectId: string | null = null;
  private callbacks: RealtimeEventCallback[] = [];
  
  public connect() {
    if (!supabase) {
      console.warn('[Realtime] Supabase client not initialized (missing env config).');
      return;
    }

    if (!this.globalProjectsChannel) {
      this.globalProjectsChannel = supabase.channel('global:projects');
      this.globalProjectsChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleGlobalProjectEvent(payload);
        }
      );

      this.globalProjectsChannel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Connected and subscribed to global projects channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Global projects channel error:', err);
        }
      });
    }
  }

  private handleGlobalProjectEvent(payload: RealtimePostgresChangesPayload<any>) {
    if (import.meta.env.DEV) {
      console.log(`[Realtime Global] Received ${payload.eventType} event on table ${payload.table}`, payload);
    }
    this.callbacks.forEach(cb => cb(payload));
  }

  public subscribeProject(projectId: string) {
    if (!supabase) {
      return;
    }

    if (this.currentProjectId === projectId && this.channel) {
      // Already subscribed to this project.
      return;
    }

    // Clean up any existing subscription to avoid duplicates or listening to wrong project
    this.disconnect();

    this.currentProjectId = projectId;
    
    // Create new channel specifically isolated for this project
    this.channel = supabase.channel(`project-scope:${projectId}`);

    const tables = [
      'projects',
      'seed_dna',
      'seed_potential_items',
      'world_candidates',
      'world_selections',
      'world_bibles',
      'characters',
      'character_relationships',
      'scenes',
      'media_assets',
      'generation_jobs'
    ];

    tables.forEach((table) => {
      // `projects` table uses `id` column for its identity, others use `project_id`
      const filterColumn = table === 'projects' ? 'id' : 'project_id';
      
      this.channel?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `${filterColumn}=eq.${projectId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleEvent(payload);
        }
      );
    });

    this.channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Connected and subscribed to project: ${projectId}`);
      } else if (status === 'CLOSED') {
        console.log(`[Realtime] Subscription closed for project: ${projectId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Channel error for project ${projectId}:`, err);
      } else if (status === 'TIMED_OUT') {
        console.error(`[Realtime] Timeout for project ${projectId}`);
      }
      
      // Auto-reconnect on drop, ensuring we don't duplicate channels.
      // The Supabase client itself tries to reconnect automatically, but if the channel is erroring out repeatedly,
      // we can attempt a manual refresh. Usually supabase handles reconnects smoothly under the hood.
      // We rely on supabase-js internal reconnects mostly, but if we need to manually rebuild:
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setTimeout(() => {
          if (this.currentProjectId === projectId) {
             console.log(`[Realtime] Attempting to reconnect channel for project: ${projectId}`);
             // supabase-js will typically retry on its own, but we force re-subscribe if needed.
             // Only disconnect and resubscribe if we completely lost it.
             this.disconnect();
             this.subscribeProject(projectId);
          }
        }, 5000);
      }
    });
  }

  private handleEvent(payload: RealtimePostgresChangesPayload<any>) {
    if (this.currentProjectId) {
      const isProjectTable = payload.table === 'projects';
      const col = isProjectTable ? 'id' : 'project_id';
      
      const newPid = payload.new && (payload.new as any)[col];
      const oldPid = payload.old && (payload.old as any)[col];
      
      if ((newPid && newPid !== this.currentProjectId) || 
          (oldPid && oldPid !== this.currentProjectId)) {
         console.warn(`[Realtime] Dropping mismatched event for ${payload.table}. Expected project ${this.currentProjectId}.`);
         return;
      }
    }

    if (import.meta.env.DEV) {
      console.log(`[Realtime] Received ${payload.eventType} event on table ${payload.table}`, payload);
    }

    this.callbacks.forEach(cb => cb(payload));
  }

  public onEvent(callback: RealtimeEventCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  public disconnect() {
    if (this.channel) {
      console.log(`[Realtime] Disconnecting from project: ${this.currentProjectId}`);
      supabase?.removeChannel(this.channel);
      this.channel = null;
    }
    this.currentProjectId = null;
  }

  public disconnectAll() {
    this.disconnect();
    if (this.globalProjectsChannel) {
      console.log('[Realtime] Disconnecting global projects channel');
      supabase?.removeChannel(this.globalProjectsChannel);
      this.globalProjectsChannel = null;
    }
  }
}

export const projectSubscription = new ProjectSubscription();
