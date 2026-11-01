import assert from "node:assert/strict";
import { access, rm } from "node:fs/promises";
import test from "node:test";
import { DATABASE_PATH, connectToDatabase, getVectorTable, TABLE_NAME } from "../src/vectorstore/lanceDB.js";

test("connects to the configured persistent LanceDB path", async () => {
  const firstConnection = await connectToDatabase();
  const secondConnection = await connectToDatabase();

  assert.equal(firstConnection, secondConnection);
  await access(DATABASE_PATH);
});

test("initializes the vector table from records", async () => {
  const database = await connectToDatabase();
  const existingTables = await database.tableNames();

  if (existingTables.includes(TABLE_NAME)) {
    return;
  }

  const table = await getVectorTable([
    {
      id: "test-record",
      text: "test",
      source: "test.txt",
      embedding: [0.1, 0.2],
      createdAt: new Date().toISOString(),
    },
  ]);

  assert.equal(table.name, TABLE_NAME);
  await rm(DATABASE_PATH, { recursive: true, force: true });
});
