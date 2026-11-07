import { createHash, randomBytes } from "node:crypto";

export const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export function sessionCookieName(production: boolean) {
  return production ? "__Host-tools-session" : "tools-session";
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionCredentials() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashSessionToken(token) };
}

export function readSessionHash(request: Request, production: boolean): string | null {
  const name = sessionCookieName(production);
  const matches = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  // Ambiguous cookies can result from an older domain-scoped cookie. Never guess which one owns data.
  if (matches.length !== 1) return null;
  const token = matches[0].slice(name.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? hashSessionToken(token) : null;
}

export function sessionCookie(token: string, production: boolean) {
  return `${sessionCookieName(production)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${production ? "; Secure" : ""}`;
}
