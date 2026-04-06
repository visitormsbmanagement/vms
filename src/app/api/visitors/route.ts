import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { visitorRegistrationSchema } from "@/lib/validations";
import { sendRegistrationEmail, sendAdminNotification } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const purpose = searchParams.get("purpose");
    const company = searchParams.get("company");
    const hasGadget = searchParams.get("hasGadget");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    const visitWhere: Record<string, unknown> = {};

    if (dateFrom || dateTo) {
      visitWhere.entryTime = {};
      if (dateFrom) (visitWhere.entryTime as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (visitWhere.entryTime as Record<string, unknown>).lte = new Date(dateTo);
    }

    if (purpose) {
      visitWhere.purposeOfVisit = { contains: purpose };
    }

    if (company) {
      visitWhere.companyToVisit = { contains: company };
    }

    if (hasGadget === "true") {
      visitWhere.carryingPersonalGadget = true;
    } else if (hasGadget === "false") {
      visitWhere.carryingPersonalGadget = false;
    }

    const hasVisitFilters = Object.keys(visitWhere).length > 0;

    if (hasVisitFilters) {
      where.visits = { some: visitWhere };
    }

    const [visitors, total] = await Promise.all([
      prisma.visitorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          visits: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.visitorProfile.count({ where }),
    ]);

    const mapped = visitors.map((v) => {
      const lastVisit = v.visits[0] ?? null;
      return {
        id: v.id,
        fullName: `${v.firstName} ${v.lastName}`.trim(),
        email: v.email,
        mobile: v.mobile,
        photo: v.photoUrl,
        lastVisitPurpose: lastVisit?.purposeOfVisit ?? null,
        company: lastVisit?.companyToVisit ?? null,
        personToVisit: lastVisit?.personToVisit ?? null,
        lastEntryTime: lastVisit?.entryTime ?? null,
        status: lastVisit?.status ?? null,
        visitCount: v.visits.length,
      };
    });

    return NextResponse.json({
      visitors: mapped,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get visitors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = visitorRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      mobile,
      purposeOfVisit,
      companyToVisit,
      personToVisit,
      gadgetType,
      gadgetSerial,
    } = parsed.data;

    const existingVisitor = await prisma.visitorProfile.findUnique({
      where: { email },
    });

    if (existingVisitor) {
      return NextResponse.json(
        { error: "A visitor with this email already exists" },
        { status: 409 }
      );
    }

    const visitor = await prisma.visitorProfile.create({
      data: {
        firstName,
        lastName,
        email,
        mobile,
        photoUrl: body.photoUrl || null,
        title: body.title || null,
        middleName: body.middleName || null,
        gender: body.gender || null,
        streetAddress: body.streetAddress || null,
        addressLine2: body.addressLine2 || null,
      },
    });

    const visit = await prisma.visitRecord.create({
      data: {
        visitorProfileId: visitor.id,
        purposeOfVisit,
        companyToVisit,
        personToVisit,
        carryingPersonalGadget: !!(gadgetType || gadgetSerial),
        gadgetType: gadgetType || null,
        gadgetIdentifier: gadgetSerial || null,
        idProofType: body.idProofType || null,
        idProofNumber: body.idProofNumber || null,
        idProofPhotoUrl: body.idProofPhotoUrl || null,
      },
    });

    try {
      await sendRegistrationEmail(`${firstName} ${lastName}`, email);
    } catch (emailError) {
      console.error("Registration email failed:", emailError);
    }

    try {
      await sendAdminNotification(
        `${firstName} ${lastName}`,
        email,
        mobile,
        companyToVisit,
        purposeOfVisit,
        personToVisit
      );
    } catch (notifyError) {
      console.error("Admin notification failed:", notifyError);
    }

    return NextResponse.json(
      { success: true, visitor, visit },
      { status: 201 }
    );
  } catch (error) {
    console.error("Visitor registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
