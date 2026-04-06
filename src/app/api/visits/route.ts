import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitSubmitSchema } from "@/lib/validations";
import { sendCheckInEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorProfileId, ...visitData } = body;

    if (!visitorProfileId) {
      return NextResponse.json(
        { error: "visitorProfileId is required" },
        { status: 400 }
      );
    }

    const parsed = visitSubmitSchema.safeParse(visitData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const visitor = await prisma.visitorProfile.findUnique({
      where: { id: visitorProfileId },
    });

    if (!visitor) {
      return NextResponse.json(
        { error: "Visitor profile not found" },
        { status: 404 }
      );
    }

    const { purposeOfVisit, companyToVisit, personToVisit, gadgetType, gadgetSerial } = parsed.data;

    const visit = await prisma.visitRecord.create({
      data: {
        visitorProfileId,
        purposeOfVisit,
        companyToVisit,
        personToVisit,
        carryingPersonalGadget: !!(gadgetType || gadgetSerial),
        gadgetType: gadgetType || null,
        gadgetIdentifier: gadgetSerial || null,
      },
    });

    try {
      await sendCheckInEmail(
        `${visitor.firstName} ${visitor.lastName}`,
        visitor.email,
        companyToVisit,
        personToVisit
      );
    } catch (emailError) {
      console.error("Check-in email failed:", emailError);
    }

    return NextResponse.json(
      { success: true, visit },
      { status: 201 }
    );
  } catch (error) {
    console.error("Visit submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
