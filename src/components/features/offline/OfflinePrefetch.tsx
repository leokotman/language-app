import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { syncForOffline } from "@/lib/offlineSync";
import { offlineLog } from "@/lib/offlineDebug";

/**
 * When the user is logged in and online, prefetches all app vocabulary and user data
 * into IndexedDB so Dictionary and Library work offline. Runs once after login (on any
 * protected page) so data is ready without the user opening each screen.
 */
export function OfflinePrefetch() {
  const userId = useAuthStore((state) => state.user?.id);
  const didPrefetchFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || typeof navigator === "undefined" || !navigator.onLine)
      return;
    if (didPrefetchFor.current === userId) return;
    didPrefetchFor.current = userId;

    offlineLog("prefetch run", { userId });
    syncForOffline(userId);
  }, [userId]);

  return null;
}
