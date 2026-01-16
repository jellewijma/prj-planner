import { exportProject } from "@/server/db/importExport";
import { jsonError, jsonOk } from "@/server/http";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = exportProject(id);
    return jsonOk(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return jsonError(message, status);
  }
}
