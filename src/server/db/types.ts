export type ProjectRow = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type NodeRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  created_at: string;
  updated_at: string;
};

export type EdgeRow = {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  type: string;
  created_at: string;
};

export type RequirementRow = {
  id: string;
  node_id: string;
  text: string;
  done: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
