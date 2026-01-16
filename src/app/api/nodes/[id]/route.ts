import { updateNode, deleteNodeCascade } from "@/server/db/nodes";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { updateNodeSchema } from "@/server/api/schemas";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await readJson(req);
    const input = updateNodeSchema.parse(body);

    const node = updateNode({ id, ...input });
    return jsonOk({ node });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 400;
    return jsonError(message, status);
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteNodeCascade(id);
    return jsonOk({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(message, 500);
  }
}
