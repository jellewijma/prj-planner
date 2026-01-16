import fs from "node:fs";
import path from "node:path";

import type Database from "better-sqlite3";

export function migrate(db: Database.Database) {
  const schemaPath = path.join(process.cwd(), "src", "server", "db", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  db.exec(sql);
}
