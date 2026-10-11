import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="pwa-offline-banner"
      className="bg-[#FFF8E7] border-b border-[#D8CCB7] px-4 py-2.5 flex items-center justify-between text-xs text-[#5C4827] shadow-2xs z-50 transition-all select-none"
    >
      <div className="flex items-center gap-2.5 max-w-4xl mx-auto flex-1">
        <div className="w-5 h-5 rounded-full bg-[#E8DCC0] flex items-center justify-center text-[#964B00] shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-semibold text-[#394840]">Offline Mode:</span>
          <span>
            You are viewing cached application pages. Generative AI, live media synthesis, email authentication, and cloud syncing require an active internet connection.
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-[#718875] hover:text-[#294B3A] p-1 rounded-md transition"
        aria-label="Dismiss offline banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
