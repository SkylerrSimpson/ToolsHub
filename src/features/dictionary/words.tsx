"use client";

import { createContext, useContext, type ReactNode } from "react";
import { apiRequest } from "@/lib/api";
import { useSavedCollection } from "@/lib/use-saved-collection";
import type { SavedWord } from "@/lib/contracts";

function useWordsState() {
  const {
    items: words,
    updateItems,
    loading,
    error,
    retry,
    mutate,
  } = useSavedCollection<SavedWord>("/api/words", "Saved words are unavailable.");
  const add = async (word: string) =>
    mutate(async () => {
      const saved = await apiRequest<SavedWord>("/api/words", {
        method: "POST",
        body: JSON.stringify({ word }),
      });
      updateItems((current) => [...current.filter((value) => value.id !== saved.id), saved]);
    });
  const remove = async (id: string) =>
    mutate(async () => {
      await apiRequest<void>(`/api/words/${encodeURIComponent(id)}`, { method: "DELETE" });
      updateItems((current) => current.filter((word) => word.id !== id));
    });
  const rename = async (id: string, word: string) =>
    mutate(async () => {
      const saved = await apiRequest<SavedWord>(`/api/words/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ word }),
      });
      updateItems((current) => current.map((word) => (word.id === id ? saved : word)));
    });
  return { words, loading, error, retry, add, remove, rename };
}

const WordsContext = createContext<ReturnType<typeof useWordsState> | null>(null);
export function WordsProvider({ children }: { children: ReactNode }) {
  const state = useWordsState();
  return <WordsContext.Provider value={state}>{children}</WordsContext.Provider>;
}
export function useWords() {
  const context = useContext(WordsContext);
  if (!context) throw new Error("Saved words require WordsProvider.");
  return context;
}
