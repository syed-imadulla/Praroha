import React, { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { StageProgressHeader } from './components/StageProgressHeader';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { InspectorDrawer } from './components/InspectorDrawer';
import { apiClient } from './api/client';
import { useWorkspaceStore } from './store/workspaceStore';

export const App: React.FC = () => {
  const {
    setHealth,
    activeProject,
    unfoldedUniverse,
    fetchUnfoldedUniverse,
    fetchActiveSelection,
    selectedWorldId,
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
    <div className="flex flex-col h-screen w-screen bg-[#090D16] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Utility Bar */}
      <TopBar />

      {/* Stage Progression Pipeline */}
      <StageProgressHeader />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        <WorkspaceCanvas />
        <InspectorDrawer />
      </div>
    </div>
  );
};

export default App;
