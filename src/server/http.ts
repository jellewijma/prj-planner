export function jsonOk(data: unknown, init?: ResponseInit) {
  return Response.json(data, { status: 200, ...init });
}

export function jsonCreated(data: unknown, init?: ResponseInit) {
  return Response.json(data, { status: 201, ...init });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function readJson<T>(req: Request): Promise<T> {
  return req.json() as Promise<T>;
}
