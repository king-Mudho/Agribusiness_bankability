"use client";

import { useEffect, useState } from "react";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { flushQueue } from "@/lib/offline/syncQueue";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOnline) return;
    setSyncing(true);
    flushQueue()
      .catch(() => undefined)
      .finally(() => setSyncing(false));
  }, [isOnline]);

  if (isOnline && !syncing) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 w-full bg-warning text-header text-sm font-medium text-center py-2"
    >
      {isOnline
        ? "Syncing your answers..."
        : "You're offline -- your answers are saved on this device and will sync automatically."}
    </div>
  );
}
