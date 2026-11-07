import { ApiError } from "./errors";

const MAX_JSON_BYTES = 8192;
const CONTROLS = /[\u0000-\u001f\u007f]/;

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  ) {
    throw new ApiError(415, "Send an application/json request.");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
    throw new ApiError(413, "The request is too large.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A JSON object is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_JSON_BYTES) {
        await reader.cancel();
        throw new ApiError(413, "The request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("not an object");
    }
    return value as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "A valid JSON object is required.");
  }
}

export function onlyFields(body: Record<string, unknown>, fields: readonly string[]) {
  if (Object.keys(body).some((key) => !fields.includes(key))) {
    throw new ApiError(400, "The request contains an unsupported field.");
  }
}

function text(value: unknown, label: string, max: number) {
  if (typeof value !== "string") throw new ApiError(400, `${label} is required.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max || CONTROLS.test(normalized)) {
    throw new ApiError(
      400,
      `${label} must contain 1 to ${max} characters without control characters.`,
    );
  }
  return normalized;
}

export function wordInput(body: Record<string, unknown>) {
  onlyFields(body, ["word"]);
  return text(body.word, "Word", 100);
}

export function todoInput(body: Record<string, unknown>) {
  onlyFields(body, ["item"]);
  return text(body.item, "Task", 500);
}

export function completionInput(body: Record<string, unknown>) {
  onlyFields(body, ["completed"]);
  if (typeof body.completed !== "boolean") {
    throw new ApiError(400, "Completed must be true or false.");
  }
  return body.completed;
}

export function githubId(value: unknown) {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,19}$/.test(value)) {
    throw new ApiError(400, "A valid GitHub profile ID is required.");
  }
  return value;
}

export function profileInput(body: Record<string, unknown>) {
  onlyFields(body, ["id", "login", "avatarUrl"]);
  const id = githubId(body.id);
  const login = text(body.login, "GitHub username", 39);
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(login) || login.includes("--")) {
    throw new ApiError(400, "A valid GitHub username is required.");
  }
  const avatarUrl = text(body.avatarUrl, "Avatar URL", 2048);
  let url: URL;
  try {
    url = new URL(avatarUrl);
  } catch {
    throw new ApiError(400, "Use a GitHub avatar URL.");
  }
  // Saved avatars are displayed by the browser. Restrict persisted image URLs to GitHub's avatar origin.
  if (
    url.protocol !== "https:" ||
    url.hostname !== "avatars.githubusercontent.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    !/^\/u\/[1-9][0-9]*$/.test(url.pathname)
  ) {
    throw new ApiError(400, "Use a GitHub avatar URL.");
  }
  return { id, login, avatarUrl: url.toString() };
}

export function uuidId(value: string) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) {
    throw new ApiError(400, "A valid saved item ID is required.");
  }
  return value;
}
