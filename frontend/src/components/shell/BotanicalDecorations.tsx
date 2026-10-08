import React from 'react';

/**
 * BotanicalDecorations
 * Subtle botanical corner illustrations (top-right and bottom-left)
 * Styled as hand-painted dried leaves / pressed botanical specimens.
 * Pointer-events-none and non-intrusive to preserve complete legibility and clickability.
 */
export const BotanicalDecorations: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Top-Right Dried Leaf Foliage */}
      <svg
        className="absolute -top-6 -right-6 w-56 h-56 sm:w-72 sm:h-72 opacity-50 transition-opacity duration-300"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="#C38A66" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Main stem */}
          <path d="M190 10 C 140 30, 90 90, 60 160" />
          
          {/* Leaf 1 */}
          <path
            d="M170 25 C 150 15, 130 25, 140 45 C 155 55, 175 40, 170 25 Z"
            fill="#D0A27F"
            fillOpacity="0.45"
          />
          <path d="M170 25 L 140 45" stroke="#B98260" strokeWidth="0.8" />
          
          {/* Leaf 2 */}
          <path
            d="M145 42 C 120 40, 105 60, 120 78 C 138 82, 150 62, 145 42 Z"
            fill="#C38A66"
            fillOpacity="0.4"
          />
          <path d="M145 42 L 120 78" stroke="#B98260" strokeWidth="0.8" />

          {/* Leaf 3 */}
          <path
            d="M125 74 C 95 75, 85 100, 102 118 C 120 120, 130 95, 125 74 Z"
            fill="#D0A27F"
            fillOpacity="0.5"
          />
          <path d="M125 74 L 102 118" stroke="#B98260" strokeWidth="0.8" />

          {/* Leaf 4 */}
          <path
            d="M98 112 C 75 115, 65 140, 80 155 C 96 156, 105 135, 98 112 Z"
            fill="#B98260"
            fillOpacity="0.4"
          />
          
          {/* Side sprig */}
          <path d="M140 45 C 110 30, 80 40, 70 50" stroke="#C38A66" strokeWidth="1" />
          <path
            d="M110 35 C 90 25, 75 35, 85 48 C 98 52, 112 45, 110 35 Z"
            fill="#D0A27F"
            fillOpacity="0.35"
          />
        </g>
      </svg>

      {/* Bottom-Left Dried Leaf Foliage */}
      <svg
        className="absolute -bottom-10 -left-10 w-64 h-64 sm:w-80 sm:h-80 opacity-45 transition-opacity duration-300"
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="#C38A66" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Main stem curving up */}
          <path d="M15 210 C 35 150, 85 100, 160 55" />
          
          {/* Leaf 1 */}
          <path
            d="M30 185 C 20 160, 35 140, 55 148 C 65 165, 50 185, 30 185 Z"
            fill="#D0A27F"
            fillOpacity="0.4"
          />
          <path d="M30 185 L 55 148" stroke="#B98260" strokeWidth="0.8" />

          {/* Leaf 2 */}
          <path
            d="M52 150 C 45 125, 65 105, 88 115 C 95 135, 75 155, 52 150 Z"
            fill="#C38A66"
            fillOpacity="0.45"
          />
          <path d="M52 150 L 88 115" stroke="#B98260" strokeWidth="0.8" />

          {/* Leaf 3 */}
          <path
            d="M85 117 C 80 90, 105 75, 128 85 C 135 105, 115 125, 85 117 Z"
            fill="#D0A27F"
            fillOpacity="0.5"
          />
          <path d="M85 117 L 128 85" stroke="#B98260" strokeWidth="0.8" />

          {/* Leaf 4 tip */}
          <path
            d="M125 87 C 125 65, 150 50, 168 62 C 172 80, 150 95, 125 87 Z"
            fill="#B98260"
            fillOpacity="0.38"
          />

          {/* Small lower branch */}
          <path d="M45 170 C 65 180, 90 185, 110 180" stroke="#C38A66" strokeWidth="1" />
          <path
            d="M70 178 C 85 190, 105 188, 108 175 C 95 168, 80 170, 70 178 Z"
            fill="#D0A27F"
            fillOpacity="0.35"
          />
        </g>
      </svg>
    </div>
  );
};
