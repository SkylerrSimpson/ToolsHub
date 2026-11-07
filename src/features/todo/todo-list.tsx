"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useSavedCollection } from "@/lib/use-saved-collection";
import type { Todo } from "@/lib/contracts";
import styles from "./todo.module.css";

export function TodoList() {
  const {
    items: todos,
    updateItems: setTodos,
    loading,
    error: loadError,
    retry,
    mutate,
  } = useSavedCollection<Todo>("/api/todos", "Your list could not be loaded.");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [mutationError, setError] = useState("");
  const error = loadError || mutationError;
  const ready = !loading && !loadError;
  const input = useRef<HTMLInputElement>(null);
  const activeControl = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (pending || !activeControl.current) return;
    const control = activeControl.current;
    activeControl.current = null;
    if (document.activeElement === document.body) {
      if (control.isConnected && !control.disabled) control.focus();
      else input.current?.focus();
    }
  }, [pending]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim() || pending || !ready) return;
    setPending("new");
    setError("");
    try {
      await mutate(async () => {
        const todo = await apiRequest<Todo>("/api/todos", {
          method: "POST",
          body: JSON.stringify({ item: draft.trim() }),
        });
        setTodos((current) => [...current, todo]);
      });
      setDraft("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "The task could not be added.");
    } finally {
      setPending(null);
    }
  }

  async function change(todo: Todo, remove: boolean) {
    if (pending || !ready) return;
    setPending(todo.id);
    setError("");
    try {
      await mutate(async () => {
        const path = "/api/todos/" + encodeURIComponent(todo.id);
        if (remove) {
          await apiRequest<void>(path, { method: "DELETE" });
          setTodos((current) => current.filter((row) => row.id !== todo.id));
        } else {
          const updated = await apiRequest<Todo>(path, {
            method: "PATCH",
            body: JSON.stringify({ completed: !todo.completed }),
          });
          setTodos((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "The task could not be updated.");
    } finally {
      setPending(null);
    }
  }

  const remaining = todos.filter((todo) => !todo.completed).length;
  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <h1>todos</h1>
        <div className={styles.listPanel} aria-busy={loading || !!pending}>
          <form onSubmit={add}>
            <label htmlFor="new-todo" className="sr-only">
              New task
            </label>
            <input
              ref={input}
              id="new-todo"
              placeholder="What needs to be done?"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={500}
              disabled={!ready}
              readOnly={!!pending}
              autoComplete="off"
            />
          </form>
          {loading ? (
            <p className={styles.message} role="status">
              Loading your list…
            </p>
          ) : ready && todos.length === 0 ? (
            <p className={styles.message}>Your list is clear. Add a task and press Enter.</p>
          ) : null}
          <ul className={styles.list}>
            {todos.map((todo) => (
              <li key={todo.id}>
                <button
                  type="button"
                  className={styles.toggle + (todo.completed ? " " + styles.checked : "")}
                  role="checkbox"
                  aria-checked={todo.completed}
                  aria-label={"Complete " + todo.item}
                  disabled={!!pending || !ready}
                  onClick={(event) => {
                    activeControl.current = event.currentTarget;
                    void change(todo, false);
                  }}
                >
                  {todo.completed && <Check size={21} aria-hidden />}
                </button>
                <span className={todo.completed ? styles.completed : undefined}>{todo.item}</span>
                <button
                  type="button"
                  className={styles.delete}
                  aria-label={"Delete " + todo.item}
                  disabled={!!pending || !ready}
                  onClick={(event) => {
                    activeControl.current = event.currentTarget;
                    void change(todo, true);
                  }}
                >
                  <X size={21} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          {ready && (
            <div className={styles.count} aria-live="polite">
              {remaining} {remaining === 1 ? "item" : "items"} left
            </div>
          )}
        </div>
        {error && (
          <div className={styles.error} role="alert">
            <p>{error}</p>
            <button
              type="button"
              disabled={!!pending}
              onClick={() => {
                setError("");
                retry();
              }}
            >
              Reload list
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
