import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Retrieves the currently authenticated user from Clerk and Prisma.
 * 
 * @returns {Promise<{ id: string; clerkId: string }>} The Prisma user record with local ID.
 * @throws {Error} If the user is not authenticated or not found in the database.
 */


export async function getAuthenticatedUser() {
  
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized: Please sign in.");
  }

  
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true },
  });

  if (!user) {
    throw new Error("User not found in database. Please try again later.");
  }

  return user;
}
