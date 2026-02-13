// lib/certificates/pdf.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type CertInput = {
  certificateNo: string;
  donorName: string;
  donorEmail: string;
  type: string; // donation | foodsupport | medicalaid | clothing
  amountText: string; // "50000 MMK" OR "rice x7, oil x2"
  cause?: string;
  issuedAtISO: string;
  transactionId?: string;
};

async function fetchBytes(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch signature image");
  return new Uint8Array(await res.arrayBuffer());
}

export async function generateCertificatePdf(input: CertInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([842, 595]); // A4 landscape-ish (you can change)
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // inside generateCertificatePdf:
const sigUrl = process.env.CERT_SIGNATURE_URL; // Cloudinary PNG
if (sigUrl) {
  const sigBytes = await fetchBytes(sigUrl);
  const sigImg = await pdfDoc.embedPng(sigBytes);
  const sigDims = sigImg.scale(0.35);

  page.drawImage(sigImg, {
    x: width - 240,
    y: 85,
    width: sigDims.width,
    height: sigDims.height,
  });
}

  // Background frame
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 2,
  });

  // Header
  page.drawText("Fair Sharing", {
    x: 60,
    y: height - 90,
    size: 28,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText("Certificate of Donation", {
    x: 60,
    y: height - 130,
    size: 18,
    font: font,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Body text
  const bodyTop = height - 190;

  page.drawText("This certifies that", {
    x: 60,
    y: bodyTop,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(input.donorName || "Donor", {
    x: 60,
    y: bodyTop - 28,
    size: 22,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.05),
  });

  page.drawText(`Email: ${input.donorEmail || "-"}`, {
    x: 60,
    y: bodyTop - 52,
    size: 12,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawText("has contributed the following:", {
    x: 60,
    y: bodyTop - 80,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Details box
  const boxY = bodyTop - 200;
  page.drawRectangle({
    x: 60,
    y: boxY,
    width: width - 120,
    height: 110,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });

  const line = (label: string, value: string, y: number) => {
    page.drawText(label, { x: 80, y, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(value || "-", { x: 220, y, size: 12, font, color: rgb(0.15, 0.15, 0.15) });
  };

  line("Certificate No:", input.certificateNo, boxY + 78);
  line("Type:", input.type, boxY + 58);
  line("Amount / Items:", input.amountText, boxY + 38);
  line("Cause:", input.cause ? String(input.cause) : "-", boxY + 18);

  // Footer
  const issuedAt = new Date(input.issuedAtISO);
  page.drawText(`Issued: ${isNaN(issuedAt.getTime()) ? input.issuedAtISO : issuedAt.toLocaleString()}`, {
    x: 60,
    y: 60,
    size: 11,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  page.drawText("Authorized Signature: ____________________", {
    x: width - 360,
    y: 60,
    size: 11,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  return pdfDoc.save();
}
