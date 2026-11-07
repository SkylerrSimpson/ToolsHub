import assert from "node:assert/strict";
import test from "node:test";
import { serializedSavedRead } from "../src/lib/saved-read";

test("two tabs share one identity when the first cookie response is delayed", async () => {
  let queue: Promise<unknown> = Promise.resolve();
  const names: string[] = [];
  const locks = {
    request(name: string, _options: unknown, operation: () => Promise<unknown>) {
      names.push(name);
      const result = queue.then(operation);
      queue = result.catch(() => {});
      return result;
    },
  } as Pick<LockManager, "request">;
  let finishFirst!: () => void;
  const delayedCookie = new Promise<void>((resolve) => {
    finishFirst = resolve;
  });
  let cookie: string | undefined;
  let secondStarted = false;
  let identitiesCreated = 0;
  const first = serializedSavedRead(async () => {
    assert.equal(cookie, undefined);
    identitiesCreated++;
    await delayedCookie;
    cookie = "browser-a";
    return cookie;
  }, locks);
  const second = serializedSavedRead(async () => {
    secondStarted = true;
    if (!cookie) identitiesCreated++;
    return cookie;
  }, locks);
  await Promise.resolve();
  assert.equal(secondStarted, false);
  finishFirst();
  assert.deepEqual(await Promise.all([first, second]), ["browser-a", "browser-a"]);
  assert.equal(identitiesCreated, 1);
  assert.deepEqual(names, ["tools-session-bootstrap", "tools-session-bootstrap"]);
});

test("unsupported locking fails before issuing a competing session request", async () => {
  let called = false;
  await assert.rejects(
    serializedSavedRead(async () => {
      called = true;
    }, undefined),
    /private saves/,
  );
  assert.equal(called, false);
});
