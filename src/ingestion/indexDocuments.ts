import { basename, resolve } from "node:path";
import { chunkText } from "./chunkText.js";
import { loadDocument } from "./loadDocuments.js";
import { createEmbeddings } from "../embeddings/createEmbeddings.js";
import { deleteRecordsBySource, getVectorTable, listVectorRecords, type VectorRecord } from "../vectorstore/lanceDB.js";

export interface IndexSummary { source: string; chunks: number; indexedAt: string; }

export async function indexDocument(filePath: string): Promise<IndexSummary> {
  const source = basename(resolve(process.cwd(), filePath));
  const content = await loadDocument(filePath);
  const chunks = chunkText(content, 500, 50, source);
  if (chunks.length === 0) throw new Error("The document produced no indexable chunks.");
  const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.text));
  const indexedAt = new Date().toISOString();
  const records: VectorRecord[] = chunks.map((chunk, index) => ({
    id: chunk.id, text: chunk.text, source, embedding: embeddings[index], createdAt: indexedAt,
  }));
  const existing = await listVectorRecords().catch((error: unknown) => {
    if (error instanceof Error && error.message.includes("not initialized")) return [];
    throw error;
  });
  if (existing.some((record) => record.source === source)) await deleteRecordsBySource(source);
  await getVectorTable(records).then(async (table) => {
    const tableRecords = existing.length === 0 ? records : records;
    if (existing.length > 0) await table.add(tableRecords);
  });
  return { source, chunks: records.length, indexedAt };
}

export async function listIndexedDocuments(): Promise<IndexSummary[]> {
  const records = await listVectorRecords().catch((error: unknown) => {
    if (error instanceof Error && error.message.includes("not initialized")) return [];
    throw error;
  });
  const grouped = new Map<string, IndexSummary>();
  for (const record of records) {
    const current = grouped.get(record.source);
    if (!current || record.createdAt > current.indexedAt) {
      grouped.set(record.source, { source: record.source, chunks: (current?.chunks ?? 0) + 1, indexedAt: record.createdAt });
    } else current.chunks += 1;
  }
  return [...grouped.values()];
}

export const deleteIndexedDocument = deleteRecordsBySource;
