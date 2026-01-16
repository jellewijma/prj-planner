import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createProjectWithRootNode, getProjectGraph } from "./projects";
import { closeDb, getDb } from "./client";
import { createNode, updateNode } from "./nodes";
import { createRequirement, updateRequirement } from "./requirements";
import { exportProject, importProject } from "./importExport";
import { importProjectSchema } from "../api/schemas";

function tempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-test-"));
  return path.join(dir, "test.sqlite");
}

afterEach(() => {
  closeDb();
});

describe("db layer", () => {
  it("creates project with root node", () => {
    getDb({ dbPath: tempDbPath() });

    const { project, rootNode } = createProjectWithRootNode({ title: "LightConsole" });
    expect(project.id).toBeTruthy();
    expect(rootNode.project_id).toBe(project.id);
    expect(rootNode.title).toBe("LightConsole");

    const graph = getProjectGraph(project.id);
    expect(graph.nodes.length).toBe(1);
  });

  it("updates node title and position", () => {
    getDb({ dbPath: tempDbPath() });

    const { project, rootNode } = createProjectWithRootNode({ title: "Demo" });
    const updated = updateNode({ id: rootNode.id, title: "Main", x: 10, y: 20 });
    expect(updated.title).toBe("Main");
    expect(updated.x).toBe(10);
    expect(updated.y).toBe(20);

    const graph = getProjectGraph(project.id);
    expect(graph.nodes[0]?.title).toBe("Main");
  });

  it("creates node with parent edge", () => {
    getDb({ dbPath: tempDbPath() });

    const { project, rootNode } = createProjectWithRootNode({ title: "Demo" });
    const { node, edge } = createNode({ projectId: project.id, parentNodeId: rootNode.id });
    expect(node.id).toBeTruthy();
    expect(edge?.id).toBeTruthy();

    const graph = getProjectGraph(project.id);
    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0]?.source_node_id).toBe(rootNode.id);
    expect(graph.edges[0]?.target_node_id).toBe(node.id);
  });

  it("creates and updates requirements", () => {
    getDb({ dbPath: tempDbPath() });

    const { project, rootNode } = createProjectWithRootNode({ title: "Demo" });
    const req = createRequirement({ nodeId: rootNode.id, text: "Add toolbar" });
    expect(req.done).toBe(0);

    const updated = updateRequirement({ id: req.id, done: true });
    expect(updated.done).toBe(1);

    const graph = getProjectGraph(project.id);
    expect(graph.requirements.length).toBe(1);
    expect(graph.requirements[0]?.done).toBe(1);
  });

  it("exports then imports project JSON", () => {
    getDb({ dbPath: tempDbPath() });

    const { project, rootNode } = createProjectWithRootNode({ title: "Demo" });
    createRequirement({ nodeId: rootNode.id, text: "A" });

    const exported = exportProject(project.id);
    const parsed = importProjectSchema.parse(exported);

    const result = importProject(parsed);
    const graph = getProjectGraph(result.project.id);

    expect(graph.project.title).toBe("Demo");
    expect(graph.nodes.length).toBe(exported.nodes.length);
    expect(graph.requirements.length).toBe(1);
  });

  it("rejects invalid import references", () => {
    const invalid = {
      schemaVersion: 1,
      project: { title: "Bad" },
      nodes: [{ id: "n1", title: "Root" }],
      edges: [{ id: "e1", sourceNodeId: "n1", targetNodeId: "missing" }],
      requirements: [],
    };

    const parsed = importProjectSchema.parse(invalid);

    getDb({ dbPath: tempDbPath() });
    expect(() => importProject(parsed)).toThrow(/missing nodes/);
  });
});
