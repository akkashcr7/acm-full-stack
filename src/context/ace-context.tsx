"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import {
  isNetworkOnline,
  isSimulatedOffline,
  setSimulatedOffline,
  getPendingQueue,
  syncOfflineQueue,
  cacheMetadataForOffline,
} from "@/lib/offline/sync";

interface AceContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  login: (email: string, password?: string, role?: UserRole, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isOnline: boolean;
  isSimulated: boolean;
  toggleSimulatedOffline: () => void;
  pendingQueueCount: number;
  triggerManualSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncMessage: string | null;
}

const GUEST_SPECTATOR: User = {
  id: "usr_guest",
  name: "Public Spectator",
  email: "",
  role: "public",
};

const AceContext = createContext<AceContextType | undefined>(undefined);

export function AceProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_SPECTATOR);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  // Load active user session and initial offline queue
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedUser = localStorage.getItem("ace_current_user");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch {
      // Fallback
    }

    setIsSimulated(isSimulatedOffline());
    setIsOnline(isNetworkOnline());

    const updateQueue = async () => {
      const pending = await getPendingQueue();
      setPendingQueueCount(pending.length);
    };

    updateQueue();

    // Register Service Worker and auto-update to latest deployment
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("SW registration ignored in dev:", err);
        });
    }

    // Prefetch and cache metadata for offline access
    const prefetchMetadata = async () => {
      try {
        const [teamsRes, critRes] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/criteria"),
        ]);
        if (teamsRes.ok && critRes.ok) {
          const { teams } = await teamsRes.json();
          const { criteria } = await critRes.json();
          await cacheMetadataForOffline(teams, criteria);
        }
      } catch (err) {
        console.warn("Metadata prefetch failed (offline):", err);
      }
    };
    prefetchMetadata();

    // Listeners for network & offline events
    const handleOnline = async () => {
      setIsOnline(isNetworkOnline());
      if (isNetworkOnline()) {
        await handleAutoSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleCustomChange = async () => {
      setIsSimulated(isSimulatedOffline());
      const onlineStatus = isNetworkOnline();
      setIsOnline(onlineStatus);
      if (onlineStatus) {
        await handleAutoSync();
      }
      await updateQueue();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("ace-connection-change", handleCustomChange);
    window.addEventListener("ace-queue-updated", updateQueue);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("ace-connection-change", handleCustomChange);
      window.removeEventListener("ace-queue-updated", updateQueue);
    };
  }, []);

  const handleAutoSync = async () => {
    setIsSyncing(true);
    const result = await syncOfflineQueue();
    setIsSyncing(false);
    if (result.syncedCount > 0) {
      setLastSyncMessage(`Synced ${result.syncedCount} score(s) automatically!`);
      setTimeout(() => setLastSyncMessage(null), 4000);
    }
    const pending = await getPendingQueue();
    setPendingQueueCount(pending.length);
  };

  const switchRole = (role: UserRole) => {
    const updatedUser: User = {
      ...currentUser,
      role,
      name: currentUser.role === "public" ? `${role.toUpperCase()} Authority` : currentUser.name,
    };
    setCurrentUser(updatedUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("ace_active_role", role);
      localStorage.setItem("ace_current_user", JSON.stringify(updatedUser));
    }
  };

  const toggleSimulatedOffline = () => {
    const newState = !isSimulated;
    setIsSimulated(newState);
    setSimulatedOffline(newState);
  };

  const triggerManualSync = async () => {
    setIsSyncing(true);
    const result = await syncOfflineQueue();
    setIsSyncing(false);
    if (result.syncedCount > 0) {
      setLastSyncMessage(`Successfully synced ${result.syncedCount} score(s)!`);
    } else if (result.errors.length > 0) {
      setLastSyncMessage(`Sync error: ${result.errors[0]}`);
    } else {
      setLastSyncMessage("Queue is empty. Everything is up to date.");
    }
    const pending = await getPendingQueue();
    setPendingQueueCount(pending.length);
    setTimeout(() => setLastSyncMessage(null), 4000);
  };

  const login = async (email: string, password?: string, role?: UserRole, name?: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        return { success: false, error: data.error || "Login failed" };
      }

      setCurrentUser(data.user);
      if (typeof window !== "undefined") {
        localStorage.setItem("ace_current_user", JSON.stringify(data.user));
        localStorage.setItem("ace_active_role", data.user.role);
        if (data.token) {
          localStorage.setItem("ace_session_token", data.token);
        }
      }
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error during login";
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    setCurrentUser(GUEST_SPECTATOR);
    if (typeof window !== "undefined") {
      localStorage.removeItem("ace_current_user");
      localStorage.setItem("ace_active_role", "public");
      localStorage.removeItem("ace_session_token");
    }
  };

  return (
    <AceContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        login,
        logout,
        isOnline,
        isSimulated,
        toggleSimulatedOffline,
        pendingQueueCount,
        triggerManualSync,
        isSyncing,
        lastSyncMessage,
      }}
    >
      {children}
    </AceContext.Provider>
  );
}

export function useAce() {
  const ctx = useContext(AceContext);
  if (!ctx) {
    throw new Error("useAce must be used within an AceProvider");
  }
  return ctx;
}
