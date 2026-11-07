import assert from "node:assert/strict";
import test from "node:test";
import { assertSameOrigin, createApi } from "../src/server/api";
import { ApiError } from "../src/server/errors";
import { hashSessionToken, sessionCookieName } from "../src/server/session";
import type { ToolStore } from "../src/server/store";
import {
  completionInput,
  profileInput,
  readJson,
  todoInput,
  wordInput,
} from "../src/server/validation";

const origin = "https://tools.example";
const mutation = (suppliedOrigin?: string) =>
  new Request(`${origin}/api/words`, {
    method: "POST",
    headers: suppliedOrigin ? { Origin: suppliedOrigin } : {},
  });

function fails(status: number) {
  return (error: unknown) => error instanceof ApiError && error.status === status;
}

test("production writes require a configured exact origin and reject cross-site requests", () => {
  const options = { production: true, appOrigin: () => origin };
  assert.doesNotThrow(() => assertSameOrigin(mutation(origin), options));
  for (const candidate of [
    undefined,
    "null",
    "https://other.example",
    `${origin}.evil`,
    `${origin}/`,
  ]) {
    assert.throws(() => assertSameOrigin(mutation(candidate), options), fails(403));
  }
  assert.throws(
    () =>
      assertSameOrigin(
        new Request(`${origin}/api/words`, {
          method: "POST",
          headers: { Origin: origin, "Sec-Fetch-Site": "cross-site" },
        }),
        options,
      ),
    fails(403),
  );
  for (const configured of [
    undefined,
    "http://tools.example",
    `${origin}/path`,
    "invalid",
    `${origin}?x=1`,
  ]) {
    assert.throws(
      () => assertSameOrigin(mutation(origin), { production: true, appOrigin: () => configured }),
      fails(503),
    );
  }
});

test("writes never create a session or contact storage before origin and cookie checks", async () => {
  const api = createApi({
    production: true,
    appOrigin: () => origin,
    getStore: () => {
      throw new Error("must not access storage");
    },
  });
  const foreign = await api.addWord(mutation("https://foreign.example"));
  assert.equal(foreign.status, 403);
  const missing = await api.addWord(mutation(origin));
  assert.equal(missing.status, 401);
  assert.equal(missing.headers.get("set-cookie"), null);
  assert.match(missing.headers.get("cache-control") ?? "", /no-store/);
});

test("initial GET persists a hash, returns an empty list and issues a cookie only after storage succeeds", async () => {
  let savedHash = "";
  const store = {
    createSession: async (hash: string, expires: Date) => {
      savedHash = hash;
      assert.ok(expires.getTime() > Date.now());
      return "session-id";
    },
  } as unknown as ToolStore;
  const api = createApi({ production: true, appOrigin: () => origin, getStore: () => store });
  const response = await api.listWords(new Request(`${origin}/api/words`));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
  const cookie = response.headers.get("set-cookie") ?? "";
  const token = cookie.split(";")[0].slice(sessionCookieName(true).length + 1);
  assert.equal(hashSessionToken(token), savedHash);
  assert.notEqual(token, savedHash);

  const unavailable = createApi({
    production: true,
    appOrigin: () => origin,
    getStore: () => {
      throw new Error("private connection details and user input");
    },
  });
  const failed = await unavailable.listWords(new Request(`${origin}/api/words`));
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get("set-cookie"), null);
  assert.doesNotMatch(await failed.text(), /private connection details/);
});

test("JSON input is bounded even when the length header is absent", async () => {
  const request = (body: string, contentType = "application/json") =>
    new Request(`${origin}/api/words`, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    });
  assert.deepEqual(await readJson(request('{"word":"hello"}')), { word: "hello" });
  await assert.rejects(readJson(request("{broken")), fails(400));
  await assert.rejects(readJson(request("[]")), fails(400));
  await assert.rejects(readJson(request("null")), fails(400));
  await assert.rejects(readJson(request('{"word":"hello"}', "text/plain")), fails(415));
  await assert.rejects(readJson(request(JSON.stringify({ word: "x".repeat(9000) }))), fails(413));
});

test("tool input rejects mass assignment, invalid values and untrusted avatar origins", () => {
  assert.equal(wordInput({ word: " hello " }), "hello");
  assert.equal(todoInput({ item: " Read a chapter " }), "Read a chapter");
  for (const body of [
    { word: "" },
    { word: "a\u0000b" },
    { word: "x".repeat(101) },
    { word: "hello", session_id: "someone-else" },
  ]) {
    assert.throws(() => wordInput(body), fails(400));
  }
  for (const completed of ["true", 1, null, undefined]) {
    assert.throws(() => completionInput({ completed }), fails(400));
  }
  assert.equal(completionInput({ completed: false }), false);
  const valid = {
    id: "583231",
    login: "octocat",
    avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  };
  assert.deepEqual(profileInput(valid), valid);
  for (const avatarUrl of [
    "javascript:alert(1)",
    "http://avatars.githubusercontent.com/u/1",
    "https://evil.example/u/1",
    "https://avatars.githubusercontent.com.evil/u/1",
    "https://user:pass@avatars.githubusercontent.com/u/1",
  ]) {
    assert.throws(() => profileInput({ ...valid, avatarUrl }), fails(400));
  }
  assert.throws(() => profileInput({ ...valid, id: "0" }), fails(400));
});
