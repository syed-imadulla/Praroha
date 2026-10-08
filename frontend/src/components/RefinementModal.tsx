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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        id="refinement-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-[#F8F4E8] border border-[#D8CCB7] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8CCB7] bg-[#F2EBDD]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#E9DDBF] border border-[#C59A55]/30 text-[#805B20]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-serif text-[#294B3A]">
                  Refine {isCharacter ? 'Character' : 'Scene Beat'}
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30">
                  v{currentVersion} → v{nextVersion}
                </span>
              </div>
              <p className="text-xs text-[#718875]">
                {isCharacter ? charData?.name : `Scene ${sceneData?.scene_number}: ${sceneData?.title}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#718875] hover:text-[#294B3A] rounded-lg hover:bg-[#F2EBDD] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-[#F5E6DC] border border-[#E2BFAC] rounded-xl flex items-start gap-2.5 text-[#B8734F] text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#A0522D]" />
              <span>{error}</span>
            </div>
          )}

          {isCharacter && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5A6E5E]">
                  Role in Universe
                </label>
                <input
                  id="refine-role-input"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F2EBDD] border border-[#D8CCB7] rounded-xl text-[#294B3A] text-sm focus:border-[#355A46] focus:ring-1 focus:ring-[#355A46] transition-all outline-none placeholder-[#8C9E90]"
                  placeholder="e.g. Lead Archivist / Renegade"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5A6E5E]">
                  Core Motivation
                </label>
                <textarea
                  id="refine-motivation-input"
                  rows={3}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F2EBDD] border border-[#D8CCB7] rounded-xl text-[#294B3A] text-sm focus:border-[#355A46] focus:ring-1 focus:ring-[#355A46] transition-all outline-none resize-none placeholder-[#8C9E90]"
                  placeholder="What drives this character forward?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5A6E5E]">
                  Core Dramatic Conflict
                </label>
                <textarea
                  id="refine-conflict-input"
                  rows={3}
                  value={coreConflict}
                  onChange={(e) => setCoreConflict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F2EBDD] border border-[#D8CCB7] rounded-xl text-[#294B3A] text-sm focus:border-[#355A46] focus:ring-1 focus:ring-[#355A46] transition-all outline-none resize-none placeholder-[#8C9E90]"
                  placeholder="What opposing forces or moral dilemma constrain them?"
                />
              </div>
            </>
          )}

          {!isCharacter && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5A6E5E]">
                  Dramatic Question
                </label>
                <input
                  id="refine-question-input"
                  type="text"
                  value={dramaticQuestion}
                  onChange={(e) => setDramaticQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F2EBDD] border border-[#D8CCB7] rounded-xl text-[#294B3A] text-sm focus:border-[#355A46] focus:ring-1 focus:ring-[#355A46] transition-all outline-none placeholder-[#8C9E90]"
                  placeholder="The central suspense or dilemma of this beat"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5A6E5E]">
                  Conflict Narrative
                </label>
                <textarea
                  id="refine-narrative-input"
                  rows={3}
                  value={conflictNarrative}
                  onChange={(e) => setConflictNarrative(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F2EBDD] border border-[#D8CCB7] rounded-xl text-[#294B3A] text-sm focus:border-[#355A46] focus:ring-1 focus:ring-[#355A46] transition-all outline-none resize-none placeholder-[#8C9E90]"
                  placeholder="Narrative breakdown of character actions and tension"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5A6E5E]">
                  Pivotal Outcome
                </label>
                <textarea
                  id="refine-outcome-input"
                  rows={2}
                  value={pivotalOutcome}
                  onChange={(e) => setPivotalOutcome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F2EBDD] border border-[#D8CCB7] rounded-xl text-[#294B3A] text-sm focus:border-[#355A46] focus:ring-1 focus:ring-[#355A46] transition-all outline-none resize-none placeholder-[#8C9E90]"
                  placeholder="Consequence that irrevocably advances the world or plot"
                />
              </div>
            </>
          )}

          {/* Revision Notes / Rationale */}
          <div className="pt-2 border-t border-[#D8CCB7] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#805B20] flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5" /> Revision Audit Rationale (Required)
              </label>
              <span className="text-[10px] text-[#718875]">Stored in immutable history</span>
            </div>
            <textarea
              id="refine-notes-input"
              required
              rows={2}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F2EBDD] border border-[#C59A55]/40 rounded-xl text-[#294B3A] text-sm focus:border-[#805B20] focus:ring-1 focus:ring-[#805B20] transition-all outline-none resize-none placeholder-[#8C9E90]"
              placeholder="Explain the creative reason for this refinement (e.g., 'Tied stakes directly to solar anomaly')"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#718875] hover:text-[#294B3A] transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-refinement-btn"
              type="submit"
              disabled={isSubmitting || !revisionNotes.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#355A46] hover:bg-[#294B3A] disabled:opacity-50 text-[#F8F4E8] font-semibold rounded-full text-sm shadow-xs transition-all"
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
