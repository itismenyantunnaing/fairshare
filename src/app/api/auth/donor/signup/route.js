import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { hashPassword, signToken, createTokenCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("FairShare");
    const body = await req.json();

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "အမည်၊ အီးမေးလ်နှင့် စကားဝှက် ထည့်သွင်းပါ။" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "စကားဝှက် အနည်းဆုံး ၆ လုံး ရှိရမည်။" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "ကျေးဇူးပြု၍ မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်သွင်းပါ။" },
        { status: 400 }
      );
    }

    const emailNormalized = email.trim().toLowerCase();
    // Check if email already exists in donors
    const existingDonor = await db.collection("donors").findOne({ email: emailNormalized });
    if (existingDonor) {
      return NextResponse.json(
        { success: false, error: "ဤအီးမေးလ်ဖြင့် အကောင့် ရှိပြီးသားဖြစ်ပါသည်။ ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const result = await db.collection("donors").insertOne({
      name: name.trim(),
      email: emailNormalized,
      password: hashedPassword,
      profileImage: null,
      certificates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const donorId = result.insertedId.toString();

    const token = signToken({
      id: donorId,
      email: emailNormalized,
      name: name.trim(),
      role: "donor",
    });

    const response = NextResponse.json({
      success: true,
      id: donorId,
      name: name.trim(),
      role: "donor",
    });

    response.headers.set("Set-Cookie", createTokenCookie(token));
    return response;
  } catch (e) {
    console.error("Donor signup error:", e);
    return NextResponse.json(
      { success: false, error: "အကောင့်ဖွင့်ခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။" },
      { status: 500 }
    );
  }
}
