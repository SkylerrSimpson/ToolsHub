"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Pencil, XCircle } from "lucide-react";
import type { SavedWord } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWords } from "./words";
import styles from "./dictionary.module.css";

function WordRow({ word }: { word: SavedWord }) {
  const { rename, remove } = useWords();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(word.word);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const cancelled = useRef(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (editing || pending || !returnFocus.current) return;
    returnFocus.current = false;
    // A keyboard commit/cancel removes the input. A deliberate blur keeps its new target.
    if (document.activeElement === document.body) editButton.current?.focus();
  }, [editing, pending]);
  function edit() {
    setDraft(word.word);
    setError("");
    cancelled.current = false;
    returnFocus.current = false;
    setEditing(true);
  }
  async function commit(event?: FormEvent) {
    event?.preventDefault();
    if (busy.current || cancelled.current) return;
    returnFocus.current = Boolean(event);
    const value = draft.trim();
    if (!value || value === word.word) {
      setEditing(false);
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    try {
      await rename(word.id, value);
      setEditing(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not rename this word. Your saved word is unchanged.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function deleteWord() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      await remove(word.id);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not remove this word. Please try again.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <li className={styles.savedRow}>
      <div className={styles.rowMain}>
        {editing ? (
          <form onSubmit={commit} className={styles.renameForm}>
            <label className={styles.srOnly} htmlFor={`rename-${word.id}`}>
              Rename {word.word}
            </label>
            <Input
              id={`rename-${word.id}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => void commit()}
              onKeyDown={(event) => {
                if (event.key === "Escape" && !pending) {
                  event.preventDefault();
                  cancelled.current = true;
                  returnFocus.current = true;
                  setEditing(false);
                }
              }}
              maxLength={100}
              autoFocus
              readOnly={pending}
              aria-busy={pending}
              aria-describedby={`rename-help-${word.id}`}
            />
            <span id={`rename-help-${word.id}`} className={styles.editHint}>
              Enter or leave field to save · Escape to cancel
            </span>
          </form>
        ) : (
          <span className={styles.savedWord} onDoubleClick={edit}>
            {word.word}
          </span>
        )}
        <div className={styles.rowActions}>
          {!editing && (
            <Button
              ref={editButton}
              variant="ghost"
              size="icon"
              aria-label={`Rename ${word.word}`}
              onClick={edit}
              disabled={pending}
            >
              <Pencil size={17} />
            </Button>
          )}
          {editing || pending ? (
            <span
              role="link"
              aria-disabled="true"
              aria-label={`Look up ${word.word}`}
              className={styles.iconLink}
              style={{ opacity: 0.45 }}
              onPointerDown={(event) => event.preventDefault()}
            >
              <ArrowUpRight size={21} />
            </span>
          ) : (
            <Link
              href={`/dictionary?word=${encodeURIComponent(word.word)}`}
              className={styles.iconLink}
              aria-label={`Look up ${word.word}`}
            >
              <ArrowUpRight size={21} />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${word.word}`}
            disabled={pending || editing}
            onClick={deleteWord}
          >
            <XCircle />
          </Button>
        </div>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

export function SavedWords() {
  const { words, loading, error, retry } = useWords();
  return (
    <section aria-labelledby="saved-words-title">
      <h1 id="saved-words-title" className={styles.pageTitle}>
        Saved Words
      </h1>
      {loading ? (
        <p className={styles.status} role="status">
          Loading saved words…
        </p>
      ) : error ? (
        <div className={styles.notice} role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : words.length === 0 ? (
        <p className={styles.status}>
          No words saved yet. <Link href="/dictionary">Look up a word</Link> and select its star to
          save it.
        </p>
      ) : (
        <>
          <p className={styles.editHint}>
            Double-click a word or use its edit button to rename it.
          </p>
          <ul className={styles.savedList}>
            {words.map((word) => (
              <WordRow key={word.id} word={word} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
