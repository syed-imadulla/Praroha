import React from 'react';
import { Home, Sparkles, User, ChevronRight } from 'lucide-react';

export type NavView = 'home' | 'creations' | 'graveyard' | 'profile';

interface SidebarProps {
  activeNav: NavView;
  onNavChange: (nav: NavView) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavChange,
  onCloseMobile,
}) => {
  const handleNavClick = (nav: NavView) => {
    onNavChange(nav);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className="w-[272px] shrink-0 h-full bg-[#F4EEDF] border-r border-[#D8CCB7] flex flex-col justify-between p-6 select-none z-20 transition-all duration-180"
      aria-label="PRAROHA primary navigation"
    >
      {/* Top Section: Brand & Primary Navigation */}
      <div className="flex flex-col gap-8">
        {/* Brand Area */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex flex-col items-center text-center cursor-pointer group py-2"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleNavClick('home');
          }}
          aria-label="PRAROHA Home"
        >
          {/* Botanical Brand Symbol */}
          <div className="flex flex-col items-center mb-2">
            {/* Terracotta Spark */}
            <svg
              className="w-3.5 h-3.5 text-[#B8734F] mb-1"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z" />
            </svg>
            {/* Dual Leaf Emblem */}
            <svg
              className="w-8 h-8 text-[#294B3A] transition-transform duration-180 group-hover:scale-105"
              viewBox="0 0 36 36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 31 C 18 20, 9 17, 7 8 C 17 8, 20 18, 18 31 Z" />
              <path d="M18 31 C 18 20, 27 17, 29 8 C 19 8, 16 18, 18 31 Z" />
            </svg>
          </div>

          {/* Wordmark & Tagline */}
          <h1 className="font-serif tracking-[0.18em] text-[1.35rem] font-bold text-[#294B3A] leading-tight">
            PRAROHA
          </h1>
          <p className="text-[0.78rem] tracking-wider text-[#718875] font-sans font-medium mt-0.5">
            Seed → Universe
          </p>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-2" aria-label="Main Navigation">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`w-full h-14 rounded-[18px] px-4 flex items-center gap-3.5 text-left text-[16px] font-medium transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-[#294B3A] focus:ring-offset-2 focus:ring-offset-[#F4EEDF] ${
              activeNav === 'home'
                ? 'bg-[#DDE2D2] text-[#294B3A] shadow-sm font-semibold'
                : 'text-[#394840] hover:bg-[#EAE4D4] hover:text-[#294B3A]'
            }`}
            aria-current={activeNav === 'home' ? 'page' : undefined}
          >
            <div
              className={`w-7 h-7 flex items-center justify-center transition-colors ${
                activeNav === 'home' ? 'text-[#294B3A]' : 'text-[#466A55]'
              }`}
            >
              <Home className="w-5 h-5 stroke-[2]" />
            </div>
            <span>Home</span>
          </button>

          {/* 2. My Creations */}
          <button
            type="button"
            onClick={() => handleNavClick('creations')}
            className={`w-full h-14 rounded-[18px] px-4 flex items-center gap-3.5 text-left text-[16px] font-medium transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-[#294B3A] focus:ring-offset-2 focus:ring-offset-[#F4EEDF] ${
              activeNav === 'creations'
                ? 'bg-[#DDE2D2] text-[#294B3A] shadow-sm font-semibold'
                : 'text-[#394840] hover:bg-[#EAE4D4] hover:text-[#294B3A]'
            }`}
            aria-current={activeNav === 'creations' ? 'page' : undefined}
          >
            <div
              className={`w-7 h-7 flex items-center justify-center transition-colors ${
                activeNav === 'creations' ? 'text-[#294B3A]' : 'text-[#466A55]'
              }`}
            >
              <Sparkles className="w-5 h-5 stroke-[2]" />
            </div>
            <span>My Creations</span>
          </button>

          {/* 3. Graveyard */}
          <button
            type="button"
            onClick={() => handleNavClick('graveyard')}
            className={`w-full h-14 rounded-[18px] px-4 flex items-center gap-3.5 text-left text-[16px] font-medium transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-[#294B3A] focus:ring-offset-2 focus:ring-offset-[#F4EEDF] ${
              activeNav === 'graveyard'
                ? 'bg-[#DDE2D2] text-[#294B3A] shadow-sm font-semibold'
                : 'text-[#394840] hover:bg-[#EAE4D4] hover:text-[#294B3A]'
            }`}
            aria-current={activeNav === 'graveyard' ? 'page' : undefined}
          >
            <div
              className={`w-7 h-7 flex items-center justify-center transition-colors ${
                activeNav === 'graveyard' ? 'text-[#6A4B67]' : 'text-[#6A4B67]/80'
              }`}
            >
              {/* Botanical Tombstone / Seed resting stone icon */}
              <svg
                className="w-5 h-5 stroke-[2]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 21 V 9 C 6 5.68 8.68 3 12 3 C 15.32 3 18 5.68 18 9 V 21" />
                <path d="M4 21 H 20" />
                <path d="M12 8 V 13" />
                <path d="M9.5 10.5 H 14.5" />
              </svg>
            </div>
            <span>Graveyard</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Profile Card / Navigation */}
      <div className="pt-4 border-t border-[#D8CCB7]/60">
        <button
          type="button"
          onClick={() => handleNavClick('profile')}
          className={`w-full h-14 rounded-[18px] px-3.5 flex items-center justify-between text-left transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-[#294B3A] focus:ring-offset-2 focus:ring-offset-[#F4EEDF] ${
            activeNav === 'profile'
              ? 'bg-[#DDE2D2] text-[#294B3A] shadow-sm'
              : 'text-[#394840] hover:bg-[#EAE4D4] hover:text-[#294B3A]'
          }`}
          aria-current={activeNav === 'profile' ? 'page' : undefined}
          aria-label="Open User Profile"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Botanical Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#E2DACB] border border-[#D8CCB7] flex items-center justify-center text-[#294B3A] shrink-0">
              <User className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#294B3A] truncate leading-tight">
                Profile
              </p>
              <p className="text-[11px] text-[#718875] truncate">
                Seed Creator
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#718875] shrink-0" />
        </button>
      </div>
    </aside>
  );
};
