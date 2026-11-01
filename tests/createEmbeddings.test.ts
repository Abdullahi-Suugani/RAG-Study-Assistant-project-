import assert from "node:assert/strict";
import test from "node:test";
import { createEmbedding, createEmbeddings, EMBEDDING_MODEL } from "../src/embeddings/createEmbeddings.js";

function mockClient(response: unknown, shouldFail = false) {
  let calls = 0;
  return {
    get calls() { return calls; },
    models: {
      embedContent: async (parameters: { model: string; contents: string | string[] }) => {
        calls += 1;
        assert.equal(parameters.model, EMBEDDING_MODEL);
        return shouldFail ? Promise.reject(new Error("simulated API failure")) : response as never;
      },
    },
  };
}

test("creates one embedding from a mocked Gemini response", async () => {
  const client = mockClient({ embeddings: [{ values: [0.1, 0.2, 0.3] }] });
  assert.deepEqual(await createEmbedding("router", client), [0.1, 0.2, 0.3]);
  assert.equal(client.calls, 1);
});

test("creates multiple embeddings with one API call and consistent dimensions", async () => {
  const client = mockClient({ embeddings: [{ values: [0.1, 0.2] }, { values: [0.3, 0.4] }] });
  assert.deepEqual(await createEmbeddings(["LAN", "WAN"], client), [[0.1, 0.2], [0.3, 0.4]]);
  assert.equal(client.calls, 1);
});

test("rejects empty input without calling Gemini", async () => {
  const client = mockClient({ embeddings: [] });
  await assert.rejects(createEmbedding("  ", client), /empty or whitespace-only/);
  assert.equal(client.calls, 0);
});

test("reports a missing API key", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(createEmbedding("text"), /GEMINI_API_KEY is missing/);
  } finally {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

test("rejects invalid Gemini vectors", async () => {
  const client = mockClient({ embeddings: [{ values: [0.1, Number.NaN] }] });
  await assert.rejects(createEmbedding("text", client), /invalid embedding vector/);
});

test("rejects inconsistent vector dimensions", async () => {
  const client = mockClient({ embeddings: [{ values: [0.1] }, { values: [0.2, 0.3] }] });
  await assert.rejects(createEmbeddings(["one", "two"], client), /inconsistent dimensions/);
});

test("converts Gemini API failures into a clear error", async () => {
  const client = mockClient(undefined, true);
  await assert.rejects(createEmbedding("text", client), /Gemini embedding request failed/);
});
