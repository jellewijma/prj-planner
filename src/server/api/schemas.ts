import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).optional(),
});

export const updateNodeSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(10_000).optional(),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

export const createNodeSchema = z.object({
  projectId: z.string().min(1),
  parentNodeId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).optional(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
});

export const createEdgeSchema = z.object({
  projectId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  type: z.string().min(1).max(50).optional(),
});

export const createRequirementSchema = z.object({
  nodeId: z.string().min(1),
  text: z.string().min(1).max(500),
});

export const updateRequirementSchema = z
  .object({
    text: z.string().min(1).max(500).optional(),
    done: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

export const importProjectSchema = z.object({
  schemaVersion: z.literal(1),
  project: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(10_000).optional(),
  }),
  nodes: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1).max(200),
      description: z.string().max(10_000).optional(),
      x: z.number().finite().optional(),
      y: z.number().finite().optional(),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string().min(1),
      sourceNodeId: z.string().min(1),
      targetNodeId: z.string().min(1),
      type: z.string().min(1).max(50).optional(),
    }),
  ),
  requirements: z.array(
    z.object({
      id: z.string().min(1),
      nodeId: z.string().min(1),
      text: z.string().min(1).max(500),
      done: z.boolean().optional(),
      sortOrder: z.number().int().nonnegative().optional(),
    }),
  ),
});

export type ImportProject = z.infer<typeof importProjectSchema>;
