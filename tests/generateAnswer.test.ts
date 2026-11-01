import assert from "node:assert/strict";
import test from "node:test";
import { generateAnswer, NO_DOCUMENT_ANSWER } from "../src/generation/generateAnswer.js";

const context = [{ id: "notes-chunk-1", text: "A router forwards packets between networks.", source: "notes.txt", distance: 0.1 }];

function mockClient(text: string, shouldFail = false) {
  let calls = 0;
  return {
    get calls() { return calls; },
    models: {
      generateContent: async (parameters: { model: string; contents: string; config?: { systemInstruction?: string } }) => {
        calls += 1;
        assert.equal(parameters.model, "test-model");
        assert.match(parameters.contents, /router forwards packets/);
        assert.match(parameters.config?.systemInstruction ?? "", /only the provided document context/);
        if (shouldFail) throw new Error("simulated failure");
        return { text };
      },
    },
  };
}

test("generates a grounded answer and returns source attribution", async () => {
  const client = mockClient("A router forwards packets between networks.");
  const result = await generateAnswer("What does a router do?", {
    search: async () => context,
    client,
    model: "test-model",
  });
  assert.equal(result.answer, "A router forwards packets between networks.");
  assert.deepEqual(result.sources, ["notes.txt"]);
  assert.equal(client.calls, 1);
});

test("returns the required fallback without calling Gemini when retrieval is empty", async () => {
  const client = mockClient("should not be returned");
  const result = await generateAnswer("Who invented Facebook?", {
    search: async () => [],
    client,
    model: "test-model",
  });
  assert.equal(result.answer, NO_DOCUMENT_ANSWER);
  assert.deepEqual(result.sources, []);
  assert.equal(client.calls, 0);
});

test("handles Gemini failures clearly", async () => {
  await assert.rejects(generateAnswer("What does a router do?", {
    search: async () => context,
    client: mockClient("", true),
    model: "test-model",
  }), /Gemini could not generate an answer/);
});

test("rejects empty questions", async () => {
  await assert.rejects(generateAnswer("  "), /Please enter a question/);
});
