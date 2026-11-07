import assert from "node:assert/strict";
import test from "node:test";
import {
  lookupWord,
  parseDictionaryEntry,
  safeDictionaryUrl,
} from "../src/features/dictionary/lookup";

const example = [
  {
    word: "hello",
    phonetics: [{ audio: "" }, { text: "/həˈləʊ/", audio: "https://example.com/hello.mp3" }],
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [{ definition: "A greeting.", example: "She said hello." }],
        synonyms: ["greeting"],
      },
    ],
    sourceUrls: ["https://example.com/hello", "javascript:alert(1)"],
  },
];

test("dictionary selects later playable audio, falls back to phonetic text, and filters unsafe sources", () => {
  const entry = parseDictionaryEntry(example);
  assert.equal(entry.audio, "https://example.com/hello.mp3");
  assert.equal(entry.phonetic, "/həˈləʊ/");
  assert.deepEqual(entry.sources, ["https://example.com/hello"]);
  assert.deepEqual(entry.meanings[0].definitions, [
    { text: "A greeting.", example: "She said hello." },
  ]);
});

test("dictionary keeps readable definitions when optional fields are missing", () => {
  const entry = parseDictionaryEntry([
    {
      word: "test",
      meanings: [{ definitions: [{ definition: "An examination." }, null, { definition: "" }] }],
    },
  ]);
  assert.equal(entry.audio, undefined);
  assert.equal(entry.phonetic, undefined);
  assert.deepEqual(entry.sources, []);
  assert.equal(entry.meanings[0].definitions.length, 1);
  assert.deepEqual(entry.meanings[0].synonyms, []);
});

test("dictionary rejects malformed or empty results without assuming array contents", () => {
  for (const value of [
    null,
    [],
    { title: "No Definitions Found" },
    [{ word: "hello", meanings: [null] }],
  ]) {
    assert.throws(() => parseDictionaryEntry(value));
  }
  assert.equal(safeDictionaryUrl("data:audio/mp3;base64,AAAA"), undefined);
  assert.equal(safeDictionaryUrl("https://user:password@example.com/audio"), undefined);
  assert.equal(safeDictionaryUrl("//example.com/audio.mp3"), "https://example.com/audio.mp3");
});

test("dictionary lookup encodes query characters and forwards cancellation", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://api.dictionaryapi.dev/api/v2/entries/en/a%2Fb%20%26c");
    assert.equal(init.signal, controller.signal);
    return Response.json(example);
  });
  assert.equal((await lookupWord(" a/b &c ", controller.signal)).word, "hello");
});

test("dictionary distinguishes not found, throttling, and server failures", async (t) => {
  for (const [status, pattern] of [
    [404, /No definition found/],
    [429, /too many requests/],
    [503, /temporarily unavailable/],
  ] as const) {
    const mock = t.mock.method(globalThis, "fetch", async () => new Response(null, { status }));
    await assert.rejects(lookupWord("word"), pattern);
    mock.mock.restore();
  }
});
