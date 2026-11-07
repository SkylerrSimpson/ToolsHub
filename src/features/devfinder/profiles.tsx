"use client";

import { createContext, useContext, type ReactNode } from "react";
import { apiRequest } from "@/lib/api";
import { useSavedCollection } from "@/lib/use-saved-collection";
import type { SavedProfile } from "@/lib/contracts";

function useProfilesState() {
  const {
    items: profiles,
    updateItems,
    loading,
    error,
    retry,
    mutate,
  } = useSavedCollection<SavedProfile>("/api/profiles", "Saved profiles are unavailable.");
  const add = async (profile: SavedProfile) =>
    mutate(async () => {
      const saved = await apiRequest<SavedProfile>("/api/profiles", {
        method: "POST",
        body: JSON.stringify(profile),
      });
      updateItems((current) => [...current.filter((value) => value.id !== saved.id), saved]);
    });
  const remove = async (id: string) =>
    mutate(async () => {
      await apiRequest<void>(`/api/profiles/${encodeURIComponent(id)}`, { method: "DELETE" });
      updateItems((current) => current.filter((profile) => profile.id !== id));
    });
  return { profiles, loading, error, retry, add, remove };
}
const ProfilesContext = createContext<ReturnType<typeof useProfilesState> | null>(null);
export function ProfilesProvider({ children }: { children: ReactNode }) {
  const state = useProfilesState();
  return <ProfilesContext.Provider value={state}>{children}</ProfilesContext.Provider>;
}
export function useProfiles() {
  const context = useContext(ProfilesContext);
  if (!context) throw new Error("Saved profiles require ProfilesProvider.");
  return context;
}
