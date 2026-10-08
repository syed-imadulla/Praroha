import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { StageProgressHeader } from './components/StageProgressHeader';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { InspectorDrawer } from './components/InspectorDrawer';
import { apiClient } from './api/client';
import { useWorkspaceStore } from './store/workspaceStore';
import { AppShell } from './components/shell/AppShell';
import { CreationCard, CreationItem } from './components/creation';

export const App: React.FC = () => {
  const [selectedCreationToast, setSelectedCreationToast] = useState<string | null>(null);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState<string | null>(null);

  const {
    setHealth,
    activeProject,
    unfoldedUniverse,
    fetchUnfoldedUniverse,
    fetchActiveSelection,
    selectedWorldId,
    activeNav,
    setActiveNav,
    hydrateProject,
    resetWorkspace,
    creations,
    isLoadingCreations,
    creationsError,
    fetchCreations,
    graveyard,
    isLoadingGraveyard,
    graveyardError,
    fetchGraveyard,
    deleteProjectAction,
    restoreProjectAction,
    permanentlyDeleteProjectAction,
  } = useWorkspaceStore();

  useEffect(() => {
    if (activeNav === 'creations') {
      fetchCreations();
    } else if (activeNav === 'graveyard') {
      fetchGraveyard();
    }
  }, [activeNav, fetchCreations, fetchGraveyard]);


  const [isHydrating, setIsHydrating] = useState(true);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  // Deep routing & authoritative hydration from PostgreSQL
  useEffect(() => {
    const handleRoute = async () => {
      const match = window.location.pathname.match(/^\/projects\/([a-zA-Z0-9-]+)$/);
      if (match) {
        const projectId = match[1];
        if (activeProject?.id !== projectId) {
          setIsHydrating(true);
          try {
            const res = await apiClient.getProjectBundle(projectId);
            if (res.success && res.data) {
              hydrateProject(res.data);
            } else {
              setHydrationError("Project not found.");
            }
          } catch (err) {
            setHydrationError("Failed to load project.");
          } finally {
            setIsHydrating(false);
          }
          return;
        }
      } else if (window.location.pathname === '/' && activeProject) {
        // If user navigated back to root but store has active project, clear it
        resetWorkspace();
      }
      setIsHydrating(false);
    };

    handleRoute();

    const handlePopState = () => {
      handleRoute();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // Run on mount and popstate

  // Sync URL to active project changes
  useEffect(() => {
    if (!isHydrating) {
      if (activeProject) {
        const newPath = `/projects/${activeProject.id}`;
        if (window.location.pathname !== newPath) {
          window.history.pushState(null, '', newPath);
        }
      } else {
        if (window.location.pathname !== '/') {
          window.history.pushState(null, '', '/');
        }
      }
    }
  }, [activeProject, isHydrating]);

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

  if (isHydrating) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F4E8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#294B3A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#294B3A] font-serif text-lg">Unearthing project...</p>
        </div>
      </div>
    );
  }

  if (hydrationError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F4E8]">
        <div className="max-w-md p-8 bg-white border border-[#D5CDB4] rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-serif text-[#294B3A] mb-4">Cannot Open Project</h2>
          <p className="text-[#394840] mb-6">{hydrationError}</p>
          <button 
            onClick={() => {
              window.history.pushState(null, '', '/');
              window.location.reload();
            }}
            className="btn-sage-primary"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

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
        <div className="flex-1 flex flex-col p-6 sm:p-8 lg:p-10 overflow-y-auto bg-[#F8F4E8] select-none">
          <div className="max-w-5xl w-full mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#294B3A]">My Creations</h2>
              <p className="text-sm text-[#718875] mt-1 italic">
                "Everything your seeds have grown into."
              </p>
            </div>

            {/* My Creations dynamic content */}
            {isLoadingCreations ? (
              <div className="flex flex-col items-center justify-center p-16 text-center text-[#718875]">
                <div className="animate-spin w-8 h-8 border-2 border-[#294B3A] border-t-transparent rounded-full mb-3" />
                <p className="text-sm font-medium">Loading your creations...</p>
              </div>
            ) : creationsError ? (
              <div className="p-12 text-center text-[#B85C46] flex flex-col items-center gap-3">
                <p className="text-sm">Could not load your creations.</p>
                <button
                  type="button"
                  onClick={() => fetchCreations()}
                  className="btn-sage-primary text-xs"
                >
                  Try Again
                </button>
              </div>
            ) : creations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
                <p className="text-base text-[#718875] font-serif">No creations yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({}, '', '/');
                    resetWorkspace();
                    setActiveNav('home');
                  }}
                  className="btn-sage-primary text-sm"
                >
                  Create your first world
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                {creations.map((proj) => {
                  const creationItem: CreationItem = {
                    id: proj.id,
                    title: proj.title,
                    type: 'story',
                    timestamp: new Date(proj.updated_at || proj.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    description: proj.seed_text || 'An unfolding world.',
                  };
                  return (
                    <CreationCard
                      key={proj.id}
                      creation={creationItem}
                      onOpen={(c) => {
                        window.history.pushState({}, '', `/projects/${c.id}`);
                        setActiveNav('home');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      onAction={async (actionKey, c) => {
                        if (actionKey === 'delete') {
                          const ok = await deleteProjectAction(c.id);
                          if (ok) {
                            setSelectedCreationToast(`Moved to Graveyard: ${c.title}`);
                          }
                        } else if (actionKey === 'open') {
                          window.history.pushState({}, '', `/projects/${c.id}`);
                          setActiveNav('home');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        } else {
                          setSelectedCreationToast(`Action "${actionKey}" on: ${c.title}`);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}

            {selectedCreationToast && (
              <div
                data-testid="creation-toast-message"
                className="fixed bottom-6 right-6 px-4 py-2.5 rounded-[14px] bg-[#294B3A] text-[#F8F4E8] text-xs font-medium shadow-lg z-50 animate-fade-in"
              >
                {selectedCreationToast}
              </div>
            )}
          </div>
        </div>
      ) : activeNav === 'graveyard' ? (
        <div className="flex-1 flex flex-col p-6 sm:p-8 lg:p-10 overflow-y-auto bg-[#F8F4E8] select-none">
          <div className="max-w-5xl w-full mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#294B3A]">Graveyard</h2>
              <p className="text-sm text-[#718875] mt-1 italic">
                "Ideas that didn't make it, but still planted a part of your imagination. Revisit, restore or let them rest."
              </p>
            </div>

            {/* Graveyard dynamic content */}
            {isLoadingGraveyard ? (
              <div className="flex flex-col items-center justify-center p-16 text-center text-[#718875]">
                <div className="animate-spin w-8 h-8 border-2 border-[#294B3A] border-t-transparent rounded-full mb-3" />
                <p className="text-sm font-medium">Loading your graveyard...</p>
              </div>
            ) : graveyardError ? (
              <div className="p-12 text-center text-[#B85C46] flex flex-col items-center gap-3">
                <p className="text-sm">Could not load your graveyard.</p>
                <button
                  type="button"
                  onClick={() => fetchGraveyard()}
                  className="btn-sage-primary text-xs"
                >
                  Try Again
                </button>
              </div>
            ) : graveyard.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center space-y-2">
                <p className="text-base text-[#718875] font-serif">Your graveyard is empty.</p>
                <p className="text-xs text-[#718875]/80 italic">Your creation is safe here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                {graveyard.map((proj) => {
                  const creationItem: CreationItem = {
                    id: proj.id,
                    title: proj.title,
                    type: 'story',
                    timestamp: proj.deleted_at
                      ? new Date(proj.deleted_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently',
                    deletedAt: proj.deleted_at
                      ? new Date(proj.deleted_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : undefined,
                    description: proj.seed_text || 'An archived seed.',
                    isDeleted: true,
                  };
                  return (
                    <CreationCard
                      key={proj.id}
                      creation={creationItem}
                      variant="graveyard"
                      onOpen={(c) => setSelectedCreationToast(`Archived seed: ${c.title}`)}
                      onAction={async (actionKey, c) => {
                        if (actionKey === 'restore') {
                          const ok = await restoreProjectAction(c.id);
                          if (ok) {
                            setSelectedCreationToast(`Restored seed: ${c.title}`);
                          }
                        } else if (actionKey === 'delete_permanently') {
                          setConfirmPermanentDeleteId(c.id);
                        } else {
                          setSelectedCreationToast(`Action "${actionKey}" on: ${c.title}`);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}

            {selectedCreationToast && (
              <div
                data-testid="creation-toast-message"
                className="fixed bottom-6 right-6 px-4 py-2.5 rounded-[14px] bg-[#294B3A] text-[#F8F4E8] text-xs font-medium shadow-lg z-50 animate-fade-in"
              >
                {selectedCreationToast}
              </div>
            )}
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

      {/* Confirmation modal for permanent deletion */}
      {confirmPermanentDeleteId && (
        <div
          data-testid="permanent-delete-modal"
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-[#F8F4E8] border border-[#D8CCB7] rounded-[20px] p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#294B3A]">
              Delete this project permanently?
            </h3>
            <p className="text-xs text-[#718875]">
              This action cannot be undone. All worlds and characters within this seed will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                data-testid="cancel-permanent-delete-btn"
                onClick={() => setConfirmPermanentDeleteId(null)}
                className="px-4 py-2 rounded-[12px] bg-[#E8E0D0] text-[#294B3A] text-xs font-medium hover:bg-[#D8CCB7] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-permanent-delete-btn"
                onClick={async () => {
                  const id = confirmPermanentDeleteId;
                  setConfirmPermanentDeleteId(null);
                  if (id) {
                    const ok = await permanentlyDeleteProjectAction(id);
                    if (ok) {
                      setSelectedCreationToast('Project deleted permanently');
                    }
                  }
                }}
                className="px-4 py-2 rounded-[12px] bg-[#B85C46] text-white text-xs font-medium hover:bg-[#9B4834] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default App;
