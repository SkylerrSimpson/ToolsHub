type BrowserLocks = Pick<LockManager, "request">;

export async function serializedSavedRead<T>(
  operation: () => Promise<T>,
  locks: BrowserLocks | undefined,
  signal?: AbortSignal | null,
): Promise<T> {
  if (!locks) {
    throw new Error(
      "This browser cannot safely initialize private saves. Use a current browser over HTTPS.",
    );
  }
  // The cookie is HttpOnly. Serialize all initial list reads across tabs so a late
  // first-visit response cannot replace the identity used by an earlier save.
  return locks.request(
    "tools-session-bootstrap",
    { mode: "exclusive", ...(signal ? { signal } : {}) },
    operation,
  );
}
