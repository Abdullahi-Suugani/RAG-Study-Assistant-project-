import assert from "node:assert/strict";
import test from "node:test";
import { runMenu, type MenuIO, type MenuServices } from "../src/cli/menu.js";

function setup(answers: string[]) {
  const output: string[] = [];
  const io: MenuIO = { question: async () => answers.shift() ?? "6", write: (text) => output.push(text), close: () => undefined };
  const calls: string[] = [];
  const services: MenuServices = {
    indexDocument: async (path) => { calls.push(`index:${path}`); return { source: path, chunks: 2 }; },
    askQuestion: async (question) => { calls.push(`ask:${question}`); return { answer: "Grounded answer", sources: ["notes.txt"] }; },
    listDocuments: async () => [{ source: "notes.txt", chunks: 2 }],
    search: async (question) => { calls.push(`search:${question}`); return [{ id: "1", text: "passage", source: "notes.txt", distance: 0.2 }]; },
    deleteDocument: async (source) => { calls.push(`delete:${source}`); },
  };
  return { io, services, output, calls };
}

test("handles indexing, questions, search, and confirmed deletion", async () => {
  const setupData = setup(["1", "notes.txt", "2", "What?", "4", "Where?", "5", "notes.txt", "yes", "6"]);
  await runMenu(setupData.services, setupData.io);
  assert.deepEqual(setupData.calls, ["index:notes.txt", "ask:What?", "search:Where?", "delete:notes.txt"]);
});

test("does not delete without explicit confirmation and handles invalid options", async () => {
  const setupData = setup(["9", "5", "notes.txt", "no", "6"]);
  await runMenu(setupData.services, setupData.io);
  assert.deepEqual(setupData.calls, []);
  assert.ok(setupData.output.some((line) => line.includes("Invalid option")));
  assert.ok(setupData.output.some((line) => line.includes("Deletion cancelled")));
});
