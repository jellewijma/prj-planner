import { deleteRequirement, updateRequirement } from "@/server/db/requirements";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { updateRequirementSchema } from "@/server/api/schemas";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await readJson(req);
    const input = updateRequirementSchema.parse(body);
    const requirement = updateRequirement({ id, ...input });
    return jsonOk({ requirement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 400;
    return jsonError(message, status);
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteRequirement(id);
    return jsonOk({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(message, 500);
  }
}
