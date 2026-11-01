import { createTerminalIO, runMenu, type MenuServices } from "./cli/menu.js";
import { generateAnswer } from "./generation/generateAnswer.js";
import { indexDocument, listIndexedDocuments, deleteIndexedDocument } from "./ingestion/indexDocuments.js";
import { searchDocuments } from "./retrieval/searchDocuments.js";

async function main(): Promise<void> {
  try {
    const services: MenuServices = {
      indexDocument,
      askQuestion: generateAnswer,
      listDocuments: listIndexedDocuments,
      search: (question) => searchDocuments(question),
      deleteDocument: deleteIndexedDocument,
    };
    await runMenu(services, createTerminalIO());
  } catch (error) {
    console.error("Application failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

main();
