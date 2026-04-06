import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalVisitors, todayCheckIns, activeVisits, recentVisits, visitCounts] =
      await Promise.all([
        prisma.visitorProfile.count(),

        prisma.visitRecord.count({
          where: {
            entryTime: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        }),

        prisma.visitRecord.count({
          where: { status: "checked-in" },
        }),

        prisma.visitRecord.findMany({
          take: 10,
          orderBy: { entryTime: "desc" },
          include: {
            visitorProfile: true,
          },
        }),

        prisma.visitRecord.groupBy({
          by: ["visitorProfileId"],
          _count: { id: true },
          having: {
            id: { _count: { gt: 1 } },
          },
        }),
      ]);

    const repeatVisitors = visitCounts.length;

    const mappedVisits = recentVisits.map((v) => ({
      id: v.id,
      visitorName: `${v.visitorProfile.firstName} ${v.visitorProfile.lastName}`.trim(),
      company: v.companyToVisit,
      personToVisit: v.personToVisit,
      purpose: v.purposeOfVisit,
      entryTime: v.entryTime,
      status: v.status,
    }));

    return NextResponse.json({
      totalVisitors,
      todayCheckIns,
      activeVisits,
      repeatVisitors,
      recentVisits: mappedVisits,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
