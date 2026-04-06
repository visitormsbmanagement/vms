import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpVerifySchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;
    const allowUnregistered = body.allowUnregistered === true;

    const visitor = await prisma.visitorProfile.findUnique({
      where: { email },
    });

    // For unregistered flow, look up OTP by email field directly
    let otpRecord;
    if (visitor) {
      otpRecord = await prisma.otpCode.findFirst({
        where: {
          visitorProfileId: visitor.id,
          code,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (allowUnregistered) {
      otpRecord = await prisma.otpCode.findFirst({
        where: {
          email,
          visitorProfileId: null,
          code,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    if (visitor) {
      await prisma.visitorProfile.update({
        where: { id: visitor.id },
        data: { lastLoginAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      visitor: visitor
        ? {
            id: visitor.id,
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            email: visitor.email,
            mobile: visitor.mobile,
            photoUrl: visitor.photoUrl,
          }
        : null,
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
