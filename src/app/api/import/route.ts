import { importProjectSchema } from "@/server/api/schemas";
import { importProject } from "@/server/db/importExport";
import { jsonCreated, jsonError, readJson } from "@/server/http";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const input = importProjectSchema.parse(body);
    const result = importProject(input);
    return jsonCreated(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(message, 400);
  }
}
