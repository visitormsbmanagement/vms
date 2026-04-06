import { NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import { readFile } from "fs/promises";

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const visitUrl = `${appUrl}/visit`;

    const qrSize = 1024;

    // Generate QR code — black on white, high error correction for logo overlay
    const qrBuffer = await QRCode.toBuffer(visitUrl, {
      errorCorrectionLevel: "H",
      type: "png",
      width: qrSize,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Read the MSB Docs logo SVG
    const logoPath = path.join(process.cwd(), "public", "MSBDOCS-Logo-new.svg");
    const logoSvg = await readFile(logoPath);

    // Logo sizing — SVG is 770x127, very wide. Fit inside the circle.
    const logoWidth = 180;
    const logoHeight = Math.round(logoWidth * (127 / 770.3));
    const logoPng = await sharp(logoSvg)
      .resize(logoWidth, logoHeight)
      .png()
      .toBuffer();

    // Create circular white background with subtle border
    const circleDiameter = 240;
    const circleRadius = circleDiameter / 2;

    const circleSvg = Buffer.from(`
      <svg width="${circleDiameter}" height="${circleDiameter}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius}" fill="white"/>
        <circle cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius - 2}" fill="none" stroke="#e0e0e0" stroke-width="1.5"/>
      </svg>
    `);

    const circlePng = await sharp(circleSvg).png().toBuffer();

    // Composite: circle bg + logo centered on it
    const logoOverlay = await sharp(circlePng)
      .composite([
        {
          input: logoPng,
          left: Math.round((circleDiameter - logoWidth) / 2),
          top: Math.round((circleDiameter - logoHeight) / 2),
        },
      ])
      .png()
      .toBuffer();

    // Composite the logo circle onto center of QR code
    const finalBuffer = await sharp(qrBuffer)
      .composite([
        {
          input: logoOverlay,
          left: Math.round((qrSize - circleDiameter) / 2),
          top: Math.round((qrSize - circleDiameter) / 2),
        },
      ])
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(finalBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="msb-docs-visitor-qr.png"',
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
