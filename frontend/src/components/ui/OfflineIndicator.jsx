import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen to standard browser events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to Electron IPC if available (more reliable for desktop apps)
    let removeListener = null;
    if (window.electronAPI && window.electronAPI.onNetworkStatus) {
       // Assuming we might add onNetworkStatus to preload.js
       // We'll just rely on standard events for now if not present, but we did send 'network:status' in main.js
    }
    
    // We can just listen to the raw IPC if we expose a generic listener, or we can use the browser's online/offline which works fairly well.
    // For now, navigator.onLine and the window events are sufficient for the frontend UI.

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (removeListener) removeListener();
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none"
        >
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm pointer-events-auto">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You are currently offline. Some features may be unavailable.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
