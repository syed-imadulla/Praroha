import React from 'react';
import { Image, Play, Music, MoreHorizontal, ArrowRight } from 'lucide-react';

export interface RecentCreationItem {
  id: string;
  title: string;
  type: 'Image' | 'Story' | 'Sound' | 'Video' | 'Chat';
  timestamp: string;
  imageUrl: string;
}

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
  },
  {
    id: 'rc-2',
    title: 'Forest Vibes',
    type: 'Video',
    timestamp: '12 min ago',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'rc-3',
    title: 'Dreamscape',
    type: 'Sound',
    timestamp: '1 hr ago',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&auto=format&fit=crop&q=80',
  },
];

export const RecentCreationsRow: React.FC<RecentCreationsRowProps> = ({
  creations = CANONICAL_RECENT_CREATIONS,
  onViewAll,
  onSelectCreation,
  onPlantSeed,
}) => {
  const hasCreations = creations && creations.length > 0;

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
        /* 3-card horizontal grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 max-w-3xl">
          {creations.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCreation?.(item)}
              className="card-botanical overflow-hidden p-2.5 flex flex-col gap-2.5 cursor-pointer group hover:-translate-y-1 transition-all duration-180"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectCreation?.(item);
              }}
              aria-label={`View creation: ${item.title}`}
            >
              {/* 16:9 Thumbnail Container */}
              <div className="relative aspect-16/9 w-full rounded-[14px] overflow-hidden bg-[#E8E0D0]">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Content-Type Badge Overlay */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#F8F4E8]/90 backdrop-blur-xs flex items-center justify-center text-[#294B3A] shadow-xs">
                  {item.type === 'Image' && <Image className="w-3.5 h-3.5 stroke-[2]" />}
                  {item.type === 'Video' && <Play className="w-3.5 h-3.5 stroke-[2] fill-none" />}
                  {item.type === 'Sound' && <Music className="w-3.5 h-3.5 stroke-[2]" />}
                  {item.type !== 'Image' && item.type !== 'Video' && item.type !== 'Sound' && (
                    <Image className="w-3.5 h-3.5 stroke-[2]" />
                  )}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="px-1 pb-1 flex items-center justify-between">
                <div>
                  <h4 className="text-[14.5px] font-medium text-[#294B3A] leading-tight truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11.5px] text-[#718875] mt-0.5">
                    {item.type} <span className="opacity-60">·</span> {item.timestamp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="p-1 text-[#718875] hover:text-[#294B3A] rounded transition-colors focus:outline-none"
                  aria-label="Options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
