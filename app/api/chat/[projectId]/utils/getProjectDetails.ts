import { prisma } from "@/lib/prisma";

// Helper function to get project details
async function getProjectDetails(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        encryptedDbUrl: true,
        dbType: true,
        dbSchema: true,
        dbSummary: true,
        schemaHash: true,
        lastSyncAt: true,
      },
    });

    if (!project) {
      return null;
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description ?? "",
      encryptedDbUrl: project.encryptedDbUrl,
      dbType: project.dbType,
      dbSchema: project.dbSchema,
      dbSummary: project.dbSummary ?? "No summary available",
      schemaHash: project.schemaHash,
      lastSyncAt: project.lastSyncAt,
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw new Error("Failed to fetch project details");
  }
}

export default getProjectDetails;