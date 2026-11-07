"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { apiRequest } from "./api";

export function useSavedCollection<Item>(path: string, unavailableMessage: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const readController = useRef<AbortController | null>(null);
  const pendingWrites = useRef(0);
  const reconcileNeeded = useRef(false);

  const refresh = useCallback(
    async (initial = false) => {
      if (!mounted.current) return;
      if (pendingWrites.current > 0) {
        reconcileNeeded.current = true;
        return;
      }
      readController.current?.abort();
      const controller = new AbortController();
      readController.current = controller;
      if (initial) {
        setLoading(true);
        setError("");
      }
      try {
        const value = await apiRequest<Item[]>(path, { signal: controller.signal });
        if (!controller.signal.aborted && mounted.current) {
          setItems(value);
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted && mounted.current)
          setError(error instanceof Error ? error.message : unavailableMessage);
      } finally {
        if (!controller.signal.aborted && mounted.current) setLoading(false);
        if (readController.current === controller) readController.current = null;
      }
    },
    [path, unavailableMessage],
  );

  const retry = useCallback(() => {
    void refresh(true);
  }, [refresh]);

  useEffect(() => {
    mounted.current = true;
    void refresh(true);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      readController.current?.abort();
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const updateItems = useCallback((update: SetStateAction<Item[]>) => {
    if (mounted.current) setItems(update);
  }, []);

  const mutate = useCallback(
    async <Result>(operation: () => Promise<Result>): Promise<Result> => {
      // An older list response must not overwrite a completed mutation.
      if (readController.current) {
        readController.current.abort();
        reconcileNeeded.current = true;
      }
      pendingWrites.current++;
      try {
        return await operation();
      } catch (error) {
        // A lost response may still have committed, and another tab may have changed the list.
        reconcileNeeded.current = true;
        throw error;
      } finally {
        pendingWrites.current--;
        if (pendingWrites.current === 0 && reconcileNeeded.current) {
          reconcileNeeded.current = false;
          void refresh();
        }
      }
    },
    [refresh],
  );

  return { items, updateItems, loading, error, retry, mutate };
}
