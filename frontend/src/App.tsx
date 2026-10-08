import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { StageProgressHeader } from './components/StageProgressHeader';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { InspectorDrawer } from './components/InspectorDrawer';
import { apiClient } from './api/client';
import { useWorkspaceStore } from './store/workspaceStore';
import { AppShell } from './components/shell/AppShell';
import { CreationCard, CreationItem } from './components/creation';

const CANONICAL_CREATIONS_SHOWCASE: CreationItem[] = [
  {
    id: 'demo-img',
    title: 'Mountain Sunset',
    type: 'Image',
    timestamp: '2 min ago',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    isFavorite: false,
  },
  {
    id: 'demo-story',
    title: 'The Whispering Grove',
    type: 'Story',
    timestamp: '45 min ago',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&auto=format&fit=crop&q=80',
    isFavorite: true,
  },
  {
    id: 'demo-sound',
    title: 'Dreamscape Reverie',
    type: 'Sound',
    timestamp: '1 hr ago',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    isFavorite: false,
  },
  {
    id: 'demo-vid',
    title: 'Forest Canopy Dawn',
    type: 'Video',
    timestamp: '3 hrs ago',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    isFavorite: false,
  },
  {
    id: 'demo-chat',
    title: 'Philosopher of the Glade',
    type: 'Chat',
    timestamp: 'Yesterday',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    isFavorite: true,
  },
  {
    id: 'demo-fallback',
    title: 'Awaiting Flora Vision',
    type: 'Image',
    timestamp: 'Just now',
    isFavorite: false,
  },
];

const CANONICAL_GRAVEYARD_SHOWCASE: CreationItem[] = [
  {
    id: 'grave-1',
    title: 'Floating Islands',
    type: 'Image',
    timestamp: '2 days ago',
    deletedAt: '2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    isDeleted: true,
  },
  {
    id: 'grave-2',
    title: 'Forgotten Chronicle',
    type: 'Story',
    timestamp: '4 days ago',
    deletedAt: '4 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&auto=format&fit=crop&q=80',
    isDeleted: true,
  },
];

export const App: React.FC = () => {
  const [creationsGallery, setCreationsGallery] = useState<CreationItem[]>(CANONICAL_CREATIONS_SHOWCASE);
  const [graveyardGallery, setGraveyardGallery] = useState<CreationItem[]>(CANONICAL_GRAVEYARD_SHOWCASE);
  const [selectedCreationToast, setSelectedCreationToast] = useState<string | null>(null);

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
        <div className="flex-1 flex flex-col p-6 sm:p-8 lg:p-10 overflow-y-auto bg-[#F8F4E8] select-none">
          <div className="max-w-5xl w-full mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#294B3A]">My Creations</h2>
              <p className="text-sm text-[#718875] mt-1 italic">
                "Everything your seeds have grown into."
              </p>
            </div>

            {/* 3-column gallery using canonical CreationCard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
              {creationsGallery.map((item) => (
                <CreationCard
                  key={item.id}
                  creation={item}
                  onOpen={(c) => setSelectedCreationToast(`Opened: ${c.title}`)}
                  onToggleFavorite={(c) => {
                    setCreationsGallery((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, isFavorite: !x.isFavorite } : x))
                    );
                  }}
                  onAction={(actionKey, c) => {
                    setSelectedCreationToast(`Action "${actionKey}" on: ${c.title}`);
                  }}
                />
              ))}
            </div>

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

            {/* Graveyard cards using canonical CreationCard variant="graveyard" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
              {graveyardGallery.map((item) => (
                <CreationCard
                  key={item.id}
                  creation={item}
                  variant="graveyard"
                  onOpen={(c) => setSelectedCreationToast(`Inspect deleted: ${c.title}`)}
                  onAction={(actionKey, c) => {
                    if (actionKey === 'restore') {
                      setGraveyardGallery((prev) => prev.filter((x) => x.id !== c.id));
                      setCreationsGallery((prev) => [...prev, { ...c, isDeleted: false }]);
                      setSelectedCreationToast(`Restored seed: ${c.title}`);
                    } else if (actionKey === 'delete_permanently') {
                      setGraveyardGallery((prev) => prev.filter((x) => x.id !== c.id));
                      setSelectedCreationToast(`Permanently released: ${c.title}`);
                    } else {
                      setSelectedCreationToast(`Action "${actionKey}" on: ${c.title}`);
                    }
                  }}
                />
              ))}
            </div>

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
    </AppShell>
  );
};

export default App;
