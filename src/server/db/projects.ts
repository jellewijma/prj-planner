import { nowIso } from "../clock";
import { newId } from "../ids";
import { getDb } from "./client";
import type { EdgeRow, NodeRow, ProjectRow, RequirementRow } from "./types";

export type CreateProjectInput = {
  title: string;
  description?: string;
};

export type CreateProjectResult = {
  project: ProjectRow;
  rootNode: NodeRow;
};

export function createProjectWithRootNode(input: CreateProjectInput): CreateProjectResult {
  const db = getDb();
  const now = nowIso();

  const project: ProjectRow = {
    id: newId(),
    title: input.title,
    description: input.description ?? "",
    created_at: now,
    updated_at: now,
  };

  const rootNode: NodeRow = {
    id: newId(),
    project_id: project.id,
    title: project.title,
    description: project.description,
    x: 0,
    y: 0,
    created_at: now,
    updated_at: now,
  };

  const insertProject = db.prepare(
    "INSERT INTO projects (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  );
  const insertNode = db.prepare(
    "INSERT INTO nodes (id, project_id, title, description, x, y, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );

  const tx = db.transaction(() => {
    insertProject.run(project.id, project.title, project.description, project.created_at, project.updated_at);
    insertNode.run(
      rootNode.id,
      rootNode.project_id,
      rootNode.title,
      rootNode.description,
      rootNode.x,
      rootNode.y,
      rootNode.created_at,
      rootNode.updated_at,
    );
  });

  tx();

  return { project, rootNode };
}

export type ProjectGraph = {
  project: ProjectRow;
  nodes: NodeRow[];
  edges: EdgeRow[];
  requirements: RequirementRow[];
};

export function getProjectGraph(projectId: string): ProjectGraph {
  const db = getDb();

  const project = db
    .prepare("SELECT id, title, description, created_at, updated_at FROM projects WHERE id = ?")
    .get(projectId) as ProjectRow | undefined;

  if (!project) throw new Error("Project not found");

  const nodes = db
    .prepare(
      "SELECT id, project_id, title, description, x, y, created_at, updated_at FROM nodes WHERE project_id = ? ORDER BY created_at ASC",
    )
    .all(projectId) as NodeRow[];

  const edges = db
    .prepare(
      "SELECT id, project_id, source_node_id, target_node_id, type, created_at FROM edges WHERE project_id = ? ORDER BY created_at ASC",
    )
    .all(projectId) as EdgeRow[];

  const requirements = db
    .prepare(
      "SELECT r.id, r.node_id, r.text, r.done, r.sort_order, r.created_at, r.updated_at FROM requirements r JOIN nodes n ON n.id = r.node_id WHERE n.project_id = ? ORDER BY r.node_id ASC, r.sort_order ASC",
    )
    .all(projectId) as RequirementRow[];

  return { project, nodes, edges, requirements };
}

export type ListProjectsRow = Pick<ProjectRow, "id" | "title" | "description" | "created_at" | "updated_at"> & {
  nodes_count: number;
};

export function listProjects(): ListProjectsRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT p.id, p.title, p.description, p.created_at, p.updated_at, (SELECT COUNT(1) FROM nodes n WHERE n.project_id = p.id) AS nodes_count FROM projects p ORDER BY p.updated_at DESC",
    )
    .all() as ListProjectsRow[];
  return rows;
}
