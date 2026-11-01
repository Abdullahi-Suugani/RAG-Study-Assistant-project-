import { createInterface, type Interface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { AnswerResult } from "../generation/generateAnswer.js";
import type { SearchResult } from "../retrieval/searchDocuments.js";

export interface IndexedDocumentInfo {
  source: string;
  chunks: number;
  indexedAt?: string;
}

export interface MenuServices {
  indexDocument(path: string): Promise<IndexedDocumentInfo>;
  askQuestion(question: string): Promise<AnswerResult>;
  listDocuments(): Promise<IndexedDocumentInfo[]>;
  search(question: string): Promise<SearchResult[]>;
  deleteDocument(source: string): Promise<void>;
}

export interface MenuIO {
  question(prompt: string): Promise<string>;
  write(message: string): void;
  close(): void;
}

export function displayMenu(io: Pick<MenuIO, "write">): void {
  io.write("\n================================\n       AI STUDY ASSISTANT\n================================\n" +
    "1. Add and index a document\n2. Ask a question\n3. List indexed documents\n" +
    "4. Search relevant document chunks\n5. Delete an indexed document\n6. Exit\n");
}

async function handleOption(option: string, services: MenuServices, io: MenuIO): Promise<boolean> {
  try {
    if (option === "1") {
      const path = await io.question("Document path: ");
      const result = await services.indexDocument(path);
      io.write(`Indexed ${result.source} (${result.chunks} chunks).`);
    } else if (option === "2") {
      const result = await services.askQuestion(await io.question("Question: "));
      io.write(`\n${result.answer}`);
      if (result.sources.length > 0) io.write(`Sources: ${result.sources.join(", ")}`);
    } else if (option === "3") {
      const documents = await services.listDocuments();
      io.write(documents.length === 0 ? "No documents are indexed." :
        documents.map((document) => `- ${document.source} (${document.chunks} chunks)`).join("\n"));
    } else if (option === "4") {
      const results = await services.search(await io.question("Question: "));
      io.write(results.length === 0 ? "No relevant document chunks found." :
        results.map((result, index) => `${index + 1}. [${result.source}] ${result.text}` +
          (result.distance === undefined ? "" : ` (distance: ${result.distance})`)).join("\n"));
    } else if (option === "5") {
      const source = await io.question("Document to delete: ");
      const confirmation = await io.question(`Delete '${source}'? Type yes to confirm: `);
      if (confirmation.trim().toLowerCase() === "yes") {
        await services.deleteDocument(source);
        io.write(`Deleted indexed records for ${source}.`);
      } else io.write("Deletion cancelled.");
    } else if (option === "6") {
      io.write("Goodbye.");
      return false;
    } else io.write("Invalid option. Please choose a number from 1 to 6.");
  } catch (error) {
    io.write(`Error: ${error instanceof Error ? error.message : "An unexpected error occurred."}`);
  }
  return true;
}

export async function runMenu(services: MenuServices, io: MenuIO): Promise<void> {
  let running = true;
  while (running) {
    displayMenu(io);
    running = await handleOption(await io.question("Choose an option: "), services, io);
  }
  io.close();
}

export function createTerminalIO(): MenuIO {
  const readline: Interface = createInterface({ input: stdin, output: stdout });
  readline.on("SIGINT", () => {
    console.log("\nGoodbye.");
    readline.close();
  });
  return {
    question: (prompt) => readline.question(prompt),
    write: (message) => console.log(message),
    close: () => readline.close(),
  };
}
