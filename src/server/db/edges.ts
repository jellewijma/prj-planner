import { nowIso } from "../clock";
import { newId } from "../ids";
import { getDb } from "./client";
import type { EdgeRow } from "./types";

export type CreateEdgeInput = {
  projectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type?: string;
};

export function createEdge(input: CreateEdgeInput): EdgeRow {
  const db = getDb();
  const edge: EdgeRow = {
    id: newId(),
    project_id: input.projectId,
    source_node_id: input.sourceNodeId,
    target_node_id: input.targetNodeId,
    type: input.type ?? "parent",
    created_at: nowIso(),
  };

  db.prepare(
    "INSERT INTO edges (id, project_id, source_node_id, target_node_id, type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(edge.id, edge.project_id, edge.source_node_id, edge.target_node_id, edge.type, edge.created_at);

  return edge;
}

export function deleteEdge(edgeId: string) {
  const db = getDb();
  db.prepare("DELETE FROM edges WHERE id = ?").run(edgeId);
}
