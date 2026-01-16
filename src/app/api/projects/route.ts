import { createProjectWithRootNode, listProjects } from "@/server/db/projects";
import { jsonCreated, jsonError, jsonOk, readJson } from "@/server/http";
import { createProjectSchema } from "@/server/api/schemas";

export async function GET() {
  try {
    const projects = listProjects();
    return jsonOk({ projects });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Unknown error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const input = createProjectSchema.parse(body);

    const result = createProjectWithRootNode(input);
    return jsonCreated(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not") ? 404 : 400;
    return jsonError(message, status);
  }
}
