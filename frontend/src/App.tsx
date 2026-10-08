import React, { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { StageProgressHeader } from './components/StageProgressHeader';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { InspectorDrawer } from './components/InspectorDrawer';
import { apiClient } from './api/client';
import { useWorkspaceStore } from './store/workspaceStore';
import { AppShell } from './components/shell/AppShell';

export const App: React.FC = () => {
  const {
    setHealth,
    activeProject,
    unfoldedUniverse,
    fetchUnfoldedUniverse,
    fetchActiveSelection,
    selectedWorldId,
    activeNav,
    setActiveNav,
  } = useWorkspaceStore();

  useEffect(() => {
    // Initial health check against backend API
    const checkBackend = async () => {
      const response = await apiClient.getHealth();
      if (response.success && response.data) {
        setHealth(response.data);
      }
    };

    checkBackend();
    // Poll every 10 seconds for real-time status indication
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, [setHealth]);

  // Sync active selection & unfolded codex if project exists
  useEffect(() => {
    if (activeProject) {
      if (activeProject.status === 'universe_unfolded' && !unfoldedUniverse) {
        fetchUnfoldedUniverse();
      }
      if (
        (activeProject.status === 'world_selected' || activeProject.status === 'universe_unfolded') &&
        !selectedWorldId
      ) {
        fetchActiveSelection();
      }
    }
  }, [activeProject, unfoldedUniverse, selectedWorldId, fetchUnfoldedUniverse, fetchActiveSelection]);

  return (
    <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
      {activeNav === 'home' ? (
        <div className="flex flex-col h-full w-full overflow-hidden select-none">
          {/* Top Utility Bar */}
          <TopBar />

          {/* Stage Progression Pipeline */}
          <StageProgressHeader />

          {/* Main Workspace Canvas */}
          <div className="flex-1 flex overflow-hidden relative min-h-0">
            <WorkspaceCanvas />
            <InspectorDrawer />
          </div>
        </div>
      ) : activeNav === 'creations' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8F4E8]">
          <div className="max-w-md card-botanical p-8 flex flex-col items-center gap-4">
            <h2 className="text-3xl font-serif font-bold text-[#294B3A]">My Creations</h2>
            <p className="text-sm text-[#718875] italic">
              "Everything your seeds have grown into."
            </p>
            <p className="text-sm text-[#394840]">
              The creation gallery is being prepared. In Phase 25, your cards and filters will open here.
            </p>
            <button
              type="button"
              onClick={() => setActiveNav('home')}
              className="btn-sage-primary text-sm mt-2"
            >
              Return to Seed Workspace
            </button>
          </div>
        </div>
      ) : activeNav === 'graveyard' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8F4E8]">
          <div className="max-w-md card-botanical p-8 flex flex-col items-center gap-4">
            <h2 className="text-3xl font-serif font-bold text-[#294B3A]">Graveyard</h2>
            <p className="text-sm text-[#6A4B67] italic">
              "Ideas that didn't make it, but still planted a part of your imagination. Revisit, restore or let them rest."
            </p>
            <p className="text-sm text-[#394840]">
              Nothing rests here yet. Full cemetery inspection unfolds in Phase 26.
            </p>
            <button
              type="button"
              onClick={() => setActiveNav('home')}
              className="btn-sage-primary text-sm mt-2"
            >
              Return to Seed Workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8F4E8]">
          <div className="max-w-md card-botanical p-8 flex flex-col items-center gap-4">
            <h2 className="text-3xl font-serif font-bold text-[#294B3A]">Profile</h2>
            <p className="text-sm text-[#718875] italic">
              "Manage your account, creations and preferences."
            </p>
            <p className="text-sm text-[#394840]">
              Your botanical creator profile and account preferences will unfold in Phase 27.
            </p>
            <button
              type="button"
              onClick={() => setActiveNav('home')}
              className="btn-sage-primary text-sm mt-2"
            >
              Return to Seed Workspace
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default App;
