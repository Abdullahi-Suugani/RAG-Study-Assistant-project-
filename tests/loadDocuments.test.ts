import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, after } from "node:test";
import { loadDocument } from "../src/ingestion/loadDocuments.js";

const temporaryDirectories: string[] = [];

after(async () => {
  await Promise.all(
    temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTemporaryDocument(extension: string, content: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "rag-loader-test-"));
  temporaryDirectories.push(directory);
  const filePath = join(directory, `notes${extension}`);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

test("loads a .txt file and preserves its original content", async () => {
  const originalContent = "Line one.\n\nLine two with   spacing.";
  const filePath = await createTemporaryDocument(".txt", originalContent);

  assert.equal(await loadDocument(filePath), originalContent);
});

test("loads a .md file", async () => {
  const originalContent = "# Study notes\n\nImportant concept.";
  const filePath = await createTemporaryDocument(".md", originalContent);

  assert.equal(await loadDocument(filePath), originalContent);
});

test("rejects a missing document", async () => {
  await assert.rejects(
    loadDocument("data/does-not-exist.txt"),
    /Document not found: data\/does-not-exist\.txt/,
  );
});

test("rejects unsupported file extensions", async () => {
  const filePath = await createTemporaryDocument(".pdf", "PDF content");

  await assert.rejects(
    loadDocument(filePath),
    /Only \.txt and \.md files are supported/,
  );
});

test("rejects empty and whitespace-only documents", async () => {
  const emptyFile = await createTemporaryDocument(".txt", "");
  const whitespaceFile = await createTemporaryDocument(".md", " \n\t ");

  await assert.rejects(loadDocument(emptyFile), /empty or contains only whitespace/);
  await assert.rejects(loadDocument(whitespaceFile), /empty or contains only whitespace/);
});
