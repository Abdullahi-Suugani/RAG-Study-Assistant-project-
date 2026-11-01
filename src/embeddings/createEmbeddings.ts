import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

export const EMBEDDING_MODEL = "gemini-embedding-001";

interface EmbeddingClient {
  models: {
    embedContent: (parameters: { model: string; contents: string | string[] }) => Promise<{
      embeddings?: Array<{ values?: number[] }>;
    }>;
  };
}

function createGeminiClient(): EmbeddingClient {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to your .env file before creating embeddings.");
  }
  return new GoogleGenAI({ apiKey });
}

function validateEmbedding(values: unknown, index: number): number[] {
  if (!Array.isArray(values) || values.length === 0 ||
      !values.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error(`Gemini returned an invalid embedding vector at position ${index + 1}.`);
  }
  return values;
}

function validateConsistentDimensions(vectors: number[][]): void {
  if (new Set(vectors.map((vector) => vector.length)).size > 1) {
    throw new Error("Gemini returned vectors with inconsistent dimensions.");
  }
}

export async function createEmbeddings(
  texts: string[],
  client: EmbeddingClient = createGeminiClient(),
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.some((text) => text.trim().length === 0)) {
    throw new Error("Cannot create embeddings for empty or whitespace-only text.");
  }

  let response: Awaited<ReturnType<EmbeddingClient["models"]["embedContent"]>>;
  try {
    response = await client.models.embedContent({ model: EMBEDDING_MODEL, contents: texts });
  } catch {
    throw new Error("Gemini embedding request failed. Check your API key and connection.");
  }

  if (!response.embeddings || response.embeddings.length !== texts.length) {
    throw new Error("Gemini returned an unexpected number of embedding vectors.");
  }
  const vectors = response.embeddings.map((embedding, index) => validateEmbedding(embedding.values, index));
  validateConsistentDimensions(vectors);
  return vectors;
}

export async function createEmbedding(text: string, client?: EmbeddingClient): Promise<number[]> {
  const [embedding] = await createEmbeddings([text], client ?? createGeminiClient());
  return embedding;
}
