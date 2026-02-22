import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/donor/profile
 * Get current donor profile. Donor only.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "donor") {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");
    const donor = await db.collection("donors").findOne(
      { _id: new ObjectId(session.id) },
      { projection: { password: 0 } }
    );

    if (!donor) {
      return NextResponse.json(
        { success: false, error: "အလှူရှင် မတွေ့ပါ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      donor: {
        ...donor,
        id: donor._id.toString(),
      },
    });
  } catch (e) {
    console.error("Donor profile GET error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/donor/profile
 * Update donor profile. Body: { name?, email?, password? }
 */
export async function PATCH(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== "donor") {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");
    const body = await req.json();
    const { name, email, password, profileImage } = body;

    const update = { updatedAt: new Date() };

    if (name !== undefined) update.name = name.trim();
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: "ကျေးဇူးပြု၍ မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်သွင်းပါ။" },
          { status: 400 }
        );
      }
      const existing = await db.collection("donors").findOne({ email: email.trim().toLowerCase() });
      if (existing && existing._id.toString() !== session.id) {
        return NextResponse.json(
          { success: false, error: "ဤအီးမေးလ်ဖြင့် အကောင့် ရှိပြီးသားဖြစ်ပါသည်။" },
          { status: 409 }
        );
      }
      update.email = email.trim().toLowerCase();
    }
    if (password !== undefined && password !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "စကားဝှက် အနည်းဆုံး ၆ လုံး ရှိရမည်။" },
          { status: 400 }
        );
      }
      update.password = await hashPassword(password);
    }
    if (profileImage !== undefined) update.profileImage = profileImage;

    await db.collection("donors").updateOne(
      { _id: new ObjectId(session.id) },
      { $set: update }
    );

    return NextResponse.json({
      success: true,
      message: "ပရိုဖိုင် သိမ်းဆည်းပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Donor profile PATCH error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
