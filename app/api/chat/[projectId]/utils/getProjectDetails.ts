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
        dbSummary: true,
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
      dbSummary: project.dbSummary ?? "No summary available",
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw new Error("Failed to fetch project details");
  }
}

export default getProjectDetails;