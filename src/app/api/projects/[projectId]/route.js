import { connection } from "next/server";
import { WORKSPACE_SEED } from "@/data/workspace-seed";

// Mocked project endpoint: returns the demo project after a short delay so the
// workspace has a real initial-loading state. Local edits are kept client-side.

export async function GET(request, { params }) {
  await connection();
  const { projectId } = await params;
  await new Promise((resolve) => setTimeout(resolve, 450));

  if (projectId !== WORKSPACE_SEED.id) {
    return Response.json({ error: { code: "not_found", message: "Project not found." } }, { status: 404 });
  }
  return Response.json(WORKSPACE_SEED);
}
