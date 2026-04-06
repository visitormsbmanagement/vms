import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const visitor = await prisma.visitorProfile.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!visitor) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    const mapped = {
      id: visitor.id,
      fullName: [visitor.title, visitor.firstName, visitor.middleName, visitor.lastName]
        .filter(Boolean)
        .join(" "),
      title: visitor.title,
      email: visitor.email,
      mobile: visitor.mobile,
      address: [visitor.streetAddress, visitor.addressLine2]
        .filter(Boolean)
        .join(", ") || null,
      photo: visitor.photoUrl,
      memberSince: visitor.createdAt,
      lastLoginDate: visitor.lastLoginAt,
      visits: visitor.visits.map((v) => ({
        id: v.id,
        purpose: v.purposeOfVisit,
        company: v.companyToVisit,
        personToVisit: v.personToVisit,
        tagNumber: v.visitorTagNumber,
        idProof: [v.idProofType, v.idProofNumber].filter(Boolean).join(" - ") || null,
        idProofPhoto: v.idProofPhotoUrl || null,
        gadgetInfo: v.carryingPersonalGadget
          ? [v.gadgetType, v.gadgetBrandModel, v.gadgetIdentifier].filter(Boolean).join(" / ")
          : null,
        entryTime: v.entryTime,
        checkInTime: v.checkInTime,
        checkOutTime: v.checkOutTime,
        status: v.status,
      })),
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Get visitor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
