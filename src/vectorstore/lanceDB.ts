import * as lancedb from "@lancedb/lancedb";
import { resolve } from "node:path";

export const DATABASE_PATH = resolve(process.cwd(), "database", "lancedb");
export const TABLE_NAME = "document_chunks";

export interface VectorRecord extends Record<string, unknown> {
  id: string;
  text: string;
  source: string;
  embedding: number[];
  createdAt: string;
}

type LanceConnection = Awaited<ReturnType<typeof lancedb.connect>>;
type LanceTable = Awaited<ReturnType<LanceConnection["openTable"]>>;

let connectionPromise: Promise<LanceConnection> | undefined;

/** Opens the same persistent local database connection for the whole process. */
export function connectToDatabase(): Promise<LanceConnection> {
  connectionPromise ??= lancedb.connect(DATABASE_PATH).catch((error: unknown) => {
    connectionPromise = undefined;
    throw new Error(`Could not connect to LanceDB at '${DATABASE_PATH}'.`, { cause: error });
  });

  return connectionPromise;
}

/** Opens the vector table, or creates it from the first batch of records. */
export async function getVectorTable(records?: VectorRecord[]): Promise<LanceTable> {
  const database = await connectToDatabase();
  const tableNames = await database.tableNames();

  if (tableNames.includes(TABLE_NAME)) {
    return database.openTable(TABLE_NAME);
  }

  if (!records || records.length === 0) {
    throw new Error("The LanceDB vector table is not initialized yet. Index a document first.");
  }

  return database.createTable(TABLE_NAME, records, { mode: "create" });
}

export async function listVectorRecords(): Promise<VectorRecord[]> {
  const table = await getVectorTable();
  return await table.query().toArray() as VectorRecord[];
}

export async function deleteRecordsBySource(source: string): Promise<void> {
  if (!source.trim()) throw new Error("A source filename is required for deletion.");
  const table = await getVectorTable();
  await table.delete(`source = '${source.replaceAll("'", "''")}'`);
}
