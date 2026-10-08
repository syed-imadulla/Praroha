import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar, NavView } from './Sidebar';
import { BotanicalDecorations } from './BotanicalDecorations';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { projectSubscription } from '../../realtime/projectSubscription';

interface AppShellProps {
  children: React.ReactNode;
  activeNav: NavView;
  onNavChange: (nav: NavView) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeNav,
  onNavChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeProjectId = useWorkspaceStore((s) => s.activeProject?.id);
  const recoverActiveJobs = useWorkspaceStore((s) => s.recoverActiveJobs);

  React.useEffect(() => {
    const handleOpen = () => setMobileMenuOpen(true);
    window.addEventListener('open-mobile-nav', handleOpen);
    return () => window.removeEventListener('open-mobile-nav', handleOpen);
  }, []);

  // Hook up Realtime Project Subscription
  React.useEffect(() => {
    if (activeProjectId) {
      projectSubscription.subscribeProject(activeProjectId);
      recoverActiveJobs();
    } else {
      projectSubscription.disconnect();
    }

    return () => {
      // We don't disconnect on every render cycle, only when unmounting the shell 
      // or changing the project. Actually, if activeProjectId changes, 
      // the cleanup function runs and disconnects, which is correct.
      projectSubscription.disconnect();
    };
  }, [activeProjectId, recoverActiveJobs]);


  return (
    <div className="flex h-screen w-screen bg-[#F8F4E8] text-[#394840] overflow-hidden font-sans relative selection:bg-[#C8D0BE] selection:text-[#294B3A]">
      {/* Background Subtle Botanical Edge Foilage */}
      <BotanicalDecorations />

      {/* Desktop Permanent Sidebar */}
      <div data-testid="desktop-sidebar" className="hidden lg:flex shrink-0 h-full relative z-20">
        <Sidebar activeNav={activeNav} onNavChange={onNavChange} />
      </div>

      {/* Mobile / Tablet Drawer Overlay & Slide-out Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#294B3A]/20 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            data-testid="mobile-sidebar"
            className="fixed top-0 bottom-0 left-0 z-50 lg:hidden flex h-full shadow-2xl transition-transform duration-200 ease-in-out translate-x-0"
          >
            <Sidebar
              activeNav={activeNav}
              onNavChange={onNavChange}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
            {/* Close button for mobile */}
            <div className="p-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 bg-[#F4EEDF] border border-[#D8CCB7] rounded-full flex items-center justify-center text-[#294B3A] shadow-md focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 min-w-0">
        {/* Mobile / Tablet Top Bar (Only when not on Home, which renders its own unified TopBar) */}
        {activeNav !== 'home' && (
          <header className="lg:hidden h-14 bg-[#F4EEDF] border-b border-[#D8CCB7] px-4 flex items-center justify-between shrink-0 z-30">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-[#294B3A] hover:bg-[#EAE4D4] focus:outline-none focus:ring-2 focus:ring-[#294B3A]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6 stroke-[2]" />
            </button>

            {/* Centered Brand on Mobile */}
            <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#294B3A]"
              viewBox="0 0 36 36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 31 C 18 20, 9 17, 7 8 C 17 8, 20 18, 18 31 Z" />
              <path d="M18 31 C 18 20, 27 17, 29 8 C 19 8, 16 18, 18 31 Z" />
            </svg>
            <span className="font-serif tracking-[0.16em] text-base font-bold text-[#294B3A]">
              PRAROHA
            </span>
          </div>

          <div className="w-11" aria-hidden="true" />
        </header>
        )}

        {/* Dynamic Page or Workspace Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
