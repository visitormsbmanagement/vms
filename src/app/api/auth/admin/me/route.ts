import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const adminInfo = getAdminFromRequest(request);

    if (!adminInfo) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminInfo.adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error("Admin me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
