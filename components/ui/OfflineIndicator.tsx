"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-warning text-warning-foreground px-4 py-2 text-center text-sm font-medium animate-in slide-in-from-top flex items-center justify-center gap-2 shadow-sm">
            <WifiOff className="h-4 w-4" />
            <span>You are offline. Changes will be synced when connection is restored.</span>
        </div>
    );
}
