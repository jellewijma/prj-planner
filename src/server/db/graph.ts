import { nowIso } from "../clock";
import { getDb } from "./client";
import type { EdgeRow, NodeRow } from "./types";

export function getNode(nodeId: string): NodeRow {
  const db = getDb();
  const node = db
    .prepare("SELECT id, project_id, title, description, x, y, created_at, updated_at FROM nodes WHERE id = ?")
    .get(nodeId) as NodeRow | undefined;
  if (!node) throw new Error("Node not found");
  return node;
}

export function createChildNode(parentNodeId: string): { node: NodeRow; edge: EdgeRow } {
  const db = getDb();
  const now = nowIso();

  const parent = getNode(parentNodeId);

  const node: NodeRow = {
    id: crypto.randomUUID(),
    project_id: parent.project_id,
    title: "New card",
    description: "",
    x: parent.x + 240,
    y: parent.y + 120,
    created_at: now,
    updated_at: now,
  };

  const edge: EdgeRow = {
    id: crypto.randomUUID(),
    project_id: parent.project_id,
    source_node_id: parent.id,
    target_node_id: node.id,
    type: "parent",
    created_at: now,
  };

  const insertNode = db.prepare(
    "INSERT INTO nodes (id, project_id, title, description, x, y, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insertEdge = db.prepare(
    "INSERT INTO edges (id, project_id, source_node_id, target_node_id, type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );

  const tx = db.transaction(() => {
    insertNode.run(node.id, node.project_id, node.title, node.description, node.x, node.y, node.created_at, node.updated_at);
    insertEdge.run(edge.id, edge.project_id, edge.source_node_id, edge.target_node_id, edge.type, edge.created_at);
  });

  tx();

  return { node, edge };
}

export function updateNodePosition(nodeId: string, x: number, y: number): NodeRow {
  const db = getDb();
  const now = nowIso();

  db.prepare("UPDATE nodes SET x = ?, y = ?, updated_at = ? WHERE id = ?").run(x, y, now, nodeId);

  return getNode(nodeId);
}
