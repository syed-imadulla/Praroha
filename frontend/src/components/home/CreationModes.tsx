import React from 'react';
import { Image, FileText, Play, MessageSquare } from 'lucide-react';

export type CreationMode = 'image' | 'story' | 'sound' | 'video' | 'chat';

interface CreationModesProps {
  activeMode?: CreationMode | null;
  onSelectMode?: (mode: CreationMode) => void;
}

interface ModeConfig {
  id: CreationMode;
  label: string;
  bgColor: string;
  accentColor: string;
  icon: React.ReactNode;
}

export const CreationModes: React.FC<CreationModesProps> = ({
  activeMode,
  onSelectMode,
}) => {
  const modes: ModeConfig[] = [
    {
      id: 'image',
      label: 'Image',
      bgColor: '#DDE2D2',
      accentColor: '#294B3A',
      icon: <Image className="w-7 h-7 stroke-[1.8]" />,
    },
    {
      id: 'story',
      label: 'Story',
      bgColor: '#E8D5C4',
      accentColor: '#A0522D',
      icon: <FileText className="w-7 h-7 stroke-[1.8]" />,
    },
    {
      id: 'sound',
      label: 'Sound',
      bgColor: '#DCCDD8',
      accentColor: '#6A4B67',
      icon: (
        <svg
          className="w-7 h-7 stroke-[1.8]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 10v4" />
          <path d="M8 7v10" />
          <path d="M12 4v16" />
          <path d="M16 8v8" />
          <path d="M20 11v2" />
        </svg>
      ),
    },
    {
      id: 'video',
      label: 'Video',
      bgColor: '#DDE2D2',
      accentColor: '#294B3A',
      icon: <Play className="w-7 h-7 stroke-[1.8] fill-none" />,
    },
    {
      id: 'chat',
      label: 'Chat',
      bgColor: '#E9DDBF',
      accentColor: '#B8734F',
      icon: <MessageSquare className="w-7 h-7 stroke-[1.8]" />,
    },
  ];

  return (
    <div className="w-full select-none my-4">
      <div className="grid grid-cols-5 gap-3 sm:gap-4 overflow-x-auto pb-1 max-w-2xl">
        {modes.map((mode) => {
          const isSelected = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode?.(mode.id)}
              style={{ backgroundColor: mode.bgColor, color: mode.accentColor }}
              className={`min-w-[100px] h-[115px] sm:h-[130px] rounded-[20px] p-4 flex flex-col items-center justify-center gap-2.5 transition-all duration-180 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#294B3A] focus:ring-offset-2 ${
                isSelected
                  ? 'border-[#294B3A] shadow-md -translate-y-1 scale-[1.02]'
                  : 'border-transparent shadow-xs hover:-translate-y-0.5 hover:shadow-sm'
              }`}
              aria-label={`Creation mode: ${mode.label}`}
              aria-pressed={isSelected}
            >
              <div className="w-9 h-9 flex items-center justify-center">
                {mode.icon}
              </div>
              <span className="text-[15px] font-sans font-medium tracking-tight">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
