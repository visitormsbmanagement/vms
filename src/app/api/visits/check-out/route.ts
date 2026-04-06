import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitId } = body;

    if (!visitId) {
      return NextResponse.json(
        { error: "visitId is required" },
        { status: 400 }
      );
    }

    const visit = await prisma.visitRecord.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Visit not found" },
        { status: 404 }
      );
    }

    const updatedVisit = await prisma.visitRecord.update({
      where: { id: visitId },
      data: {
        status: "checked-out",
        checkOutTime: new Date(),
      },
    });

    return NextResponse.json({ success: true, visit: updatedVisit });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
