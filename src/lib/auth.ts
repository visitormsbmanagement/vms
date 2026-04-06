import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateOtp(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

interface AdminTokenPayload {
  adminId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function signAdminToken(adminId: string, email: string): string {
  return jwt.sign({ adminId, email }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminFromRequest(
  request: Request
): { adminId: string; email: string } | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const token = cookies["admin_token"];
  if (!token) return null;

  const payload = verifyAdminToken(token);
  if (!payload) return null;

  return { adminId: payload.adminId, email: payload.email };
}
