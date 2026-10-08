import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Keyboard, X, Sparkles } from 'lucide-react';

interface ShortcutRow {
  keys: string[];
  action: string;
  category: 'Navigation' | 'Tools' | 'General';
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: ['1'], action: 'Jump to Stage 1: Seed (Raw Idea / Formless Potential)', category: 'Navigation' },
  { keys: ['2'], action: 'Jump to Stage 2: Understand (Seed DNA)', category: 'Navigation' },
  { keys: ['3'], action: 'Jump to Stage 3: 3 Worlds (Latent Manifestations)', category: 'Navigation' },
  { keys: ['4'], action: 'Jump to Stage 4: Choose (Human Direction Gate)', category: 'Navigation' },
  { keys: ['5'], action: 'Jump to Stage 5: Unfold (Universe Codex)', category: 'Navigation' },
  { keys: ['6'], action: 'Jump to Stage 6: Trace (Causal Lineage DAG)', category: 'Navigation' },
  { keys: ['7'], action: 'Jump to Stage 7: Refine (Continuity, Branch & Save)', category: 'Navigation' },
  { keys: ['i'], action: 'Toggle Inspector Drawer', category: 'Tools' },
  { keys: ['t'], action: 'Launch 7-Stage Guided Demo Tour', category: 'Tools' },
  { keys: ['?'], action: 'Toggle Keyboard Shortcuts Modal', category: 'General' },
  { keys: ['Esc'], action: 'Close Modal / Exit Tour', category: 'General' },
];

export const KeyboardShortcutsModal: React.FC = () => {
  const { shortcutsModalOpen, toggleShortcutsModal } = useWorkspaceStore();

  if (!shortcutsModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-[#F8F4E8] border border-[#D8CCB7] rounded-2xl shadow-2xl overflow-hidden text-[#294B3A]"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#D8CCB7] flex items-center justify-between bg-[#F2EBDD]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#DDE2D2] border border-[#294B3A]/30 text-[#294B3A]">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#294B3A]">Keyboard Shortcuts</h2>
                <p className="text-xs text-[#5A6E5E]">Rapid navigation and workspace controls</p>
              </div>
            </div>
            <button
              onClick={toggleShortcutsModal}
              className="p-1.5 rounded-lg text-[#5A6E5E] hover:text-[#294B3A] hover:bg-[#FAF6EE] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
            {/* Category Groups */}
            {(['Navigation', 'Tools', 'General'] as const).map((cat) => {
              const group = SHORTCUTS.filter((s) => s.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <h4 className="text-[11px] font-mono font-medium text-[#5A6E5E] uppercase tracking-wider">
                    {cat}
                  </h4>
                  <div className="space-y-1.5">
                    {group.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#FAF6EE] border border-[#D8CCB7] hover:border-[#B5A58D] transition-colors"
                      >
                        <span className="text-xs text-[#294B3A]">{item.action}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="px-2 py-0.5 rounded bg-[#F2EBDD] border border-[#D8CCB7] text-[11px] font-mono font-semibold text-[#294B3A] shadow-xs min-w-[24px] text-center"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#D8CCB7] bg-[#F2EBDD] flex items-center justify-between text-xs text-[#5A6E5E]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#805B20]" />
              Shortcuts active outside input fields
            </span>
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#FAF6EE] text-[#294B3A] border border-[#D8CCB7] font-mono">Esc</kbd> to dismiss</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
