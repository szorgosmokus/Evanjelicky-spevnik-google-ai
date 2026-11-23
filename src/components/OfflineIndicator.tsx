import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useOrientation } from '../hooks/useOrientation';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isCompactLandscape } = useOrientation();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed ${
        isCompactLandscape ? 'bottom-3' : 'bottom-20 lg:bottom-5'
      } left-4 z-40 flex items-center gap-2 rounded-xl bg-[#1A2232] dark:bg-[#253045] border border-[#D4A34B]/40 px-3.5 py-2 text-xs font-medium text-[#FAF7F0] shadow-lg`}
    >
      <WifiOff className="w-3.5 h-3.5 text-[#D4A34B] shrink-0" aria-hidden="true" />
      <span>Offline režim — všetkých 700 piesní je dostupných</span>
    </div>
  );
};
