import assert from "node:assert/strict";
import test from "node:test";
import { chunkText } from "../src/ingestion/chunkText.js";

test("keeps a short document in one chunk", () => {
  const chunks = chunkText("one two three", 500, 50, "notes.txt");

  assert.deepEqual(chunks, [
    {
      id: "notes.txt-chunk-1",
      text: "one two three",
      sourceFilename: "notes.txt",
    },
  ]);
});

test("splits long documents using the requested word count", () => {
  const words = Array.from({ length: 7 }, (_, index) => `word${index + 1}`);
  const chunks = chunkText(words.join(" "), 3, 0);

  assert.deepEqual(chunks.map((chunk) => chunk.text), [
    "word1 word2 word3",
    "word4 word5 word6",
    "word7",
  ]);
  assert.equal(new Set(chunks.map((chunk) => chunk.id)).size, chunks.length);
});

test("returns no chunks for empty or whitespace-only input", () => {
  assert.deepEqual(chunkText(""), []);
  assert.deepEqual(chunkText(" \n\t "), []);
});

test("rejects invalid chunk settings", () => {
  assert.throws(() => chunkText("some words", 0), /positive whole number/);
  assert.throws(() => chunkText("some words", 2, -1), /whole number/);
  assert.throws(() => chunkText("some words", 2, 2), /smaller than chunk size/);
  assert.throws(() => chunkText("some words", 2.5), /positive whole number/);
});

test("preserves overlapping words without losing words", () => {
  const chunks = chunkText("one two three four five six", 4, 2);

  assert.deepEqual(chunks.map((chunk) => chunk.text), [
    "one two three four",
    "three four five six",
  ]);
});
