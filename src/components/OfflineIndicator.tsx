import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-3 right-3 z-50 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-warning)] text-[#1F2A2E] text-xs font-semibold shadow-md">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline — All changes saved locally</span>
    </div>
  );
};
