import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { migrate } from "./migrate";

let cachedDb: Database.Database | undefined;

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

export type DbOptions = {
  dbPath?: string;
};

export function getDb(options: DbOptions = {}) {
  if (cachedDb) return cachedDb;

  const dbPath = options.dbPath ?? path.join(ensureDataDir(), "planner.sqlite");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  migrate(db);

  cachedDb = db;
  return db;
}

export function closeDb() {
  if (!cachedDb) return;
  cachedDb.close();
  cachedDb = undefined;
}
