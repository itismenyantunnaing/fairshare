import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";

/**
 * GET /api/admin/manage
 * List all admin accounts. Super admin only.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const admins = await db
      .collection("admins")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, admins });
  } catch (e) {
    console.error("Error fetching admins:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/manage
 * Create a new admin account. Super admin only.
 *
 * Body: { name, email, password, role }
 * role must be "admin" (super_admin cannot be created via this endpoint)
 */
export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။ Super Admin သာ စီမံခန့်ခွဲသူ ဖန်တီးနိုင်ပါသည်။" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");
    const body = await req.json();

    const { name, email, password } = body;

    if (!name || !email || !password) {
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

    // Check if email already exists
    const existing = await db.collection("admins").findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "ဤအီးမေးလ်ဖြင့် စီမံခန့်ခွဲသူ အကောင့် ရှိပြီးသားဖြစ်ပါသည်။" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await db.collection("admins").insertOne({
      name,
      email,
      password: hashedPassword,
      role: "admin", // only regular admin can be created here
      createdAt: new Date(),
      createdBy: session.id,
    });

    return NextResponse.json({
      success: true,
      message: "စီမံခန့်ခွဲသူ အကောင့် အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Error creating admin:", e);
    return NextResponse.json(
      { success: false, error: "စီမံခန့်ခွဲသူ ဖန်တီးခြင်း မအောင်မြင်ပါ။" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/manage
 * Update admin permission (e.g. canManageDistribution). Super admin only.
 * Body: { adminId, canManageDistribution?: boolean }
 */
export async function PATCH(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { adminId, canManageDistribution } = body;

    if (!adminId || !ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { success: false, error: "စီမံခန့်ခွဲသူ ID မမှန်ကန်ပါ။" },
        { status: 400 }
      );
    }

    if (typeof canManageDistribution !== "boolean") {
      return NextResponse.json(
        { success: false, error: "canManageDistribution ဖြစ်ရမည်။" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const result = await db.collection("admins").updateOne(
      { _id: new ObjectId(adminId) },
      { $set: { canManageDistribution } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "စီမံခန့်ခွဲသူ မတွေ့ပါ။" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ခွင့်ပြုချက် ပြင်ပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Error updating admin:", e);
    return NextResponse.json(
      { success: false, error: "စီမံခန့်ခွဲသူ ပြင်ခြင်း မအောင်မြင်ပါ။" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/manage
 * Delete an admin account. Super admin only. Cannot delete yourself.
 *
 * Body: { adminId }
 */
export async function DELETE(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။ Super Admin သာ စီမံခန့်ခွဲသူ ဖျက်နိုင်ပါသည်။" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { adminId } = body;

    if (!adminId || !ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { success: false, error: "စီမံခန့်ခွဲသူ ID မမှန်ကန်ပါ။" },
        { status: 400 }
      );
    }

    // Cannot delete yourself
    if (adminId === session.id) {
      return NextResponse.json(
        { success: false, error: "မိမိကိုယ်ကို ဖျက်၍ မရပါ။" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");

    const result = await db.collection("admins").deleteOne({
      _id: new ObjectId(adminId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "စီမံခန့်ခွဲသူ မတွေ့ပါ။" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "စီမံခန့်ခွဲသူ အကောင့် ဖျက်ပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Error deleting admin:", e);
    return NextResponse.json(
      { success: false, error: "စီမံခန့်ခွဲသူ ဖျက်ခြင်း မအောင်မြင်ပါ။" },
      { status: 500 }
    );
  }
}
