import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { verifyPassword, signToken, createTokenCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("FairShare");
    const body = await req.json();

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "အီးမေးလ်နှင့် စကားဝှက် ထည့်သွင်းပါ။" },
        { status: 400 }
      );
    }

    const emailNormalized = String(email).trim().toLowerCase();

    // --- Check admins collection first ---
    const admin = await db.collection("admins").findOne({ email: emailNormalized });

    if (admin) {
      const isValid = await verifyPassword(password, admin.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ကန်ပါ။" },
          { status: 401 }
        );
      }

      const token = signToken({
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role, // "super_admin" or "admin"
      });

      const response = NextResponse.json({
        success: true,
        id: admin._id.toString(),
        name: admin.name,
        role: admin.role,
      });

      response.headers.set("Set-Cookie", createTokenCookie(token));
      return response;
    }

    // --- Check donors collection ---
    const donor = await db.collection("donors").findOne({ email: emailNormalized });
    if (donor) {
      const isValid = await verifyPassword(password, donor.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ကန်ပါ။" },
          { status: 401 }
        );
      }
      const token = signToken({
        id: donor._id.toString(),
        email: donor.email,
        name: donor.name,
        role: "donor",
      });
      const response = NextResponse.json({
        success: true,
        id: donor._id.toString(),
        name: donor.name,
        role: "donor",
      });
      response.headers.set("Set-Cookie", createTokenCookie(token));
      return response;
    }

    // --- Check hostels (shelters) collection ---
    const shelter = await db.collection("hostels").findOne({ email: emailNormalized });

    if (!shelter) {
      return NextResponse.json(
        { success: false, error: "အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ကန်ပါ။" },
        { status: 401 }
      );
    }

    // Check if shelter has a password (old records created before auth may not)
    if (!shelter.password) {
      return NextResponse.json(
        { success: false, error: "ဤအကောင့်တွင် စကားဝှက် မရှိပါ။ ကျေးဇူးပြု၍ အကောင့်အသစ် ဖွင့်ပါ။" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, shelter.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ကန်ပါ။" },
        { status: 401 }
      );
    }

    // Check shelter status — only pending and approved can login
    const status = shelter.verification?.status;
    if (status === "auto_rejected") {
      return NextResponse.json(
        { success: false, error: "သင့်လက်မှတ်ကို AI က အတည်မပြုနိုင်ပါ။ ကျေးဇူးပြု၍ ရှင်းလင်းသော လက်မှတ်ဖြင့် ပြန်လည် မှတ်ပုံတင်ပါ။" },
        { status: 403 }
      );
    }
    if (status === "rejected") {
      return NextResponse.json(
        { success: false, error: "သင့်ခိုလှုံရာအိမ် မှတ်ပုံတင်ခြင်းကို ငြင်းပယ်ထားပါသည်။" },
        { status: 403 }
      );
    }

    // Sign JWT with shelter role
    const shelterId = shelter._id.toString();
    const token = signToken({
      id: shelterId,
      email: shelter.email,
      hostelName: shelter.hostelName,
      role: "shelter",
      status: shelter.verification?.status,
    });

    const response = NextResponse.json({
      success: true,
      id: shelterId,
      hostelName: shelter.hostelName,
      role: "shelter",
      status: shelter.verification?.status,
    });

    response.headers.set("Set-Cookie", createTokenCookie(token));
    return response;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { success: false, error: "အကောင့်ဝင်ခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။" },
      { status: 500 }
    );
  }
}
