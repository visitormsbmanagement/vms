import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const visitors = await prisma.visitorProfile.findMany({
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Name",
      "Email",
      "Mobile",
      "Last Visit Purpose",
      "Company",
      "Person to Visit",
      "Last Entry Time",
      "Status",
    ];

    const escapeCSV = (value: string): string => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = visitors.map((visitor) => {
      const lastVisit = visitor.visits[0];
      return [
        escapeCSV(`${visitor.firstName} ${visitor.lastName}`),
        escapeCSV(visitor.email),
        escapeCSV(visitor.mobile),
        escapeCSV(lastVisit?.purposeOfVisit || ""),
        escapeCSV(lastVisit?.companyToVisit || ""),
        escapeCSV(lastVisit?.personToVisit || ""),
        lastVisit?.entryTime ? new Date(lastVisit.entryTime).toISOString() : "",
        escapeCSV(lastVisit?.status || ""),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="visitors-export.csv"',
      },
    });
  } catch (error) {
    console.error("Export visitors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
