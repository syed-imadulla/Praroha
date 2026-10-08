import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Check,
  Volume2,
  Palette,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { supabase } from '../../realtime/supabaseRealtime';

interface ProfileSettingsViewProps {
  onBackToWorkspace: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  onBackToWorkspace,
}) => {
  const { user, signOut } = useAuthStore();
  const { creations } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // Display Name management
  const initialName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Seed Creator');

  const [displayName, setDisplayName] = useState(initialName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sound effects / Audio preference
  const [autoplayAudio, setAutoplayAudio] = useState<boolean>(() => {
    return localStorage.getItem('praroha_autoplay_audio') === 'true';
  });

  const [defaultMood, setDefaultMood] = useState<string>(() => {
    return localStorage.getItem('praroha_default_mood') || 'serene-ambient';
  });

  useEffect(() => {
    if (saveToast) {
      const t = setTimeout(() => setSaveToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [saveToast]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSavingName(true);
    try {
      if (supabase && user) {
        await supabase.auth.updateUser({
          data: { full_name: displayName.trim() },
        });
      }
      localStorage.setItem('praroha_display_name', displayName.trim());
      setSaveToast('Profile name updated.');
      setIsEditingName(false);
    } catch {
      setSaveToast('Saved locally.');
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleToggleAutoplay = () => {
    const next = !autoplayAudio;
    setAutoplayAudio(next);
    localStorage.setItem('praroha_autoplay_audio', next ? 'true' : 'false');
    setSaveToast(`Audio autoplay ${next ? 'enabled' : 'disabled'}.`);
  };

  const handleChangeDefaultMood = (mood: string) => {
    setDefaultMood(mood);
    localStorage.setItem('praroha_default_mood', mood);
    setSaveToast('Default soundscape updated.');
  };

  const userEmail = user?.email || 'creator@praroha.local';
  const initialLetter = (displayName || userEmail || 'C').charAt(0).toUpperCase();
  const creationsCount = creations?.length || 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8F4E8] select-none">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D8CCB7]">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#294B3A]">
              Profile & Settings
            </h1>
            <p className="text-xs md:text-sm text-[#718875] mt-1">
              Your creator identity and application preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToWorkspace}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2EBDD] hover:bg-[#EAE4D4] text-[#294B3A] border border-[#D8CCB7] text-xs font-semibold transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Seeds</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-[#F2EBDD] border border-[#D8CCB7] rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#294B3A] text-[#F8F4E8] shadow-xs'
                : 'text-[#5F6D63] hover:text-[#294B3A]'
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#294B3A] text-[#F8F4E8] shadow-xs'
                : 'text-[#5F6D63] hover:text-[#294B3A]'
            }`}
          >
            Settings
          </button>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {/* Identity Card */}
            <div className="p-6 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Botanical Avatar Circle */}
                <div className="w-16 h-16 rounded-full bg-[#E2DACB] border-2 border-[#D8CCB7] flex items-center justify-center text-[#294B3A] text-2xl font-serif font-bold shadow-xs shrink-0">
                  {initialLetter}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold font-serif text-[#294B3A] truncate">
                      {displayName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#DDE2D2] text-[#294B3A] border border-[#C8D0BE]">
                      Seed Creator
                    </span>
                  </div>
                  <p className="text-xs text-[#718875] truncate font-mono">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Edit Name Field */}
              <div className="pt-4 border-t border-[#D8CCB7]/70 space-y-3">
                <label className="text-xs font-semibold text-[#5F6D63] block">
                  Display Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setIsEditingName(true);
                    }}
                    placeholder="Enter your creator name"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] text-xs text-[#294B3A] focus:outline-none focus:ring-1 focus:ring-[#294B3A]"
                  />
                  {isEditingName && (
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="px-3 py-2 rounded-xl bg-[#355A46] hover:bg-[#294B3A] text-[#F8F4E8] text-xs font-semibold transition-all shadow-2xs"
                    >
                      {isSavingName ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>

              {/* Creator Statistics */}
              <div className="pt-4 border-t border-[#D8CCB7]/70 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7]">
                  <span className="text-[#718875] block">Active Creations</span>
                  <span className="text-lg font-bold font-serif text-[#294B3A]">
                    {creationsCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7]">
                  <span className="text-[#718875] block">Account Status</span>
                  <span className="text-sm font-semibold text-[#355A46] flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Visual Theme Card */}
            <div className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#294B3A]">
                <Palette className="w-4 h-4 text-[#355A46]" />
                <h3 className="text-sm font-bold font-serif">Visual Atmosphere</h3>
              </div>
              <p className="text-xs text-[#5F6D63]">
                Warm Parchment & Botanical Palette is currently active across all 7 stages.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg text-xs bg-[#F2EBDD] border border-[#D8CCB7] text-[#294B3A] font-medium">
                  Warm Parchment (#F8F4E8)
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs bg-[#DDE2D2] border border-[#C8D0BE] text-[#294B3A] font-medium">
                  Sage Accent (#294B3A)
                </span>
              </div>
            </div>

            {/* Audio Preferences Card */}
            <div className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-[#294B3A]">
                    <Volume2 className="w-4 h-4 text-[#C59A55]" />
                    <h3 className="text-sm font-bold font-serif">Audio Autoplay</h3>
                  </div>
                  <p className="text-xs text-[#5F6D63]">
                    Automatically play narration audio once generated.
                  </p>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={handleToggleAutoplay}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-1 focus:ring-[#294B3A] ${
                    autoplayAudio ? 'bg-[#355A46]' : 'bg-[#D8CCB7]'
                  }`}
                  aria-label="Toggle audio autoplay"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs ${
                      autoplayAudio ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-[#D8CCB7]/70 space-y-2">
                <label className="text-xs font-semibold text-[#5F6D63] block">
                  Default Soundscape Tone
                </label>
                <select
                  value={defaultMood}
                  onChange={(e) => handleChangeDefaultMood(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F2EBDD] border border-[#D8CCB7] text-xs text-[#294B3A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#294B3A] cursor-pointer"
                >
                  <option value="serene-ambient">Serene Ambient (Tranquil resonance)</option>
                  <option value="tense-dramatic">Tense Dramatic (Suspenseful underscore)</option>
                  <option value="mystic-ethereal">Mystic Ethereal (Celestial pad)</option>
                  <option value="ominous-drone">Ominous Drone (Deep sub-bass)</option>
                  <option value="epic-orchestral">Epic Orchestral (Cinematic motifs)</option>
                </select>
              </div>
            </div>

            {/* Account & Session Actions Card */}
            <div className="p-5 rounded-[20px] bg-[#F8F4E8] border border-[#D8CCB7] shadow-xs space-y-3">
              <h3 className="text-sm font-bold font-serif text-[#294B3A]">
                Account Session
              </h3>
              <p className="text-xs text-[#5F6D63]">
                Signed in as <strong className="text-[#294B3A]">{userEmail}</strong>.
              </p>

              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to sign out?')) {
                    await signOut();
                  }
                }}
                data-testid="profile-sign-out-btn"
                className="mt-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5E6DC] hover:bg-[#EDD5C7] text-[#B8734F] border border-[#E2BFAC] text-xs font-bold transition-all shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Toast */}
        {saveToast && (
          <div
            data-testid="profile-save-toast"
            className="fixed bottom-6 right-6 px-4 py-2.5 rounded-[14px] bg-[#294B3A] text-[#F8F4E8] text-xs font-medium shadow-lg z-50 flex items-center gap-2 animate-fade-in"
          >
            <Check className="w-3.5 h-3.5 text-[#DDE2D2]" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};
