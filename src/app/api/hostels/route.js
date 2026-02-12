import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { verifyCertificateText } from "@/lib/vision";

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("FairShare");
    const body = await req.json();

    const { hostelName, email, address, city, phone, licenseImage, ocrText, ocrConfidence } = body;

    // Validate required fields
    if (!hostelName || !email || !address || !city || !phone || !licenseImage) {
      return NextResponse.json(
        { success: false, error: "All fields are required including email and the certificate image." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Verify certificate using OCR text from client
    let visionResult = null;
    let verificationStatus = "pending";
    let autoCheckPassed = false;

    if (ocrText) {
      visionResult = verifyCertificateText(ocrText, ocrConfidence || 0);
      autoCheckPassed = visionResult.isLegit;

      if (!autoCheckPassed) {
        verificationStatus = "auto_rejected";
      }
    }
    // If no OCR text provided, stays as "pending" for manual review

    // Save hostel record to MongoDB
    const result = await db.collection("hostels").insertOne({
      hostelName,
      email,
      address,
      city,
      phone,
      licenseImage,
      createdAt: new Date(),
      updatedAt: new Date(),
      verification: {
        status: verificationStatus,
        autoCheckPassed,
        visionAnalysis: visionResult,
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: null,
      },
    });

    // Build user-friendly response message
    let message;
    if (autoCheckPassed) {
      message =
        "Certificate verified successfully! Your hostel registration is now pending admin approval.";
    } else if (verificationStatus === "auto_rejected") {
      message =
        "The uploaded image could not be verified as a valid certificate. Please upload a clear photo of your hostel license/certificate.";
    } else {
      message =
        "Your registration has been submitted successfully and is pending admin review.";
    }

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      verification: {
        status: verificationStatus,
        autoCheckPassed,
        message,
      },
    });
  } catch (e) {
    console.error("Hostel registration error:", e);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db("FairShare");

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query = {};
    if (status) {
      query["verification.status"] = status;
    }

    const hostels = await db
      .collection("hostels")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const sanitizedHostels = hostels.map((h) => ({
      ...h,
      licenseImage: h.licenseImage ? true : false,
    }));

    return NextResponse.json({ success: true, hostels: sanitizedHostels });
  } catch (e) {
    console.error("Error fetching hostels:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
