import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, Save, GitCommit } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { CharacterRead, SceneRead } from '../types';

interface ModalContentProps {
  entity: { type: 'character' | 'scene'; data: CharacterRead | SceneRead };
  onClose: () => void;
}

const RefinementModalContent: React.FC<ModalContentProps> = ({ entity, onClose }) => {
  const { refineCharacterAction, refineSceneAction } = useWorkspaceStore();
  const { type, data } = entity;
  const isCharacter = type === 'character';
  const charData = isCharacter ? (data as CharacterRead) : null;
  const sceneData = !isCharacter ? (data as SceneRead) : null;

  // Character editable fields
  const [motivation, setMotivation] = useState(charData?.motivation || '');
  const [coreConflict, setCoreConflict] = useState(charData?.core_conflict || '');
  const [role, setRole] = useState(charData?.role || '');

  // Scene editable fields
  const [dramaticQuestion, setDramaticQuestion] = useState(sceneData?.dramatic_question || '');
  const [conflictNarrative, setConflictNarrative] = useState(sceneData?.conflict_narrative || '');
  const [pivotalOutcome, setPivotalOutcome] = useState(sceneData?.pivotal_outcome || '');

  // Mandatory revision notes
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentVersion = data.version || 1;
  const nextVersion = currentVersion + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) {
      setError('Please provide a revision note explaining what changed and why.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let success = false;
    if (isCharacter && charData) {
      success = await refineCharacterAction(charData.id, {
        motivation: motivation.trim() || undefined,
        core_conflict: coreConflict.trim() || undefined,
        role: role.trim() || undefined,
        revision_notes: revisionNotes.trim(),
      });
    } else if (!isCharacter && sceneData) {
      success = await refineSceneAction(sceneData.id, {
        dramatic_question: dramaticQuestion.trim() || undefined,
        conflict_narrative: conflictNarrative.trim() || undefined,
        pivotal_outcome: pivotalOutcome.trim() || undefined,
        revision_notes: revisionNotes.trim(),
      });
    }

    setIsSubmitting(false);
    if (success) {
      onClose();
    } else {
      setError('Failed to apply refinement. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        id="refinement-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-neutral-100">
                  Refine {isCharacter ? 'Character' : 'Scene Beat'}
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  v{currentVersion} → v{nextVersion}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {isCharacter ? charData?.name : `Scene ${sceneData?.scene_number}: ${sceneData?.title}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {isCharacter && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Role in Universe
                </label>
                <input
                  id="refine-role-input"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all outline-none"
                  placeholder="e.g. Lead Archivist / Renegade"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Core Motivation
                </label>
                <textarea
                  id="refine-motivation-input"
                  rows={3}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all outline-none resize-none"
                  placeholder="What drives this character forward?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Core Dramatic Conflict
                </label>
                <textarea
                  id="refine-conflict-input"
                  rows={3}
                  value={coreConflict}
                  onChange={(e) => setCoreConflict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all outline-none resize-none"
                  placeholder="What opposing forces or moral dilemma constrain them?"
                />
              </div>
            </>
          )}

          {!isCharacter && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Dramatic Question
                </label>
                <input
                  id="refine-question-input"
                  type="text"
                  value={dramaticQuestion}
                  onChange={(e) => setDramaticQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all outline-none"
                  placeholder="The central suspense or dilemma of this beat"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Conflict Narrative
                </label>
                <textarea
                  id="refine-narrative-input"
                  rows={3}
                  value={conflictNarrative}
                  onChange={(e) => setConflictNarrative(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all outline-none resize-none"
                  placeholder="Narrative breakdown of character actions and tension"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Pivotal Outcome
                </label>
                <textarea
                  id="refine-outcome-input"
                  rows={2}
                  value={pivotalOutcome}
                  onChange={(e) => setPivotalOutcome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all outline-none resize-none"
                  placeholder="Consequence that irrevocably advances the world or plot"
                />
              </div>
            </>
          )}

          {/* Revision Notes / Rationale */}
          <div className="pt-2 border-t border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5" /> Revision Audit Rationale (Required)
              </label>
              <span className="text-[10px] text-neutral-500">Stored in immutable history</span>
            </div>
            <textarea
              id="refine-notes-input"
              required
              rows={2}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-amber-500/30 rounded-xl text-neutral-200 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none resize-none"
              placeholder="Explain the creative reason for this refinement (e.g., 'Tied stakes directly to solar anomaly')"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-refinement-btn"
              type="submit"
              disabled={isSubmitting || !revisionNotes.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-neutral-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving Snapshot...' : `Save Refinement (v${nextVersion})`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const RefinementModal: React.FC = () => {
  const { refiningEntity, setRefiningEntity } = useWorkspaceStore();

  return (
    <AnimatePresence>
      {refiningEntity && (
        <RefinementModalContent
          key={refiningEntity.data.id}
          entity={refiningEntity}
          onClose={() => setRefiningEntity(null)}
        />
      )}
    </AnimatePresence>
  );
};
