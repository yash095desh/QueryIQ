import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import { auth } from "@clerk/nextjs/server"; 
import { prisma } from "@/lib/prisma";


export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, db_url, dbType } = await req.json();
    if (!name || !db_url || !dbType)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const encryptedDbUrl = encrypt(db_url);

    const project = await prisma.project.create({
      data: {
        userId: userId,
        name,
        dbType,
        encryptedDbUrl,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projects = await prisma.project.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        dbType: true,
        createdAt: true,
      },
    });

    return NextResponse.json(projects);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
