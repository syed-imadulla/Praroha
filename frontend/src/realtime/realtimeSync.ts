import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { projectSubscription } from './projectSubscription';
import { useWorkspaceStore } from '../store/workspaceStore';

let isInitialized = false;

export function initRealtimeSync() {
  if (isInitialized) return;
  isInitialized = true;

  projectSubscription.onEvent((payload: RealtimePostgresChangesPayload<any>) => {
    const state = useWorkspaceStore.getState();
    const { eventType, table, new: newRec, old: oldRec } = payload;
    
    // Global project gallery handling (My Creations & Graveyard)
    if (table === 'projects') {
      const creations = [...state.creations];
      const graveyard = [...state.graveyard];

      if (eventType === 'INSERT' && newRec) {
        if (newRec.deleted_at) {
          if (!graveyard.find(p => p.id === newRec.id)) {
            useWorkspaceStore.setState({ graveyard: [newRec, ...graveyard] });
          }
        } else {
          if (!creations.find(p => p.id === newRec.id)) {
            useWorkspaceStore.setState({ creations: [newRec, ...creations] });
          }
        }
      } else if (eventType === 'UPDATE' && newRec) {
        if (newRec.deleted_at) {
          // Moved to Graveyard
          useWorkspaceStore.setState({
            creations: creations.filter(p => p.id !== newRec.id),
            graveyard: [newRec, ...graveyard.filter(p => p.id !== newRec.id)],
          });
        } else {
          // Restored to My Creations
          useWorkspaceStore.setState({
            graveyard: graveyard.filter(p => p.id !== newRec.id),
            creations: [newRec, ...creations.filter(p => p.id !== newRec.id)],
          });
        }

        if (state.activeProject && state.activeProject.id === newRec.id) {
          useWorkspaceStore.setState({ activeProject: { ...state.activeProject, ...newRec } });
        }
      } else if (eventType === 'DELETE' && oldRec) {
        // Permanently deleted
        useWorkspaceStore.setState({
          creations: creations.filter(p => p.id !== oldRec.id),
          graveyard: graveyard.filter(p => p.id !== oldRec.id),
        });
        if (state.activeProject && state.activeProject.id === oldRec.id) {
          useWorkspaceStore.getState().resetWorkspace();
        }
      }
      return;
    }

    // We only care for child entities if we have an active project
    const activeProject = state.activeProject;
    if (!activeProject) return;
    else if (table === 'seed_dna' && newRec) {
       if (eventType === 'UPDATE' || eventType === 'INSERT') {
           useWorkspaceStore.setState({ seedDNA: newRec });
       }
    }
    else if (table === 'seed_potential_items') {
       const items = [...state.potentialItems];
       if (eventType === 'INSERT' && newRec) {
           if (!items.find(i => i.id === newRec.id)) {
               useWorkspaceStore.setState({ potentialItems: [...items, newRec] });
       }
       } else if (eventType === 'UPDATE' && newRec) {
           useWorkspaceStore.setState({ 
               potentialItems: items.map(i => i.id === newRec.id ? { ...i, ...newRec } : i) 
           });
       } else if (eventType === 'DELETE' && oldRec) {
           useWorkspaceStore.setState({ 
               potentialItems: items.filter(i => i.id !== oldRec.id) 
           });
       }
    }
    else if (table === 'world_candidates') {
       const worlds = [...state.worlds];
       if (eventType === 'INSERT' && newRec) {
           if (!worlds.find(w => w.id === newRec.id)) {
               useWorkspaceStore.setState({ worlds: [...worlds, newRec] });
           }
       } else if (eventType === 'UPDATE' && newRec) {
           useWorkspaceStore.setState({ 
               worlds: worlds.map(w => w.id === newRec.id ? { ...w, ...newRec } : w) 
           });
       } else if (eventType === 'DELETE' && oldRec) {
           useWorkspaceStore.setState({ 
               worlds: worlds.filter(w => w.id !== oldRec.id) 
           });
       }
    }
    else if (table === 'world_selections' && newRec) {
       if (eventType === 'UPDATE' || eventType === 'INSERT') {
           useWorkspaceStore.setState({ 
               activeSelection: { ...(state.activeSelection || {} as any), ...newRec },
               selectedWorldId: newRec.world_candidate_id,
               selectedWorldRationale: newRec.user_rationale || '',
               humanOnlyZones: newRec.human_only_zones || state.humanOnlyZones
           });
       }
    }
    else if (table === 'world_bibles' && newRec) {
       if (eventType === 'UPDATE' || eventType === 'INSERT') {
           useWorkspaceStore.setState({ 
               unfoldedUniverse: { 
                   ...(state.unfoldedUniverse || {} as any), 
                   ...newRec 
               } 
           });
       }
    }
    else if (table === 'characters') {
       if (state.unfoldedUniverse) {
           const chars = [...(state.unfoldedUniverse.characters || [])];
           let newChars = chars;
           if (eventType === 'INSERT' && newRec) {
               if (!chars.find(c => c.id === newRec.id)) {
                   newChars = [...chars, newRec];
               }
           } else if (eventType === 'UPDATE' && newRec) {
               newChars = chars.map(c => c.id === newRec.id ? { ...c, ...newRec } : c);
           } else if (eventType === 'DELETE' && oldRec) {
               newChars = chars.filter(c => c.id !== oldRec.id);
           }
           useWorkspaceStore.setState({ 
               unfoldedUniverse: { ...state.unfoldedUniverse, characters: newChars } 
           });
       }
    }
    else if (table === 'character_relationships') {
       if (state.unfoldedUniverse) {
           const rels = [...(state.unfoldedUniverse.relationships || [])];
           let newRels = rels;
           if (eventType === 'INSERT' && newRec) {
               if (!rels.find(r => r.id === newRec.id)) {
                   newRels = [...rels, newRec];
               }
           } else if (eventType === 'UPDATE' && newRec) {
               newRels = rels.map(r => r.id === newRec.id ? { ...r, ...newRec } : r);
           } else if (eventType === 'DELETE' && oldRec) {
               newRels = rels.filter(r => r.id !== oldRec.id);
           }
           useWorkspaceStore.setState({ 
               unfoldedUniverse: { ...state.unfoldedUniverse, relationships: newRels } 
           });
       }
    }
    else if (table === 'scenes') {
       if (state.unfoldedUniverse) {
           const scenes = [...(state.unfoldedUniverse.scenes || [])];
           let newScenes = scenes;
           if (eventType === 'INSERT' && newRec) {
               if (!scenes.find(s => s.id === newRec.id)) {
                   newScenes = [...scenes, newRec];
               }
           } else if (eventType === 'UPDATE' && newRec) {
               newScenes = scenes.map(s => s.id === newRec.id ? { ...s, ...newRec } : s);
           } else if (eventType === 'DELETE' && oldRec) {
               newScenes = scenes.filter(s => s.id !== oldRec.id);
           }
           useWorkspaceStore.setState({ 
               unfoldedUniverse: { ...state.unfoldedUniverse, scenes: newScenes } 
           });
       }
    }
    else if (table === 'media_assets') {
       const assetKey = (newRec as any)?.entity_id || (oldRec as any)?.entity_id;
       if (!assetKey) return;
       const assets = { ...state.mediaAssets };
       const list = [...(assets[assetKey] || [])];
       
       if (eventType === 'INSERT' && newRec) {
           const existingIdx = list.findIndex(a => a.id === newRec.id);
           if (existingIdx >= 0) {
               list[existingIdx] = { ...list[existingIdx], ...newRec };
           } else {
               list.push(newRec);
           }
           assets[assetKey] = list;
       } else if (eventType === 'UPDATE' && newRec) {
           const existingIdx = list.findIndex(a => a.id === newRec.id);
           if (existingIdx >= 0) {
               list[existingIdx] = { ...list[existingIdx], ...newRec };
           } else {
               list.push(newRec);
           }
           assets[assetKey] = list;
       } else if (eventType === 'DELETE' && oldRec) {
           assets[assetKey] = list.filter(a => a.id !== oldRec.id);
       }

       // Authoritative generation flag update
       const isGenerating = { ...state.isGeneratingMedia };
       const mediaType = (newRec as any)?.media_type || (oldRec as any)?.media_type;
       if (mediaType) {
           const genKey = `${assetKey}_${mediaType}`;
           if (newRec && (newRec.status === 'completed' || newRec.status === 'failed')) {
               isGenerating[genKey] = false;
           } else if (newRec && (newRec.status === 'processing' || newRec.status === 'queued')) {
               isGenerating[genKey] = true;
           }
       }

       // Keep activeMediaJobs aligned with PostgreSQL state
       const jobs = { ...state.activeMediaJobs };
       if (newRec && newRec.id) {
           jobs[newRec.id] = {
               job_id: newRec.id,
               status: newRec.status,
               media_type: newRec.media_type,
               entity_type: newRec.entity_type,
               entity_id: newRec.entity_id,
               asset_url: newRec.asset_url,
               error_message: newRec.error_message,
           };
       }

       useWorkspaceStore.setState({
           mediaAssets: assets,
           isGeneratingMedia: isGenerating,
           activeMediaJobs: jobs,
       });
    }
    else if (table === 'generation_jobs') {
       const jobs = { ...state.activeMediaJobs };
       if (newRec) {
           if (eventType === 'UPDATE' && jobs[newRec.id]) {
               jobs[newRec.id] = { ...jobs[newRec.id], ...newRec };
           } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
               jobs[newRec.id] = newRec;
           }

           if (newRec.job_type && newRec.job_type.startsWith('media_')) {
               const mediaType = newRec.job_type.replace('media_', '');
               const isGenerating = { ...state.isGeneratingMedia };
               for (const [entityId, assetList] of Object.entries(state.mediaAssets)) {
                   if (assetList.some(a => a.id === newRec.id)) {
                       const genKey = `${entityId}_${mediaType}`;
                       if (newRec.status === 'completed' || newRec.status === 'failed') {
                           isGenerating[genKey] = false;
                       } else if (newRec.status === 'processing' || newRec.status === 'queued') {
                           isGenerating[genKey] = true;
                       }
                       break;
                   }
               }
               useWorkspaceStore.setState({ isGeneratingMedia: isGenerating });
           }
       }
       if (eventType === 'DELETE' && oldRec && jobs[oldRec.id]) {
           delete jobs[oldRec.id];
       }
       useWorkspaceStore.setState({ activeMediaJobs: jobs });
    }
  });
}
