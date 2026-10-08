import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  GitFork,
  Download,
  Upload,
  HardDrive,
  Save,
  CheckCircle2,
  AlertCircle,
  History,
  Plus,
  RefreshCw,
  Edit3,
  Database,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { RefinementModal } from './RefinementModal';
import { apiClient } from '../api/client';

export const RefineCanvas: React.FC = () => {
  const {
    activeProject,
    unfoldedUniverse,
    projectBranches,
    entityRevisions,
    snapshots,
    isBranching,
    isSavingSnapshot,
    fetchBranches,
    switchBranch,
    forkBranch,
    fetchEntityRevisions,
    fetchSnapshots,
    createSnapshotAction,
    setRefiningEntity,
  } = useWorkspaceStore();

  const [newBranchName, setNewBranchName] = useState('');
  const [branchError, setBranchError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<'all' | 'character' | 'scene'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load branches, revisions, and snapshots when project is active
  useEffect(() => {
    if (activeProject) {
      fetchBranches();
      fetchEntityRevisions();
      fetchSnapshots();
    }
  }, [activeProject?.id]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleForkBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setBranchError(null);
    try {
      const ok = await forkBranch(newBranchName.trim());
      if (ok) {
        showToast(`Forked new branch "${newBranchName.trim()}"!`);
        setNewBranchName('');
      } else {
        setBranchError('Failed to fork branch. Ensure name is unique.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fork branch';
      setBranchError(msg);
    }
  };

  const handleExportBundle = async () => {
    if (!activeProject) return;
    setIsExporting(true);
    try {
      const res = await apiClient.getProjectBundle(activeProject.id);
      if (res.success && res.data) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        const branchSlug = (activeProject.branch_name || 'main').replace(/\s+/g, '-').toLowerCase();
        downloadAnchor.setAttribute(
          'download',
          `${activeProject.title.replace(/\s+/g, '_').toLowerCase()}_${branchSlug}_bundle.seedunfold.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Project bundle downloaded successfully!');
      } else {
        alert(`Export failed: ${res.error?.message || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      alert(`Export failed: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const text = await file.text();
      const bundleData = JSON.parse(text);
      const res = await apiClient.importProjectBundle(bundleData);
      if (res.success && res.data) {
        await switchBranch(res.data.id);
        showToast(`Successfully imported project: "${res.data.title}"!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setImportError(res.error?.message || 'Import failed');
      }
    } catch (err: unknown) {
      console.error('Import failed', err);
      const msg = err instanceof Error ? err.message : 'Invalid project bundle JSON file';
      setImportError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      const ok = await createSnapshotAction();
      if (ok) {
        showToast('Universe snapshot saved to backend storage!');
      } else {
        alert('Snapshot save failed.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Snapshot save failed: ${msg}`);
    }
  };

  const filteredRevisions = entityRevisions.filter((rev) => {
    if (selectedEntityFilter === 'all') return true;
    return rev.entity_type === selectedEntityFilter;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 text-[#294B3A]">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#294B3A] border border-[#355A46] text-[#F8F4E8] text-sm font-medium shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-[#DDE2D2] shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9DDBF] border border-[#C59A55]/40 text-[#805B20] text-xs font-mono uppercase tracking-wider">
          <History className="w-3.5 h-3.5 text-[#805B20]" />
          <span>Tattva 2: Forms Hidden in Formless • Stage 7 Refinement & Continuity</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-black text-[#294B3A] tracking-tight flex items-center gap-3">
              <span>Refine, Branch & Save</span>
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-lg bg-[#F2EBDD] text-[#466A55] border border-[#D8CCB7]">
                Stage 7
              </span>
            </h1>
            <p className="text-[#5A6E5E] text-sm max-w-2xl mt-1">
              Explore alternate timeline branches with isolated remapped state, inspect immutable revision logs for characters and scenes, and persist state snapshots.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="export-bundle-btn"
              onClick={handleExportBundle}
              disabled={isExporting || !activeProject}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F2EBDD] hover:bg-[#EAE1D0] border border-[#D8CCB7] text-[#294B3A] text-xs font-mono font-medium transition hover:border-[#B5A58D] disabled:opacity-50"
              title="Download portable JSON project bundle with full lineage DAG"
            >
              <Download className="w-4 h-4 text-[#466A55]" />
              <span>{isExporting ? 'Exporting...' : 'Export Bundle (.json)'}</span>
            </button>

            <button
              id="save-snapshot-btn"
              onClick={handleSaveSnapshot}
              disabled={isSavingSnapshot || !activeProject}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#294B3A] hover:bg-[#355A46] border border-[#294B3A] text-[#F8F4E8] text-xs font-mono font-bold transition shadow-sm hover:shadow disabled:opacity-50"
              title="Persist snapshot to StorageProvider"
            >
              <Save className="w-4 h-4 text-[#DDE2D2]" />
              <span>{isSavingSnapshot ? 'Saving...' : 'Save Storage Snapshot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* GRID SECTION 1 & 2: Timeline Branching + Refinement Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Timeline & Branch Navigator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-[#FAF6EE] border border-[#D8CCB7] space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D8CCB7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#DDE2D2] text-[#294B3A] border border-[#C2CCA8]">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-[#294B3A]">Timeline Branching</h2>
                  <p className="text-xs text-[#5A6E5E]">Fork parallel worlds with remapped state (PERS-02)</p>
                </div>
              </div>
              <button
                onClick={() => fetchBranches()}
                className="p-1.5 rounded-lg text-[#5A6E5E] hover:text-[#294B3A] hover:bg-[#F2EBDD] transition"
                title="Refresh branches"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Timeline Info */}
            <div className="p-3.5 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5A6E5E] font-mono">Active Timeline:</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[#DDE2D2] text-[#294B3A] border border-[#294B3A]/30">
                  {activeProject?.branch_name || 'main'}
                </span>
              </div>
              {activeProject?.parent_project_id && (
                <div className="text-[11px] text-[#5A6E5E] font-mono flex items-center gap-1.5 pt-1 border-t border-[#D8CCB7]/60">
                  <GitFork className="w-3 h-3 text-[#355A46]" />
                  <span>Forked from Parent Project ID:</span>
                  <span className="text-[#294B3A] truncate max-w-[140px]">
                    {activeProject.parent_project_id}
                  </span>
                </div>
              )}
            </div>

            {/* Fork Form */}
            <form onSubmit={handleForkBranch} className="space-y-2.5 pt-1">
              <label className="text-xs font-bold text-[#294B3A] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#355A46]" />
                <span>Fork New Timeline Branch</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="branch-name-input"
                  type="text"
                  placeholder="e.g. alternate-solar-rebellion"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] text-[#294B3A] placeholder-[#8C9E8F] text-xs font-mono focus:outline-none focus:border-[#294B3A]"
                />
                <button
                  id="submit-fork-branch-btn"
                  type="submit"
                  disabled={isBranching || !newBranchName.trim()}
                  className="px-4 py-2 rounded-xl bg-[#294B3A] hover:bg-[#355A46] text-[#F8F4E8] font-bold text-xs font-mono transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isBranching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <GitFork className="w-3.5 h-3.5" />
                  )}
                  <span>Fork</span>
                </button>
              </div>
              {branchError && (
                <p className="text-xs text-[#B8734F] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{branchError}</span>
                </p>
              )}
            </form>

            {/* Timeline Branches List */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#5A6E5E]">
                Known Timeline Branches ({projectBranches.length})
              </span>
              <div id="project-branches-list" className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {projectBranches.map((br) => {
                  const isCurrent = br.id === activeProject?.id;
                  return (
                    <div
                      key={br.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-[#EAE1D0] border-[#294B3A] text-[#294B3A] shadow-sm'
                          : 'bg-[#F2EBDD] border-[#D8CCB7] text-[#394840] hover:border-[#B5A58D]'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs truncate">
                            {br.branch_name || 'main'}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#294B3A] text-[#F8F4E8] border border-[#294B3A]">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#5A6E5E] font-mono flex items-center gap-2">
                          <span>{br.title}</span>
                          <span>•</span>
                          <span>{new Date(br.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => switchBranch(br.id)}
                          className="switch-branch-btn px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#F8F4E8] hover:bg-[#294B3A] text-[#294B3A] hover:text-[#F8F4E8] border border-[#D8CCB7] transition shrink-0"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Refine Launchers */}
          <div className="p-6 rounded-2xl bg-[#FAF6EE] border border-[#D8CCB7] space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-[#D8CCB7] pb-3">
              <div className="p-2 rounded-lg bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-[#294B3A]">Direct Refinement Launchers</h3>
                <p className="text-xs text-[#5A6E5E]">Trigger trait or scene refinement dialogs</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-[#5A6E5E] block mb-1.5 font-medium">Refine Character:</span>
                <div className="flex flex-wrap gap-2">
                  {unfoldedUniverse?.characters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setRefiningEntity({ type: 'character', data: c })}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#E9DDBF] hover:bg-[#DFCFAC] text-[#805B20] border border-[#C59A55]/40 flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{c.name}</span>
                      <span className="opacity-75 text-[10px]">v{c.version || 1}</span>
                    </button>
                  ))}
                  {(!unfoldedUniverse || unfoldedUniverse.characters.length === 0) && (
                    <span className="text-xs text-[#718875] italic">No characters available</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#D8CCB7]">
                <span className="text-xs text-[#5A6E5E] block mb-1.5 font-medium">Refine Scene:</span>
                <div className="flex flex-wrap gap-2">
                  {unfoldedUniverse?.scenes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setRefiningEntity({ type: 'scene', data: s })}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#EFE8EE] hover:bg-[#E4D7E2] text-[#6A4B67] border border-[#B399B0]/40 flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Scene {s.scene_number}</span>
                      <span className="opacity-75 text-[10px]">v{s.version || 1}</span>
                    </button>
                  ))}
                  {(!unfoldedUniverse || unfoldedUniverse.scenes.length === 0) && (
                    <span className="text-xs text-[#718875] italic">No scenes available</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Universe Refinement Audit Log (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-[#FAF6EE] border border-[#D8CCB7] space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8CCB7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-[#294B3A]">Refinement Audit Log</h2>
                  <p className="text-xs text-[#5A6E5E]">Immutable version history & diff tracking (PERS-01)</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-[#F2EBDD] p-1 rounded-xl border border-[#D8CCB7]">
                {(['all', 'character', 'scene'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedEntityFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition ${
                      selectedEntityFilter === filter
                        ? 'bg-[#294B3A] text-[#F8F4E8] font-bold shadow-sm'
                        : 'text-[#5A6E5E] hover:text-[#294B3A]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Log Content */}
            <div id="refinement-audit-log" className="space-y-3">
              {filteredRevisions.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] text-center space-y-2">
                  <History className="w-8 h-8 text-[#718875] mx-auto" />
                  <p className="text-sm font-medium text-[#294B3A]">No Refinements Recorded Yet</p>
                  <p className="text-xs text-[#5A6E5E] max-w-md mx-auto">
                    Use the "Refine" button on character cards or scene cards in Stage 5 Codex or the launchers on the left to evolve entities and produce immutable audit snapshots.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {filteredRevisions.map((rev) => {
                    let snapshotObj: Record<string, any> = {};
                    try {
                      snapshotObj = JSON.parse(rev.snapshot_json);
                    } catch {
                      snapshotObj = {};
                    }
                    const isCharacter = rev.entity_type === 'character';

                    return (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] hover:border-[#B5A58D] transition space-y-3 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CCB7]/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                isCharacter
                                  ? 'bg-[#E9DDBF] text-[#805B20] border border-[#C59A55]/30'
                                  : 'bg-[#EFE8EE] text-[#6A4B67] border border-[#B399B0]/30'
                              }`}
                            >
                              {rev.entity_type}
                            </span>
                            <span className="font-bold text-[#294B3A] text-sm">
                              {snapshotObj.name || snapshotObj.title || rev.entity_id}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F2EBDD] text-[#466A55] border border-[#D8CCB7]">
                              v{rev.version}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#5A6E5E] font-mono">
                            {new Date(rev.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* Revision Notes */}
                        <div className="text-xs bg-[#F2EBDD] p-2.5 rounded-lg border border-[#D8CCB7] space-y-1">
                          <span className="text-[10px] font-mono uppercase font-bold text-[#5A6E5E]">
                            Creator Rationale / Diff Notes:
                          </span>
                          <p className="text-[#294B3A] italic font-serif text-xs">
                            "{rev.revision_notes || 'Initial revision baseline'}"
                          </p>
                        </div>

                        {/* Snapshot Attributes Diff Preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {isCharacter ? (
                            <>
                              <div className="p-2 rounded bg-[#FAF6EE] border border-[#D8CCB7]">
                                <span className="text-[10px] text-[#5A6E5E] uppercase font-mono block">
                                  Motivation:
                                </span>
                                <span className="text-[#294B3A] line-clamp-2">
                                  {snapshotObj.motivation || 'N/A'}
                                </span>
                              </div>
                              <div className="p-2 rounded bg-[#FAF6EE] border border-[#D8CCB7]">
                                <span className="text-[10px] text-[#5A6E5E] uppercase font-mono block">
                                  Core Conflict:
                                </span>
                                <span className="text-[#294B3A] line-clamp-2">
                                  {snapshotObj.core_conflict || 'N/A'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-2 rounded bg-[#FAF6EE] border border-[#D8CCB7]">
                                <span className="text-[10px] text-[#5A6E5E] uppercase font-mono block">
                                  Dramatic Question:
                                </span>
                                <span className="text-[#294B3A] line-clamp-2">
                                  {snapshotObj.dramatic_question || 'N/A'}
                                </span>
                              </div>
                              <div className="p-2 rounded bg-[#FAF6EE] border border-[#D8CCB7]">
                                <span className="text-[10px] text-[#5A6E5E] uppercase font-mono block">
                                  Pivotal Outcome:
                                </span>
                                <span className="text-[#294B3A] line-clamp-2">
                                  {snapshotObj.pivotal_outcome || 'N/A'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Project Snapshot & State Portability Station (PERS-03) */}
      <div className="p-6 rounded-2xl bg-[#FAF6EE] border border-[#D8CCB7] space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8CCB7] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#DDE2D2] text-[#294B3A] border border-[#C2CCA8]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#294B3A]">Project Snapshot & State Portability</h2>
              <p className="text-xs text-[#5A6E5E]">
                Full-fidelity bundle import/export (.json) with Lineage DAG and cloud storage persistence (PERS-03)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFileChange}
              className="hidden"
              id="bundle-file-input"
            />
            <button
              id="import-bundle-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F2EBDD] hover:bg-[#EAE1D0] text-[#294B3A] text-xs font-mono font-medium border border-[#D8CCB7] transition hover:border-[#B5A58D]"
              title="Import a previously exported ProjectBundle JSON file"
            >
              <Upload className="w-4 h-4 text-[#355A46]" />
              <span>{isImporting ? 'Importing...' : 'Import Project Bundle'}</span>
            </button>
          </div>
        </div>

        {importError && (
          <div className="p-3.5 rounded-xl bg-[#F5E6DC] border border-[#B8734F]/40 text-[#B8734F] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#B8734F] shrink-0" />
            <span>Import failed: {importError}</span>
          </div>
        )}

        {/* Snapshots Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#5A6E5E] flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#355A46]" />
              <span>Stored Backend Snapshots ({snapshots.length})</span>
            </span>
            <button
              onClick={() => fetchSnapshots()}
              className="p-1 rounded text-[#5A6E5E] hover:text-[#294B3A] transition"
              title="Refresh snapshots"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] text-center text-xs text-[#5A6E5E]">
              No storage snapshots saved yet. Click "Save Storage Snapshot" above to commit the current universe state to the storage layer.
            </div>
          ) : (
            <div id="storage-snapshots-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-4 rounded-xl bg-[#F8F4E8] border border-[#D8CCB7] hover:border-[#294B3A] transition space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#DDE2D2] text-[#294B3A] border border-[#294B3A]/30 font-bold">
                      {(snap.size_bytes / 1024).toFixed(1)} KB
                    </span>
                    <span className="text-[10px] text-[#5A6E5E] font-mono">
                      {new Date(snap.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-mono text-[#294B3A] truncate block" title={snap.storage_key}>
                      {snap.storage_key}
                    </span>
                    <span className="text-[10px] font-mono text-[#5A6E5E] block">
                      Version: v{snap.version}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refinement Modal */}
      <RefinementModal />
    </div>
  );
};
