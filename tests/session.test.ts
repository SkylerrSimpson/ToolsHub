import assert from "node:assert/strict";
import test from "node:test";
import {
  hashSessionToken,
  newSessionCredentials,
  readSessionHash,
  sessionCookie,
  sessionCookieName,
} from "../src/server/session";

test("browser credentials are 32 random bytes and the database representation is only their hash", () => {
  const first = newSessionCredentials();
  const second = newSessionCredentials();
  assert.match(first.token, /^[0-9a-f]{64}$/);
  assert.match(first.hash, /^[0-9a-f]{64}$/);
  assert.notEqual(first.token, first.hash);
  assert.notEqual(first.token, second.token);
  assert.equal(first.hash, hashSessionToken(first.token));
});

test("production cookies are secure, host-only and unavailable to scripts", () => {
  const { token, hash } = newSessionCredentials();
  const cookie = sessionCookie(token, true);
  assert.ok(cookie.startsWith("__Host-tools-session="));
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; SameSite=Lax/);
  assert.match(cookie, /; Path=\//);
  assert.doesNotMatch(cookie, /Domain=/i);
  const request = new Request("https://tools.example/api/words", {
    headers: { cookie: cookie.split(";")[0] },
  });
  assert.equal(readSessionHash(request, true), hash);
  assert.equal(readSessionHash(request, false), null);
});

test("malformed, unrelated and ambiguous session cookies do not become identities", () => {
  const { token } = newSessionCredentials();
  const name = sessionCookieName(false);
  for (const cookie of [
    "",
    `${name}=short`,
    `${name}=${"g".repeat(64)}`,
    `other=${token}`,
    `${name}=${token}; ${name}=${token}`,
    `${name}=${encodeURIComponent(`${token};other=x`)}`,
  ]) {
    assert.equal(
      readSessionHash(new Request("http://localhost/api/words", { headers: { cookie } }), false),
      null,
    );
  }
  assert.equal(
    readSessionHash(
      new Request("http://localhost/api/words", {
        headers: { cookie: `other=x; ${name}=${token}` },
      }),
      false,
    ),
    hashSessionToken(token),
  );
});
