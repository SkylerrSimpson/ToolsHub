import assert from "node:assert/strict";
import test from "node:test";
import {
  lookupProfile,
  parseGithubProfile,
  safeGithubAvatar,
  safeWebsite,
} from "../src/features/devfinder/lookup";

test("GitHub avatar parsing accepts the supported image origin and rejects forged URLs", () => {
  assert.equal(
    safeGithubAvatar("https://avatars.githubusercontent.com/u/42?v=4"),
    "https://avatars.githubusercontent.com/u/42?v=4",
  );
  for (const value of [
    "",
    "https://example.com/avatar.png",
    "http://avatars.githubusercontent.com/u/42",
    "https://avatars.githubusercontent.com/u/42#x",
    "https://avatars.githubusercontent.com:444/u/42",
  ])
    assert.equal(safeGithubAvatar(value), undefined);
});

test("GitHub parser preserves legitimate zero counts and stable GitHub identity", () => {
  const profile = parseGithubProfile({
    id: 42,
    login: "example",
    public_repos: 0,
    followers: 0,
    following: 0,
    name: null,
    bio: null,
  });
  assert.equal(profile.id, "42");
  assert.equal(profile.repos, 0);
  assert.equal(profile.followers, 0);
  assert.equal(profile.following, 0);
  assert.equal(profile.name, undefined);
  assert.equal(profile.joined, undefined);
});

test("GitHub parser omits invalid dates/counts and rejects incomplete identity", () => {
  const profile = parseGithubProfile({
    id: 42,
    login: "example",
    followers: -1,
    following: "3",
    public_repos: Infinity,
    created_at: "not a date",
  });
  assert.equal(profile.joined, undefined);
  assert.equal(profile.followers, undefined);
  assert.equal(profile.following, undefined);
  assert.equal(profile.repos, undefined);
  for (const value of [
    null,
    [],
    {},
    { id: "42", login: "example" },
    { id: 0, login: "example" },
    { id: 42, login: "" },
  ])
    assert.throws(() => parseGithubProfile(value));
});

test("external website links normalize domains and reject executable/credential URLs", () => {
  assert.equal(safeWebsite("example.com/blog"), "https://example.com/blog");
  assert.equal(safeWebsite("//example.com"), "https://example.com/");
  assert.equal(safeWebsite("https://example.com"), "https://example.com/");
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "ftp://example.com",
    "https://user:pass@example.com",
    "",
    "/relative",
    null,
  ])
    assert.equal(safeWebsite(value), undefined);
});

test("profile lookup encodes its path and forwards cancellation", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://api.github.com/users/a%2Fb");
    assert.equal(init.signal, controller.signal);
    return Response.json({ id: 1, login: "example" });
  });
  assert.equal((await lookupProfile("a/b", controller.signal)).login, "example");
});

test("profile lookup distinguishes not found and exhausted GitHub quota", async (t) => {
  for (const [status, headers, pattern] of [
    [404, {}, /No profile found/],
    [429, {}, /request limit/],
    [403, { "x-ratelimit-remaining": "0" }, /request limit/],
    [502, {}, /temporarily unavailable/],
  ] as const) {
    const mock = t.mock.method(
      globalThis,
      "fetch",
      async () => new Response(null, { status, headers }),
    );
    await assert.rejects(lookupProfile("example"), pattern);
    mock.mock.restore();
  }
});
