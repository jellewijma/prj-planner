import { createRequirement } from "@/server/db/requirements";
import { jsonCreated, jsonError, readJson } from "@/server/http";
import { createRequirementSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const input = createRequirementSchema.parse(body);
    const requirement = createRequirement(input);
    return jsonCreated({ requirement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(message, 400);
  }
}
