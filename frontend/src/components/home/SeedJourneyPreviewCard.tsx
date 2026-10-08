import React from 'react';
import { Check, Sparkles, Image, Globe } from 'lucide-react';

export const SeedJourneyPreviewCard: React.FC = () => {
  return (
    <div className="w-full max-w-[340px] card-botanical p-4 flex flex-col gap-4 select-none shrink-0">
      {/* Top Header Pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAE4D4] border border-[#D8CCB7]/70 text-[#294B3A] text-xs font-medium">
        <svg
          className="w-4 h-4 stroke-[2]"
          viewBox="0 0 36 36"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 31 C 18 20, 9 17, 7 8 C 17 8, 20 18, 18 31 Z" />
          <path d="M18 31 C 18 20, 27 17, 29 8 C 19 8, 16 18, 18 31 Z" />
        </svg>
        <span>From a seed...</span>
      </div>

      {/* Sprouting Seedling Photo */}
      <div className="relative aspect-4/3 w-full rounded-[14px] overflow-hidden bg-[#E8E0D0] shadow-inner">
        <img
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80"
          alt="Young sprout emerging from fertile earth"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Progression Checklist */}
      <div className="flex flex-col gap-2">
        {/* 1. Seed Input */}
        <div className="h-10 rounded-xl bg-[#EAE4D4]/80 px-3 flex items-center justify-between text-xs font-medium text-[#294B3A]">
          <div className="flex items-center gap-2.5">
            <svg
              className="w-3.5 h-3.5 stroke-[2]"
              viewBox="0 0 36 36"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M18 31 C 18 20, 9 17, 7 8 C 17 8, 20 18, 18 31 Z" />
            </svg>
            <span>Seed Input</span>
          </div>
          <div className="w-4 h-4 rounded-full bg-[#294B3A] text-[#F8F4E8] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>

        {/* 2. AI Magic */}
        <div className="h-10 rounded-xl bg-[#EAE4D4]/80 px-3 flex items-center justify-between text-xs font-medium text-[#294B3A]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B8734F] stroke-[2]" />
            <span>AI Magic</span>
          </div>
          <div className="w-4 h-4 rounded-full bg-[#B8734F] text-[#F8F4E8] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>

        {/* 3. Image */}
        <div className="h-10 rounded-xl bg-[#EAE4D4]/80 px-3 flex items-center justify-between text-xs font-medium text-[#294B3A]">
          <div className="flex items-center gap-2.5">
            <Image className="w-3.5 h-3.5 stroke-[2]" />
            <span>Image</span>
          </div>
          <div className="w-4 h-4 rounded-full bg-[#294B3A] text-[#F8F4E8] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>

        {/* 4. Your Universe */}
        <div className="h-10 rounded-xl bg-[#EAE4D4]/50 border border-[#D8CCB7]/60 px-3 flex items-center justify-between text-xs font-medium text-[#718875]">
          <div className="flex items-center gap-2.5">
            <Globe className="w-3.5 h-3.5 stroke-[1.8]" />
            <span>Your Universe</span>
          </div>
          <div className="w-4 h-4 rounded-full border border-[#718875] flex items-center justify-center" />
        </div>
      </div>

      {/* Motto & Leaf Mark */}
      <div className="pt-2 text-center flex flex-col items-center">
        <p className="font-serif italic text-sm text-[#466A55] tracking-wide">
          Same seed, endless worlds...
        </p>
        <svg
          className="w-4 h-4 text-[#466A55] mt-1 stroke-[1.8]"
          viewBox="0 0 36 36"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 31 C 18 20, 9 17, 7 8 C 17 8, 20 18, 18 31 Z" />
          <path d="M18 31 C 18 20, 27 17, 29 8 C 19 8, 16 18, 18 31 Z" />
        </svg>
      </div>
    </div>
  );
};
