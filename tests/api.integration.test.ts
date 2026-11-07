import "../scripts/env";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import postgres from "postgres";
import { createApi } from "../src/server/api";
import { runMigrations } from "../src/server/migrate";
import { createStore, MAX_ITEMS_PER_TOOL } from "../src/server/store";

const testUrl = process.env.TEST_DATABASE_URL;
const origin = "https://tools.example";

test(
  "PostgreSQL API: private ownership, atomic rename, precise failures and session expiry",
  {
    skip: !testUrl ? "Set TEST_DATABASE_URL to an isolated PostgreSQL test database." : false,
  },
  async (t) => {
    const parsed = new URL(testUrl!);
    assert.match(
      parsed.pathname,
      /(?:^|[_/-])test(?:[_/-]|$)/,
      "TEST_DATABASE_URL must name a test database",
    );
    if (process.env.DATABASE_URL) {
      const production = new URL(process.env.DATABASE_URL);
      assert.notEqual(
        `${parsed.host}${parsed.pathname}`,
        `${production.host}${production.pathname}`,
        "Integration tests require a different database from DATABASE_URL",
      );
    }
    const schema = `api_test_${randomBytes(8).toString("hex")}`;
    const admin = postgres(testUrl!, { max: 1, connect_timeout: 5, onnotice: () => {} });
    const sql = postgres(testUrl!, {
      max: 5,
      connect_timeout: 5,
      onnotice: () => {},
      connection: { search_path: schema },
    });
    let schemaCreated = false;
    t.after(async () => {
      await sql.end();
      try {
        if (schemaCreated) await admin`DROP SCHEMA ${admin(schema)} CASCADE`;
      } finally {
        await admin.end();
      }
    });
    await admin`CREATE SCHEMA ${admin(schema)}`;
    schemaCreated = true;
    await runMigrations(sql);
    await runMigrations(sql);
    const api = createApi({
      production: true,
      appOrigin: () => origin,
      getStore: () => createStore(sql),
    });
    const request = (method: string, cookie?: string, body?: unknown) =>
      new Request(`${origin}/api/test`, {
        method,
        headers: {
          Origin: origin,
          ...(cookie ? { cookie } : {}),
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    const bootstrap = async () => {
      const response = await api.listWords(request("GET"));
      assert.equal(response.status, 200);
      const cookie = response.headers.get("set-cookie")?.split(";")[0];
      assert.ok(cookie);
      return cookie;
    };
    const alice = await bootstrap();
    const bob = await bootstrap();
    assert.notEqual(alice, bob);

    const created = await api.addWord(request("POST", alice, { word: "hello" }));
    assert.equal(created.status, 201);
    const firstWord = await created.json();
    assert.deepEqual(Object.keys(firstWord).sort(), ["id", "word"]);
    assert.equal((await api.addWord(request("POST", alice, { word: "HELLO" }))).status, 409);
    assert.equal((await api.addWord(request("POST", bob, { word: "hello" }))).status, 201);
    assert.equal(
      (await api.renameWord(request("PATCH", bob, { word: "stolen" }), firstWord.id)).status,
      404,
    );
    assert.equal((await api.deleteWord(request("DELETE", bob), firstWord.id)).status, 404);

    const secondResponse = await api.addWord(request("POST", alice, { word: "world" }));
    const secondWord = await secondResponse.json();
    const bobWords = await (await api.listWords(request("GET", bob))).json();
    assert.equal(bobWords.length, 1);
    assert.equal(bobWords[0].word, "hello");
    assert.notEqual(bobWords[0].id, firstWord.id);
    assert.ok(!bobWords.some((word: { id: string }) => word.id === secondWord.id));
    assert.equal(
      (await api.renameWord(request("PATCH", alice, { word: "hello" }), secondWord.id)).status,
      409,
    );
    const afterFailure = await (await api.listWords(request("GET", alice))).json();
    assert.equal(
      afterFailure.find((word: { id: string }) => word.id === secondWord.id).word,
      "world",
    );
    const renamed = await (
      await api.renameWord(request("PATCH", alice, { word: "earth" }), secondWord.id)
    ).json();
    assert.deepEqual(renamed, { id: secondWord.id, word: "earth" });
    const deleted = await api.deleteWord(request("DELETE", alice), secondWord.id);
    assert.equal(deleted.status, 204);
    assert.equal(await deleted.text(), "");

    const profile = {
      id: "583231",
      login: "octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    };
    assert.equal((await api.addProfile(request("POST", alice, profile))).status, 201);
    assert.equal((await api.addProfile(request("POST", alice, profile))).status, 409);
    assert.deepEqual(await (await api.listProfiles(request("GET", bob))).json(), []);
    assert.equal((await api.deleteProfile(request("DELETE", bob), profile.id)).status, 404);
    assert.equal((await api.addProfile(request("POST", bob, profile))).status, 201);
    assert.equal((await api.deleteProfile(request("DELETE", alice), profile.id)).status, 204);
    assert.deepEqual(await (await api.listProfiles(request("GET", bob))).json(), [profile]);

    const taskResponse = await api.addTodo(request("POST", alice, { item: "Read a chapter" }));
    assert.equal(taskResponse.status, 201);
    const task = await taskResponse.json();
    assert.equal(task.completed, false);
    assert.deepEqual(await (await api.listTodos(request("GET", bob))).json(), []);
    assert.equal(
      (await api.completeTodo(request("PATCH", bob, { completed: true }), task.id)).status,
      404,
    );
    assert.equal((await api.deleteTodo(request("DELETE", bob), task.id)).status, 404);
    assert.equal(
      (await api.completeTodo(request("PATCH", alice, { completed: "true" }), task.id)).status,
      400,
    );
    assert.equal(
      (
        await api.completeTodo(
          request("PATCH", alice, { completed: true, session_id: "injected" }),
          task.id,
        )
      ).status,
      400,
    );
    assert.equal(
      (await api.completeTodo(request("PATCH", alice, { completed: true }), task.id)).status,
      200,
    );
    assert.deepEqual(await (await api.listTodos(request("GET", alice))).json(), [
      { ...task, completed: true },
    ]);
    assert.equal((await api.deleteTodo(request("DELETE", alice), "not-an-id")).status, 400);
    assert.equal((await api.deleteTodo(request("DELETE", alice), task.id)).status, 204);

    const [aliceSession] = await sql<{ id: string; token_hash: string }[]>`
    SELECT s.id, s.token_hash FROM browser_sessions s JOIN saved_words w ON w.session_id = s.id WHERE w.id = ${firstWord.id}
  `;
    assert.notEqual(aliceSession.token_hash, alice.split("=")[1]);
    await sql`
    INSERT INTO todos (id, session_id, item)
    SELECT gen_random_uuid(), ${aliceSession.id}, 'fixture ' || number FROM generate_series(1, ${MAX_ITEMS_PER_TOOL - 1}) number
  `;
    const finalSlots = await Promise.all([
      api.addTodo(request("POST", alice, { item: "last slot one" })),
      api.addTodo(request("POST", alice, { item: "last slot two" })),
    ]);
    assert.deepEqual(finalSlots.map((response) => response.status).sort(), [201, 422]);
    assert.equal(
      (await (await api.listTodos(request("GET", alice))).json()).length,
      MAX_ITEMS_PER_TOOL,
    );

    await sql`UPDATE browser_sessions SET expires_at = now() - interval '1 second' WHERE id = ${aliceSession.id}`;
    const expired = await api.addWord(request("POST", alice, { word: "expired" }));
    assert.equal(expired.status, 401);
    assert.equal(expired.headers.get("set-cookie"), null);
    const fresh = await api.listWords(request("GET", alice));
    assert.deepEqual(await fresh.json(), []);
    assert.ok(fresh.headers.get("set-cookie"));
    assert.notEqual(fresh.headers.get("set-cookie")?.split(";")[0], alice);
  },
);
