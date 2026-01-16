import { deleteEdge } from "@/server/db/edges";
import { jsonError, jsonOk } from "@/server/http";

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteEdge(id);
    return jsonOk({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(message, 500);
  }
}
