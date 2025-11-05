import { NextResponse } from "next/server";
import { projectSchema } from "./helper/projectSchema";
import generateDbSummary from "./helper/generateDBSummary";
import createProject from "./helper/createProject";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";


export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const projectData = parsed.data;

    let dbSummary;
    try {
      dbSummary = await generateDbSummary(
        projectData.dbUrl,
        projectData.dbType
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Database introspection failed",
          details:
            "Please verify your database connection string and ensure it is accessible.",
        },
        { status: 400 }
      );
    }

    const project = await createProject(
      user.id,
      projectData,
      dbSummary.summary
    );
    console.log(` Project created successfully: ${project.id}`);

    return NextResponse.json(
      {
        message: "Project created successfully",
        project: {
          ...project,
          tablesCount: Array.isArray(dbSummary.summary)
            ? dbSummary.summary.length
            : 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(" Unexpected error in POST /api/projects:", error);
    return NextResponse.json(
      {
        error: "Unexpected server error",
        message:
          error instanceof Error ? error.message : "Please try again later",
      },
      { status: 500 }
    );
  }
}
