import { createEmbedding } from "../embeddings/createEmbeddings.js";
import { getVectorTable, type VectorRecord } from "../vectorstore/lanceDB.js";

export interface SearchResult {
  id: string;
  text: string;
  source: string;
  distance?: number;
}

export interface SearchTable {
  vectorSearch(vector: number[]): {
    limit(limit: number): {
      toArray(): Promise<Array<VectorRecord & { _distance?: number; distance?: number }>>;
    };
  };
}

export interface SearchOptions {
  limit?: number;
  /** LanceDB distance threshold. Lower distances are more similar. */
  maxDistance?: number;
}

export async function searchDocuments(
  question: string,
  options: SearchOptions = {},
  dependencies: {
    embed?: (text: string) => Promise<number[]>;
    table?: SearchTable;
  } = {},
): Promise<SearchResult[]> {
  if (!question.trim()) {
    throw new Error("Please enter a question to search the indexed documents.");
  }

  const limit = options.limit ?? 5;
  if (!Number.isInteger(limit) || limit < 3 || limit > 5) {
    throw new Error("Search result limit must be a whole number between 3 and 5.");
  }
  if (options.maxDistance !== undefined &&
      (!Number.isFinite(options.maxDistance) || options.maxDistance < 0)) {
    throw new Error("Maximum distance must be a non-negative number.");
  }

  let embedding: number[];
  try {
    embedding = await (dependencies.embed ?? createEmbedding)(question);
  } catch (error) {
    throw new Error("Could not create an embedding for the question.", { cause: error });
  }

  let table: SearchTable;
  try {
    table = dependencies.table ?? await getVectorTable() as unknown as SearchTable;
  } catch (error) {
    throw new Error("Could not open the indexed document database.", { cause: error });
  }

  let rows: Array<VectorRecord & { _distance?: number; distance?: number }>;
  try {
    rows = await table.vectorSearch(embedding).limit(limit).toArray();
  } catch (error) {
    throw new Error("Document similarity search failed.", { cause: error });
  }

  return rows
    .map((row) => ({
      id: row.id,
      text: row.text,
      source: row.source,
      distance: row._distance ?? row.distance,
    }))
    .filter((result) => options.maxDistance === undefined ||
      result.distance === undefined || result.distance <= options.maxDistance);
}
