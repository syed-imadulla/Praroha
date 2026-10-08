import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { CreationCard, CreationItem } from '../creation';

export type RecentCreationItem = CreationItem;

interface RecentCreationsRowProps {
  creations?: RecentCreationItem[];
  onViewAll?: () => void;
  onSelectCreation?: (item: RecentCreationItem) => void;
  onPlantSeed?: () => void;
}

export const CANONICAL_RECENT_CREATIONS: RecentCreationItem[] = [
  {
    id: 'rc-1',
    title: 'Mountain Sunset',
    type: 'Image',
    timestamp: '2 min ago',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    isFavorite: false,
  },
  {
    id: 'rc-2',
    title: 'Forest Vibes',
    type: 'Video',
    timestamp: '12 min ago',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    isFavorite: false,
  },
  {
    id: 'rc-3',
    title: 'Dreamscape',
    type: 'Sound',
    timestamp: '1 hr ago',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&auto=format&fit=crop&q=80',
    isFavorite: true,
  },
];

export const RecentCreationsRow: React.FC<RecentCreationsRowProps> = ({
  creations: initialCreations = CANONICAL_RECENT_CREATIONS,
  onViewAll,
  onSelectCreation,
  onPlantSeed,
}) => {
  const [items, setItems] = useState<RecentCreationItem[]>(initialCreations);

  useEffect(() => {
    setItems(initialCreations);
  }, [initialCreations]);

  const handleToggleFavorite = (target: RecentCreationItem) => {
    setItems((prev) =>
      prev.map((c) => (c.id === target.id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const hasCreations = items && items.length > 0;

  return (
    <section className="w-full select-none mt-6" aria-label="Recent Creations">
      {/* Header with Title and "View all →" */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[22px] sm:text-[24px] font-serif font-bold text-[#294B3A]">
          Recent Creations
        </h2>
        {hasCreations && (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#466A55] hover:text-[#294B3A] transition-colors focus:outline-none focus:ring-1 focus:ring-[#294B3A] rounded px-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!hasCreations ? (
        /* Empty State */
        <div className="card-botanical p-8 sm:p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#DDE2D2] text-[#294B3A] flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 stroke-[2]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#294B3A]">
            Your garden is waiting.
          </h3>
          <p className="text-sm text-[#718875] mt-1 max-w-sm">
            Plant your first seed and watch an idea become a universe.
          </p>
          <button
            type="button"
            onClick={onPlantSeed}
            className="btn-sage-primary text-xs mt-4"
          >
            Plant a seed
          </button>
        </div>
      ) : (
        /* 3-card horizontal grid using canonical CreationCard */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 max-w-3xl">
          {items.slice(0, 3).map((item) => (
            <CreationCard
              key={item.id}
              creation={item}
              onOpen={onSelectCreation}
              onToggleFavorite={handleToggleFavorite}
              onAction={(actionKey, creation) => {
                if (actionKey === 'open') {
                  onSelectCreation?.(creation);
                } else if (actionKey === 'favorite') {
                  handleToggleFavorite(creation);
                }
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};
