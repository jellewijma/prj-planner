import { nowIso } from "../clock";
import { newId } from "../ids";
import { getDb } from "./client";
import type { RequirementRow } from "./types";

export type CreateRequirementInput = {
  nodeId: string;
  text: string;
};

export function createRequirement(input: CreateRequirementInput): RequirementRow {
  const db = getDb();
  const now = nowIso();

  const row = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort FROM requirements WHERE node_id = ?")
    .get(input.nodeId) as { next_sort: number };

  const req: RequirementRow = {
    id: newId(),
    node_id: input.nodeId,
    text: input.text,
    done: 0,
    sort_order: row.next_sort,
    created_at: now,
    updated_at: now,
  };

  db.prepare(
    "INSERT INTO requirements (id, node_id, text, done, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(req.id, req.node_id, req.text, req.done, req.sort_order, req.created_at, req.updated_at);

  return req;
}

export type UpdateRequirementInput = {
  id: string;
  text?: string;
  done?: boolean;
};

export function updateRequirement(input: UpdateRequirementInput): RequirementRow {
  const db = getDb();
  const now = nowIso();

  const existing = db
    .prepare(
      "SELECT id, node_id, text, done, sort_order, created_at, updated_at FROM requirements WHERE id = ?",
    )
    .get(input.id) as RequirementRow | undefined;

  if (!existing) throw new Error("Requirement not found");

  const next: RequirementRow = {
    ...existing,
    text: input.text ?? existing.text,
    done: typeof input.done === "boolean" ? (input.done ? 1 : 0) : existing.done,
    updated_at: now,
  };

  db.prepare("UPDATE requirements SET text = ?, done = ?, updated_at = ? WHERE id = ?").run(
    next.text,
    next.done,
    next.updated_at,
    next.id,
  );

  return next;
}

export function deleteRequirement(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM requirements WHERE id = ?").run(id);
}
