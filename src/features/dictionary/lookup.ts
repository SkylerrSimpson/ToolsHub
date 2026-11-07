export type Definition = { text: string; example?: string };
export type Meaning = { partOfSpeech: string; definitions: Definition[]; synonyms: string[] };
export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  audio?: string;
  meanings: Meaning[];
  sources: string[];
};

const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export function safeDictionaryUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return;
  try {
    const url = new URL(value.startsWith("//") ? `https:${value}` : value);
    if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password)
      return url.href;
  } catch {
    /* Invalid external data is omitted. */
  }
}

export function parseDictionaryEntry(value: unknown): DictionaryEntry {
  const entry = object(Array.isArray(value) ? value[0] : undefined);
  const word = text(entry?.word);
  if (!entry || !word || !Array.isArray(entry.meanings))
    throw new Error("The dictionary returned an unexpected response. Please try again.");
  const phonetics = Array.isArray(entry.phonetics) ? entry.phonetics.map(object) : [];
  const meanings: Meaning[] = entry.meanings.flatMap((value) => {
    const meaning = object(value);
    if (!meaning || !Array.isArray(meaning.definitions)) return [];
    const definitions = meaning.definitions.flatMap((value): Definition[] => {
      const definition = object(value);
      const description = text(definition?.definition);
      return description ? [{ text: description, example: text(definition?.example) }] : [];
    });
    if (!definitions.length) return [];
    return [
      {
        partOfSpeech: text(meaning.partOfSpeech) ?? "meaning",
        definitions,
        synonyms: Array.isArray(meaning.synonyms)
          ? meaning.synonyms.flatMap((value) => (text(value) ? [text(value)!] : []))
          : [],
      },
    ];
  });
  if (!meanings.length)
    throw new Error("The dictionary returned no readable definitions for this word.");
  return {
    word,
    phonetic: text(entry.phonetic) ?? phonetics.map((value) => text(value?.text)).find(Boolean),
    audio: phonetics.map((value) => safeDictionaryUrl(value?.audio)).find(Boolean),
    meanings,
    sources: Array.isArray(entry.sourceUrls)
      ? entry.sourceUrls.flatMap((value) =>
          safeDictionaryUrl(value) ? [safeDictionaryUrl(value)!] : [],
        )
      : [],
  };
}

export async function lookupWord(word: string, signal?: AbortSignal): Promise<DictionaryEntry> {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`,
    { signal },
  );
  if (response.status === 404)
    throw new Error(`No definition found for “${word}”. Check the spelling or try another word.`);
  if (response.status === 429)
    throw new Error("The dictionary is receiving too many requests. Wait a moment and try again.");
  if (!response.ok) throw new Error("The dictionary is temporarily unavailable. Please try again.");
  return parseDictionaryEntry(await response.json());
}
