import { createEdge } from "@/server/db/edges";
import { jsonCreated, jsonError, readJson } from "@/server/http";
import { createEdgeSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const input = createEdgeSchema.parse(body);
    const edge = createEdge(input);
    return jsonCreated({ edge });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(message, 400);
  }
}
