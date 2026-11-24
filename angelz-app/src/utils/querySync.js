import { queryClient } from "../app/AppProviders";

const CHANNEL_NAME = "angelz_query_sync";
let channel = null;

if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      const keys = event.data?.keys;
      if (Array.isArray(keys)) {
        keys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key, refetchType: "all" });
          queryClient.refetchQueries({ queryKey: key, type: "active" });
        });
      }
    };
  } catch (err) {
    console.warn("BroadcastChannel initialization error:", err);
  }
}

// Fallback via window storage event for environments where BroadcastChannel is blocked
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "angelz_query_sync_event" && e.newValue) {
      try {
        const { keys } = JSON.parse(e.newValue);
        if (Array.isArray(keys)) {
          keys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key, refetchType: "all" });
            queryClient.refetchQueries({ queryKey: key, type: "active" });
          });
        }
      } catch (err) {
        // ignore parse error
      }
    }
  });
}

/**
 * Invalidates query keys locally and broadcasts across all open tabs/windows
 * (e.g. Organization window, Volunteer window, Volunteer Group window)
 */
export function syncInvalidateQueries(...keys) {
  // 1. Invalidate in current tab/window
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: key, refetchType: "all" });
    queryClient.refetchQueries({ queryKey: key });
  });

  // 2. Broadcast to other tabs/windows via BroadcastChannel
  if (channel) {
    try {
      channel.postMessage({ keys });
    } catch (err) {
      console.warn("BroadcastChannel postMessage error:", err);
    }
  }

  // 3. Secondary broadcast via localStorage event
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("angelz_query_sync_event", JSON.stringify({ keys, ts: Date.now() }));
    } catch (err) {
      // ignore
    }
  }
}
