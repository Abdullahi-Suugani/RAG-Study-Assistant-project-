import assert from "node:assert/strict";
import test from "node:test";
import { searchDocuments, type SearchTable } from "../src/retrieval/searchDocuments.js";

function mockTable(rows: Array<Record<string, unknown>>): SearchTable {
  return {
    vectorSearch: () => ({
      limit: (limit: number) => ({ toArray: async () => rows.slice(0, limit) }),
    }),
  };
}

test("performs semantic search and returns source metadata", async () => {
  const results = await searchDocuments("What does a router do?", {
    limit: 3,
  }, {
    embed: async () => [0.1, 0.2],
    table: mockTable([{ id: "notes.txt-chunk-1", text: "A router forwards packets.", source: "notes.txt", _distance: 0.12 }]),
  });

  assert.deepEqual(results, [{ id: "notes.txt-chunk-1", text: "A router forwards packets.", source: "notes.txt", distance: 0.12 }]);
});

test("rejects empty questions", async () => {
  await assert.rejects(searchDocuments("   ", {}, { embed: async () => [1], table: mockTable([]) }), /Please enter a question/);
});

test("returns an empty array when no chunks match", async () => {
  assert.deepEqual(await searchDocuments("unknown", {}, { embed: async () => [1], table: mockTable([]) }), []);
});

test("respects result limits and maximum distance", async () => {
  const results = await searchDocuments("network", { limit: 3, maxDistance: 0.5 }, {
    embed: async () => [1],
    table: mockTable([
      { id: "one", text: "one", source: "a.txt", distance: 0.2 },
      { id: "two", text: "two", source: "b.txt", distance: 0.8 },
    ]),
  });
  assert.deepEqual(results.map((result) => result.id), ["one"]);
});

test("reports embedding and database failures clearly", async () => {
  await assert.rejects(searchDocuments("question", {}, { embed: async () => { throw new Error("API"); } }), /embedding for the question/);
  await assert.rejects(searchDocuments("question", {}, { embed: async () => [1], table: { vectorSearch: () => { throw new Error("DB"); } } }), /similarity search failed/);
});
