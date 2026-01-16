import { nowIso } from "../clock";
import { newId } from "../ids";
import type { ImportProject } from "../api/schemas";
import { getDb } from "./client";
import type { EdgeRow, NodeRow, ProjectRow, RequirementRow } from "./types";

export type ExportProject = {
  schemaVersion: 1;
  project: {
    title: string;
    description?: string;
  };
  nodes: Array<{
    id: string;
    title: string;
    description?: string;
    x?: number;
    y?: number;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    type?: string;
  }>;
  requirements: Array<{
    id: string;
    nodeId: string;
    text: string;
    done?: boolean;
    sortOrder?: number;
  }>;
};

export function exportProject(projectId: string): ExportProject {
  const db = getDb();

  const project = db
    .prepare("SELECT id, title, description, created_at, updated_at FROM projects WHERE id = ?")
    .get(projectId) as ProjectRow | undefined;

  if (!project) throw new Error("Project not found");

  const nodes = db
    .prepare("SELECT id, project_id, title, description, x, y, created_at, updated_at FROM nodes WHERE project_id = ?")
    .all(projectId) as NodeRow[];

  const edges = db
    .prepare(
      "SELECT id, project_id, source_node_id, target_node_id, type, created_at FROM edges WHERE project_id = ?",
    )
    .all(projectId) as EdgeRow[];

  const requirements = db
    .prepare(
      "SELECT r.id, r.node_id, r.text, r.done, r.sort_order, r.created_at, r.updated_at FROM requirements r JOIN nodes n ON n.id = r.node_id WHERE n.project_id = ?",
    )
    .all(projectId) as RequirementRow[];

  return {
    schemaVersion: 1,
    project: {
      title: project.title,
      description: project.description || undefined,
    },
    nodes: nodes.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description || undefined,
      x: n.x,
      y: n.y,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sourceNodeId: e.source_node_id,
      targetNodeId: e.target_node_id,
      type: e.type !== "parent" ? e.type : undefined,
    })),
    requirements: requirements.map((r) => ({
      id: r.id,
      nodeId: r.node_id,
      text: r.text,
      done: !!r.done,
      sortOrder: r.sort_order,
    })),
  };
}

export type ImportResult = {
  project: ProjectRow;
  nodesCount: number;
};

export function importProject(input: ImportProject): ImportResult {
  const db = getDb();
  const now = nowIso();

  if (input.nodes.length === 0) throw new Error("Import must include at least one node");

  const nodeIds = new Set(input.nodes.map((n) => n.id));
  for (const edge of input.edges) {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      throw new Error("Import contains edges referencing missing nodes");
    }
  }
  for (const req of input.requirements) {
    if (!nodeIds.has(req.nodeId)) {
      throw new Error("Import contains requirements referencing missing nodes");
    }
  }

  const project: ProjectRow = {
    id: newId(),
    title: input.project.title,
    description: input.project.description ?? "",
    created_at: now,
    updated_at: now,
  };

  const nodeIdMap = new Map<string, string>();

  const insertProject = db.prepare(
    "INSERT INTO projects (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  );
  const insertNode = db.prepare(
    "INSERT INTO nodes (id, project_id, title, description, x, y, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insertEdge = db.prepare(
    "INSERT INTO edges (id, project_id, source_node_id, target_node_id, type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const insertReq = db.prepare(
    "INSERT INTO requirements (id, node_id, text, done, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  const tx = db.transaction(() => {
    insertProject.run(project.id, project.title, project.description, project.created_at, project.updated_at);

    for (const node of input.nodes) {
      const newNodeId = newId();
      nodeIdMap.set(node.id, newNodeId);

      insertNode.run(
        newNodeId,
        project.id,
        node.title,
        node.description ?? "",
        node.x ?? 0,
        node.y ?? 0,
        now,
        now,
      );
    }

    for (const edge of input.edges) {
      const sourceId = nodeIdMap.get(edge.sourceNodeId);
      const targetId = nodeIdMap.get(edge.targetNodeId);
      if (!sourceId || !targetId) throw new Error("Internal import error: missing node remap");

      insertEdge.run(newId(), project.id, sourceId, targetId, edge.type ?? "parent", now);
    }

    for (const req of input.requirements) {
      const nodeId = nodeIdMap.get(req.nodeId);
      if (!nodeId) throw new Error("Internal import error: missing node remap");

      insertReq.run(
        newId(),
        nodeId,
        req.text,
        req.done ? 1 : 0,
        req.sortOrder ?? 0,
        now,
        now,
      );
    }
  });

  tx();

  return { project, nodesCount: input.nodes.length };
}
