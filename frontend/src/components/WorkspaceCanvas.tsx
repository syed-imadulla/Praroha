import React from 'react';
import { Compass, ArrowLeft, AlertTriangle, X } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { StageType } from '../types';
import { SeedInputCanvas } from './SeedInputCanvas';
import { SeedDnaViewer } from './SeedDnaViewer';
import { WorldCandidatesCanvas } from './WorldCandidatesCanvas';
import { WorldSelectionCanvas } from './WorldSelectionCanvas';
import { UniverseCodexCanvas } from './UniverseCodexCanvas';
import { TraceabilityCanvas } from './TraceabilityCanvas';
import { RefineCanvas } from './RefineCanvas';
import { GuidedTourOverlay } from './GuidedTourOverlay';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

import { PageContainer } from './shell/PageContainer';

export const WorkspaceCanvas: React.FC = () => {
  const {
    activeStage,
    setActiveStage,
    unlockedStages,
    inspectorOpen,
    toggleInspector,
    seedDNA,
    tourOpen,
    startTour,
    closeTour,
    shortcutsModalOpen,
    toggleShortcutsModal,
    providerFallbackWarning,
    setProviderFallbackWarning,
  } = useWorkspaceStore();

  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStage]);

  // Global Keyboard Shortcuts Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (shortcutsModalOpen) toggleShortcutsModal();
        if (tourOpen) closeTour();
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        toggleShortcutsModal();
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        startTour();
        return;
      }

      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        toggleInspector();
        return;
      }

      // Keys 1 through 7 for stages
      const stageMap: Record<string, StageType> = {
        '1': 'seed',
        '2': 'understand',
        '3': 'worlds',
        '4': 'choose',
        '5': 'unfold',
        '6': 'trace',
        '7': 'refine',
      };

      if (e.key in stageMap) {
        const targetStage = stageMap[e.key];
        if (unlockedStages.includes(targetStage)) {
          e.preventDefault();
          setActiveStage(targetStage);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    unlockedStages,
    setActiveStage,
    toggleInspector,
    startTour,
    toggleShortcutsModal,
    shortcutsModalOpen,
    tourOpen,
    closeTour,
  ]);

  return (
    <main
      ref={mainRef}
      className={`flex-1 overflow-y-auto transition-all duration-300 py-6 sm:py-8 flex flex-col items-center justify-start ${
        inspectorOpen ? 'mr-0 md:mr-80 lg:mr-96' : ''
      }`}
    >
      <PageContainer
        maxWidth={
          activeStage === 'worlds' || activeStage === 'choose' || activeStage === 'unfold' || activeStage === 'trace' || activeStage === 'refine'
            ? 'wide'
            : 'standard'
        }
        className="space-y-8"
      >
        {/* Provider Fallback Toast Banner */}
        {providerFallbackWarning && (
          <div className="p-3.5 rounded-xl bg-[#FAF5EE] border border-[#E8DCC8] text-[#B8734F] flex items-center justify-between gap-3 text-xs shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#B8734F] shrink-0" />
              <span>{providerFallbackWarning}</span>
            </div>
            <button
              onClick={() => setProviderFallbackWarning(null)}
              className="p-1 rounded text-[#B8734F]/70 hover:text-[#B8734F] hover:bg-[#F2EBDD] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* Dynamic Stage Canvas View */}
        {activeStage === 'seed' && <SeedInputCanvas />}

        {activeStage === 'understand' && <SeedDnaViewer dnaRecord={seedDNA} />}

        {activeStage === 'worlds' && <WorldCandidatesCanvas />}

        {activeStage === 'choose' && <WorldSelectionCanvas />}

        {activeStage === 'unfold' && <UniverseCodexCanvas />}

        {activeStage === 'trace' && <TraceabilityCanvas />}

        {activeStage === 'refine' && <RefineCanvas />}

        {activeStage !== 'seed' && activeStage !== 'understand' && activeStage !== 'worlds' && activeStage !== 'choose' && activeStage !== 'unfold' && activeStage !== 'trace' && activeStage !== 'refine' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-[#294B3A] font-serif capitalize">
              Stage: {activeStage}
            </h2>
            <p className="text-sm text-[#466A55] max-w-md mx-auto">
              Universe unfolding will activate in Phase 5 (Stage-by-Stage Unfolding Pipeline).
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveStage('choose')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] text-xs font-semibold border border-[#D8CCB7] transition shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to World Selection</span>
              </button>
            </div>
          </div>
        )}

      </PageContainer>

      {/* 7-Stage Guided Demo Tour Overlay */}
      <GuidedTourOverlay />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal />
    </main>
  );
};
