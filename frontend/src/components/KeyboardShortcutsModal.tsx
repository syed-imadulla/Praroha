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
  { keys: ['1'], action: 'Jump to Stage 1: Seed (Avyakta)', category: 'Navigation' },
  { keys: ['2'], action: 'Jump to Stage 2: Understand (Bija)', category: 'Navigation' },
  { keys: ['3'], action: 'Jump to Stage 3: 3 Worlds (Srishti)', category: 'Navigation' },
  { keys: ['4'], action: 'Jump to Stage 4: Choose (Sankalpa)', category: 'Navigation' },
  { keys: ['5'], action: 'Jump to Stage 5: Unfold (Vistara)', category: 'Navigation' },
  { keys: ['6'], action: 'Jump to Stage 6: Trace (Sambandha)', category: 'Navigation' },
  { keys: ['7'], action: 'Jump to Stage 7: Refine (Parinamana & Dharana)', category: 'Navigation' },
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-[#0f1422] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Keyboard Shortcuts</h2>
                <p className="text-xs text-white/50">Rapid navigation and workspace controls</p>
              </div>
            </div>
            <button
              onClick={toggleShortcutsModal}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
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
                  <h4 className="text-[11px] font-mono font-medium text-white/40 uppercase tracking-wider">
                    {cat}
                  </h4>
                  <div className="space-y-1.5">
                    {group.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <span className="text-xs text-white/80">{item.action}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[11px] font-mono font-semibold text-cyan-300 shadow-sm min-w-[24px] text-center"
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
          <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Shortcuts active outside input fields
            </span>
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">Esc</kbd> to dismiss</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
