import { ApiError, sessionRequired } from "./errors";
import {
  newSessionCredentials,
  readSessionHash,
  SESSION_MAX_AGE_SECONDS,
  sessionCookie,
} from "./session";
import type { ToolStore } from "./store";
import {
  completionInput,
  githubId,
  profileInput,
  readJson,
  todoInput,
  uuidId,
  wordInput,
} from "./validation";

type ApiOptions = {
  getStore: () => ToolStore;
  production: boolean;
  appOrigin: () => string | undefined;
};

export function assertSameOrigin(
  request: Request,
  options: Pick<ApiOptions, "production" | "appOrigin">,
) {
  const configured = options.appOrigin();
  if (!configured && options.production) {
    throw new ApiError(503, "Saving is temporarily unavailable.");
  }
  let expected: string;
  try {
    const url = new URL(configured ?? request.url);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (configured && (url.pathname !== "/" || url.search || url.hash))
    ) {
      throw new Error("Invalid application origin");
    }
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (options.production && !loopback && url.protocol !== "https:") {
      throw new Error("HTTPS is required");
    }
    expected = url.origin;
  } catch {
    throw new ApiError(503, "Saving is temporarily unavailable.");
  }
  if (
    request.headers.get("origin") !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new ApiError(403, "Save changes from this website only.");
  }
}

function json(value: unknown, status = 200, cookie?: string) {
  const headers = new Headers({ "Cache-Control": "private, no-store", Vary: "Cookie" });
  if (cookie) headers.set("Set-Cookie", cookie);
  if (status === 204) return new Response(null, { status, headers });
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), { status, headers });
}

export function createApi(options: ApiOptions) {
  async function respond(operation: () => Promise<Response>) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      // Database errors may contain query values or connection details. Never return or log them.
      return json({ error: "Saved items are temporarily unavailable. Please try again." }, 503);
    }
  }

  async function owner(request: Request, store: ToolStore) {
    const hash = readSessionHash(request, options.production);
    if (!hash) throw sessionRequired();
    const id = await store.findSession(hash);
    if (!id) throw sessionRequired();
    return id;
  }

  function list(request: Request, read: (store: ToolStore, owner: string) => Promise<unknown>) {
    return respond(async () => {
      const store = options.getStore();
      const hash = readSessionHash(request, options.production);
      const existing = hash ? await store.findSession(hash) : null;
      if (existing) return json(await read(store, existing));
      const credentials = newSessionCredentials();
      await store.createSession(
        credentials.hash,
        new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
      );
      // Only a successful initial GET issues a cookie. Writes never create competing sessions.
      return json([], 200, sessionCookie(credentials.token, options.production));
    });
  }

  function mutate(
    request: Request,
    operation: (store: ToolStore, owner: string) => Promise<Response>,
  ) {
    return respond(async () => {
      assertSameOrigin(request, options);
      if (!readSessionHash(request, options.production)) throw sessionRequired();
      const store = options.getStore();
      const id = await owner(request, store);
      return operation(store, id);
    });
  }

  return {
    listWords: (request: Request) => list(request, (store, id) => store.words(id)),
    addWord: (request: Request) =>
      mutate(request, async (store, id) =>
        json(await store.addWord(id, wordInput(await readJson(request))), 201),
      ),
    renameWord: (request: Request, wordId: string) =>
      mutate(request, async (store, id) =>
        json(await store.renameWord(id, uuidId(wordId), wordInput(await readJson(request)))),
      ),
    deleteWord: (request: Request, wordId: string) =>
      mutate(request, async (store, id) => {
        await store.deleteWord(id, uuidId(wordId));
        return json(null, 204);
      }),
    listProfiles: (request: Request) => list(request, (store, id) => store.profiles(id)),
    addProfile: (request: Request) =>
      mutate(request, async (store, id) =>
        json(await store.addProfile(id, profileInput(await readJson(request))), 201),
      ),
    deleteProfile: (request: Request, profileId: string) =>
      mutate(request, async (store, id) => {
        await store.deleteProfile(id, githubId(profileId));
        return json(null, 204);
      }),
    listTodos: (request: Request) => list(request, (store, id) => store.todos(id)),
    addTodo: (request: Request) =>
      mutate(request, async (store, id) =>
        json(await store.addTodo(id, todoInput(await readJson(request))), 201),
      ),
    completeTodo: (request: Request, todoId: string) =>
      mutate(request, async (store, id) =>
        json(
          await store.completeTodo(id, uuidId(todoId), completionInput(await readJson(request))),
        ),
      ),
    deleteTodo: (request: Request, todoId: string) =>
      mutate(request, async (store, id) => {
        await store.deleteTodo(id, uuidId(todoId));
        return json(null, 204);
      }),
  };
}
