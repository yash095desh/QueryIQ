import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import { deleteSession } from "../../utils/dbHelpers";
import { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await ctx.params;
    const user = await getAuthenticatedUser();

    await deleteSession(sessionId, user.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return Response.json({ error: "Failed to delete session" }, { status: 500 });
  }
}