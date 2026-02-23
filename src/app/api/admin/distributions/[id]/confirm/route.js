import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageDistribution } from "@/lib/distributionAuth";

/**
 * POST /api/admin/distributions/[id]/confirm
 * Confirm a draft distribution: assign donations to this distribution (set distributionId).
 * Only allowed when status is "draft".
 */
export async function POST(req, { params }) {
  try {
    const session = await getSession();
    const canManage = await canManageDistribution(session);
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: "ဝင်ရောက်ခွင့် မရှိပါ။" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID ပုံစံ မမှန်ကန်ပါ။" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("FairShare");
    const distId = new ObjectId(id);

    const distribution = await db.collection("distributions").findOne({ _id: distId });
    if (!distribution) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှု မတွေ့ပါ။" },
        { status: 404 }
      );
    }

    const status = distribution.status || "confirmed";
    if (status !== "draft") {
      return NextResponse.json(
        { success: false, error: "ဤဖြန့်ဝေမှုကို အတည်ပြုပြီးပါပြီ။" },
        { status: 400 }
      );
    }

    const donationIds = distribution.donationIds || [];
    if (donationIds.length > 0) {
      const ids = donationIds
        .map((oid) => (oid && ObjectId.isValid(oid) ? new ObjectId(oid) : null))
        .filter(Boolean);
      if (ids.length > 0) {
        await db.collection("donations").updateMany(
          { _id: { $in: ids } },
          { $set: { distributionId: distId } }
        );
      }
    }

    await db.collection("distributions").updateOne(
      { _id: distId },
      { $set: { status: "confirmed", confirmedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: "ဖြန့်ဝေမှုကို အတည်ပြုပြီးပါပြီ။ အလှူများ ဤဖြန့်ဝေမှုသို့ ထည့်သွင်းပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("Confirm distribution error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
