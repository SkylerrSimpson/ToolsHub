import { randomUUID } from "node:crypto";
import type { Sql, TransactionSql } from "postgres";
import type { SavedProfile, SavedWord, Todo } from "../lib/contracts";
import { ApiError, sessionRequired } from "./errors";

export const MAX_ITEMS_PER_TOOL = 500;

async function lockOwner(sql: TransactionSql, owner: string) {
  const rows =
    await sql`SELECT id FROM browser_sessions WHERE id = ${owner} AND expires_at > now() FOR UPDATE`;
  if (!rows.length) throw sessionRequired();
}

function limit(count: number) {
  if (count >= MAX_ITEMS_PER_TOOL) {
    throw new ApiError(
      422,
      `This tool can save up to ${MAX_ITEMS_PER_TOOL} items. Remove an item first.`,
    );
  }
}

async function duplicate<T>(operation: () => Promise<T>, message: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new ApiError(409, message);
    }
    throw error;
  }
}

export function createStore(sql: Sql) {
  return {
    async findSession(hash: string) {
      const rows = await sql<{ id: string }[]>`
        SELECT id FROM browser_sessions WHERE token_hash = ${hash} AND expires_at > now()
      `;
      return rows[0]?.id ?? null;
    },

    async createSession(hash: string, expiresAt: Date) {
      const id = randomUUID();
      await sql`INSERT INTO browser_sessions (id, token_hash, expires_at) VALUES (${id}, ${hash}, ${expiresAt})`;
      return id;
    },

    async words(owner: string): Promise<SavedWord[]> {
      return sql<
        SavedWord[]
      >`SELECT id, word FROM saved_words WHERE session_id = ${owner} ORDER BY created_at, id`;
    },

    async addWord(owner: string, word: string): Promise<SavedWord> {
      return duplicate(async () => {
        const rows = await sql.begin(async (tx) => {
          await lockOwner(tx, owner);
          const [count] = await tx<
            { count: number }[]
          >`SELECT count(*)::int AS count FROM saved_words WHERE session_id = ${owner}`;
          limit(count.count);
          return tx<SavedWord[]>`
              INSERT INTO saved_words (id, session_id, word) VALUES (${randomUUID()}, ${owner}, ${word}) RETURNING id, word
            `;
        });
        return rows[0];
      }, "This word is already saved.");
    },

    async renameWord(owner: string, id: string, word: string): Promise<SavedWord> {
      return duplicate(async () => {
        const rows = await sql<SavedWord[]>`
            UPDATE saved_words SET word = ${word} WHERE session_id = ${owner} AND id = ${id} RETURNING id, word
          `;
        if (!rows.length) throw new ApiError(404, "Saved word not found.");
        return rows[0];
      }, "This word is already saved.");
    },

    async deleteWord(owner: string, id: string) {
      const rows =
        await sql`DELETE FROM saved_words WHERE session_id = ${owner} AND id = ${id} RETURNING id`;
      if (!rows.length) throw new ApiError(404, "Saved word not found.");
    },

    async profiles(owner: string): Promise<SavedProfile[]> {
      return sql<SavedProfile[]>`
        SELECT github_id AS id, login, avatar_url AS "avatarUrl" FROM saved_profiles
        WHERE session_id = ${owner} ORDER BY created_at, github_id
      `;
    },

    async addProfile(owner: string, profile: SavedProfile): Promise<SavedProfile> {
      return duplicate(async () => {
        const rows = await sql.begin(async (tx) => {
          await lockOwner(tx, owner);
          const [count] = await tx<
            { count: number }[]
          >`SELECT count(*)::int AS count FROM saved_profiles WHERE session_id = ${owner}`;
          limit(count.count);
          return tx<SavedProfile[]>`
              INSERT INTO saved_profiles (session_id, github_id, login, avatar_url)
              VALUES (${owner}, ${profile.id}, ${profile.login}, ${profile.avatarUrl})
              RETURNING github_id AS id, login, avatar_url AS "avatarUrl"
            `;
        });
        return rows[0];
      }, "This profile is already saved.");
    },

    async deleteProfile(owner: string, id: string) {
      const rows =
        await sql`DELETE FROM saved_profiles WHERE session_id = ${owner} AND github_id = ${id} RETURNING github_id`;
      if (!rows.length) throw new ApiError(404, "Saved profile not found.");
    },

    async todos(owner: string): Promise<Todo[]> {
      return sql<
        Todo[]
      >`SELECT id, item, completed FROM todos WHERE session_id = ${owner} ORDER BY created_at, id`;
    },

    async addTodo(owner: string, item: string): Promise<Todo> {
      const rows = await sql.begin(async (tx) => {
        await lockOwner(tx, owner);
        const [count] = await tx<
          { count: number }[]
        >`SELECT count(*)::int AS count FROM todos WHERE session_id = ${owner}`;
        limit(count.count);
        return tx<Todo[]>`
          INSERT INTO todos (id, session_id, item) VALUES (${randomUUID()}, ${owner}, ${item}) RETURNING id, item, completed
        `;
      });
      return rows[0];
    },

    async completeTodo(owner: string, id: string, completed: boolean): Promise<Todo> {
      const rows = await sql<Todo[]>`
        UPDATE todos SET completed = ${completed} WHERE session_id = ${owner} AND id = ${id} RETURNING id, item, completed
      `;
      if (!rows.length) throw new ApiError(404, "Task not found.");
      return rows[0];
    },

    async deleteTodo(owner: string, id: string) {
      const rows =
        await sql`DELETE FROM todos WHERE session_id = ${owner} AND id = ${id} RETURNING id`;
      if (!rows.length) throw new ApiError(404, "Task not found.");
    },
  };
}

export type ToolStore = ReturnType<typeof createStore>;
