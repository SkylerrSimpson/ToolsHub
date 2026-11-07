export type GithubProfile = {
  id: string;
  login: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  joined?: string;
  repos?: number;
  followers?: number;
  following?: number;
  location?: string;
  website?: string;
  websiteLabel?: string;
  twitter?: string;
  company?: string;
};

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const count = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;

export function safeWebsite(value: unknown): string | undefined {
  const source = text(value);
  if (!source) return;
  if (source.startsWith("/") && !source.startsWith("//")) return;
  if (/^[a-z][a-z\d+.-]*:/i.test(source) && !/^https?:/i.test(source)) return;
  try {
    const url = new URL(
      source.startsWith("//")
        ? `https:${source}`
        : /^https?:\/\//i.test(source)
          ? source
          : `https://${source}`,
    );
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password &&
      url.hostname.includes(".")
    )
      return url.href;
  } catch {
    /* Invalid third-party links are omitted. */
  }
}

export function safeGithubAvatar(value: unknown): string | undefined {
  const source = safeWebsite(value);
  if (!source) return;
  const url = new URL(source);
  if (
    url.protocol === "https:" &&
    url.hostname === "avatars.githubusercontent.com" &&
    !url.port &&
    !url.hash &&
    /^\/u\/[1-9][0-9]*$/.test(url.pathname)
  )
    return url.href;
}

export function parseGithubProfile(value: unknown): GithubProfile {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("GitHub returned an unexpected response. Please try again.");
  const data = value as Record<string, unknown>;
  const login = text(data.login);
  const id = count(data.id);
  if (!login || id === undefined || id === 0)
    throw new Error("GitHub returned an incomplete profile. Please try again.");
  const created = text(data.created_at);
  const date = created ? new Date(created) : undefined;
  return {
    id: String(id),
    login,
    name: text(data.name),
    avatarUrl: safeGithubAvatar(data.avatar_url),
    bio: text(data.bio),
    joined: date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined,
    repos: count(data.public_repos),
    followers: count(data.followers),
    following: count(data.following),
    location: text(data.location),
    website: safeWebsite(data.blog),
    websiteLabel: text(data.blog),
    twitter: text(data.twitter_username),
    company: text(data.company),
  };
}

export async function lookupProfile(
  username: string,
  signal?: AbortSignal,
): Promise<GithubProfile> {
  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username.trim())}`,
    { signal, headers: { Accept: "application/vnd.github+json" } },
  );
  if (response.status === 404)
    throw new Error(`No profile found for “${username}”. Check the username and try again.`);
  if (
    response.status === 429 ||
    (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")
  )
    throw new Error("GitHub’s request limit has been reached. Please try again later.");
  if (!response.ok) throw new Error("GitHub is temporarily unavailable. Please try again.");
  return parseGithubProfile(await response.json());
}
