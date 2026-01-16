import { nowIso } from "../clock";
import { newId } from "../ids";
import { getDb } from "./client";
import { createEdge } from "./edges";
import type { NodeRow } from "./types";

export type UpdateNodeInput = {
  id: string;
  title?: string;
  description?: string;
  x?: number;
  y?: number;
};

export function updateNode(input: UpdateNodeInput): NodeRow {
  const db = getDb();
  const now = nowIso();

  const existing = db
    .prepare("SELECT id, project_id, title, description, x, y, created_at, updated_at FROM nodes WHERE id = ?")
    .get(input.id) as NodeRow | undefined;

  if (!existing) throw new Error("Node not found");

  const next: NodeRow = {
    ...existing,
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    x: input.x ?? existing.x,
    y: input.y ?? existing.y,
    updated_at: now,
  };

  db.prepare("UPDATE nodes SET title = ?, description = ?, x = ?, y = ?, updated_at = ? WHERE id = ?").run(
    next.title,
    next.description,
    next.x,
    next.y,
    next.updated_at,
    next.id,
  );

  return next;
}

export type CreateNodeInput = {
  projectId: string;
  parentNodeId?: string;
  title?: string;
  description?: string;
  x?: number;
  y?: number;
};

export type CreateNodeResult = {
  node: NodeRow;
  edge?: { id: string };
};

export function createNode(input: CreateNodeInput): CreateNodeResult {
  const db = getDb();
  const now = nowIso();

  let x = input.x ?? 0;
  let y = input.y ?? 0;

  if (input.parentNodeId) {
    const parent = db
      .prepare("SELECT id, project_id, x, y FROM nodes WHERE id = ?")
      .get(input.parentNodeId) as { id: string; project_id: string; x: number; y: number } | undefined;

    if (!parent) throw new Error("Parent node not found");
    if (parent.project_id !== input.projectId) throw new Error("Parent node does not belong to project");

    x = input.x ?? parent.x + 240;
    y = input.y ?? parent.y + 120;
  }

  const node: NodeRow = {
    id: newId(),
    project_id: input.projectId,
    title: input.title ?? "New card",
    description: input.description ?? "",
    x,
    y,
    created_at: now,
    updated_at: now,
  };

  const insertNode = db.prepare(
    "INSERT INTO nodes (id, project_id, title, description, x, y, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );

  const tx = db.transaction(() => {
    insertNode.run(node.id, node.project_id, node.title, node.description, node.x, node.y, node.created_at, node.updated_at);
  });

  tx();

  if (input.parentNodeId) {
    const edge = createEdge({
      projectId: input.projectId,
      sourceNodeId: input.parentNodeId,
      targetNodeId: node.id,
      type: "parent",
    });

    return { node, edge: { id: edge.id } };
  }

  return { node };
}

export function deleteNodeCascade(nodeId: string) {
  const db = getDb();
  db.prepare("DELETE FROM nodes WHERE id = ?").run(nodeId);
}
