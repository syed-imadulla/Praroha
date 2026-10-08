import React from 'react';

export const HomeHero: React.FC = () => {
  return (
    <div className="flex flex-col items-start w-full select-none">
      {/* Editorial Poetry Quote */}
      <blockquote className="text-[28px] sm:text-[34px] md:text-[38px] font-serif font-normal text-[#294B3A] leading-[1.25] tracking-tight max-w-2xl">
        Universes exist in a seed form,<br />
        autonomously unfolds with initial agency.<br />
        Forms hidden in formless.
      </blockquote>

      {/* Decorative Botanical Leaf Separator */}
      <div className="flex items-center gap-4 w-full max-w-md my-6 opacity-75">
        <div className="flex-1 h-[1px] bg-[#D8CCB7]" />
        {/* PRAROHA Leaf Emblem */}
        <div className="flex items-center justify-center text-[#294B3A] px-1">
          <svg
            className="w-6 h-6 stroke-[1.8]"
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
        <div className="flex-1 h-[1px] bg-[#D8CCB7]" />
      </div>
    </div>
  );
};
