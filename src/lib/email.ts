import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });

  await prisma.emailLog.create({
    data: {
      to,
      subject,
      body: html,
      status: "SENT",
    },
  });
}

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<void> {
  const subject = "Your Verification Code";
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background-color:#0069DE;padding:30px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;">MSB Docs</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;text-align:center;">
                  <h2 style="color:#1f2937;margin:0 0 16px;">Your Verification Code</h2>
                  <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
                    Use the code below to verify your identity. This code expires in 10 minutes.
                  </p>
                  <div style="background-color:#E8F1FC;border:2px dashed #0069DE;border-radius:12px;padding:24px;margin:0 auto 24px;max-width:280px;">
                    <span style="font-size:36px;font-weight:700;letter-spacing:0.3em;color:#0057B8;font-family:monospace;">${otp}</span>
                  </div>
                  <p style="color:#9ca3af;font-size:13px;margin:0;">
                    If you didn't request this code, please ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">
                    &copy; ${new Date().getFullYear()} MSB Docs. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail(email, subject, html);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    await prisma.emailLog.create({
      data: {
        to: email,
        subject,
        body: html,
        status: "FAILED",
      },
    });
  }
}

export async function sendRegistrationEmail(
  name: string,
  email: string
): Promise<void> {
  const subject = "Welcome to MSB Docs";
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background-color:#0069DE;padding:30px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;">MSB Docs</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#1f2937;margin:0 0 16px;">Welcome, ${name}!</h2>
                  <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">
                    Your registration has been completed successfully. You can now check in quickly on your future visits using your registered email or mobile number.
                  </p>
                  <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
                    Simply verify your identity with a one-time password and you'll be checked in within seconds.
                  </p>
                  <div style="background-color:#E8F1FC;border-left:4px solid #0069DE;padding:16px 20px;border-radius:4px;">
                    <p style="color:#0057B8;font-size:14px;margin:0;">
                      If you did not register, please disregard this email.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">
                    &copy; ${new Date().getFullYear()} MSB Docs. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail(email, subject, html);
  } catch (error) {
    console.error("Failed to send registration email:", error);
    await prisma.emailLog.create({
      data: {
        to: email,
        subject,
        body: html,
        status: "FAILED",
      },
    });
  }
}

export async function sendCheckInEmail(
  name: string,
  email: string,
  company: string,
  person: string
): Promise<void> {
  const subject = "Check-In Confirmation";
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background-color:#059669;padding:30px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;">Check-In Confirmed</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#1f2937;margin:0 0 16px;">Hello, ${name}!</h2>
                  <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
                    Your visit has been checked in successfully. Here are your visit details:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Company</td>
                      <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;border-bottom:1px solid #e5e7eb;">${company}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 16px;color:#6b7280;font-size:14px;">Person to Visit</td>
                      <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;">${person}</td>
                    </tr>
                  </table>
                  <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0;">
                    Please keep this email for your records. Remember to check out before leaving the premises.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">
                    &copy; ${new Date().getFullYear()} MSB Docs. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail(email, subject, html);
  } catch (error) {
    console.error("Failed to send check-in email:", error);
    await prisma.emailLog.create({
      data: {
        to: email,
        subject,
        body: html,
        status: "FAILED",
      },
    });
  }
}

export async function sendAdminNotification(
  visitorName: string,
  email: string,
  mobile: string,
  company: string,
  purposeOfVisit: string,
  personToVisit: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("ADMIN_EMAIL environment variable is not set");
    return;
  }

  const subject = `New Visitor: ${visitorName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f7;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background-color:#0069DE;padding:30px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;">New Visitor Alert</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
                    A new visitor has registered. Here are the details:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Visitor Name</td>
                      <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;border-bottom:1px solid #e5e7eb;">${visitorName}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Email</td>
                      <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;border-bottom:1px solid #e5e7eb;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Mobile</td>
                      <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;border-bottom:1px solid #e5e7eb;">${mobile}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Purpose</td>
                      <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;border-bottom:1px solid #e5e7eb;">${purposeOfVisit}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Company Visiting</td>
                      <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;border-bottom:1px solid #e5e7eb;">${company}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 16px;color:#6b7280;font-size:14px;">Person to Visit</td>
                      <td style="padding:8px 16px;color:#1f2937;font-size:14px;font-weight:600;">${personToVisit}</td>
                    </tr>
                  </table>
                  <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0;">
                    Please log in to the admin dashboard for full visitor details.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">
                    &copy; ${new Date().getFullYear()} MSB Docs. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await sendEmail(adminEmail, subject, html);
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    await prisma.emailLog.create({
      data: {
        to: adminEmail,
        subject,
        body: html,
        status: "FAILED",
      },
    });
  }
}
