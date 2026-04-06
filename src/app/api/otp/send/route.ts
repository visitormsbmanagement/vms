import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, mobile } = body;

    if (!email && !mobile) {
      return NextResponse.json(
        { error: "Email or mobile is required" },
        { status: 400 }
      );
    }

    const allowUnregistered = body.allowUnregistered === true;

    const visitor = await prisma.visitorProfile.findFirst({
      where: email ? { email } : { mobile },
    });

    if (!visitor && !allowUnregistered) {
      return NextResponse.json(
        { error: "No account found" },
        { status: 404 }
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        visitorProfileId: visitor?.id ?? null,
        email: email || null,
        code: otp,
        expiresAt,
      },
    });

    console.log(`OTP for ${email || mobile}: ${otp}`);

    if (email) {
      try {
        await sendOtpEmail(email, otp);
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
