import React, { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showBackOnlineToast, setShowBackOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnlineToast(true);
      const timer = setTimeout(() => {
        setShowBackOnlineToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnlineToast(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (showBackOnlineToast) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/20 animate-fade-in">
        <Wifi className="w-4 h-4 text-emerald-100" />
        <span>ইন্টারনেট পুনঃসংযোগ হয়েছে — অ্যাপটি অনলাইনে সচল</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-amber-900/20 border border-amber-500/30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <WifiOff className="w-3.5 h-3.5" />
        <span>অফলাইন মোড — ক্যাশ করা ডাটাবেজ ব্যবহার হচ্ছে</span>
      </div>
    );
  }

  return null;
};
