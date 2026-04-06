import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    response.cookies.set("admin_token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
