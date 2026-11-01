import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md"]);

export async function loadDocument(filePath: string): Promise<string> {
  if (!filePath.trim()) {
    throw new Error("Please provide a document path.");
  }

  const absolutePath = resolve(process.cwd(), filePath);
  const extension = extname(absolutePath).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error(
      `Unsupported document type: '${extension || "no extension"}'. ` +
        "Only .txt and .md files are supported.",
    );
  }

  let content: string;

  try {
    content = await readFile(absolutePath, "utf-8");
  } catch (error) {
    if (isFileNotFoundError(error)) {
      throw new Error(`Document not found: ${filePath}`);
    }

    throw new Error(`Could not read document '${filePath}'.`);
  }

  if (content.trim().length === 0) {
    throw new Error(`The document is empty or contains only whitespace: ${filePath}`);
  }

  return content;
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
