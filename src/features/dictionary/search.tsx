"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Play, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupWord, type DictionaryEntry } from "./lookup";
import { useWords } from "./words";
import styles from "./dictionary.module.css";

export function DictionarySearch() {
  const params = useSearchParams();
  const initial = params.get("word")?.trim() || "hello";
  const [input, setInput] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const lookupGeneration = useRef(0);
  const words = useWords();
  const saved = words.words.find(
    (word) => word.word.toLocaleLowerCase() === entry?.word.toLocaleLowerCase(),
  );

  useEffect(() => {
    setInput(initial);
    setQuery(initial);
  }, [initial]);
  useEffect(() => {
    const controller = new AbortController();
    lookupGeneration.current++;
    setLoading(true);
    setError("");
    setEntry(null);
    setSaveError("");
    setSaveMessage("");
    setAudioError("");
    stopAudio();
    lookupWord(query, controller.signal)
      .then((entry) => {
        if (!controller.signal.aborted) setEntry(entry);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof TypeError
              ? "Could not reach the dictionary. Check your connection and try again."
              : error instanceof Error
                ? error.message
                : "Could not look up this word.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      lookupGeneration.current++;
      stopAudio();
    };
  }, [query, attempt]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    setQuery(value);
    setAttempt((value) => value + 1);
  }
  async function toggleSave() {
    if (!entry || saving) return;
    const generation = lookupGeneration.current;
    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      if (saved) {
        await words.remove(saved.id);
        if (generation === lookupGeneration.current)
          setSaveMessage(`Removed ${entry.word} from saved words.`);
      } else {
        await words.add(entry.word);
        if (generation === lookupGeneration.current) setSaveMessage(`Saved ${entry.word}.`);
      }
    } catch (error) {
      if (generation === lookupGeneration.current)
        setSaveError(
          error instanceof Error
            ? error.message
            : "Could not update saved words. Please try again.",
        );
    } finally {
      setSaving(false);
    }
  }
  function stopAudio() {
    const previous = audio.current;
    audio.current = null;
    previous?.pause();
  }
  async function playAudio() {
    if (!entry?.audio) return;
    setAudioError("");
    stopAudio();
    const player = new Audio(entry.audio);
    audio.current = player;
    try {
      await player.play();
    } catch {
      if (audio.current === player)
        setAudioError("This pronunciation could not be played. Please try again.");
    }
  }

  return (
    <section aria-label="Word lookup">
      <form className={styles.search} onSubmit={search} role="search">
        <label htmlFor="dictionary-query" className={styles.srOnly}>
          Word to look up
        </label>
        <Input
          id="dictionary-query"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search for any word…"
          maxLength={100}
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Search dictionary"
          disabled={!input.trim()}
        >
          <Search />
        </Button>
      </form>
      {words.error && (
        <div className={styles.notice} role="alert">
          <p>Saved words could not be loaded. You can still look up words.</p>
          <p>{words.error}</p>
          <Button variant="outline" size="sm" onClick={words.retry}>
            Retry saved words
          </Button>
        </div>
      )}
      {loading && (
        <p className={styles.status} role="status">
          Looking up “{query}”…
        </p>
      )}
      {error && (
        <div className={styles.notice} role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            Try again
          </Button>
        </div>
      )}
      {entry && !loading && (
        <article className={styles.entry}>
          <header className={styles.wordHeader}>
            <div>
              <h1>{entry.word}</h1>
              {entry.phonetic && <p>{entry.phonetic}</p>}
            </div>
            <Button
              className={styles.star}
              variant="ghost"
              size="icon"
              aria-label={saved ? `Remove ${entry.word} from saved words` : `Save ${entry.word}`}
              aria-pressed={Boolean(saved)}
              disabled={saving || words.loading || Boolean(words.error)}
              onClick={toggleSave}
            >
              <Star fill={saved ? "currentColor" : "none"} />
            </Button>
          </header>
          {saveError && (
            <p className={styles.error} role="alert">
              {saveError}
            </p>
          )}
          <p className={styles.srOnly} role="status">
            {saveMessage}
          </p>
          {audioError && (
            <p className={styles.error} role="alert">
              {audioError}
            </p>
          )}
          {entry.meanings.map((meaning, index) => (
            <section
              key={`${meaning.partOfSpeech}-${index}`}
              className={styles.meaning}
              aria-label={`${meaning.partOfSpeech} definitions`}
            >
              <h2>{meaning.partOfSpeech}</h2>
              <div className={styles.meaningBody}>
                <div>
                  <p className={styles.secondary}>Meaning</p>
                  <ul className={styles.definitions}>
                    {meaning.definitions.map((definition, index) => (
                      <li key={index}>
                        <p>{definition.text}</p>
                        {definition.example && (
                          <p className={styles.example}>“{definition.example}”</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.audioWrap}>
                  <Button
                    className={styles.audio}
                    variant="ghost"
                    size="icon"
                    onClick={playAudio}
                    disabled={!entry.audio}
                    aria-label={
                      entry.audio
                        ? `Play pronunciation of ${entry.word}`
                        : `Pronunciation unavailable for ${entry.word}`
                    }
                  >
                    <Play fill="currentColor" />
                  </Button>
                  {!entry.audio && <span>No audio</span>}
                </div>
              </div>
              {meaning.synonyms.length > 0 && (
                <div className={styles.synonyms}>
                  <span className={styles.secondary}>Synonyms</span>
                  <p>{meaning.synonyms.join(" · ")}</p>
                </div>
              )}
            </section>
          ))}
          {entry.sources.length > 0 && (
            <footer className={styles.sources}>
              <span>Source</span>
              <ul>
                {entry.sources.map((source) => (
                  <li key={source}>
                    <a href={source} target="_blank" rel="noopener noreferrer">
                      {source}
                      <ExternalLink size={14} aria-hidden="true" />
                      <span className={styles.srOnly}> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </footer>
          )}
        </article>
      )}
    </section>
  );
}
