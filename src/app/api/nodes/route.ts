import { createNode } from "@/server/db/nodes";
import { jsonCreated, jsonError, readJson } from "@/server/http";
import { createNodeSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const input = createNodeSchema.parse(body);
    const result = createNode(input);
    return jsonCreated(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(message, 400);
  }
}
