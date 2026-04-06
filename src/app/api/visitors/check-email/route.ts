import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const visitor = await prisma.visitorProfile.findUnique({
      where: { email },
      select: { id: true, firstName: true, lastName: true },
    });

    return NextResponse.json({
      exists: !!visitor,
      visitor: visitor
        ? { firstName: visitor.firstName, lastName: visitor.lastName }
        : null,
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
