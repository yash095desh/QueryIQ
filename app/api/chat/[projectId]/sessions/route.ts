import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import { listSessions } from "../utils/dbHelpers";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await ctx.params;
    const user = await getAuthenticatedUser();

    const sessions = await listSessions(projectId, user.id);

    return Response.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return Response.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}