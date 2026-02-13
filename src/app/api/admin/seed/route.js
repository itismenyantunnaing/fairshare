import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

/**
 * DELETE /api/admin/seed
 * Deletes ALL admin accounts so the seed can be re-run.
 * Only works in development mode.
 */
export async function DELETE() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Production တွင် ဤလုပ်ဆောင်ချက်ကို ပိတ်ထားပါသည်။" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");
    await db.collection("admins").deleteMany({});

    return NextResponse.json({
      success: true,
      message: "စီမံခန့်ခွဲသူ အကောင့်အားလုံး ဖျက်ပြီးပါပြီ။ Seed ပြန်လည်လုပ်နိုင်ပါပြီ။",
    });
  } catch (e) {
    console.error("Admin reset error:", e);
    return NextResponse.json(
      { success: false, error: "ဖျက်ခြင်း မအောင်မြင်ပါ။" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/seed
 * Creates the initial super admin account.
 * Only works if no admins exist yet (first-time setup).
 *
 * Body: { email, password, name }
 */
export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("FairShare");

    // Check if any admin already exists
    const existingAdmin = await db.collection("admins").findOne({});
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "စီမံခန့်ခွဲသူ အကောင့် ရှိပြီးသားဖြစ်ပါသည်။ Seed ထပ်မံလုပ်၍ မရပါ။" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "အမည်၊ အီးမေးလ်နှင့် စကားဝှက် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "စကားဝှက် အနည်းဆုံး ၆ လုံး ရှိရမည်။" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await db.collection("admins").insertOne({
      name,
      email,
      password: hashedPassword,
      role: "super_admin",
      createdAt: new Date(),
      createdBy: null, // self-created (seed)
    });

    return NextResponse.json({
      success: true,
      message: "Super Admin အကောင့် အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Admin seed error:", e);
    return NextResponse.json(
      { success: false, error: "Super Admin ဖန်တီးခြင်း မအောင်မြင်ပါ။" },
      { status: 500 }
    );
  }
}
