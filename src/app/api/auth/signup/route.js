import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { verifyCertificateText } from "@/lib/vision";
import { hashPassword, signToken, createTokenCookie } from "@/lib/auth";
import { sendRegistrationEmail } from "@/lib/mailer";

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("FairShare");
    const body = await req.json();

    const {
      hostelName,
      email,
      password,
      address,
      city,
      phone,
      population,
      licenseImageUrl,
      ocrText,
      ocrConfidence,
    } = body;

    // Validate required fields
    if (!hostelName || !email || !password || !address || !city || !phone || !licenseImageUrl) {
      return NextResponse.json(
        { success: false, error: "အကွက်အားလုံး ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "စကားဝှက် အနည်းဆုံး ၆ လုံး ရှိရမည်။" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "ကျေးဇူးပြု၍ မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်သွင်းပါ။" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.collection("hostels").findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "ဤအီးမေးလ်ဖြင့် အကောင့် ရှိပြီးသားဖြစ်ပါသည်။ ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

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

    const populationData = {
      adults: Math.max(0, parseInt(population?.adults, 10) || 0),
      children: Math.max(0, parseInt(population?.children, 10) || 0),
    };

    // Save shelter record to MongoDB
    const result = await db.collection("hostels").insertOne({
      hostelName,
      email,
      password: hashedPassword,
      address,
      city,
      phone,
      population: populationData,
      licenseImageUrl,
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

    const shelterId = result.insertedId.toString();

    // Send registration confirmation email if AI verified
    if (autoCheckPassed && email) {
      try {
        await sendRegistrationEmail(email, hostelName, shelterId);
      } catch (emailError) {
        console.error("Failed to send registration email:", emailError.message);
      }
    }

    // Build response message
    let message;
    if (autoCheckPassed) {
      message =
        "လက်မှတ် အတည်ပြုခြင်း အောင်မြင်ပါသည်! သင့်ဂေဟာ မှတ်ပုံတင်ခြင်းကို စီမံခန့်ခွဲသူ အတည်ပြုရန် စောင့်ဆိုင်းနေပါသည်။";
    } else if (verificationStatus === "auto_rejected") {
      message =
        "တင်သွင်းထားသော ပုံကို တရားဝင်လက်မှတ်အဖြစ် အတည်ပြုနိုင်ခြင်း မရှိပါ။ ကျေးဇူးပြု၍ သင့်ဂေဟာ လိုင်စင်/လက်မှတ်၏ ရှင်းလင်းသော ဓာတ်ပုံကို တင်ပေးပါ။";
    } else {
      message =
        "သင့်မှတ်ပုံတင်ခြင်းကို အောင်မြင်စွာ တင်သွင်းပြီးဖြစ်ပြီး စီမံခန့်ခွဲသူ စစ်ဆေးရန် စောင့်ဆိုင်းနေပါသည်။";
    }

    // Sign JWT and set cookie (only if pending — AI passed or no OCR)
    let tokenCookie = null;
    if (verificationStatus === "pending") {
      const token = signToken({
        id: shelterId,
        email,
        hostelName,
        role: "shelter",
        status: verificationStatus,
      });
      tokenCookie = createTokenCookie(token);
    }

    const response = NextResponse.json({
      success: true,
      id: shelterId,
      verification: {
        status: verificationStatus,
        autoCheckPassed,
        message,
      },
    });

    if (tokenCookie) {
      response.headers.set("Set-Cookie", tokenCookie);
    }

    return response;
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json(
      { success: false, error: "မှတ်ပုံတင်ခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။" },
      { status: 500 }
    );
  }
}
