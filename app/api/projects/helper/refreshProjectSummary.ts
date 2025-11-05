
import { decrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import generateDbSummary from "./generateDBSummary";


// ===========================
// Optional: Background Summary Refresh
// ===========================
export async function refreshProjectSummary(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { encryptedDbUrl: true, dbType: true },
    });

    if (!project) throw new Error('Project not found');

    const dbUrl = decrypt(project.encryptedDbUrl);
    const dbSummary = await generateDbSummary(dbUrl, project.dbType);

    await prisma.project.update({
      where: { id: projectId },
      data: { dbSummary: JSON.parse(JSON.stringify(dbSummary)) },
    });

    console.log(` Project summary refreshed: ${projectId}`);
    return { success: true };
  } catch (error) {
    console.error(` Failed to refresh project summary: ${projectId}`, error);
    throw error;
  }
}