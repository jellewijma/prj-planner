"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeTypes,
  type NodeMouseHandler,
  type NodeDragHandler,
  applyEdgeChanges,
  applyNodeChanges,
} from "reactflow";

import "reactflow/dist/style.css";

import { toast } from "sonner";

import type { ProjectGraph } from "@/server/db/projects";
import type { NodeRow, RequirementRow } from "@/server/db/types";

import { CardNode } from "@/components/flow/CardNode";
import { FlowActionsProvider } from "@/components/flow/FlowActionsContext";
import { ProjectToolbar } from "@/components/projects/ProjectToolbar";
import { NodeSheet } from "@/components/projects/NodeSheet";

const nodeTypes: NodeTypes = {
  card: CardNode,
};

type UiNodeData = {
  title: string;
  requirements: RequirementRow[];
};

function groupRequirementsByNode(requirements: RequirementRow[]) {
  const map = new Map<string, RequirementRow[]>();
  for (const req of requirements) {
    const list = map.get(req.node_id);
    if (list) list.push(req);
    else map.set(req.node_id, [req]);
  }
  return map;
}

function toFlowNode(node: NodeRow, requirements: RequirementRow[]): Node<UiNodeData> {
  return {
    id: node.id,
    type: "card",
    position: { x: node.x, y: node.y },
    data: {
      title: node.title,
      requirements,
    },
  };
}

type NodeApi = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  x: number;
  y: number;
};

type RequirementApi = {
  id: string;
  node_id: string;
  text: string;
  done: number;
  sort_order: number;
};

export function ProjectDiagram({ initialGraph }: { initialGraph: ProjectGraph }) {
  const projectIdRef = useRef(initialGraph.project.id);

  const requirementsByNode = useMemo(
    () => groupRequirementsByNode(initialGraph.requirements),
    [initialGraph.requirements],
  );

  const [nodes, setNodes] = useState<Node<UiNodeData>[]>(
    initialGraph.nodes.map((n) => toFlowNode(n, requirementsByNode.get(n.id) ?? [])),
  );
  const [edges, setEdges] = useState<Edge[]>(
    initialGraph.edges.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      type: "default",
    })),
  );

  const fetchGraph = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectIdRef.current}`);
    if (!res.ok) throw new Error("Failed to load project");
    const graph = (await res.json()) as ProjectGraph;

    const reqByNode = groupRequirementsByNode(graph.requirements);

    setNodes(graph.nodes.map((n) => toFlowNode(n, reqByNode.get(n.id) ?? [])));
    setEdges(
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        type: "default",
      })),
    );
  }, []);

  const addChildForNode = useCallback(
    async (nodeId: string, opts: { side: "top" | "bottom"; x: number; y: number }) => {
      try {
        const offsetY = 160;

        const res = await fetch("/api/nodes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            projectId: projectIdRef.current,
            parentNodeId: nodeId,
            x: opts.x,
            y: opts.side === "top" ? opts.y - offsetY : opts.y + offsetY,
          }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(err?.error ?? "Failed to create node");
        }

        await fetchGraph();
        toast.success("Card added");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [fetchGraph],
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId],
  );

  const [selectedNodeMeta, setSelectedNodeMeta] = useState<NodeApi | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<RequirementApi[]>([]);

  const onNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges>[0]) => setNodes((prev) => applyNodeChanges(changes, prev)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges>[0]) => setEdges((prev) => applyEdgeChanges(changes, prev)),
    [],
  );

  const loadSelectedDetails = useCallback(
    async (nodeId: string) => {
      // The graph endpoint contains node+requirements; reuse it.
      const res = await fetch(`/api/projects/${projectIdRef.current}`);
      if (!res.ok) throw new Error("Failed to load node");
      const graph = (await res.json()) as ProjectGraph;

      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) throw new Error("Node not found");

      const requirements = graph.requirements.filter((r) => r.node_id === nodeId);

      setSelectedNodeMeta({
        id: node.id,
        project_id: node.project_id,
        title: node.title,
        description: node.description,
        x: node.x,
        y: node.y,
      });
      setSelectedRequirements(
        requirements.map((r) => ({
          id: r.id,
          node_id: r.node_id,
          text: r.text,
          done: r.done,
          sort_order: r.sort_order,
        })),
      );
    },
    [],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  const onNodeDragStop: NodeDragHandler = useCallback(async (_evt, node) => {
    try {
      await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ x: node.position.x, y: node.position.y }),
      });
    } catch {
      // ignore; toast would get noisy while dragging
    }
  }, []);

  const addChildFromToolbar = useCallback(() => {
    if (!selectedNodeId) {
      toast.error("Click a card (then use Add Child)");
      return;
    }

    const node = nodes.find((n) => n.id === selectedNodeId);
    const x = node?.position.x ?? 0;
    const y = node?.position.y ?? 0;

    void addChildForNode(selectedNodeId, { side: "bottom", x, y });
  }, [addChildForNode, nodes, selectedNodeId]);

  const exportJson = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectIdRef.current}/export`);
      if (!res.ok) throw new Error("Export failed");

      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${initialGraph.project.title || "project"}.json`;
      a.click();

      URL.revokeObjectURL(url);
      toast.success("Exported JSON");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    }
  }, [initialGraph.project.title]);

  const importJson = useCallback(async (json: unknown) => {
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(json),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Import failed");
      }

      const data = (await res.json()) as { project: { id: string } };
      toast.success("Imported into new project");
      window.location.href = `/projects/${data.project.id}`;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    if (!selectedNodeId) {
      setSelectedNodeMeta(null);
      setSelectedRequirements([]);
      return;
    }

    void loadSelectedDetails(selectedNodeId).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    });
  }, [loadSelectedDetails, selectedNodeId]);

  async function refreshSelected() {
    if (selectedNodeId) await loadSelectedDetails(selectedNodeId);
    await fetchGraph();
  }

  const deleteSelectedNode = useCallback(async () => {
    if (!selectedNodeId) return;

    if (!confirm("Delete this card and all its edges/requirements?")) return;

    try {
      const res = await fetch(`/api/nodes/${selectedNodeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setSelectedNodeId(null);
      await fetchGraph();
      toast.success("Card deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
    }
  }, [fetchGraph, selectedNodeId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedNodeId(null);
      if (e.key === "Delete") void deleteSelectedNode();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelectedNode]);

  return (
    <FlowActionsProvider value={{ addChild: addChildForNode }}>
      <div className="h-screen w-full">
        <ProjectToolbar
        projectTitle={initialGraph.project.title}
        onAddChild={addChildFromToolbar}
        onExport={exportJson}
        onImport={importJson}
      />

      <div className="h-[calc(100vh-56px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

        <NodeSheet
          open={!!selectedNode}
          onOpenChange={(open) => setSelectedNodeId(open ? selectedNodeId : null)}
          node={selectedNodeMeta}
          requirements={selectedRequirements}
          onRefresh={() => void refreshSelected()}
          onDelete={() => void deleteSelectedNode()}
        />
      </div>
    </FlowActionsProvider>
  );
}
