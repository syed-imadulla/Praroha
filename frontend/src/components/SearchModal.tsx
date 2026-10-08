import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Users, Film, BookOpen, Compass, ArrowRight } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { StageType } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const {
    unfoldedUniverse,
    seedDNA,
    activeProject,
    setActiveStage,
    toggleInspector,
  } = useWorkspaceStore();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search Results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: Array<{
      id: string;
      title: string;
      category: 'Character' | 'Scene' | 'Location' | 'Stage' | 'Concept';
      subtitle: string;
      stage?: StageType;
    }> = [];

    // Characters
    unfoldedUniverse?.characters.forEach((char) => {
      if (
        char.name.toLowerCase().includes(q) ||
        char.role.toLowerCase().includes(q) ||
        char.motivation.toLowerCase().includes(q)
      ) {
        items.push({
          id: char.id,
          title: char.name,
          category: 'Character',
          subtitle: `${char.role} (${char.archetype}) • ${char.motivation}`,
          stage: 'unfold',
        });
      }
    });

    // Scenes
    unfoldedUniverse?.scenes.forEach((sc) => {
      if (
        sc.title.toLowerCase().includes(q) ||
        sc.location_setting.toLowerCase().includes(q) ||
        sc.conflict_narrative.toLowerCase().includes(q)
      ) {
        items.push({
          id: sc.id,
          title: sc.title,
          category: 'Scene',
          subtitle: `${sc.location_setting} • ${sc.conflict_narrative}`,
          stage: 'unfold',
        });
      }
    });

    // Locations
    unfoldedUniverse?.world_bible.key_locations.forEach((loc, idx) => {
      if (loc.name.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q)) {
        items.push({
          id: `loc-${idx}`,
          title: loc.name,
          category: 'Location',
          subtitle: loc.description,
          stage: 'unfold',
        });
      }
    });

    // Seed DNA
    if (seedDNA && seedDNA.dna) {
      if (seedDNA.dna.premise.toLowerCase().includes(q)) {
        items.push({
          id: 'dna-premise',
          title: 'Distilled Seed Premise',
          category: 'Concept',
          subtitle: seedDNA.dna.premise,
          stage: 'understand',
        });
      }
    }

    return items.slice(0, 8);
  }, [query, unfoldedUniverse, seedDNA]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#294B3A]/30 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#F8F4E8] border border-[#D8CCB7] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#D8CCB7] bg-[#F4EEDF]">
          <Search className="w-5 h-5 text-[#355A46] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search characters, scenes, locations, seed concepts..."
            className="flex-1 bg-transparent border-none text-[#294B3A] placeholder-[#8C9E90] text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-[#718875] hover:text-[#294B3A]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 rounded bg-[#EAE4D4] border border-[#D8CCB7] text-xs font-mono text-[#5F6D63]">
            ESC
          </kbd>
        </div>

        {/* Search Results Area */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
          {query.trim() === '' ? (
            <div className="py-8 px-4 text-center text-[#718875]">
              <Compass className="w-8 h-8 mx-auto text-[#A5B2A8] mb-2" />
              <p className="text-xs font-sans">
                Search across the current active universe ({activeProject?.title || 'PRAROHA'})
              </p>
              <p className="text-[11px] text-[#8C9E90] mt-1">
                Type character names, scene locations, or core premise keywords.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 px-4 text-center text-[#718875]">
              <p className="text-sm font-sans font-medium text-[#294B3A]">No matches found</p>
              <p className="text-xs text-[#8C9E90] mt-1">
                No canon items matched "{query}". Try another term.
              </p>
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.stage) setActiveStage(item.stage);
                  toggleInspector(false);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#EAE4D4] transition text-left group border border-transparent hover:border-[#D8CCB7]"
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAE4D4] group-hover:bg-[#DDE2D2] text-[#294B3A] flex items-center justify-center shrink-0 mt-0.5 transition">
                    {item.category === 'Character' && <Users className="w-4 h-4" />}
                    {item.category === 'Scene' && <Film className="w-4 h-4" />}
                    {item.category === 'Location' && <BookOpen className="w-4 h-4" />}
                    {item.category === 'Concept' && <Compass className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#294B3A] group-hover:text-[#355A46] truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-[#EAE4D4] text-[#5F6D63]">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6D63] truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#A5B2A8] group-hover:text-[#294B3A] shrink-0 transition" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
