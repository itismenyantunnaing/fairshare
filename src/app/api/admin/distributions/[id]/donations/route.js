import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageDistribution } from "@/lib/distributionAuth";

/**
 * DELETE /api/admin/distributions/[id]/donations
 * Remove (delete) all donations that belong to this distribution.
 * Only allowed when distribution has ended (endDate in the past).
 */
export async function DELETE(req, { params }) {
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

    const distId = new ObjectId(id);
    const client = await clientPromise;
    const db = client.db("FairShare");

    const distribution = await db.collection("distributions").findOne({
      _id: distId,
    });

    if (!distribution) {
      return NextResponse.json(
        { success: false, error: "ဖြန့်ဝေမှု မတွေ့ပါ။" },
        { status: 404 }
      );
    }

    const endDate = distribution.endDate ? new Date(distribution.endDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDay = endDate ? new Date(endDate) : null;
    endDay.setHours(0, 0, 0, 0);
    if (!endDate || endDay >= today) {
      return NextResponse.json(
        {
          success: false,
          error: "ဖြန့်ဝေမှု မပြီးဆုံးသေးပါ။ ပြီးဆုံးပြီးမှ အလှူများ ဖျက်နိုင်ပါသည်။",
        },
        { status: 403 }
      );
    }

    const donationIds = distribution.donationIds || [];
    if (donationIds.length > 0) {
      const ids = donationIds.map((id) => (typeof id === "string" ? new ObjectId(id) : id));
      await db.collection("donations").deleteMany({ _id: { $in: ids } });
    }

    await db.collection("distributions").updateOne(
      { _id: distId },
      { $set: { donationIds: [] } }
    );

    return NextResponse.json({
      success: true,
      message: "အလှူများ ဖျက်ပြီးပါပြီ။",
    });
  } catch (e) {
    console.error("DELETE distribution donations error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
